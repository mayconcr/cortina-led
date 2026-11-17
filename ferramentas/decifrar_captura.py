"""Decifra os comandos da cortina numa captura já listada por captura_att.py (só leitura).

    .venv/bin/python ferramentas/captura_att.py capturas/x.pklg > capturas/x.att.txt
    .venv/bin/python ferramentas/decifrar_captura.py capturas/x.att.txt [--pixels]

Mostra, em ordem: escritas na CMD (handle 0x0006) e notificações (0x000d) decifradas com AES,
o handshake no 0xAE01 (texto puro) e os pixels na …960B (0x000b), agrupados ("... 75 pixels").
Com --pixels, lista cada pixel (linha, coluna, G R B).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ferramentas.cripto import decrypt  # noqa: E402

LINHA = re.compile(r"^\s*(\d+)\s+(APP->|<-DEV)\s+(\w+)\s+h=0x([0-9a-f]{4})\s+\(\s*\d+B\)\s+([0-9a-f]+)")
CMD, PIX, NOTIFY = "0006", "000b", "000d"


def legivel(b: bytes) -> str:
    return "".join(chr(x) if 32 <= x < 127 else "." for x in b)


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    mostrar_pixels = "--pixels" in sys.argv
    pixels: list[str] = []

    def despejar():
        if not pixels:
            return
        if mostrar_pixels:
            for p in pixels:
                print(p)
        else:
            print(f"          ... {len(pixels)} pixels")
        pixels.clear()

    for texto in Path(sys.argv[1]).read_text().splitlines():
        if "conexão LE" in texto:
            despejar()
            print(texto.strip())
            continue
        m = LINHA.match(texto)
        if not m:
            continue
        idx, quem, op, h, dados = m.groups()
        b = bytes.fromhex(dados)
        if h in (CMD, PIX, NOTIFY) and len(b) == 16:
            pt = decrypt(b)
            if h == PIX:
                pixels.append(f"   {idx:>6} pixel lin {pt[1]:2d} col {pt[2]:2d}  GRB {pt[3]:02X} {pt[4]:02X} {pt[5]:02X}  ({pt[:6].hex(' ')})")
                continue
            despejar()
            n = min(pt[0], 15)
            seta = "->" if quem == "APP->" else "<-"
            print(f"   {idx:>6} {seta} {'CMD ' if h == CMD else 'NOTI'} {legivel(pt[1:1 + n]):<10} {pt.hex(' ')}")
        elif op in ("WriteCmd", "WriteReq", "Notify") and h not in (CMD, PIX, NOTIFY):
            despejar()
            print(f"   {idx:>6} {quem} {op} h=0x{h} ({len(b)}B) {b.hex(' ')}  |{legivel(b)}|")
    despejar()


if __name__ == "__main__":
    main()
