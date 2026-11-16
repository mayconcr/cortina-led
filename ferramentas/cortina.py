"""Fase 2: comandos básicos da cortina iDeal LED pela linha de comando.

    .venv/bin/python ferramentas/cortina.py [opções] COMANDO ...

Comandos:
    ligar                       LEDON (TYPE1) ou TURN 01 (TYPE2)
    desligar                    LEDOFF (TYPE1) ou TURN 00 (TYPE2)
    cor R G B [--brilho %]      COLO (TYPE1) ou SGLS (TYPE2), cor em 5 bits
    efeito N [--velocidade V]   N de 1 a 10. TYPE1: LIGHT + 3×EFF. TYPE2: MULT + paleta em DATA
    versao                      VE 00 e VE 01 (a resposta chega por NOTIFY)

Opções:
    --tipo TYPE1|TYPE2   conjunto de comandos (padrão TYPE1, ver docs/DESCOBERTAS.md)
    --so-mostrar         NÃO conecta: só imprime os pacotes (texto puro e cifrado)
    --espera S           segundos esperando notificações depois do último pacote (padrão 2)
    --nome NOME          nome Bluetooth (padrão IDL-6A9E5C)

Segurança (CLAUDE.md): só pacotes do PROTOCOLO.md, efeito 1–10 validado em protocolo.py,
cor em 5 bits, fila única de escrita com pausa de 30 ms, NOTIFY assinado antes de escrever.
Só a CMD recebe bytes cifrados; a DATA recebe texto puro.

macOS: rodar no painel Terminal, não pela ferramenta Bash do Claude Code.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ferramentas import protocolo as p  # noqa: E402
from ferramentas.cripto import decrypt, encrypt  # noqa: E402

# docs/PROTOCOLO.md §1
CMD = "d44bc439-abfd-45a2-b575-925416129600"
DATA = "d44bc439-abfd-45a2-b575-92541612960a"
NOTIFY = "d44bc439-abfd-45a2-b575-925416129601"

PAUSA_ENTRE_ESCRITAS = 0.030  # CLAUDE.md regra 6: pelo menos 30 ms
PALETA_PADRAO = [(255, 0, 0), (255, 216, 0), (0, 255, 0), (0, 255, 255), (0, 0, 255), (255, 0, 255), (255, 255, 255)]


@dataclass
class Escrita:
    caracteristica: str  # CMD ou DATA
    puro: bytes
    rotulo: str

    @property
    def fio(self) -> bytes:
        """O que vai no ar: cifrado para CMD, texto puro para DATA."""
        return encrypt(self.puro) if self.caracteristica == CMD else self.puro


def montar(args) -> list[Escrita]:
    """Transforma o comando da linha em uma lista ordenada de escritas (a fila)."""
    t1 = args.tipo == "TYPE1"
    fila: list[Escrita] = []
    if args.comando == "ligar":
        fila.append(Escrita(CMD, p.ledon() if t1 else p.turn(True), "LEDON" if t1 else "TURN 01"))
    elif args.comando == "desligar":
        fila.append(Escrita(CMD, p.ledoff() if t1 else p.turn(False), "LEDOFF" if t1 else "TURN 00"))
    elif args.comando == "cor":
        r, g, b = args.r, args.g, args.b
        if t1:
            fila.append(Escrita(CMD, p.colo(r, g, b, args.brilho), f"COLO {r},{g},{b} @{args.brilho}%"))
        else:
            fila.append(Escrita(CMD, p.sgls(r, g, b, args.brilho), f"SGLS {r},{g},{b} @{args.brilho}%"))
    elif args.comando == "efeito":
        n = args.n
        if t1:
            if args.velocidade is not None:
                print("aviso: TYPE1 não tem velocidade documentada; ignorando --velocidade")
            seq = p.efeito_type1(n)
            fila.append(Escrita(CMD, seq[0], "LIGHT"))
            fila += [Escrita(CMD, pk, f"EFF {n} ({i}/3)") for i, pk in enumerate(seq[1:], 1)]
        else:
            vel = args.velocidade if args.velocidade is not None else 80
            fila.append(Escrita(CMD, p.mult(n, velocidade=vel, brilho=args.brilho), f"MULT {n} vel {vel} brilho {args.brilho}%"))
            fila.append(Escrita(DATA, p.paleta_data(PALETA_PADRAO), "paleta 7 cores (DATA)"))
    elif args.comando == "versao":
        fila.append(Escrita(CMD, p.versao(0), "VE 00 (placa)"))
        fila.append(Escrita(CMD, p.versao(1), "VE 01 (firmware)"))
    else:
        raise SystemExit(f"comando desconhecido: {args.comando}")
    return fila


def mostrar(fila: list[Escrita]) -> None:
    print(f"Fila: {len(fila)} escrita(s)")
    for i, e in enumerate(fila, 1):
        alvo = "CMD " if e.caracteristica == CMD else "DATA"
        print(f"  {i}. [{alvo}] {e.rotulo}")
        print(f"       texto puro : {p.hexs(e.puro)}")
        if e.caracteristica == CMD:
            print(f"       cifrado    : {p.hexs(e.fio)}")
        else:
            print(f"       (DATA vai em texto puro, {len(e.puro)} bytes)")


def ascii_legivel(dados: bytes) -> str:
    return "".join(chr(b) if 32 <= b < 127 else "." for b in dados)


async def enviar(args, fila: list[Escrita]) -> int:
    from bleak import BleakClient, BleakScanner

    print(f"[scan] procurando {args.nome}...")
    dispositivo = await BleakScanner.find_device_by_name(args.nome, timeout=15)
    if dispositivo is None:
        print("não achei a cortina. Ligada? App iDeal LED fechado no celular?")
        return 2

    recebidas: list[bytes] = []

    def ao_notificar(_c, dados: bytearray):
        dados = bytes(dados)
        recebidas.append(dados)
        carimbo = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"[notify {carimbo}] bruto ({len(dados)} B): {p.hexs(dados)}")
        if len(dados) == 16:
            puro = decrypt(dados)
            print(f"[notify {carimbo}] decifrado    : {p.hexs(puro)}  |{ascii_legivel(puro)}|")

    async with BleakClient(dispositivo, timeout=25.0) as cliente:
        print(f"[conexão] conectado, MTU {cliente.mtu_size}")
        await cliente.start_notify(NOTIFY, ao_notificar)  # antes de qualquer escrita
        for i, e in enumerate(fila, 1):  # fila única, uma escrita por vez
            alvo = "CMD " if e.caracteristica == CMD else "DATA"
            t0 = time.monotonic()
            await cliente.write_gatt_char(e.caracteristica, e.fio, response=False)
            print(f"[envio {i}/{len(fila)}] [{alvo}] {e.rotulo}  ({(time.monotonic() - t0) * 1000:.0f} ms)")
            await asyncio.sleep(PAUSA_ENTRE_ESCRITAS)
        print(f"[espera] {args.espera:.0f} s por notificações...")
        await asyncio.sleep(args.espera)
        try:
            await cliente.stop_notify(NOTIFY)
        except Exception:
            pass
    print(f"[fim] {len(fila)} escrita(s) enviada(s), {len(recebidas)} notificação(ões) recebida(s)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Comandos básicos da cortina iDeal LED (Fase 2)")
    ap.add_argument("--tipo", choices=("TYPE1", "TYPE2"), default="TYPE1")
    ap.add_argument("--so-mostrar", action="store_true", help="só imprime os pacotes, não conecta")
    ap.add_argument("--espera", type=float, default=2.0)
    ap.add_argument("--nome", default="IDL-6A9E5C")
    sub = ap.add_subparsers(dest="comando", required=True)
    sub.add_parser("ligar")
    sub.add_parser("desligar")
    c = sub.add_parser("cor")
    c.add_argument("r", type=int)
    c.add_argument("g", type=int)
    c.add_argument("b", type=int)
    c.add_argument("--brilho", type=int, default=100, help="0–100 %%, aplicado antes do >> 3")
    e = sub.add_parser("efeito")
    e.add_argument("n", type=int, help="1 a 10")
    e.add_argument("--velocidade", type=int, default=None, help="1–100 (só TYPE2)")
    e.add_argument("--brilho", type=int, default=50, help="0–100 %% (só TYPE2)")
    sub.add_parser("versao")
    args = ap.parse_args()

    try:
        fila = montar(args)
    except ValueError as erro:
        print(f"ERRO de validação: {erro}")
        return 2
    mostrar(fila)
    if args.so_mostrar:
        print("(--so-mostrar: nada foi enviado)")
        return 0
    return asyncio.run(enviar(args, fila))


if __name__ == "__main__":
    sys.exit(main())
