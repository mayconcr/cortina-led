"""Gera tests/vetores.json: bytes produzidos pelo Python para o app em JS conferir (Fase 4.2).

    .venv/bin/python ferramentas/vetores_js.py

Os testes tests/protocol.test.mjs e tests/jlauth.test.mjs leem este arquivo e exigem que
web/js/protocol.js e web/js/jlauth.js gerem exatamente os mesmos bytes.
Só valores dentro dos limites de segurança do app (brilho ≤ 40 %, MODE 03, etc.).
"""

from __future__ import annotations

import json
import random
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))

from ferramentas import jl_auth  # noqa: E402
from ferramentas import protocolo as p  # noqa: E402
from ferramentas.cripto import encrypt  # noqa: E402

# nome no JS -> função no Python
FUNCOES = {
    "ver": p.ver,
    "leds": p.leds,
    "ledon": p.ledon_05,
    "ledoff": p.ledoff,
    "hora": p.hora,
    "colo8": p.colo8,
    "effApp": p.eff_app,
    "lightBrilho": p.light_brilho,
    "speed": p.speed,
    "mode": p.mode,
    "smvew": p.smvew,
    "pixelXY": p.pixel_xy,
    "pixel": p.pixel,
    "quadro": p.quadro,
    "anim": p.anim,
}

CASOS = [
    ("ver", []),
    ("leds", []),
    ("leds", [0]),
    ("ledon", []),
    ("ledoff", []),
    ("hora", [1, 22, 46, 5]),
    ("hora", [7, 0, 0, 0]),
    ("hora", [3, 23, 59, 59]),
    ("hora", [1, 12, 0, 0, []]),
    ("colo8", [255, 0, 0, 30]),
    ("colo8", [0, 255, 0, 30]),
    ("colo8", [0, 0, 255, 40]),
    ("colo8", [255, 255, 255, 30]),
    ("colo8", [255, 128, 0, 40]),
    ("colo8", [10, 20, 30, 100]),
    *[("effApp", [n]) for n in range(1, 11)],
    ("lightBrilho", [40]),
    ("lightBrilho", [5]),
    ("lightBrilho", [20]),
    ("lightBrilho", [50]),
    ("lightBrilho", [60]),
    ("lightBrilho", [80]),
    ("lightBrilho", [100]),
    ("speed", [8]),
    ("speed", [1]),
    ("speed", [16]),
    ("mode", [3]),
    ("anim", [0x0E]),
    ("anim", [0x1E]),
    ("anim", [0x31]),
    ("smvew", [1]),
    ("smvew", [2]),
    ("pixelXY", [7, 5, 255, 0, 0, 40]),
    ("pixelXY", [0, 0, 0, 255, 0, 40]),
    ("pixelXY", [19, 19, 0, 0, 255, 40]),
    ("pixelXY", [2, 10, 255, 200, 0, 25]),
    ("pixel", [0, 0, 255, 0, 0]),
    ("pixel", [19, 0, 0, 255, 0]),
    ("pixel", [0, 19, 0, 0, 255]),
    ("pixel", [19, 19, 255, 255, 0, 40]),
]


def _arg_py(nome: str, args: list) -> list:
    if nome == "hora" and len(args) == 5:
        return [*args[:4], bytes(args[4])]
    return args


def _pacotes(resultado) -> list[bytes]:
    return resultado if isinstance(resultado, list) else [resultado]


def main() -> None:
    protocolo = []
    for nome, args in CASOS:
        pacotes = _pacotes(FUNCOES[nome](*_arg_py(nome, args)))
        protocolo.append({"f": nome, "args": args, "puro": [pk.hex() for pk in pacotes], "cifrado": [encrypt(pk).hex() for pk in pacotes]})

    cantos = [[None] * p.COLUNAS for _ in range(p.LINHAS)]
    cantos[0][0], cantos[0][19], cantos[19][0], cantos[19][19] = [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0]
    smile = json.loads((RAIZ / "desenhos" / "smile.json").read_text())
    for grade, brilho in ((cantos, 40), (smile, 40), (smile, 20)):
        protocolo.append({"f": "quadro", "args": [grade, brilho], "puro": [pk.hex() for pk in p.quadro(grade, brilho)]})

    gerador = random.Random(2026_11_16)
    desafios = [bytes.fromhex("67c6697351ff4aec29cdbaabf2fbe346"), bytes.fromhex("3054108cae6bc3395cd78673b8ae0de7")]
    desafios += [bytes(gerador.randrange(256) for _ in range(16)) for _ in range(8)]
    jl = [{"desafio": d.hex(), "resposta": jl_auth.resposta(d).hex(), "pacote": jl_auth.pacote_resposta(d).hex()} for d in desafios]

    saida = {"gerado_por": "ferramentas/vetores_js.py", "protocolo": protocolo, "borda": p.borda(), "jl": jl}
    destino = RAIZ / "tests" / "vetores.json"
    destino.write_text(json.dumps(saida, indent=1) + "\n")
    print(f"{destino.relative_to(RAIZ)}: {len(protocolo)} casos de protocolo, {len(jl)} desafios JieLi")


if __name__ == "__main__":
    main()
