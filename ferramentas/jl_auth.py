"""Autenticação JieLi (RCSP auth) do serviço 0xAE00 — docs/PROTOCOLO.md §5ter.

Reconstruída do assembly de libjl_ota_auth.so (APK oficial): é a função E1 do Bluetooth
clássico (cifra SAFER+), com chave e "endereço" fixos embutidos na biblioteca. Validada contra
os dois pares desafio/resposta da captura do iPhone de 2026-11-16 (tests/test_jl_auth.py).

Funções puras; quem fala com a cortina é ferramentas/cortina.py (--auth).
"""

from __future__ import annotations

# Constantes em .data de libjl_ota_auth.so (0xb150 e 0xb160)
CHAVE_JL = bytes.fromhex("06775f87918dd423005df1d8cf0c142b")
ENDERECO_JL = bytes.fromhex("112233332211")

EXP = [pow(45, i, 257) % 256 for i in range(256)]
LOG = [0] * 256
for _i, _v in enumerate(EXP):
    LOG[_v] = _i
_XOR = frozenset({0, 3, 4, 7, 8, 11, 12, 15})
_PERM = (8, 11, 12, 15, 2, 1, 6, 5, 10, 9, 14, 13, 0, 7, 4, 3)
_DESLOC = ((233, "+"), (229, "^"), (223, "+"), (193, "^"), (179, "+"), (167, "^"), (149, "+"), (131, "^"),
           (233, "^"), (229, "+"), (223, "^"), (193, "+"), (179, "^"), (167, "+"), (149, "^"), (131, "+"))


def _bias(i: int) -> list[int]:
    return [EXP[EXP[(17 * i + j + 1) % 256]] for j in range(16)]


def _subchaves(chave: bytes) -> list[list[int]]:
    k = list(chave) + [0]
    for b in chave:
        k[16] ^= b
    sub = [list(chave)]
    for i in range(2, 18):
        k = [((b << 3) | (b >> 5)) & 0xFF for b in k]
        bias = _bias(i)
        sub.append([(k[(i - 1 + j) % 17] + bias[j]) & 0xFF for j in range(16)])
    return sub


def _mistura(x: list[int], k: list[int], xor_nas_marcadas: bool) -> list[int]:
    return [(x[i] ^ k[i]) if (i in _XOR) == xor_nas_marcadas else (x[i] + k[i]) & 0xFF for i in range(16)]


def ar(chave: bytes, bloco: bytes, linha: bool = False) -> bytes:
    """SAFER+ Ar (linha=False) ou Ar' (linha=True), 8 rodadas, chave de 128 bits."""
    ks = _subchaves(chave)
    x = list(bloco)
    entrada = list(bloco)
    for r in range(8):
        if linha and r == 2:
            x = _mistura(x, entrada, True)
        x = _mistura(x, ks[2 * r], True)
        x = [EXP[x[i]] if i in _XOR else LOG[x[i]] for i in range(16)]
        x = _mistura(x, ks[2 * r + 1], False)
        for camada in range(4):
            y = [0] * 16
            for p in range(0, 16, 2):
                a, b = x[p], x[p + 1]
                y[p], y[p + 1] = (2 * a + b) & 0xFF, (a + b) & 0xFF
            x = y if camada == 3 else [y[_PERM[i]] for i in range(16)]
    return bytes(_mistura(x, ks[16], True))


def e1(chave: bytes, desafio: bytes, endereco: bytes) -> bytes:
    """Função E1 do Bluetooth clássico, devolvendo os 16 bytes (não só o SRES)."""
    if len(chave) != 16 or len(desafio) != 16 or len(endereco) != 6:
        raise ValueError("E1 precisa de chave de 16 bytes, desafio de 16 bytes e endereço de 6 bytes")
    t = ar(chave, desafio)
    t2 = bytes(((t[i] ^ desafio[i]) + endereco[i % 6]) & 0xFF for i in range(16))
    k2 = bytes((chave[i] + c) & 0xFF if op == "+" else chave[i] ^ c for i, (c, op) in enumerate(_DESLOC))
    return ar(k2, t2, linha=True)


def resposta(desafio: bytes) -> bytes:
    """Resposta de 16 bytes a um desafio de 16 bytes, com a chave e o endereço fixos da JieLi."""
    return e1(CHAVE_JL, desafio, ENDERECO_JL)


# ---------- pacotes do handshake (escritos em 0xAE01, recebidos em 0xAE02) ----------

PASS = b"\x02pass"


def pacote_desafio(aleatorio16: bytes) -> bytes:
    """Passo 1 (app -> cortina): 00 + 16 bytes aleatórios."""
    if len(aleatorio16) != 16:
        raise ValueError("o desafio precisa ter 16 bytes")
    return b"\x00" + bytes(aleatorio16)


def pacote_resposta(desafio16: bytes) -> bytes:
    """Passo 4 (app -> cortina): 01 + E1(desafio da cortina)."""
    return b"\x01" + resposta(desafio16)
