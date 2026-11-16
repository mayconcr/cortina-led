// Testes da coleção de Natal (web/js/natal.js)
import assert from "node:assert/strict";
import { test } from "node:test";

import * as G from "../web/js/grade.js";
import { ANIMACOES_NATAL, CORES, DESENHOS_NATAL } from "../web/js/natal.js";
import { quadro } from "../web/js/protocol.js";

const todos = [...DESENHOS_NATAL, ...ANIMACOES_NATAL];

test("20 desenhos e 20 animações, com ids únicos", () => {
  assert.equal(DESENHOS_NATAL.length, 20);
  assert.equal(ANIMACOES_NATAL.length, 20);
  assert.equal(new Set(todos.map((d) => d.id)).size, 40);
  for (const d of todos) assert.ok(d.nome && typeof d.criar === "function", d.id);
});

test("cada um é uma grade 20×20 válida, com cores de 0 a 255", () => {
  for (const d of todos) {
    const g = d.criar();
    assert.equal(g.length, 20, d.id);
    for (const linha of g) {
      assert.equal(linha.length, 20, d.id);
      for (const c of linha) if (c) assert.ok(c.length === 3 && c.every((v) => Number.isInteger(v) && v >= 0 && v <= 255), d.id);
    }
  }
});

test("tamanho razoável: entre 40 e 220 LEDs (até ~7 s para enviar)", () => {
  for (const d of todos) {
    const n = G.contarAcesos(d.criar());
    assert.ok(n >= 40 && n <= 220, `${d.id}: ${n} LEDs`);
  }
});

test("os pacotes respeitam o orçamento de energia no brilho seguro", () => {
  for (const d of todos) {
    const g = d.criar();
    const b = G.brilhoSeguro(g, 40);
    const soma = quadro(g, b).reduce((s, pk) => s + pk[3] + pk[4] + pk[5], 0);
    assert.ok(soma <= G.ORCAMENTO, d.id);
  }
});

test("criar() devolve uma grade nova a cada chamada", () => {
  const a = DESENHOS_NATAL[0].criar();
  a[1][9] = null;
  assert.notEqual(DESENHOS_NATAL[0].criar()[1][9], null);
  assert.ok(Object.values(CORES).every((c) => c.length === 3));
});
