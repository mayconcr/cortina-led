// Testes de web/js/grade.js, web/js/fonte.js e web/js/exemplos.js
import assert from "node:assert/strict";
import { test } from "node:test";

import { EXEMPLOS } from "../web/js/exemplos.js";
import { capacidade, normalizar, quebrar, textoParaGrade } from "../web/js/fonte.js";
import * as G from "../web/js/grade.js";
import { quadro } from "../web/js/protocol.js";

const cheia = (cor) => Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => [...cor]));
const ascii = (g) => g.map((l) => l.map((c) => (c ? "#" : ".")).join(""));

test("orçamento: 400 LEDs em branco nunca passam de 30 %", () => {
  assert.equal(G.brilhoSeguro(cheia([255, 255, 255]), 40), 30);
  assert.equal(G.brilhoSeguro(cheia([255, 0, 0]), 40), 40);
  assert.equal(G.brilhoSeguro(G.novaGrade(), 40), 40);
  assert.equal(G.brilhoSeguro(cheia([255, 0, 0]), 99), 40, "nunca acima de 40 %");
  for (const e of EXEMPLOS) {
    const g = e.criar();
    const b = G.brilhoSeguro(g, 40);
    const soma = quadro(g, b).reduce((s, pk) => s + pk[3] + pk[4] + pk[5], 0);
    assert.ok(soma <= G.ORCAMENTO, `${e.nome}: ${soma} > ${G.ORCAMENTO}`);
  }
});

test("brilho seguro de cor sólida", () => {
  assert.equal(G.brilhoSeguroCor(255, 255, 255, 40), 30);
  assert.equal(G.brilhoSeguroCor(255, 0, 0, 40), 40);
  assert.equal(G.brilhoSeguroCor(255, 0, 0, 100), 40);
  assert.equal(G.brilhoSeguroCor(0, 0, 255, 20), 20);
});

test("balde pinta só a região contínua", () => {
  const g = G.novaGrade();
  for (let l = 0; l < 20; l++) g[l][10] = [0, 0, 255]; // parede no meio
  const r = G.encher(g, 0, 0, [255, 0, 0]);
  assert.equal(G.contarAcesos(r), 20 + 200);
  assert.deepEqual(r[5][3], [255, 0, 0]);
  assert.equal(r[5][15], null);
  assert.equal(G.contarAcesos(g), 20, "não mexe na original");
  const apagada = G.encher(r, 10, 0, null);
  assert.equal(apagada[0][10], null);
});

test("guardar e carregar a grade", () => {
  const g = EXEMPLOS[0].criar();
  const t = G.paraTexto(g);
  assert.equal(t.length, 2400);
  assert.deepEqual(G.deTexto(t), g);
  assert.throws(() => G.deTexto("abc"));
  assert.throws(() => G.deTexto("zz".repeat(1200)));
});

test("cores em hex", () => {
  assert.deepEqual(G.hexParaRGB("#FF8000"), [255, 128, 0]);
  assert.equal(G.rgbParaHex([0, 10, 255]), "#000aff");
  assert.throws(() => G.hexParaRGB("vermelho"));
});

test("imagem RGBA → grade, pela média dos blocos", () => {
  const lado = 40;
  const rgba = new Uint8ClampedArray(lado * lado * 4);
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const i = (y * lado + x) * 4;
      rgba.set(x < lado / 2 ? [255, 0, 0, 255] : [0, 0, 10, 255], i);
    }
  }
  const g = G.deRGBA(rgba, lado, { limiar: 20 });
  assert.deepEqual(g[0][0], [255, 0, 0]);
  assert.equal(g[0][19], null, "escuro abaixo do limiar fica apagado");
  assert.equal(G.contarAcesos(g), 200);
  assert.throws(() => G.deRGBA(new Uint8ClampedArray(10), 40));
});

test("tempo estimado ≈ 32 ms por LED aceso", () => {
  assert.ok(Math.abs(G.tempoEstimado(cheia([255, 0, 0])) - 13.1) < 0.1);
});

test("fonte: capacidade e normalização", () => {
  assert.deepEqual(capacidade("grande"), { letras: 3, linhas: 2 });
  assert.deepEqual(capacidade("pequena"), { letras: 5, linhas: 3 });
  assert.equal(normalizar("Olá, Ção <3 ~"), "OLA, CAO ♥ ?");
  assert.deepEqual(quebrar("OI MAYCON", 5), ["OI", "MAYCO", "N"]);
  assert.deepEqual(quebrar("AB\nCD", 3), ["AB", "CD"]);
});

test("fonte: letras no lugar certo", () => {
  const { grade, linhas, cabe } = textoParaGrade("ola", { cor: [0, 255, 0] });
  assert.deepEqual(linhas, ["OLA"]);
  assert.ok(cabe);
  const a = ascii(grade);
  assert.equal(a[6], "..###..#......###...");
  assert.equal(a[12], "..###..#####.#...#..");
  assert.deepEqual(grade[6][2], [0, 255, 0]);
  const esquerda = ascii(textoParaGrade("I", { alinhamento: "esquerda" }).grade);
  assert.equal(esquerda[9], "..#.................");
  const longo = textoParaGrade("uma frase longa demais", { fonte: "pequena" });
  assert.equal(longo.cabe, false);
  assert.equal(longo.linhas.length, 3);
});

test("exemplos cabem na grade e respeitam o orçamento", () => {
  for (const e of EXEMPLOS) {
    const g = e.criar();
    assert.equal(g.length, 20);
    assert.ok(g.every((l) => l.length === 20));
    assert.ok(G.contarAcesos(g) > 0, e.nome);
  }
});
