"""Testes de ferramentas/cripto.py com TODOS os vetores do docs/PROTOCOLO.md §2.

Rodar na raiz do projeto:
    .venv/bin/python -m unittest tests/test_cripto.py -v
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ferramentas.cripto import CHAVE, completar, decrypt, encrypt  # noqa: E402

# (nome, texto puro, cifrado) — copiados literalmente da tabela da §2.
VETORES = [
    ("TURN liga", "05 54 55 52 4E 01 00 00 00 00 00 00 00 00 00 00", "84dd5042374150897ac82f39110968a8"),
    ("TURN desliga", "05 54 55 52 4E 00 00 00 00 00 00 00 00 00 00 00", "79d1dba40919c246a8580ae7d11b7884"),
    ("LEDON", "06 4C 45 44 4F 4E 00 00 00 00 00 00 00 00 00 00", "8ebc70eb0de699d5eb16383e026d2ac6"),
    ("LEDOFF", "06 4C 45 44 4F 46 46 00 00 00 00 00 00 00 00 00", "cbb1fdbfc560d5e453c2cbd928b53fab"),
    ("SGLS vermelho", "0F 53 47 4C 53 00 00 64 50 1F 00 00 1F 00 00 32", "2dec317e7181ccb079fc665ae43fa9dd"),
]


class TestCripto(unittest.TestCase):
    def test_chave(self):
        self.assertEqual(CHAVE.hex().upper(), "34522A5B7A6E492C08090A9D8D2A23F8")
        self.assertEqual(len(CHAVE), 16)

    def test_encrypt_vetores(self):
        for nome, puro, cifrado in VETORES:
            with self.subTest(nome):
                self.assertEqual(encrypt(bytes.fromhex(puro)).hex(), cifrado)

    def test_decrypt_vetores(self):
        for nome, puro, cifrado in VETORES:
            with self.subTest(nome):
                self.assertEqual(decrypt(bytes.fromhex(cifrado)), bytes.fromhex(puro))

    def test_ida_e_volta(self):
        bloco = bytes(range(16))
        self.assertEqual(decrypt(encrypt(bloco)), bloco)

    def test_tamanho_errado(self):
        with self.assertRaises(ValueError):
            encrypt(b"\x05TURN\x01")
        with self.assertRaises(ValueError):
            decrypt(bytes(17))

    def test_completar(self):
        self.assertEqual(completar(b"\x05TURN\x01"), bytes.fromhex("0554 5552 4E01 0000 0000 0000 0000 0000"))
        self.assertEqual(len(completar(b"")), 16)
        with self.assertRaises(ValueError):
            completar(bytes(17))

    def test_completar_mais_encrypt(self):
        self.assertEqual(encrypt(completar(b"\x05TURN\x01")).hex(), "84dd5042374150897ac82f39110968a8")


if __name__ == "__main__":
    unittest.main()
