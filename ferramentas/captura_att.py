"""Lista os pacotes ATT de uma captura Bluetooth HCI: btsnoop (Android) ou .pklg (Apple PacketLogger).

Só leitura. Mostra direção, opcode, handle e valor de escritas/notificações, e as conexões LE
(endereço do periférico), para separar a conversa com a cortina do resto.

Uso:
    python ferramentas/captura_att.py arquivo.pklg|arquivo.log [--tudo]
"""

from __future__ import annotations

import struct
import sys

OPC = {0x12: "WriteReq", 0x13: "WriteRsp", 0x52: "WriteCmd", 0x1b: "Notify", 0x1d: "Indicate",
       0x0a: "ReadReq", 0x0b: "ReadRsp", 0x01: "Error", 0x02: "MtuReq", 0x03: "MtuRsp",
       0x08: "ReadByTypeReq", 0x09: "ReadByTypeRsp", 0x10: "ReadByGrpReq", 0x11: "ReadByGrpRsp",
       0x04: "FindInfoReq", 0x05: "FindInfoRsp", 0x0c: "ReadBlobReq", 0x0d: "ReadBlobRsp",
       0x18: "ExecWriteReq", 0x19: "ExecWriteRsp", 0x16: "PrepWriteReq", 0x17: "PrepWriteRsp"}
DESCOBERTA = {0x04, 0x05, 0x08, 0x09, 0x10, 0x11}


def legivel(b: bytes) -> str:
    return "".join(chr(x) if 32 <= x < 127 else "." for x in b)


def registros(caminho: str):
    """Gera (indice, direcao, tipo, dados) onde tipo é 'acl' ou 'evt'."""
    d = open(caminho, "rb").read()
    if d[:8] == b"btsnoop\0":
        _, dl = struct.unpack(">II", d[8:16])
        off, i = 16, 0
        while off + 24 <= len(d):
            _orig, incl, flags, _drops, _ts = struct.unpack(">IIIIq", d[off:off + 24])
            off += 24
            pkt = d[off:off + incl]
            off += incl
            i += 1
            direcao = "<-DEV" if flags & 1 else "APP->"
            if dl == 1002 and pkt:  # H4: byte de tipo na frente
                t = pkt[0]
                if t == 0x02:
                    yield i, direcao, "acl", pkt[1:]
                elif t == 0x04:
                    yield i, direcao, "evt", pkt[1:]
            elif dl == 1001:
                if flags & 2 == 0:
                    yield i, direcao, "acl", pkt
                elif flags & 1:
                    yield i, direcao, "evt", pkt
        return
    # Apple PacketLogger (.pklg): [len BE 4][ts seg 4][ts useg 4][tipo 1][dados]
    off, i = 0, 0
    while off + 13 <= len(d):
        ln = struct.unpack(">I", d[off:off + 4])[0]
        if ln < 9 or off + 4 + ln > len(d):
            break
        tipo = d[off + 12]
        dados = d[off + 13:off + 4 + ln]
        off += 4 + ln
        i += 1
        if tipo == 0x02:
            yield i, "APP->", "acl", dados
        elif tipo == 0x03:
            yield i, "<-DEV", "acl", dados
        elif tipo == 0x01:
            yield i, "<-DEV", "evt", dados


def main(caminho: str, tudo: bool) -> None:
    frag: dict = {}
    for i, direcao, tipo, pkt in registros(caminho):
        if tipo == "evt":
            if len(pkt) >= 2 and pkt[0] == 0x3E and len(pkt) > 2 and pkt[2] in (0x01, 0x0A) and len(pkt) >= 12:
                handle = struct.unpack("<H", pkt[4:6])[0]
                addr = ":".join(f"{b:02X}" for b in pkt[8:14][::-1])
                print(f"{i:6d} ===== conexão LE: handle 0x{handle:04x} periférico {addr}")
            elif len(pkt) >= 2 and pkt[0] == 0x05 and len(pkt) >= 5:
                handle = struct.unpack("<H", pkt[3:5])[0]
                print(f"{i:6d} ===== desconexão: handle 0x{handle:04x} motivo 0x{pkt[5]:02x}")
            continue
        if len(pkt) < 4:
            continue
        hf, alen = struct.unpack("<HH", pkt[:4])
        pb = (hf >> 12) & 3
        body = pkt[4:4 + alen]
        key = (hf & 0xfff, direcao)
        if pb == 1:
            body = frag.pop(key, b"") + body
        if len(body) < 4:
            frag[key] = body
            continue
        l2len, cid = struct.unpack("<HH", body[:4])
        if len(body) < 4 + l2len:
            frag[key] = body
            continue
        if cid != 4:
            continue
        att = body[4:4 + l2len]
        if not att:
            continue
        op = att[0]
        nome = OPC.get(op, f"op{op:02x}")
        if op in DESCOBERTA and not tudo:
            continue
        if op in (0x12, 0x52, 0x1b, 0x1d, 0x0a, 0x16):
            h = struct.unpack("<H", att[1:3])[0]
            val = att[3:]
            print(f"{i:6d} {direcao} {nome:9s} h=0x{h:04x} ({len(val):3d}B) {val.hex()}  |{legivel(val)}|")
        elif op == 0x0b:
            val = att[1:]
            print(f"{i:6d} {direcao} {nome:9s}            ({len(val):3d}B) {val.hex()}  |{legivel(val)}|")
        elif op == 0x01:
            print(f"{i:6d} {direcao} Error     req=0x{att[1]:02x} h=0x{struct.unpack('<H', att[2:4])[0]:04x} code=0x{att[4]:02x}")
        else:
            print(f"{i:6d} {direcao} {nome:9s} {att[1:].hex()}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    main(sys.argv[1], "--tudo" in sys.argv)
