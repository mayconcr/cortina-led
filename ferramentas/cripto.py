"""Criptografia dos pacotes CMD do iDeal LED (ver docs/PROTOCOLO.md §2).

AES-128 em modo ECB, sem IV e sem padding. Todo pacote tem exatamente 16 bytes.
Só o que vai para a característica CMD é cifrado; DATA vai em texto puro.
As notificações chegam cifradas e são decifradas com a mesma chave.
"""

from __future__ import annotations

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

# Chave pública, extraída do app Android (docs/PROTOCOLO.md §2).
CHAVE = bytes.fromhex("34522A5B7A6E492C08090A9D8D2A23F8")

TAMANHO_BLOCO = 16


def _conferir_bloco(dados: bytes) -> bytes:
    dados = bytes(dados)
    if len(dados) != TAMANHO_BLOCO:
        raise ValueError(
            f"o pacote precisa ter exatamente {TAMANHO_BLOCO} bytes, veio com {len(dados)}"
        )
    return dados


def encrypt(bytes16: bytes) -> bytes:
    """Cifra um pacote de 16 bytes (texto puro -> bytes para a característica CMD)."""
    dados = _conferir_bloco(bytes16)
    cifra = Cipher(algorithms.AES(CHAVE), modes.ECB()).encryptor()
    return cifra.update(dados) + cifra.finalize()


def decrypt(bytes16: bytes) -> bytes:
    """Decifra um bloco de 16 bytes (notificação cifrada -> texto puro)."""
    dados = _conferir_bloco(bytes16)
    cifra = Cipher(algorithms.AES(CHAVE), modes.ECB()).decryptor()
    return cifra.update(dados) + cifra.finalize()


# ---------- "cifra tiro" (segunda cifra do APK oficial, docs/PROTOCOLO.md §2) ----------
# Reconstruída do assembly ARM64 de libtiro-aes-lib.so (tiro_cipher / tiro_inv_cipher).
# Apesar do nome da biblioteca, NÃO é AES: é um encadeamento byte a byte com uma tabela de 16 bytes.
TABELA_TIRO = bytes.fromhex("382C5DAABC71C6A4FD546732E653825E")


def tiro_cipher(bytes16: bytes) -> bytes:
    """out[0] = (in[0] ^ 0x15) - 0x6D ; out[i] = (K + in[i] - in[i-1]) ^ T[i], K = out[0] + (T[0] ^ 0xC7)."""
    e = _conferir_bloco(bytes16)
    saida = bytearray(16)
    saida[0] = ((e[0] ^ 0x15) - 0x6D) & 0xFF
    k = (saida[0] + (TABELA_TIRO[0] ^ 0xC7)) & 0xFF
    for i in range(1, 16):
        saida[i] = ((k + e[i] - e[i - 1]) ^ TABELA_TIRO[i]) & 0xFF
    return bytes(saida)


def tiro_inv_cipher(bytes16: bytes) -> bytes:
    """Inverso exato de tiro_cipher (tiro_inv_cipher do .so)."""
    c = _conferir_bloco(bytes16)
    saida = bytearray(16)
    saida[0] = ((c[0] + 0x6D) ^ 0x15) & 0xFF
    k = ((TABELA_TIRO[0] ^ 0x38) - c[0] + 1) & 0xFF
    for i in range(1, 16):
        saida[i] = (k + (TABELA_TIRO[i] ^ c[i]) + saida[i - 1]) & 0xFF
    return bytes(saida)


def completar(dados: bytes) -> bytes:
    """Completa um comando com zeros até 16 bytes (formato geral da §3)."""
    dados = bytes(dados)
    if len(dados) > TAMANHO_BLOCO:
        raise ValueError(f"comando com {len(dados)} bytes, o máximo é {TAMANHO_BLOCO}")
    return dados + bytes(TAMANHO_BLOCO - len(dados))


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3 or sys.argv[1] not in ("enc", "dec"):
        print("uso: python ferramentas/cripto.py enc|dec <32 dígitos hex>")
        sys.exit(2)
    bloco = bytes.fromhex(sys.argv[2])
    saida = encrypt(bloco) if sys.argv[1] == "enc" else decrypt(bloco)
    print(saida.hex())
