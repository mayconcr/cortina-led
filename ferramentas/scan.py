"""Fase 0.5: procura controladores iDeal LED (nomes IDL-/ISP-) por 10 s.

Somente leitura: não conecta e não escreve nada.
Rodar: .venv/bin/python ferramentas/scan.py [--todos] [--segundos N]

No macOS o terminal pede permissão de Bluetooth na primeira vez, e o bleak
mostra um UUID no lugar do endereço MAC.
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from bleak import BleakScanner

PREFIXOS = ("IDL-", "ISP-")


async def escanear(segundos: float, todos: bool) -> dict:
    vistos: dict[str, tuple[str, int]] = {}

    def ao_detectar(device, adv):
        nome = device.name or adv.local_name or ""
        if not todos and not nome.startswith(PREFIXOS):
            return
        novo = device.address not in vistos
        vistos[device.address] = (nome, adv.rssi)
        if novo:
            print(f"  achou: {nome or '(sem nome)'}  {device.address}  RSSI {adv.rssi} dBm")

    print(f"Procurando por {segundos:.0f} s" + ("" if todos else f" (só {' / '.join(PREFIXOS)})") + "...")
    async with BleakScanner(detection_callback=ao_detectar):
        await asyncio.sleep(segundos)
    return vistos


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan de controladores iDeal LED (somente leitura)")
    parser.add_argument("--segundos", type=float, default=10)
    parser.add_argument("--todos", action="store_true", help="mostra todos os dispositivos BLE, não só IDL-/ISP-")
    args = parser.parse_args()

    try:
        vistos = asyncio.run(escanear(args.segundos, args.todos))
    except Exception as erro:  # ex.: Bluetooth desligado ou sem permissão
        print(f"ERRO no scan: {erro!r}", file=sys.stderr)
        return 2

    print()
    if not vistos:
        print("Nenhum dispositivo encontrado. Confira: cortina ligada, app iDeal LED fechado no celular, Bluetooth do computador ligado.")
        return 1
    print(f"{'Nome':<20} {'Endereço / UUID':<40} RSSI")
    for endereco, (nome, rssi) in sorted(vistos.items(), key=lambda kv: -kv[1][1]):
        print(f"{nome or '(sem nome)':<20} {endereco:<40} {rssi} dBm")
    return 0


if __name__ == "__main__":
    sys.exit(main())
