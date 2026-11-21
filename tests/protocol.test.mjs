// node --test 'tests/*.test.mjs'
// Confere web/js/protocol.js contra os bytes gerados pelo Python (tests/vetores.json,
// produzido por ferramentas/vetores_js.py) e contra as regras de segurança do CLAUDE.md.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { cifrar } from "../web/js/aes.js";
import * as P from "../web/js/protocol.js";

const vetores = JSON.parse(readFileSync(new URL("./vetores.json", import.meta.url)));
const paraHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const lista = (r) => (Array.isArray(r) ? r : [r]);

test("cada pacote é idêntico ao do Python (texto puro e cifrado)", () => {
  for (const caso of vetores.protocolo) {
    const pacotes = lista(P[caso.f](...caso.args));
    assert.deepEqual(pacotes.map(paraHex), caso.puro, `${caso.f}(${JSON.stringify(caso.args).slice(0, 60)})`);
    if (caso.cifrado) assert.deepEqual(pacotes.map((pk) => paraHex(cifrar(pk))), caso.cifrado, `${caso.f} cifrado`);
  }
});

test("todos os pacotes têm 16 bytes", () => {
  for (const caso of vetores.protocolo) for (const pk of lista(P[caso.f](...caso.args))) assert.equal(pk.length, 16);
});

test("borda igual à do Python (76 posições)", () => {
  assert.deepEqual(P.borda(), vetores.borda);
  assert.equal(P.borda().length, 76);
});

test("exemplos da captura do app (PROTOCOLO §5bis)", () => {
  assert.equal(P.hexs(P.ver()).slice(0, 11), "03 56 45 52");
  assert.equal(P.hexs(P.ledoff()).slice(0, 20), "06 4C 45 44 4F 46 46");
  assert.equal(P.hexs(P.ledon()).slice(0, 17), "05 4C 45 44 4F 4E");
  assert.equal(P.hexs(P.hora(1, 22, 46, 5)).slice(0, 47), "08 54 49 4D 45 01 16 2E 05 A5 5A A5 00 03 02 06");
  assert.equal(P.hexs(P.mode()).slice(0, 17), "05 4D 4F 44 45 03");
});

test("horaDe usa 1 = segunda ... 7 = domingo", () => {
  const segunda = new Date(2026, 10, 16, 8, 9, 10); // 16/11/2026 é segunda-feira
  assert.deepEqual(Array.from(P.horaDe(segunda).slice(5, 9)), [1, 8, 9, 10]);
  const domingo = new Date(2026, 10, 22, 23, 0, 0);
  assert.equal(P.horaDe(domingo)[5], 7);
});

test("regra 3: efeito só de 1 a 10", () => {
  for (const n of [0, 11, 12, 255, -1, 1.5, "3", null]) assert.throws(() => P.effApp(n), RangeError, `efeito ${n}`);
  for (const n of [0, 11]) assert.throws(() => P.efeito(n));
  for (let n = 1; n <= 10; n++) assert.equal(P.effApp(n)[0][4], n);
});

test("regra 5: brilho de desenho até 40 %; efeitos (LIGHT) de 5 a 100 %, liberado pelo usuário", () => {
  assert.throws(() => P.pixelXY(0, 0, 255, 0, 0, 41));
  assert.throws(() => P.pixel(0, 0, 255, 0, 0, 100));
  assert.throws(() => P.quadro(Array.from({ length: 20 }, () => Array(20).fill([255, 0, 0])), 41));
  assert.throws(() => P.lightBrilho(101));
  assert.throws(() => P.lightBrilho(4));
  assert.throws(() => P.lightBrilho(0));
  assert.equal(P.lightBrilho(100)[6], 0x64);
  assert.equal(P.lightBrilho(50)[6], 0x32); // o valor que o app oficial manda
  assert.equal(Math.max(...P.pixelXY(0, 0, 255, 255, 255, 40).slice(3, 6)), 102);
});

