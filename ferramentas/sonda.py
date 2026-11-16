"""Fase 1: sonda SOMENTE LEITURA da cortina iDeal LED.

O que faz, nesta ordem (ver docs/PLANO.md, Fase 1):
  1.1 conecta e lista serviços e características (propriedades, handles, MTU)
  1.2 lê os descritores 0x2901 (User Description) e mostra a string de firmware
  1.3 assina NOTIFY, decifra e loga o que chegar por 15 s (hex e ASCII)
  1.4 determina TYPE1/TYPE2 pela regra do docs/PROTOCOLO.md §4

NÃO escreve em nenhuma característica. Não toca no serviço 0xae00 (OTA).

Rodar (macOS: no painel Terminal, não pela ferramenta Bash do Claude Code):
    .venv/bin/python ferramentas/sonda.py [--nome IDL-6A9E5C] [--escuta 15]
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import time
from datetime import datetime
from pathlib import Path

from bleak import BleakClient, BleakScanner

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ferramentas.cripto import decrypt  # noqa: E402

# docs/PROTOCOLO.md §1
SERVICO = "0000fff0-0000-1000-8000-00805f9b34fb"
CMD = "d44bc439-abfd-45a2-b575-925416129600"
DATA = "d44bc439-abfd-45a2-b575-92541612960a"
NOTIFY = "d44bc439-abfd-45a2-b575-925416129601"
OTA_NAO_MEXER = "0000ae00-0000-1000-8000-00805f9b34fb"
DESCRITOR_USER_DESCRIPTION = "00002901-0000-1000-8000-00805f9b34fb"
EXTRA_READ = "d44bc439-abfd-45a2-b575-925416129602"  # [read], não documentada; só lida com --ler-extra

ESPERADOS = {CMD: "CMD", DATA: "DATA", NOTIFY: "NOTIFY"}

# docs/PROTOCOLO.md §4
OVERRIDE_TYPE2 = ("TR2503R004-01",)
MODELOS_TYPE1 = ("R002-15", "R003-01", "R004-01", "R005-03")
MODELOS_TYPE2 = ("R011-04", "R012-01")


def ascii_legivel(dados: bytes) -> str:
    return "".join(chr(b) if 32 <= b < 127 else "." for b in dados)


def classificar_tipo(firmware: str | None) -> tuple[str, str]:
    """Regra da §4. Devolve (tipo, motivo)."""
    if not firmware:
        return "TYPE2", "leitura do firmware falhou -> padrão TYPE2"
    if firmware.startswith(OVERRIDE_TYPE2):
        return "TYPE2", f"override: começa com {OVERRIDE_TYPE2[0]}"
    partes = firmware.split("R")
    if len(partes) < 3:
        return "TYPE2", "não achei o segundo 'R' na string -> padrão TYPE2"
    modelo = "R" + "R".join(partes[2:])
    if modelo in MODELOS_TYPE1:
        return "TYPE1", f"modelo {modelo} está na lista TYPE1"
    if modelo in MODELOS_TYPE2:
        return "TYPE2", f"modelo {modelo} está na lista TYPE2"
    return "TYPE2", f"modelo {modelo} desconhecido -> padrão TYPE2"


async def achar(nome: str, segundos: float):
    print(f"[scan] procurando {nome} por até {segundos:.0f} s...")
    achado = await BleakScanner.find_device_by_name(nome, timeout=segundos)
    if achado is None:
        raise SystemExit(f"não achei {nome}. Cortina ligada? App iDeal LED fechado no celular?")
    print(f"[scan] achei {achado.name} em {achado.address}")
    return achado


async def sonda(nome: str, escuta: float, ler_extra: bool = False) -> int:
    dispositivo = await achar(nome, 15)
    firmware: str | None = None
    notificacoes: list[tuple[float, bytes]] = []
    t0 = time.monotonic()

    def ao_notificar(_caracteristica, dados: bytearray):
        dados = bytes(dados)
        notificacoes.append((time.monotonic() - t0, dados))
        carimbo = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"[notify {carimbo}] bruto    ({len(dados):2d} B): {dados.hex(' ')}")
        if len(dados) == 16:
            puro = decrypt(dados)
            print(f"[notify {carimbo}] decifrado         : {puro.hex(' ')}  |{ascii_legivel(puro)}|")
        else:
            print(f"[notify {carimbo}] (não tem 16 bytes, não decifrei)  ascii |{ascii_legivel(dados)}|")

    def ao_desconectar(_cliente):
        print("[conexão] a cortina desconectou")

    print(f"[conexão] conectando em {dispositivo.address}...")
    async with BleakClient(dispositivo, timeout=25.0, disconnected_callback=ao_desconectar) as cliente:
        print(f"[conexão] conectado. MTU negociado: {cliente.mtu_size}")

        # 1.1 serviços e características
        print("\n=== 1.1 Serviços e características ===")
        achados: dict[str, object] = {}
        for servico in cliente.services:
            marca = "  <- OTA, NÃO MEXER" if servico.uuid == OTA_NAO_MEXER else ("  <- serviço do protocolo" if servico.uuid == SERVICO else "")
            print(f"serviço {servico.uuid}  (handle {servico.handle}){marca}")
            for car in servico.characteristics:
                nome_esp = ESPERADOS.get(car.uuid, "")
                if nome_esp:
                    achados[nome_esp] = car
                props = ",".join(car.properties)
                extra = ""
                if "write-without-response" in car.properties:
                    extra = f"  max_wwr={car.max_write_without_response_size}"
                print(f"   car {car.uuid}  handle {car.handle:3d}  [{props}]{extra}  {nome_esp}")
                for desc in car.descriptors:
                    print(f"      desc {desc.uuid}  handle {desc.handle}")

        print("\nConferência com o PROTOCOLO.md §1:")
        for nome_esp in ("CMD", "DATA", "NOTIFY"):
            car = achados.get(nome_esp)
            print(f"  {nome_esp:6s}: {'OK  ' + ','.join(car.properties) if car else 'NÃO ENCONTRADA'}")

        # 1.2 descritores 0x2901
        print("\n=== 1.2 Descritores 0x2901 (User Description) ===")
        for servico in cliente.services:
            if servico.uuid == OTA_NAO_MEXER:
                print(f"  (pulando o serviço {servico.uuid}, OTA)")
                continue
            for car in servico.characteristics:
                for desc in car.descriptors:
                    if desc.uuid != DESCRITOR_USER_DESCRIPTION:
                        continue
                    try:
                        valor = bytes(await cliente.read_gatt_descriptor(desc))
                    except Exception as erro:
                        print(f"  car {car.uuid} handle {desc.handle}: ERRO ao ler ({erro!r})")
                        continue
                    texto = valor.decode("utf-8", "replace").strip("\x00")
                    print(f"  car {car.uuid} desc handle {desc.handle}: {valor.hex(' ')}  -> '{texto}'")
                    if car.uuid in ESPERADOS and firmware is None and texto:
                        firmware = texto
        if firmware is None:
            print("  nenhum 0x2901 legível nas características CMD/DATA/NOTIFY; tentando handle 7 (como a integração HA)")
            try:
                valor = bytes(await cliente.read_gatt_descriptor(7))
                texto = valor.decode("utf-8", "replace").strip("\x00")
                print(f"  handle 7: {valor.hex(' ')} -> '{texto}'")
                firmware = texto or None
            except Exception as erro:
                print(f"  handle 7: ERRO ({erro!r})")
        print(f"\nString de firmware: {firmware!r}")

        # extra (opcional): ler a característica …9602 [read], não documentada. Leitura é segura.
        if ler_extra:
            print("\n=== extra: leitura da característica …9602 (read) ===")
            try:
                valor = bytes(await cliente.read_gatt_char(EXTRA_READ))
                print(f"  bruto ({len(valor)} B): {valor.hex(' ')}  |{ascii_legivel(valor)}|")
                if len(valor) == 16:
                    puro = decrypt(valor)
                    print(f"  decifrado com a chave do PROTOCOLO: {puro.hex(' ')}  |{ascii_legivel(puro)}|")
            except Exception as erro:
                print(f"  ERRO ao ler: {erro!r}")

        # 1.4 tipo
        tipo, motivo = classificar_tipo(firmware)
        print(f"Tipo de protocolo (§4): {tipo}  ({motivo})")

        # 1.3 notificações
        print(f"\n=== 1.3 Escutando NOTIFY por {escuta:.0f} s (sem enviar nada) ===")
        car_notify = achados.get("NOTIFY")
        if car_notify is None:
            print("  característica NOTIFY não encontrada; não dá para assinar")
        else:
            await cliente.start_notify(car_notify, ao_notificar)
            await asyncio.sleep(escuta)
            try:
                await cliente.stop_notify(car_notify)
            except Exception:
                pass
            print(f"  chegaram {len(notificacoes)} notificações em {escuta:.0f} s")

    print("\n=== RESUMO ===")
    print(f"endereço: {dispositivo.address}")
    print(f"firmware: {firmware!r}")
    print(f"tipo: {tipo}  ({motivo})")
    print(f"notificações: {len(notificacoes)}")
    print("FIM sonda")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Sonda somente leitura da cortina iDeal LED (Fase 1)")
    parser.add_argument("--nome", default="IDL-6A9E5C")
    parser.add_argument("--escuta", type=float, default=15, help="segundos escutando notificações")
    parser.add_argument("--ler-extra", action="store_true", help="lê também a característica …9602 (read)")
    args = parser.parse_args()
    return asyncio.run(sonda(args.nome, args.escuta, args.ler_extra))


if __name__ == "__main__":
    sys.exit(main())
