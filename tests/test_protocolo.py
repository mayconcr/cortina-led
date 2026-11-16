"""Testa os pacotes gerados por ferramentas/protocolo.py contra os exemplos do docs/PROTOCOLO.md.

Rodar: .venv/bin/python -m unittest discover -s tests -v
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ferramentas import protocolo as p  # noqa: E402
from ferramentas.cripto import encrypt  # noqa: E402


def hx(s: str) -> bytes:
    return bytes.fromhex(s)


class TestType1(unittest.TestCase):
    def test_ledon_ledoff_vetores_da_secao2(self):
        self.assertEqual(p.ledon(), hx("06 4C 45 44 4F 4E 00 00 00 00 00 00 00 00 00 00"))
        self.assertEqual(p.ledoff(), hx("06 4C 45 44 4F 46 46 00 00 00 00 00 00 00 00 00"))
        self.assertEqual(encrypt(p.ledon()).hex(), "8ebc70eb0de699d5eb16383e026d2ac6")
        self.assertEqual(encrypt(p.ledoff()).hex(), "cbb1fdbfc560d5e453c2cbd928b53fab")

    def test_colo_vermelho_5bits(self):
        # §6: verde no byte 5, vermelho no 6, azul no 7; 255 >> 3 = 31 = 0x1F
        self.assertEqual(p.colo(255, 0, 0), hx("07 43 4F 4C 4F 00 1F 00 00 00 00 00 00 00 00 00"))
        self.assertEqual(p.colo(0, 255, 0), hx("07 43 4F 4C 4F 1F 00 00 00 00 00 00 00 00 00 00"))
        self.assertEqual(p.colo(0, 0, 255), hx("07 43 4F 4C 4F 00 00 1F 00 00 00 00 00 00 00 00"))

    def test_colo_brilho(self):
        # branco a 30%: 255*30//100 = 76 -> 76 >> 3 = 9
        self.assertEqual(p.colo(255, 255, 255, brilho=30)[5:8], bytes([9, 9, 9]))
        self.assertEqual(p.colo(255, 255, 255, brilho=0)[5:8], bytes(3))

    def test_light_e_eff(self):
        self.assertEqual(p.light(), hx("06 4C 49 47 48 54 0C 00 00 00 00 00 00 00 00 00"))
        pacotes = p.eff(3)
        self.assertEqual(pacotes[0], hx("0E 45 46 46 03 07 03 FF 00 00 FF 80 00 FF FF 00"))
        self.assertEqual(pacotes[1], hx("0E 45 46 46 03 07 13 00 FF 00 00 FF FF 00 00 FF"))
        self.assertEqual(pacotes[2], hx("0E 45 46 46 03 07 21 80 00 FF 00 00 00 00 00 00"))
        seq = p.efeito_type1(10)
        self.assertEqual(len(seq), 4)
        self.assertEqual(seq[0], p.light())
        self.assertTrue(all(pk[4] == 10 for pk in seq[1:]))

    def test_todos_os_pacotes_tem_16_bytes(self):
        for pk in [p.ledon(), p.ledoff(), p.colo(1, 2, 3), p.light(), *p.eff(1), p.turn(True), p.sgls(1, 2, 3), p.mult(1), p.versao(0)]:
            self.assertEqual(len(pk), 16)


class TestType2(unittest.TestCase):
    def test_turn_vetores_da_secao2(self):
        self.assertEqual(p.turn(True), hx("05 54 55 52 4E 01 00 00 00 00 00 00 00 00 00 00"))
        self.assertEqual(p.turn(False), hx("05 54 55 52 4E 00 00 00 00 00 00 00 00 00 00 00"))
        self.assertEqual(encrypt(p.turn(True)).hex(), "84dd5042374150897ac82f39110968a8")

    def test_sgls_vermelho_exemplo_secao5_2(self):
        self.assertEqual(p.sgls(255, 0, 0), hx("0F 53 47 4C 53 00 00 64 50 1F 00 00 1F 00 00 32"))
        self.assertEqual(encrypt(p.sgls(255, 0, 0)).hex(), "2dec317e7181ccb079fc665ae43fa9dd")

    def test_mult_exemplo_integracao_ha(self):
        # const.py da integração: 0A 4D 55 4C 54 08 00 64 50 07 32 (efeito 8, vel 80, brilho 50)
        self.assertEqual(p.mult(8, velocidade=80, brilho=50), hx("0A 4D 55 4C 54 08 00 64 50 07 32 00 00 00 00 00"))

    def test_paleta(self):
        self.assertEqual(p.paleta_data([(255, 0, 0)]), hx("03 00 FF 00 00"))
        sete = p.paleta_data([(255, 0, 0)] * 7)
        self.assertEqual(sete[:2], hx("15 00"))
        self.assertEqual(len(sete), 2 + 21)
        with self.assertRaises(ValueError):
            p.paleta_data([])
        with self.assertRaises(ValueError):
            p.paleta_data([(0, 0, 0)] * 8)


class TestSeguranca(unittest.TestCase):
    def test_efeito_fora_de_1_a_10_da_erro(self):
        for n in (0, 11, 12, 255, -1):
            for fn in (p.eff, p.efeito_type1, p.mult):
                with self.subTest(fn=fn.__name__, n=n), self.assertRaises(ValueError):
                    fn(n)

    def test_cor_sempre_5_bits(self):
        self.assertEqual(max(p.colo(255, 255, 255)[5:8]), 31)
        self.assertEqual(max(p.sgls(255, 255, 255)[9:15]), 31)

    def test_canais_e_brilho_invalidos(self):
        with self.assertRaises(ValueError):
            p.colo(256, 0, 0)
        with self.assertRaises(ValueError):
            p.colo(0, 0, 0, brilho=101)
        with self.assertRaises(ValueError):
            p.versao(2)

    def test_nao_existe_lampn_ct_time(self):
        for proibido in ("lampn", "ct", "time"):
            self.assertFalse(hasattr(p, proibido), f"protocolo.py não pode ter {proibido}()")

    def test_versao(self):
        self.assertEqual(p.versao(0), hx("03 56 45 00 00 00 00 00 00 00 00 00 00 00 00 00"))
        self.assertEqual(p.versao(1), hx("03 56 45 01 00 00 00 00 00 00 00 00 00 00 00 00"))


if __name__ == "__main__":
    unittest.main()