test("regra 5: cor sólida sem canal acima de 40 % e sem branco acima de 30 %", () => {
  assert.throws(() => P.colo8(255, 0, 0, 41));
  assert.throws(() => P.colo8(255, 0, 0, 100));
  assert.throws(() => P.colo8(255, 255, 255, 31));
  assert.throws(() => P.colo8(255, 255, 255, 40));
  assert.doesNotThrow(() => P.colo8(255, 255, 255, 30));
  assert.doesNotThrow(() => P.colo8(255, 255, 0, 40)); // amarelo: 2 canais a 40 %
});

test("valores fora do que foi testado são recusados", () => {
  assert.throws(() => P.mode(0));
  assert.throws(() => P.mode(7));
  assert.throws(() => P.smvew(0));
  assert.throws(() => P.smvew(3));
  assert.throws(() => P.leds(1));
  assert.throws(() => P.speed(-1));
  assert.throws(() => P.speed(101));
  assert.throws(() => P.hora(1, 12, 0, 0, [1, 2, 3]));
  assert.throws(() => P.hora(8, 12, 0, 0));
  assert.throws(() => P.pixelXY(20, 0, 255, 0, 0));
  assert.throws(() => P.pixelXY(0, 20, 255, 0, 0));
  assert.throws(() => P.mapear(-1, 0));
  assert.throws(() => P.colo8(256, 0, 0, 10));
});

test("regra 4: não existe LAMPN nem CT no módulo", () => {
  const nomes = Object.keys(P).map((n) => n.toLowerCase());
  for (const proibido of ["lampn", "ct"]) assert.ok(!nomes.includes(proibido), proibido);
});

test("quadro ignora pixels apagados e só manda os acesos", () => {
  const g = Array.from({ length: 20 }, () => Array(20).fill(null));
  g[3][5] = [255, 0, 0];
  g[4][6] = [0, 0, 0];
  const pk = P.quadro(g);
  assert.equal(pk.length, 1);
  assert.deepEqual(Array.from(pk[0].slice(0, 6)), [5, 3, 5, 0, 102, 0]); // linha 3, coluna 5, G R B
});

test("ANIM: só os 58 números da galeria capturada em 2026-11-20, na ordem do app oficial", () => {
  assert.equal(P.hexs(P.anim(0x0e)).slice(0, 17), "05 41 4E 49 4D 0E");
  for (const n of [0x01, 0x0f, 0x11, 0x1a, 0x39, 0x3f, 0x41]) assert.equal(P.anim(n)[5], n);
  for (const n of [0, 0x10, 0x3a, 0x3e, 0x40, 0x42, 255, -1, 1.5, "14"]) assert.throws(() => P.anim(n), RangeError, `ANIM ${n}`);
  assert.equal(P.ANIMACOES_CORTINA.length, 58);
  assert.equal(new Set(P.ANIMACOES_CORTINA.map((a) => a.numero)).size, 58);
  // a galeria começa no cubo (1E) e termina em 41, 3F, como o usuário tocou
  assert.deepEqual(P.ANIMACOES_CORTINA.slice(0, 2).map((a) => a.numero), [0x1e, 0x1f]);
  assert.deepEqual(P.ANIMACOES_CORTINA.slice(-2).map((a) => a.numero), [0x41, 0x3f]);
  assert.equal(P.nomeAnimacao(0x0e), "Trenó do Papai Noel");
  assert.equal(P.nomeAnimacao(0x31), "Desenho aleatório");
  assert.equal(P.nomeAnimacao(0x1e), "Cubo girando");
});

test("MODE e SPEED: os 6 movimentos e a velocidade de 0 a 100 confirmados na cortina", () => {
  const modos = Object.fromEntries(P.MOVIMENTOS.map((m) => [m.id, m.modo]));
  assert.deepEqual(modos, { parado: null, esquerda: 3, direita: 4, cima: 5, baixo: 6, piscar: 2 });
  for (let m = 1; m <= 6; m++) assert.equal(P.hexs(P.mode(m)).slice(0, 17), `05 4D 4F 44 45 0${m}`);
  assert.equal(P.movimento("cima").modo, 5);
  assert.equal(P.movimento("voar"), undefined);
  assert.equal(P.hexs(P.speed(0)).slice(0, 20), "06 53 50 45 45 44 00");
  assert.equal(P.hexs(P.speed(100)).slice(0, 20), "06 53 50 45 45 44 64");
});
