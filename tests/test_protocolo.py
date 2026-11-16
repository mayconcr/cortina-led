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


class TestCapturaIphone(unittest.TestCase):
    """Os bytes úteis (N+1 primeiros) batem com o que o app mandou na captura de 2026-11-16 (§5bis)."""

    def uteis(self, pk: bytes) -> bytes:
        return pk[: pk[0] + 1]

    def test_preambulo(self):
        self.assertEqual(self.uteis(p.ver()), hx("03 56 45 52"))
        self.assertEqual(self.uteis(p.leds(0)), hx("05 4C 45 44 53 00"))
        self.assertEqual(self.uteis(p.hora(1, 0, 40, 28)), hx("08 54 49 4D 45 01 00 28 1C"))
        # captura 2508, pacote inteiro com a cauda do app, e o cifrado idêntico ao que foi ao ar
        self.assertEqual(p.hora(1, 0, 40, 28), hx("08 54 49 4D 45 01 00 28 1C A5 5A A5 00 03 02 06"))
        self.assertEqual(encrypt(p.hora(1, 0, 40, 28)).hex(), "6c5e1b96aeca76b7d4e03a441a88afcb")
        self.assertEqual(p.hora(1, 0, 40, 28, cauda=b"")[9:], bytes(7))
        with self.assertRaises(ValueError):
            p.hora(1, 0, 0, 0, cauda=b"\x01")

    def test_liga_desliga(self):
        self.assertEqual(p.ledoff(), hx("06 4C 45 44 4F 46 46 00 00 00 00 00 00 00 00 00"))
        self.assertEqual(self.uteis(p.ledon_05()), hx("05 4C 45 44 4F 4E"))
        self.assertEqual(encrypt(p.ledoff()).hex(), "cbb1fdbfc560d5e453c2cbd928b53fab")  # igual à captura (2618)
        self.assertEqual(encrypt(p.ledon_05()).hex(), "ebd372ed98857317f2f54cd2130fdc9c")  # captura (2762)

    def test_cor_8_bits(self):
        self.assertEqual(self.uteis(p.colo8(255, 0, 0)), hx("07 43 4F 4C 4F 00 FF 00"))
        self.assertEqual(self.uteis(p.colo8(0, 255, 0)), hx("07 43 4F 4C 4F FF 00 00"))
        self.assertEqual(self.uteis(p.colo8(0, 0, 255)), hx("07 43 4F 4C 4F 00 00 FF"))

    def test_efeito_light_speed(self):
        seq = p.eff_app(3)
        self.assertEqual(seq[0], hx("0F 45 46 46 03 07 03 FF 00 00 FF 80 00 FF FF 00"))
        self.assertEqual(seq[1], hx("0F 45 46 46 03 07 13 00 FF 00 00 FF FF 00 00 FF"))
        self.assertEqual(self.uteis(seq[2]), hx("07 45 46 46 03 07 21 80"))
        self.assertEqual(self.uteis(p.light_brilho(50)), hx("06 4C 49 47 48 54 32"))
        self.assertEqual(self.uteis(p.speed(8)), hx("06 53 50 45 45 44 08"))

    def test_imag_mode_smvew_pixel(self):
        self.assertEqual(self.uteis(p.imag(0x1A)), hx("05 49 4D 41 47 1A"))
        self.assertEqual(self.uteis(p.mode(3)), hx("05 4D 4F 44 45 03"))
        self.assertEqual(self.uteis(p.smvew(1)), hx("06 53 4D 56 45 57 01"))
        self.assertEqual(self.uteis(p.smvew(2)), hx("06 53 4D 56 45 57 02"))
        # captura 6586: 05 07 05 FD 54 01 (brilho 100 %); os bytes de cor são G R B (visto na cortina: verde)
        self.assertEqual(p.pixel_xy(7, 5, 0x54, 0xFD, 0x01, brilho=100), hx("05 07 05 FD 54 01 00 00 00 00 00 00 00 00 00 00"))
        self.assertEqual(encrypt(p.pixel_xy(7, 5, 0x54, 0xFD, 0x01, brilho=100)).hex(), "bc69ba6b343cb77fe4c75d952452feec")
        self.assertEqual(p.pixel_xy(1, 1, 255, 255, 255)[3:6], bytes([102, 102, 102]))  # 40 % por padrão
        self.assertEqual(p.pixel_xy(1, 1, 255, 0, 0, brilho=100)[3:6], bytes([0, 255, 0]))  # vermelho = 00 FF 00
        with self.assertRaises(ValueError):
            p.pixel_xy(21, 0, 0, 0, 0)
        with self.assertRaises(ValueError):
            p.smvew(3)


class TestGrade(unittest.TestCase):
    """Mapa confirmado na cortina em 2026-11-16: pacote = 05 LINHA COLUNA G R B, origem em cima à esquerda."""

    def test_cantos_como_vistos_na_cortina(self):
        self.assertEqual(p.pixel(0, 0, 255, 0, 0)[:6], hx("05 00 00 00 66 00"))      # vermelho, em cima à esquerda
        self.assertEqual(p.pixel(19, 0, 0, 255, 0)[:6], hx("05 00 13 66 00 00"))     # verde, em cima à direita
        self.assertEqual(p.pixel(0, 19, 0, 0, 255)[:6], hx("05 13 00 00 00 66"))     # azul, embaixo à esquerda
        self.assertEqual(p.pixel(19, 19, 255, 255, 0)[:6], hx("05 13 13 66 66 00"))  # amarelo, embaixo à direita

    def test_mapear(self):
        self.assertEqual(p.mapear(10, 2), (2, 10))
        for col, lin in ((20, 0), (0, 20), (-1, 0)):
            with self.assertRaises(ValueError):
                p.mapear(col, lin)

    def test_brilho_de_desenho_limitado(self):
        with self.assertRaises(ValueError):
            p.pixel(0, 0, 255, 255, 255, brilho=41)
        self.assertEqual(max(p.pixel(0, 0, 255, 255, 255)[3:6]), 102)

    def test_borda(self):
        b = p.borda()
        self.assertEqual(len(b), 76)
        self.assertEqual(len(set(b)), 76)
        self.assertTrue(all(c in (0, 19) or l in (0, 19) for c, l in b))

    def test_quadro(self):
        grade = [[None] * 20 for _ in range(20)]
        grade[3][7] = [255, 0, 0]
        grade[4][7] = [0, 0, 0]
        pacotes = p.quadro(grade)
        self.assertEqual(len(pacotes), 1)
        self.assertEqual(pacotes[0][:6], hx("05 03 07 00 66 00"))
        self.assertEqual(len(p.quadro([[[255, 255, 255]] * 20 for _ in range(20)])), 400)
        with self.assertRaises(ValueError):
            p.quadro([[None] * 20 for _ in range(19)])


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
