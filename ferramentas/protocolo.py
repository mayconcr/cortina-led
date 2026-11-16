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


# ---------- Comandos reais desta cortina (PROTOCOLO.md §5bis, captura do app em 2026-11-16) ----------

def ver() -> bytes:
    """Pede a versão: 03 'VER'. A cortina responde por NOTIFY com 05 'VER' 08 01."""
    return completar(b"\x03VER")


def leds(n: int = 0) -> bytes:
    """05 'LEDS' NN — o app manda LEDS 00 duas vezes logo após conectar. Função desconhecida."""
    _canal(n, "LEDS")
    return completar(b"\x05LEDS" + bytes([n]))


def ledon_05() -> bytes:
    """Liga como o app faz nesta cortina: 05 'LEDON' (N = 5)."""
    return completar(b"\x05LEDON")


# Cauda fixa que o app iOS manda depois da hora no TIME (captura 2508). A marca A5 5A A5 também
# aparece nas capturas Android (seguida de 01 02 06 09). Significado desconhecido.
CAUDA_TIME_APP = bytes.fromhex("A5 5A A5 00 03 02 06")


def hora(dia_semana: int, h: int, m: int, s: int, cauda: bytes = CAUDA_TIME_APP) -> bytes:
    """08 'TIME' DW HH MM SS + cauda, como o app (regra 4 do CLAUDE.md: só com pedido explícito do usuário)."""
    for v, nome, maximo in ((dia_semana, "dia da semana", 7), (h, "hora", 23), (m, "minuto", 59), (s, "segundo", 59)):
        if not isinstance(v, int) or not 0 <= v <= maximo:
            raise ValueError(f"{nome} fora da faixa 0..{maximo}: {v!r}")
    if cauda not in (CAUDA_TIME_APP, b""):
        raise ValueError("a cauda do TIME só pode ser a do app ou vazia")
    return completar(b"\x08TIME" + bytes([dia_semana, h, m, s]) + cauda)


def colo8(r: int, g: int, b: int, brilho: int = 100) -> bytes:
    """Cor sólida como o app faz nesta cortina: 07 'COLO' G R B em 8 bits. O brilho (%) escala antes."""
    _porcento(brilho, "brilho")
    canais = [(_canal(v, n) * brilho // 100) & 0xFF for v, n in ((r, "R"), (g, "G"), (b, "B"))]
    return completar(b"\x07COLO" + bytes([canais[1], canais[0], canais[2]]))


def eff_app(n: int) -> list[bytes]:
    """Os 3 pacotes EFF exatamente como o app (N = 0F, 0F, 07). ACK esperado: 06 'EFF' 0x 'OK'."""
    validar_efeito(n)
    modelos = (
        "0F 45 46 46 NN 07 03 FF 00 00 FF 80 00 FF FF 00",
        "0F 45 46 46 NN 07 13 00 FF 00 00 FF FF 00 00 FF",
        "07 45 46 46 NN 07 21 80 00 FF 00 00 00 00 00 00",
    )
    return [bytes.fromhex(m.replace("NN", f"{n:02X}")) for m in modelos]


def light_brilho(brilho: int = 50) -> bytes:
    """06 'LIGHT' BR — brilho em % (o app manda 32 = 50 %). Limite do CLAUDE.md: ≤ 40 % em desenho."""
    _porcento(brilho, "brilho")
    return completar(b"\x06LIGHT" + bytes([brilho]))


def speed(v: int = 8) -> bytes:
    """06 'SPEED' SP — velocidade (o app manda 08)."""
    _porcento(v, "velocidade")
    return completar(b"\x06SPEED" + bytes([v]))


def imag(indice: int) -> bytes:
    """05 'IMAG' II — animação nativa (1A = 26 = árvore de Natal)."""
    _canal(indice, "indice")
    return completar(b"\x05IMAG" + bytes([indice]))


def mode(m: int = 3) -> bytes:
    """05 'MODE' MM — o app manda MODE 03 depois de IMAG e depois do desenho."""
    _canal(m, "modo")
    return completar(b"\x05MODE" + bytes([m]))


def smvew(fase: int) -> bytes:
    """06 'SMVEW' 01 abre o envio de pixels na …960B; 06 'SMVEW' 02 fecha."""
    if fase not in (1, 2):
        raise ValueError("fase precisa ser 1 (abrir) ou 2 (fechar)")
    return completar(b"\x06SMVEW" + bytes([fase]))


def pixel_xy(x: int, y: int, r: int, g: int, b: int, brilho: int = 40) -> bytes:
    """Um pixel para a característica …960B (cifrado com AES): 05 X Y G R B (ordem G R B, como o COLO;
    confirmado na cortina em 2026-11-16). Brilho padrão 40 % (CLAUDE.md)."""
    _porcento(brilho, "brilho")
    for v, nome in ((x, "x"), (y, "y")):
        if not isinstance(v, int) or not 0 <= v <= 20:
            raise ValueError(f"{nome} precisa ser de 0 a 20, veio {v!r}")
    canais = [(_canal(v, n) * brilho // 100) & 0xFF for v, n in ((r, "R"), (g, "G"), (b, "B"))]
    return completar(bytes([0x05, x, y, canais[1], canais[0], canais[2]]))


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
