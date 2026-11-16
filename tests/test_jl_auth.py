"""Testa ferramentas/jl_auth.py contra os pares desafio/resposta reais da captura do iPhone (2026-11-16)."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ferramentas import jl_auth  # noqa: E402


class TestJlAuth(unittest.TestCase):
    def test_tabelas_como_no_so(self):
        # .rodata de libjl_ota_auth.so: exp em 0xc20, log em 0xd20, bias B2 (invertido) em 0xb20
        self.assertEqual(bytes(jl_auth.EXP[:8]).hex(), "012de293be4515ae")
        self.assertEqual(bytes(jl_auth.LOG[:8]).hex(), "8000b00960efb9fd")
        self.assertEqual(bytes(jl_auth._bias(2)).hex(), "4697b1baa3b7100ac537b3c95a28ac64")

    def test_resposta_da_cortina_ao_desafio_do_app(self):
        # captura 2534 -> 2541
        desafio = bytes.fromhex("67c6697351ff4aec29cdbaabf2fbe346")
        self.assertEqual(jl_auth.resposta(desafio).hex(), "023a02126fa284879236e9da27ba0b8d")

    def test_resposta_do_app_ao_desafio_da_cortina(self):
        # captura 2546 -> 2548
        desafio = bytes.fromhex("3054108cae6bc3395cd78673b8ae0de7")
        self.assertEqual(jl_auth.resposta(desafio).hex(), "0bb49938575b4301cccd05340f09d073")
        self.assertEqual(jl_auth.pacote_resposta(desafio).hex(), "010bb49938575b4301cccd05340f09d073")

    def test_pacotes(self):
        self.assertEqual(jl_auth.pacote_desafio(bytes(16)), bytes(17))
        self.assertEqual(jl_auth.PASS.hex(), "0270617373")
        with self.assertRaises(ValueError):
            jl_auth.pacote_desafio(bytes(15))
        with self.assertRaises(ValueError):
            jl_auth.e1(bytes(16), bytes(16), bytes(5))


if __name__ == "__main__":
    unittest.main()
