"""Fase 2: comandos básicos da cortina iDeal LED pela linha de comando.

    .venv/bin/python ferramentas/cortina.py [opções] COMANDO ...

Comandos:
    ligar                       preâmbulo + handshake + LEDON
    desligar                    preâmbulo + handshake + LEDOFF
    cor R G B [--brilho %]      preâmbulo + handshake + COLO (8 bits, brilho padrão 30 %)
    efeito N [--velocidade V] [--brilho %]   N de 1 a 10: 3×EFF + LIGHT + SPEED (brilho padrão 40 %)
    versao                      VE 00 e VE 01 (a resposta chega por NOTIFY)
    roteiro PASSO [PASSO ...]   comandos reais desta cortina (PROTOCOLO §5bis), em ordem:
                                ver · leds[:N] · ledoff · ledon · hora · cor:R,G,B[,brilho] · efeito:N[,brilho,vel]
                                imag:I · mode[:M] · smvew:1|2 · pixel:X,Y,R,G,B[,brilho]

Opções:
    --tipo REAL|TYPE1|TYPE2  REAL (padrão) = protocolo confirmado nesta cortina; os outros são do kit original
    --so-mostrar         NÃO conecta: só imprime os pacotes (texto puro e cifrado)
    --espera S           segundos esperando notificações depois do último pacote (padrão 2)
    --com-resposta       escrita com resposta (ATT Write Request). O padrão é SEM resposta (Write Command,
                         opcode 0x52), que é o que o app Android usa nas capturas btsnoop. As duas foram
                         testadas na cortina em 2026-11-16 e nenhuma mudou o resultado.
    --nome NOME          nome Bluetooth (padrão IDL-6A9E5C)
    --auth               handshake JieLi (3 pacotes no 0xAE01) antes dos comandos, como o app faz (PROTOCOLO §5ter)
    --cifra aes|tiro     cifra aplicada na CMD (padrão aes). "tiro" é a segunda cifra do APK oficial (PROTOCOLO §2)

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
from ferramentas.cripto import decrypt, encrypt, tiro_cipher, tiro_inv_cipher  # noqa: E402

# Cifra usada na CMD: "aes" (PROTOCOLO §2, padrão) ou "tiro" (segunda cifra achada no APK, §2).
CIFRAS = {"aes": (encrypt, decrypt), "tiro": (tiro_cipher, tiro_inv_cipher)}
CIFRA_ATIVA = "aes"

# docs/PROTOCOLO.md §1
CMD = "d44bc439-abfd-45a2-b575-925416129600"
DATA = "d44bc439-abfd-45a2-b575-92541612960a"
NOTIFY = "d44bc439-abfd-45a2-b575-925416129601"
PIX = "d44bc439-abfd-45a2-b575-92541612960b"  # pixels do desenho (SMVEW), cifrados com AES (PROTOCOLO §5bis)
# Serviço 0xAE00 (JieLi RCSP). Usado SOMENTE pelo handshake de autenticação (--auth, PROTOCOLO §5ter).
AE01 = "0000ae01-0000-1000-8000-00805f9b34fb"
AE02 = "0000ae02-0000-1000-8000-00805f9b34fb"
AUTH, PAUSA = "@auth", "@pausa"  # itens especiais da fila do `roteiro` (não são escritas simples)

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
        return CIFRAS[CIFRA_ATIVA][0](self.puro) if self.caracteristica in (CMD, PIX) else self.puro


# O que o app manda logo após conectar e que esta cortina exige antes de obedecer (confirmado em 2026-11-16).
PREAMBULO = ("ver", "hora", "leds", "leds", "auth", "pausa:2")
LIMITE_BRANCO = 40  # % — CLAUDE.md regra 5: nunca os 400 LEDs em branco forte (fonte 5V/USB)


def conferir_branco(r: int, g: int, b: int, brilho: int) -> None:
    """Bloqueia cor sólida com os três canais acima de 40 % (branco forte nos 400 LEDs)."""
    if min(r, g, b) * brilho / 100 > 255 * LIMITE_BRANCO / 100:
        raise ValueError(f"branco forte bloqueado: com os 3 canais acesos, o brilho máximo é {LIMITE_BRANCO}%")


def montar(args) -> list[Escrita]:
    """Transforma o comando da linha em uma lista ordenada de escritas (a fila)."""
    t1 = args.tipo == "TYPE1"
    fila: list[Escrita] = []
    if args.tipo == "REAL" and args.comando in ("ligar", "desligar", "cor", "efeito"):
        # Protocolo real desta cortina (PROTOCOLO §5bis/§5ter): preâmbulo do app + handshake + comando.
        for token in PREAMBULO:
            fila += passo(token)
        if args.comando == "ligar":
            fila += passo("ledon")
        elif args.comando == "desligar":
            fila += passo("ledoff")
        elif args.comando == "cor":
            brilho = 30 if args.brilho is None else args.brilho
            conferir_branco(args.r, args.g, args.b, brilho)
            fila += passo(f"cor:{args.r},{args.g},{args.b},{brilho}")
        else:
            brilho = 40 if args.brilho is None else args.brilho
            vel = 8 if args.velocidade is None else args.velocidade
            fila += passo(f"efeito:{args.n},{brilho},{vel}")
        return fila
    if args.comando in ("cor", "efeito") and args.brilho is None:
        args.brilho = 100 if args.comando == "cor" else 50
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
    elif args.comando == "roteiro":
        for token in args.passos:
            fila += passo(token)
    else:
        raise SystemExit(f"comando desconhecido: {args.comando}")
    return fila


def passo(token: str) -> list[Escrita]:
    """Um passo do `roteiro` (PROTOCOLO §5bis). Formato: nome ou nome:arg1,arg2..."""
    nome, _, resto = token.partition(":")
    args = [int(a, 0) for a in resto.split(",")] if resto else []
    if nome == "ver":
        return [Escrita(CMD, p.ver(), "VER (espera NOTIFY 05 'VER' 08 01)")]
    if nome == "leds":
        return [Escrita(CMD, p.leds(*(args or [0])), f"LEDS {args[0] if args else 0:02X}")]
    if nome == "ledoff":
        return [Escrita(CMD, p.ledoff(), "LEDOFF (06)")]
    if nome == "ledon":
        return [Escrita(CMD, p.ledon_05(), "LEDON (05, como o app)")]
    if nome == "hora":
        from datetime import datetime
        agora = datetime.now()
        dw = agora.isoweekday()  # o app mandou 01 numa segunda-feira: 1 = segunda ... 7 = domingo
        return [Escrita(CMD, p.hora(dw, agora.hour, agora.minute, agora.second), f"TIME dw={dw} {agora:%H:%M:%S} + cauda do app")]
    if nome == "auth":
        return [Escrita(AUTH, b"", "handshake JieLi no 0xAE01 (PROTOCOLO §5ter)")]
    if nome == "pausa":
        return [Escrita(PAUSA, bytes([args[0] if args else 1]), f"pausa de {args[0] if args else 1} s")]
    if nome == "cor":
        r, g, b = args[:3]
        brilho = args[3] if len(args) > 3 else 100
        return [Escrita(CMD, p.colo8(r, g, b, brilho), f"COLO 8 bits {r},{g},{b} @{brilho}%")]
    if nome == "efeito":
        n = args[0]
        seq = p.eff_app(n)
        fila = [Escrita(CMD, pk, f"EFF {n} ({i}/3)") for i, pk in enumerate(seq, 1)]
        fila.append(Escrita(CMD, p.light_brilho(args[1] if len(args) > 1 else 50), "LIGHT (brilho)"))
        fila.append(Escrita(CMD, p.speed(args[2] if len(args) > 2 else 8), "SPEED"))
        return fila
    if nome == "imag":
        return [Escrita(CMD, p.imag(args[0]), f"IMAG {args[0]}"), Escrita(CMD, p.mode(3), "MODE 03"),
                Escrita(CMD, p.light_brilho(args[1] if len(args) > 1 else 50), "LIGHT (brilho)"), Escrita(CMD, p.speed(8), "SPEED")]
    if nome == "mode":
        return [Escrita(CMD, p.mode(*(args or [3])), f"MODE {args[0] if args else 3:02X}")]
    if nome == "smvew":
        return [Escrita(CMD, p.smvew(args[0]), f"SMVEW {args[0]:02X}")]
    if nome == "pixel":
        x, y, r, g, b = args[:5]
        brilho = args[5] if len(args) > 5 else 40
        return [Escrita(PIX, p.pixel_xy(x, y, r, g, b, brilho), f"pixel ({x},{y}) = {r},{g},{b} @{brilho}% -> …960B")]
    raise SystemExit(f"passo desconhecido: {token!r} (use ver, leds, ledoff, ledon, hora, cor:R,G,B, efeito:N, imag:I, mode, smvew:1|2, pixel:X,Y,R,G,B)")


def mostrar(fila: list[Escrita]) -> None:
    print(f"Fila: {len(fila)} escrita(s)")
    for i, e in enumerate(fila, 1):
        if e.caracteristica in (AUTH, PAUSA):
            print(f"  {i}. [----] {e.rotulo}")
            continue
        alvo = {CMD: "CMD ", DATA: "DATA", PIX: "PIX "}[e.caracteristica]
        print(f"  {i}. [{alvo}] {e.rotulo}")
        print(f"       texto puro : {p.hexs(e.puro)}")
        if e.caracteristica in (CMD, PIX):
            print(f"       cifrado ({CIFRA_ATIVA}): {p.hexs(e.fio)}")
        else:
            print(f"       (DATA vai em texto puro, {len(e.puro)} bytes)")


def ascii_legivel(dados: bytes) -> str:
    return "".join(chr(b) if 32 <= b < 127 else "." for b in dados)


async def autenticar(cliente, caixa: "asyncio.Queue[bytes]") -> bool:
    """Handshake JieLi no serviço 0xAE00 (PROTOCOLO §5ter). Só os 3 pacotes vistos na captura do app.

    app  -> AE01: 00 + 16 aleatórios      cortina -> AE02: 01 + E1(aleatórios)
    app  -> AE01: 02 'pass'               cortina -> AE02: 00 + 16 aleatórios
    app  -> AE01: 01 + E1(desafio)        cortina -> AE02: 02 'pass'
    """
    import os

    from ferramentas import jl_auth

    async def esperar(descricao: str) -> bytes | None:
        try:
            return await asyncio.wait_for(caixa.get(), timeout=4.0)
        except asyncio.TimeoutError:
            print(f"[auth] sem resposta ({descricao})")
            return None

    async def escrever(pacote: bytes, rotulo: str) -> None:
        print(f"[auth] -> AE01 {rotulo}: {p.hexs(pacote)}")
        await cliente.write_gatt_char(AE01, pacote, response=False)
        await asyncio.sleep(PAUSA_ENTRE_ESCRITAS)

    desafio = os.urandom(16)
    await escrever(jl_auth.pacote_desafio(desafio), "desafio (00 + 16 aleatórios)")
    r = await esperar("resposta ao meu desafio")
    if r is None or len(r) != 17 or r[0] != 0x01:
        return False
    if r[1:] != jl_auth.resposta(desafio):
        print("[auth] a cortina respondeu algo diferente do esperado; parando")
        return False
    print("[auth] a cortina provou conhecer a chave")
    await escrever(jl_auth.PASS, "02 'pass'")
    r = await esperar("desafio da cortina")
    if r is None or len(r) != 17 or r[0] != 0x00:
        return False
    await escrever(jl_auth.pacote_resposta(r[1:]), "resposta (01 + E1)")
    r = await esperar("'pass' final")
    if r != jl_auth.PASS:
        return False
    print("[auth] OK: autenticado")
    return True


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
            for nome, (_, dec) in CIFRAS.items():
                puro = dec(dados)
                print(f"[notify {carimbo}] decifrado ({nome}): {p.hexs(puro)}  |{ascii_legivel(puro)}|")

    async with BleakClient(dispositivo, timeout=25.0) as cliente:
        print(f"[conexão] conectado, MTU {cliente.mtu_size}")
        await cliente.start_notify(NOTIFY, ao_notificar)  # antes de qualquer escrita
        caixa_ae02: asyncio.Queue[bytes] = asyncio.Queue()
        usa_auth = args.auth or any(e.caracteristica == AUTH for e in fila)
        if usa_auth:  # como o app: notificações do 0xAE02 ligadas desde o início e até o fim da conexão

            def ao_notificar_ae02(_c, dados: bytearray):
                print(f"[auth] <- AE02 ({len(dados)} B): {p.hexs(bytes(dados))}")
                caixa_ae02.put_nowait(bytes(dados))

            await cliente.start_notify(AE02, ao_notificar_ae02)
        if args.auth and not await autenticar(cliente, caixa_ae02):
            print("[auth] FALHOU: não vou enviar a fila de comandos")
            return 3
        com_resposta = args.com_resposta or args.tipo == "REAL"  # o que foi confirmado na cortina em 2026-11-16
        modo = "com resposta (ATT Write Request)" if com_resposta else "sem resposta (ATT Write Command, como o app oficial nas capturas)"
        print(f"[modo] escrita {modo}")
        for i, e in enumerate(fila, 1):  # fila única, uma escrita por vez
            if e.caracteristica == AUTH:
                if not await autenticar(cliente, caixa_ae02):
                    print("[auth] FALHOU: parando a fila aqui")
                    return 3
                continue
            if e.caracteristica == PAUSA:
                print(f"[pausa] {e.puro[0]} s")
                await asyncio.sleep(e.puro[0])
                continue
            alvo = {CMD: "CMD ", DATA: "DATA", PIX: "PIX "}[e.caracteristica]
            t0 = time.monotonic()
            await cliente.write_gatt_char(e.caracteristica, e.fio, response=com_resposta)
            ack = "ACK da cortina" if com_resposta else "sem ack"
            print(f"[envio {i}/{len(fila)}] [{alvo}] {e.rotulo}  ({(time.monotonic() - t0) * 1000:.0f} ms, {ack})")
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
    ap.add_argument("--tipo", choices=("REAL", "TYPE1", "TYPE2"), default="REAL", help="REAL = protocolo confirmado nesta cortina (padrão); TYPE1/TYPE2 = kit original, não funcionam nela")
    ap.add_argument("--so-mostrar", action="store_true", help="só imprime os pacotes, não conecta")
    ap.add_argument("--espera", type=float, default=2.0)
    ap.add_argument("--com-resposta", action="store_true", help="usa escrita com resposta (padrão: sem resposta, como o app oficial nas capturas)")
    ap.add_argument("--nome", default="IDL-6A9E5C")
    ap.add_argument("--cifra", choices=tuple(CIFRAS), default="aes", help="cifra da CMD: aes (padrão) ou tiro (PROTOCOLO §2)")
    ap.add_argument("--auth", action="store_true", help="faz o handshake JieLi no 0xAE00 antes da fila (PROTOCOLO §5ter)")
    sub = ap.add_subparsers(dest="comando", required=True)
    sub.add_parser("ligar")
    sub.add_parser("desligar")
    c = sub.add_parser("cor")
    c.add_argument("r", type=int)
    c.add_argument("g", type=int)
    c.add_argument("b", type=int)
    c.add_argument("--brilho", type=int, default=None, help="0–100 %% (padrão 30)")
    e = sub.add_parser("efeito")
    e.add_argument("n", type=int, help="1 a 10")
    e.add_argument("--velocidade", type=int, default=None, help="velocidade (padrão 8, como o app)")
    e.add_argument("--brilho", type=int, default=None, help="0–100 %% (padrão 40)")
    sub.add_parser("versao")
    r = sub.add_parser("roteiro", help="sequência de passos do PROTOCOLO §5bis, ex.: roteiro ver leds ledoff")
    r.add_argument("passos", nargs="+")
    args = ap.parse_args()
    global CIFRA_ATIVA
    CIFRA_ATIVA = args.cifra

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
