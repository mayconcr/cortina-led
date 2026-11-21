// Testes de todas as coleções de animações (web/js/colecoes.js) e dos desenhos de Natal.
import assert from "node:assert/strict";
import { test } from "node:test";

import { COLECOES_ANIMACOES } from "../web/js/colecoes.js";
import * as G from "../web/js/grade.js";
import { DESENHOS_NATAL } from "../web/js/natal.js";
import { quadro } from "../web/js/protocol.js";

const animacoes = Object.values(COLECOES_ANIMACOES).flatMap((c) => c.itens);

test("ids únicos em todas as coleções e na galeria de Natal", () => {
  const ids = [...animacoes, ...DESENHOS_NATAL].map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("nomes curtos e criar() válido", () => {
  for (const d of animacoes) {
    assert.ok(d.nome && d.nome.length <= 24, `${d.id}: nome "${d.nome}"`);
    assert.equal(typeof d.criar, "function", d.id);
  }
});

test("cada cena é uma grade 20×20, entre 40 e 220 LEDs, dentro do orçamento de energia", () => {
  for (const d of animacoes) {
    const g = d.criar();
    assert.equal(g.length, 20, d.id);
    assert.ok(g.every((l) => l.length === 20), d.id);
    for (const c of g.flat()) if (c) assert.ok(c.length === 3 && c.every((v) => Number.isInteger(v) && v >= 0 && v <= 255), d.id);
    const n = G.contarAcesos(g);
    assert.ok(n >= 40 && n <= 220, `${d.id}: ${n} LEDs`);
    const b = G.brilhoSeguro(g, 40);
    assert.ok(quadro(g, b).reduce((s, pk) => s + pk[3] + pk[4] + pk[5], 0) <= G.ORCAMENTO, d.id);
  }
});

test("criar() devolve uma grade nova a cada chamada", () => {
  for (const d of animacoes) assert.notEqual(d.criar(), d.criar(), d.id);
});

test("movimento sugerido de cada cena: esquerda (padrão), direita, cima ou baixo", () => {
  for (const d of animacoes) {
    if (d.movimento === undefined) continue;
    assert.ok(["esquerda", "direita", "cima", "baixo"].includes(d.movimento), `${d.id}: ${d.movimento}`);
  }
});

test("nomes únicos em cada coleção", () => {
  for (const c of Object.values(COLECOES_ANIMACOES)) {
    const nomes = c.itens.map((d) => d.nome.toLowerCase());
    assert.equal(new Set(nomes).size, nomes.length, c.nome);
  }
});
