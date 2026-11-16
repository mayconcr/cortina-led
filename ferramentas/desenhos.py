"""Gera os quadros de teste da Fase 3.5 em desenhos/*.json (grade[linha][coluna] = [r, g, b] ou null).

    .venv/bin/python ferramentas/desenhos.py

As cores aqui são "cheias" (0–255); o limite de brilho (40 %) é aplicado por protocolo.quadro().
"""

from __future__ import annotations

import json
import math
from pathlib import Path

N = 20
PASTA = Path(__file__).resolve().parents[1] / "desenhos"


def vazio() -> list[list]:
    return [[None] * N for _ in range(N)]


def xadrez() -> list[list]:
    """Casas de 2×2, alternando vermelho e apagado (200 LEDs acesos, um canal só)."""
    g = vazio()
    for lin in range(N):
        for col in range(N):
            if (lin // 2 + col // 2) % 2 == 0:
                g[lin][col] = [255, 0, 0]
    return g


def smile() -> list[list]:
    """Rosto amarelo: contorno circular, dois olhos azuis e um sorriso."""
    g = vazio()
    cx = cy = (N - 1) / 2
    for lin in range(N):
        for col in range(N):
            d = math.hypot(col - cx, lin - cy)
            if 8.0 <= d < 9.2:
                g[lin][col] = [255, 200, 0]
    for lin in (6, 7):
        for col in (6, 7, 12, 13):
            g[lin][col] = [0, 80, 255]
    for col in range(5, 15):
        lin = round(12 + 2.5 * math.sin(math.pi * (col - 5) / 9))
        g[lin][col] = [255, 0, 0]
    return g


def degrade() -> list[list]:
    """400 LEDs acesos: vermelho à esquerda virando azul à direita, mais forte embaixo.

    R + B = 255 em toda a grade, então mesmo cheio consome menos que o branco a 30 % já testado.
    """
    g = vazio()
    for lin in range(N):
        forca = 0.35 + 0.65 * lin / (N - 1)
        for col in range(N):
            t = col / (N - 1)
            g[lin][col] = [round(255 * (1 - t) * forca), 0, round(255 * t * forca)]
    return g


def main() -> None:
    PASTA.mkdir(exist_ok=True)
    for nome, grade in (("xadrez", xadrez()), ("smile", smile()), ("degrade", degrade())):
        arquivo = PASTA / f"{nome}.json"
        arquivo.write_text(json.dumps(grade))
        acesos = sum(1 for linha in grade for cor in linha if cor and any(cor))
        print(f"{arquivo.name}: {acesos} pixels acesos")
        for linha in grade:
            print("   " + "".join("#" if cor and any(cor) else "." for cor in linha))


if __name__ == "__main__":
    main()
