"""Montagem dos pacotes do iDeal LED (fonte: docs/PROTOCOLO.md).

Funções puras: recebem parâmetros, devolvem os bytes EM TEXTO PURO (16 bytes para
CMD). Quem cifra e envia é ferramentas/cortina.py. Não existe aqui nenhum byte que
não esteja documentado no PROTOCOLO.md, e as validações de segurança do CLAUDE.md
são feitas aqui (efeito 1–10, cor em 5 bits, brilho limitado).

Nunca implementar aqui: LAMPN, CT, TIME (CLAUDE.md, regra 4).
"""

from __future__ import annotations

from ferramentas.cripto import completar

EFEITO_MIN, EFEITO_MAX = 1, 10


# ---------- validações ----------

def _canal(valor: int, nome: str) -> int:
    if not isinstance(valor, int) or not 0 <= valor <= 255:
        raise ValueError(f"{nome} precisa ser inteiro de 0 a 255, veio {valor!r}")
    return valor


def _porcento(valor: int, nome: str) -> int:
    if not isinstance(valor, int) or not 0 <= valor <= 100:
        raise ValueError(f"{nome} precisa ser inteiro de 0 a 100, veio {valor!r}")
    return valor


def validar_efeito(n: int) -> int:
    """Regra 3 do CLAUDE.md: só efeitos de 1 a 10. Erro, nunca ajuste silencioso."""
    if not isinstance(n, int) or not EFEITO_MIN <= n <= EFEITO_MAX:
        raise ValueError(f"efeito precisa ser de {EFEITO_MIN} a {EFEITO_MAX}, veio {n!r}")
    return n


def cor_5bits(r: int, g: int, b: int, brilho: int = 100) -> tuple[int, int, int]:
    """Aplica o brilho (%) no RGB de 8 bits e reduz a 5 bits (>> 3), como o app original."""
    _porcento(brilho, "brilho")
    canais = []
    for v, nome in ((r, "R"), (g, "G"), (b, "B")):
        _canal(v, nome)
        canais.append((v * brilho // 100) >> 3)
    return tuple(canais)  # cada um de 0 a 31


# ---------- TYPE1 (PROTOCOLO.md §6) ----------

def ledon() -> bytes:
    """Liga (TYPE1): 06 'LEDON'."""
    return completar(b"\x06LEDON")


def ledoff() -> bytes:
    """Desliga (TYPE1): 06 'LEDOFF'."""
    return completar(b"\x06LEDOFF")


def colo(r: int, g: int, b: int, brilho: int = 100) -> bytes:
    """Cor sólida (TYPE1): 07 'COLO' Gx Rx Bx — verde no byte 5, vermelho no 6, azul no 7, em 5 bits."""
    r5, g5, b5 = cor_5bits(r, g, b, brilho)
    return completar(b"\x07COLO" + bytes([g5, r5, b5]))


def light() -> bytes:
    """Entrada no modo efeitos (TYPE1): 06 'LIGHT' 0C. Fixo."""
    return completar(bytes.fromhex("06 4C 49 47 48 54 0C"))


def eff(n: int) -> list[bytes]:
    """Os 3 pacotes 'EFF' do efeito n (TYPE1), com n no byte 4. Paleta fixa documentada."""
    validar_efeito(n)
    modelos = (
        "0E 45 46 46 NN 07 03 FF 00 00 FF 80 00 FF FF 00",
        "0E 45 46 46 NN 07 13 00 FF 00 00 FF FF 00 00 FF",
        "0E 45 46 46 NN 07 21 80 00 FF 00 00 00 00 00 00",
    )
    return [bytes.fromhex(m.replace("NN", f"{n:02X}")) for m in modelos]


def efeito_type1(n: int) -> list[bytes]:
    """Sequência completa de efeito TYPE1: LIGHT + 3× EFF."""
    return [light(), *eff(n)]


# ---------- TYPE2 (PROTOCOLO.md §5), só os comandos básicos ----------

def turn(ligar: bool) -> bytes:
    """Liga/desliga (TYPE2): 05 'TURN' SS."""
    return completar(b"\x05TURN" + bytes([1 if ligar else 0]))


def sgls(r: int, g: int, b: int, brilho: int = 100, velocidade: int = 80) -> bytes:
    """Cor sólida (TYPE2): 0F 'SGLS' 00 00 64 SP Rx Gx Bx Ry Gy By 32, cor em 5 bits."""
    r5, g5, b5 = cor_5bits(r, g, b, brilho)
    _porcento(velocidade, "velocidade")
    return completar(b"\x0fSGLS" + bytes([0x00, 0x00, 0x64, velocidade, r5, g5, b5, r5, g5, b5, 0x32]))


def mult(n: int, velocidade: int = 80, brilho: int = 50, reverso: bool = False) -> bytes:
    """Efeito (TYPE2): 0A 'MULT' NN RV 64 SP 07 BR. A paleta vai em DATA (ver paleta_data)."""
    validar_efeito(n)
    if not 1 <= velocidade <= 100:
        raise ValueError(f"velocidade precisa ser de 1 a 100, veio {velocidade!r}")
    _porcento(brilho, "brilho")
    return completar(b"\x0aMULT" + bytes([n, 1 if reverso else 0, 0x64, velocidade, 0x07, brilho]))


def paleta_data(cores: list[tuple[int, int, int]]) -> bytes:
    """Paleta para DATA (texto puro, TYPE2): [3×n] 00 R G B ... com n ≤ 7 cores em 8 bits."""
    if not 1 <= len(cores) <= 7:
        raise ValueError("a paleta precisa ter de 1 a 7 cores")
    corpo = b"".join(bytes([_canal(r, "R"), _canal(g, "G"), _canal(b, "B")]) for r, g, b in cores)
    return bytes([3 * len(cores), 0x00]) + corpo


# ---------- comum (§5.6, seguro) ----------

def versao(qual: int) -> bytes:
    """Pede a versão: 03 'VE' 00 (placa) ou 03 'VE' 01 (firmware). A resposta vem por NOTIFY."""
    if qual not in (0, 1):
        raise ValueError("qual precisa ser 0 (placa) ou 1 (firmware)")
    return completar(b"\x03VE" + bytes([qual]))


def hexs(pacote: bytes) -> str:
    return pacote.hex(" ").upper()
