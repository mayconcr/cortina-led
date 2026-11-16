// Confere web/js/jlauth.js contra a captura do iPhone e contra o Python (tests/vetores.json).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import * as JL from "../web/js/jlauth.js";

const vetores = JSON.parse(readFileSync(new URL("./vetores.json", import.meta.url)));
const hex = (s) => Uint8Array.from(s.match(/../g).map((h) => parseInt(h, 16)));
const paraHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

test("pares desafio/resposta da captura do iPhone (2026-11-16)", () => {
  assert.equal(paraHex(JL.resposta(hex("67c6697351ff4aec29cdbaabf2fbe346"))), "023a02126fa284879236e9da27ba0b8d");
  assert.equal(paraHex(JL.resposta(hex("3054108cae6bc3395cd78673b8ae0de7"))), "0bb49938575b4301cccd05340f09d073");
});

test("igual ao Python em todos os desafios do vetores.json", () => {
  for (const v of vetores.jl) {
    assert.equal(paraHex(JL.resposta(hex(v.desafio))), v.resposta);
    assert.equal(paraHex(JL.pacoteResposta(hex(v.desafio))), v.pacote);
  }
});

test("pacotes do handshake", () => {
  const d = new Uint8Array(16).fill(7);
  const p = JL.pacoteDesafio(d);
  assert.equal(p.length, 17);
  assert.equal(p[0], 0);
  assert.equal(paraHex(JL.PASS), "0270617373");
  assert.throws(() => JL.pacoteDesafio(new Uint8Array(15)));
  assert.ok(JL.iguais(JL.PASS, Uint8Array.from([2, 0x70, 0x61, 0x73, 0x73])));
  assert.ok(!JL.iguais(JL.PASS, Uint8Array.from([2, 0x70])));
});
