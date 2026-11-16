"""Gera os ícones do app (Fase 4.6) em web/icones/: PNGs 180/192/512 (+ maskable) e um SVG.

    .venv/bin/python ferramentas/icones.py

Desenho: um coração de "LEDs" (pontos) em tons de âmbar e vermelho sobre fundo escuro.
PNG escrito à mão com zlib (sem dependências).
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

PASTA = Path(__file__).resolve().parents[1] / "web" / "icones"
FUNDO = (13, 15, 19)
APAGADO = (32, 36, 44)
CORACAO = [
    ".........",
    ".##...##.",
    "####.####",
    "#########",
    "#########",
    ".#######.",
    "..#####..",
    "...###...",
    "....#....",
]


def cor_led(lin: int) -> tuple[int, int, int]:
    t = lin / (len(CORACAO) - 1)
    return (255, round(190 * (1 - t) + 40 * t), round(40 * (1 - t) + 50 * t))


def pontos(lado: float, margem: float) -> list[tuple[float, float, float, tuple[int, int, int]]]:
    n = len(CORACAO)
    passo = (lado - 2 * margem) / n
    raio = passo * 0.38
    saida = []
    for lin, fileira in enumerate(CORACAO):
        for col, ch in enumerate(fileira):
            cx = margem + (col + 0.5) * passo
            cy = margem + (lin + 0.5) * passo
            saida.append((cx, cy, raio, cor_led(lin) if ch == "#" else APAGADO))
    return saida


def png(lado: int, margem_rel: float) -> bytes:
    margem = lado * margem_rel
    pts = pontos(lado, margem)
    passo = (lado - 2 * margem) / len(CORACAO)
    sub = 4
    linhas = []
    for y in range(lado):
        linha = bytearray([0])
        for x in range(lado):
            r, g, b = FUNDO
            col = int((x - margem) / passo)
            lin = int((y - margem) / passo)
            alvo = None
            if 0 <= col < len(CORACAO) and 0 <= lin < len(CORACAO):
                alvo = pts[lin * len(CORACAO) + col]
            if alvo:
                cx, cy, raio, cor = alvo
                dentro = 0
                for sy in range(sub):
                    for sx in range(sub):
                        px = x + (sx + 0.5) / sub
                        py = y + (sy + 0.5) / sub
                        if (px - cx) ** 2 + (py - cy) ** 2 <= raio * raio:
                            dentro += 1
                a = dentro / (sub * sub)
                r, g, b = (round(FUNDO[i] * (1 - a) + cor[i] * a) for i in range(3))
            linha += bytes((r, g, b))
        linhas.append(bytes(linha))
    dados = zlib.compress(b"".join(linhas), 9)

    def bloco(tipo: bytes, conteudo: bytes) -> bytes:
        return struct.pack(">I", len(conteudo)) + tipo + conteudo + struct.pack(">I", zlib.crc32(tipo + conteudo) & 0xFFFFFFFF)

    cabecalho = struct.pack(">IIBBBBB", lado, lado, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + bloco(b"IHDR", cabecalho) + bloco(b"IDAT", dados) + bloco(b"IEND", b"")


def svg() -> str:
    lado = 512
    circulos = "".join(
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{raio:.1f}" fill="rgb{cor}"/>' for cx, cy, raio, cor in pontos(lado, lado * 0.1)
    )
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lado} {lado}"><rect width="{lado}" height="{lado}" rx="112" fill="rgb{FUNDO}"/>{circulos}</svg>\n'


def main() -> None:
    PASTA.mkdir(parents=True, exist_ok=True)
    for nome, lado, margem in (("icone-180.png", 180, 0.1), ("icone-192.png", 192, 0.1), ("icone-512.png", 512, 0.1), ("icone-512-maskable.png", 512, 0.2)):
        (PASTA / nome).write_bytes(png(lado, margem))
        print(nome)
    (PASTA / "icone.svg").write_text(svg())
    print("icone.svg")


if __name__ == "__main__":
    main()
