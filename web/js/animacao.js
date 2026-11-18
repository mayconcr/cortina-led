// Animações quadro a quadro, como as guardadas na cortina (trenó, cubo…): uma lista de grades 20×20
// trocadas em sequência, em loop.
//
// As da cortina rodam a 10 quadros/s porque estão gravadas nela (o app oficial só manda `ANIM NN`).
// As nossas precisam ir pelo Bluetooth: mandamos só os LEDs que MUDAM de um quadro para o outro,
// um pacote por LED, com 30 ms entre escritas (CLAUDE.md, regra 6). Por isso cada quadro dura pelo menos
// (LEDs que mudam) × 32 ms, e as animações são desenhadas para mudar poucos LEDs por quadro.
// Testes: tests/animacao.test.mjs

import { MS_POR_PIXEL, acesa, brilhoSeguro, contarAcesos, mesmaCor } from "./grade.js";
import { COLUNAS, LINHAS } from "./protocol.js";

/** LEDs que mudam de `antes` para `depois`: [[col, lin, [r,g,b] | null], ...] (null = apagar). */
export function diferencas(antes, depois) {
  const lista = [];
  for (let lin = 0; lin < LINHAS; lin++) {
    for (let col = 0; col < COLUNAS; col++) {
      const a = antes ? antes[lin][col] : null;
      const b = depois[lin][col];
      if (!mesmaCor(a, b)) lista.push([col, lin, acesa(b) ? [b[0], b[1], b[2]] : null]);
    }
  }
  return lista;
}

/** Quantos LEDs mudam para chegar em cada quadro (o primeiro vem do último, porque roda em loop). */
export function mudancasPorQuadro(quadros) {
  const n = quadros.length;
  return quadros.map((q, i) => (n === 1 ? 0 : diferencas(quadros[(i - 1 + n) % n], q).length));
}

/** Duração de cada quadro na cortina: o tempo pedido, ou mais, se houver muitos LEDs para trocar. */
export function duracoes(quadros, ms, msPorLed = MS_POR_PIXEL) {
  return mudancasPorQuadro(quadros).map((m) => Math.max(ms, m * msPorLed));
}

/** Números para mostrar no app e conferir nos testes. */
export function resumoAnimacao(quadros, ms, msPorLed = MS_POR_PIXEL) {
  const mud = mudancasPorQuadro(quadros);
  const dur = duracoes(quadros, ms, msPorLed);
  const ciclo = dur.reduce((s, d) => s + d, 0);
  return {
    quadros: quadros.length,
    maxMudancas: Math.max(...mud),
    mediaMudancas: mud.reduce((s, m) => s + m, 0) / mud.length,
    cicloMs: ciclo,
    quadrosPorSegundo: (quadros.length * 1000) / ciclo,
    ledsPrimeiroQuadro: contarAcesos(quadros[0]),
  };
}

/** Maior brilho (%) que serve para TODOS os quadros (orçamento de energia de grade.js). */
export function brilhoSeguroAnimacao(quadros, pedido) {
  return Math.min(...quadros.map((q) => brilhoSeguro(q, pedido)));
}

/**
 * Na cortina, cada quadro é redesenhado inteiro (SMVEW 01 + LEDs acesos + SMVEW 02) e aparece de uma vez.
 * Tempo médio por quadro, em segundos: ~32 ms por LED aceso + ~100 ms de abrir e fechar.
 */
export function segundosPorQuadroNaCortina(quadros, msPorLed = MS_POR_PIXEL) {
  const total = quadros.reduce((s, q) => s + contarAcesos(q) * msPorLed + 100, 0);
  return total / quadros.length / 1000;
}

/** Quadros que vão para a cortina: no máximo `max`, pegando um a cada tantos (animações longas ficam curtas). */
export function quadrosParaCortina(quadros, max = 10) {
  const passo = Math.max(1, Math.ceil(quadros.length / max));
  return quadros.filter((_, i) => i % passo === 0);
}
