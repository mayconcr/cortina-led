// Testes do motor de animação (web/js/animacao.js), das ferramentas de movimento e das 40 animações de Natal.
import assert from "node:assert/strict";
import { test } from "node:test";

import * as A from "../web/js/animacao.js";
import * as G from "../web/js/grade.js";
import * as M from "../web/js/movimento.js";
import { ANIMACOES_MOVIMENTO } from "../web/js/natal-movimento.js";
import { quadro } from "../web/js/protocol.js";

const vazia = () => G.novaGrade();

test("diferenças: acende, troca de cor e apaga (null)", () => {
  const a = vazia();
  const b = vazia();
  a[0][0] = [255, 0, 0];
  a[1][1] = [0, 255, 0];
  b[1][1] = [0, 0, 255];
  b[2][2] = [255, 255, 0];
  const d = A.diferencas(a, b);
  assert.deepEqual(d, [[0, 0, null], [1, 1, [0, 0, 255]], [2, 2, [255, 255, 0]]]);
  assert.deepEqual(A.diferencas(null, b).map(([c, l]) => [c, l]), [[1, 1], [2, 2]], "sem quadro anterior: só os acesos");
});

test("mudanças por quadro contam o loop (do último para o primeiro)", () => {
  const q0 = vazia();
  const q1 = vazia();
  q1[5][5] = [255, 0, 0];
  assert.deepEqual(A.mudancasPorQuadro([q0, q1]), [1, 1]);
  assert.deepEqual(A.duracoes([q0, q1], 100, 32), [100, 100]);
  const q2 = vazia();
  for (let c = 0; c < 10; c++) q2[0][c] = [255, 0, 0];
  assert.deepEqual(A.duracoes([q0, q2], 100, 32), [320, 320], "10 LEDs × 32 ms > 100 ms");
});

test("resumo e brilho seguro da animação", () => {
  const q = vazia();
  q[0][0] = [255, 255, 255];
  const r = A.resumoAnimacao([q, vazia()], 200);
  assert.equal(r.quadros, 2);
  assert.equal(r.maxMudancas, 1);
  assert.equal(r.ledsPrimeiroQuadro, 1);
  const cheia = Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => [255, 255, 255]));
  assert.equal(A.brilhoSeguroAnimacao([q, cheia], 40), 30);
});

test("ferramentas de movimento: pulo, vai e volta, fluxo que dá a volta na tela", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map((t) => M.vaiVolta(t, 4)), [0, 1, 2, 3, 2, 1, 0]);
  assert.equal(M.pulo(0, 10, 5), 0);
  assert.equal(M.pulo(5, 10, 5), 5);
  assert.equal(M.mod(-1, 20), 19);
  const g = G.novaGrade();
  M.fluxo(g, 3, [[18, 0]], { vx: 1 }); // 18 + 3 = 21 → coluna 1
  assert.ok(g[0][1] && !g[0][18]);
  const h = G.novaGrade();
  h[0][1] = [1, 2, 3];
  M.atras(h, [[1, 0], [2, 0]], "W"); // não apaga o que já está aceso
  assert.deepEqual(h[0][1], [1, 2, 3]);
  assert.ok(h[0][2]);
});

test("40 animações de Natal com movimento, ids únicos, nomes curtos", () => {
  assert.equal(ANIMACOES_MOVIMENTO.length, 40);
  assert.equal(new Set(ANIMACOES_MOVIMENTO.map((a) => a.id)).size, 40);
  for (const a of ANIMACOES_MOVIMENTO) {
    assert.ok(a.id.startsWith("mov-"), a.id);
    assert.ok(a.nome.length <= 24, a.id);
    assert.ok(Number.isInteger(a.ms) && a.ms >= 80 && a.ms <= 500, a.id);
  }
});

test("cada animação: quadros 20×20 válidos, que mexem de verdade e cabem no Bluetooth", () => {
  for (const a of ANIMACOES_MOVIMENTO) {
    const qs = a.criar();
    assert.ok(qs.length >= 8 && qs.length <= 96, `${a.id}: ${qs.length} quadros`);
    for (const q of qs) {
      assert.equal(q.length, 20, a.id);
      assert.ok(q.every((l) => l.length === 20), a.id);
      for (const c of q.flat()) if (c) assert.ok(c.every((v) => Number.isInteger(v) && v >= 0 && v <= 255), a.id);
      assert.ok(G.contarAcesos(q) <= 220, `${a.id}: quadro com LEDs demais`);
    }
    const r = A.resumoAnimacao(qs, a.ms);
    assert.ok(r.mediaMudancas >= 3, `${a.id}: quase não mexe (média ${r.mediaMudancas.toFixed(1)})`);
    assert.ok(r.maxMudancas <= 20, `${a.id}: até ${r.maxMudancas} LEDs mudando num quadro`);
    assert.ok(r.mediaMudancas <= 12, `${a.id}: média ${r.mediaMudancas.toFixed(1)} LEDs por quadro`);
    assert.ok(r.ledsPrimeiroQuadro <= 130, `${a.id}: 1º quadro com ${r.ledsPrimeiroQuadro} LEDs (aparece aos poucos)`);
    const b = A.brilhoSeguroAnimacao(qs, 40);
    for (const q of qs) assert.ok(quadro(q, b).reduce((s, pk) => s + pk[3] + pk[4] + pk[5], 0) <= G.ORCAMENTO, a.id);
  }
});

test("criar() devolve quadros novos a cada chamada", () => {
  const a = ANIMACOES_MOVIMENTO[0];
  assert.notEqual(a.criar()[0], a.criar()[0]);
});

