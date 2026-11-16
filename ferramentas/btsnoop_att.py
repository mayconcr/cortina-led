"""Lista os pacotes ATT de um btsnoop (Android HCI snoop): direção, opcode, handle, valor."""
import struct, sys

OPC = {0x12: "WriteReq", 0x13: "WriteRsp", 0x52: "WriteCmd", 0x1b: "Notify", 0x1d: "Indicate",
       0x0a: "ReadReq", 0x0b: "ReadRsp", 0x01: "Error", 0x02: "MtuReq", 0x03: "MtuRsp",
       0x08: "ReadByTypeReq", 0x09: "ReadByTypeRsp", 0x10: "ReadByGrpReq", 0x11: "ReadByGrpRsp",
       0x04: "FindInfoReq", 0x05: "FindInfoRsp", 0x0c: "ReadBlobReq", 0x0d: "ReadBlobRsp",
       0x18: "ExecWriteReq", 0x19: "ExecWriteRsp", 0x16: "PrepWriteReq", 0x17: "PrepWriteRsp"}

def main(path):
    d = open(path, "rb").read()
    assert d[:8] == b"btsnoop\0", "não é btsnoop"
    ver, dl = struct.unpack(">II", d[8:16])
    off = 16
    i = 0
    frag = {}
    while off + 24 <= len(d):
        orig, incl, flags, drops, ts = struct.unpack(">IIIIq", d[off:off + 24])
        off += 24
        pkt = d[off:off + incl]
        off += incl
        i += 1
        direcao = "<-DEV" if flags & 1 else "APP->"
        if dl == 1002:  # H4
            if not pkt or pkt[0] != 0x02:
                continue
            acl = pkt[1:]
        elif dl == 1001:
            if flags & 2 == 0:  # bit1: 0 = ACL (data), 1 = command/event
                acl = pkt
            else:
                continue
        else:
            raise SystemExit(f"datalink {dl} não suportado")
        if len(acl) < 4:
            continue
        hf, alen = struct.unpack("<HH", acl[:4])
        pb = (hf >> 12) & 3
        body = acl[4:4 + alen]
        key = (hf & 0xfff, direcao)
        if pb == 1:  # continuação
            body = frag.pop(key, b"") + body
        l2len, cid = struct.unpack("<HH", body[:4]) if len(body) >= 4 else (0, 0)
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
        if op in (0x12, 0x52, 0x1b, 0x1d, 0x0a):
            h = struct.unpack("<H", att[1:3])[0]
            val = att[3:]
            txt = "".join(chr(b) if 32 <= b < 127 else "." for b in val)
            print(f"{i:5d} {direcao} {nome:9s} h=0x{h:04x} ({len(val):3d}B) {val.hex()}  |{txt}|")
        elif op == 0x0b:
            val = att[1:]
            txt = "".join(chr(b) if 32 <= b < 127 else "." for b in val)
            print(f"{i:5d} {direcao} {nome:9s}            ({len(val):3d}B) {val.hex()}  |{txt}|")
        elif op == 0x01:
            print(f"{i:5d} {direcao} Error     req=0x{att[1]:02x} h=0x{struct.unpack('<H', att[2:4])[0]:04x} code=0x{att[4]:02x}")
        else:
            print(f"{i:5d} {direcao} {nome:9s} {att[1:].hex()}")

main(sys.argv[1])
