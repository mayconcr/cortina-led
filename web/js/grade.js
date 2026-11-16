// A grade 20×20 do app: grade[linha][coluna] = [r, g, b] (0–255) ou null (apagado).
// Linha 0 = em cima, coluna 0 = à esquerda, olhando a cortina de frente (mapa confirmado na Fase 3).
// As cores ficam "cheias" aqui; o brilho (≤ 40 %) é aplicado na hora de montar os pacotes.
// Testes: tests/grade.test.mjs

import { BRILHO_MAX, COLUNAS, LINHAS, canaisCor } from "./protocol.js";

// Orçamento de energia de um desenho: soma dos canais depois do brilho. Igual aos 400 LEDs em
// branco a 30 %, que já foi testado na cortina (Fase 2). CLAUDE.md regra 5: nunca 400 LEDs em branco total.
export const ORCAMENTO = Math.floor((COLUNAS * LINHAS * 3 * 255 * 30) / 100); // 91 800
export const MS_POR_PIXEL = 32; // medido na Fase 3 (pixels sem resposta)
export const MS_POR_PIXEL_COM_RESPOSTA = 91;

export const novaGrade = () => Array.from({ length: LINHAS }, () => Array(COLUNAS).fill(null));
export const copiar = (grade) => grade.map((linha) => linha.map((c) => (c ? [c[0], c[1], c[2]] : null)));
export const acesa = (c) => !!c && (c[0] | c[1] | c[2]) > 0;
export const contarAcesos = (grade) => grade.flat().filter(acesa).length;
export const somaCanais = (grade) => grade.flat().filter(acesa).reduce((s, c) => s + c[0] + c[1] + c[2], 0);
export const mesmaCor = (a, b) => (!acesa(a) && !acesa(b)) || (acesa(a) && acesa(b) && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]);

/** Maior brilho (%) permitido para este desenho: até 40 % e dentro do orçamento de energia. */
export function brilhoSeguro(grade, pedido = BRILHO_MAX) {
  let brilho = Math.min(Math.max(0, Math.floor(pedido)), BRILHO_MAX);
  const soma = somaCanais(grade);
  if (soma > 0) brilho = Math.min(brilho, Math.floor((ORCAMENTO * 100) / soma));
  return brilho;
}

/** Maior brilho (%) permitido para uma cor sólida nos 400 LEDs (regras do protocol.js). */
export function brilhoSeguroCor(r, g, b, pedido = BRILHO_MAX) {
  for (let brilho = Math.min(Math.floor(pedido), BRILHO_MAX); brilho > 0; brilho--) {
    try {
      canaisCor(r, g, b, brilho);
      return brilho;
    } catch {
      /* tenta um pouco mais fraco */
    }
  }
  return 0;
}

/** Segundos estimados para enviar o desenho (≈ 32 ms por LED aceso + abertura e fechamento). */
export function tempoEstimado(grade, msPorPixel = MS_POR_PIXEL) {
  return (contarAcesos(grade) * msPorPixel + 300) / 1000;
}

/** Balde de tinta: pinta a região contínua (vizinhos em cruz) que tem a mesma cor de (col, lin). */
export function encher(grade, col, lin, cor) {
  const nova = copiar(grade);
  const alvo = grade[lin][col];
  const tinta = acesa(cor) ? [cor[0], cor[1], cor[2]] : null;
  if (mesmaCor(alvo, tinta)) return nova;
  const pilha = [[col, lin]];
  while (pilha.length) {
    const [c, l] = pilha.pop();
    if (c < 0 || l < 0 || c >= COLUNAS || l >= LINHAS || !mesmaCor(nova[l][c], alvo)) continue;
    nova[l][c] = tinta ? [...tinta] : null;
    pilha.push([c + 1, l], [c - 1, l], [c, l + 1], [c, l - 1]);
  }
  return nova;
}

// ---------- cores ----------

export function hexParaRGB(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new RangeError(`cor inválida: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbParaHex = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");

// ---------- guardar e carregar (galeria) ----------

/** Texto compacto: 400 grupos de 6 caracteres ("rrggbb" ou "------" para apagado). */
export function paraTexto(grade) {
  return grade.flat().map((c) => (acesa(c) ? rgbParaHex(c).slice(1) : "------")).join("");
}

export function deTexto(texto) {
  if (typeof texto !== "string" || texto.length !== COLUNAS * LINHAS * 6) throw new RangeError("desenho salvo inválido");
  const grade = novaGrade();
  for (let i = 0; i < COLUNAS * LINHAS; i++) {
    const pedaco = texto.slice(i * 6, i * 6 + 6);
    if (pedaco === "------") continue;
    if (!/^[0-9a-f]{6}$/i.test(pedaco)) throw new RangeError("desenho salvo inválido");
    grade[Math.floor(i / COLUNAS)][i % COLUNAS] = hexParaRGB(pedaco);
  }
  return grade;
}

// ---------- imagem → grade ----------

/**
 * Reduz uma imagem RGBA quadrada (lado × lado) para a grade 20×20 pela média de cada bloco.
 * `limiar` (0–255): blocos mais escuros que isso ficam apagados (economiza LEDs e tempo de envio).
 */
export function deRGBA(rgba, lado, { limiar = 0 } = {}) {
  if (rgba.length !== lado * lado * 4) throw new RangeError("imagem com tamanho inesperado");
  const grade = novaGrade();
  for (let lin = 0; lin < LINHAS; lin++) {
    for (let col = 0; col < COLUNAS; col++) {
      const y0 = Math.floor((lin * lado) / LINHAS);
      const y1 = Math.floor(((lin + 1) * lado) / LINHAS);
      const x0 = Math.floor((col * lado) / COLUNAS);
      const x1 = Math.floor(((col + 1) * lado) / COLUNAS);
      let r = 0;
      let g = 0;
      let b = 0;
      let peso = 0;
      for (let y = y0; y < Math.max(y1, y0 + 1); y++) {
        for (let x = x0; x < Math.max(x1, x0 + 1); x++) {
          const i = (y * lado + x) * 4;
          const a = rgba[i + 3] / 255;
          r += rgba[i] * a;
          g += rgba[i + 1] * a;
          b += rgba[i + 2] * a;
          peso++;
        }
      }
      const cor = [r, g, b].map((v) => Math.round(v / peso));
      if (Math.max(...cor) > limiar) grade[lin][col] = cor;
    }
  }
  return grade;
}

/** Cores mais vivas para foto em LED: afasta cada canal da média (fator > 1 satura). */
export function realcar(grade, fator = 1.5) {
  return grade.map((linha) =>
    linha.map((c) => {
      if (!acesa(c)) return null;
      const media = (c[0] + c[1] + c[2]) / 3;
      const nova = c.map((v) => Math.max(0, Math.min(255, Math.round(media + (v - media) * fator))));
      return acesa(nova) ? nova : null;
    }),
  );
}
