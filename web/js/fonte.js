// Letras em bitmap para escrever na grade 20×20.
//   Grande 5×7: 3 letras por linha, 2 linhas.
//   Pequena 3×5: 5 letras por linha, 3 linhas.
// Testes: tests/fonte.test.mjs

import { COLUNAS, LINHAS } from "./protocol.js";
import { novaGrade } from "./grade.js";

// 5×7 clássica: 5 colunas por letra, bit 0 = linha de cima.
const COLUNAS_5X7 = {
  " ": [0x00, 0x00, 0x00, 0x00, 0x00],
  "!": [0x00, 0x00, 0x5f, 0x00, 0x00],
  "?": [0x02, 0x01, 0x51, 0x09, 0x06],
  ".": [0x00, 0x60, 0x60, 0x00, 0x00],
  ",": [0x00, 0x50, 0x30, 0x00, 0x00],
  ":": [0x00, 0x36, 0x36, 0x00, 0x00],
  "-": [0x08, 0x08, 0x08, 0x08, 0x08],
  "+": [0x08, 0x08, 0x3e, 0x08, 0x08],
  "=": [0x14, 0x14, 0x14, 0x14, 0x14],
  "/": [0x20, 0x10, 0x08, 0x04, 0x02],
  "(": [0x00, 0x1c, 0x22, 0x41, 0x00],
  ")": [0x00, 0x41, 0x22, 0x1c, 0x00],
  "%": [0x23, 0x13, 0x08, 0x64, 0x62],
  "♥": [0x0c, 0x1e, 0x3c, 0x1e, 0x0c],
  0: [0x3e, 0x51, 0x49, 0x45, 0x3e],
  1: [0x00, 0x42, 0x7f, 0x40, 0x00],
  2: [0x42, 0x61, 0x51, 0x49, 0x46],
  3: [0x21, 0x41, 0x45, 0x4b, 0x31],
  4: [0x18, 0x14, 0x12, 0x7f, 0x10],
  5: [0x27, 0x45, 0x45, 0x45, 0x39],
  6: [0x3c, 0x4a, 0x49, 0x49, 0x30],
  7: [0x01, 0x71, 0x09, 0x05, 0x03],
  8: [0x36, 0x49, 0x49, 0x49, 0x36],
  9: [0x06, 0x49, 0x49, 0x29, 0x1e],
  A: [0x7e, 0x11, 0x11, 0x11, 0x7e],
  B: [0x7f, 0x49, 0x49, 0x49, 0x36],
  C: [0x3e, 0x41, 0x41, 0x41, 0x22],
  D: [0x7f, 0x41, 0x41, 0x22, 0x1c],
  E: [0x7f, 0x49, 0x49, 0x49, 0x41],
  F: [0x7f, 0x09, 0x09, 0x09, 0x01],
  G: [0x3e, 0x41, 0x49, 0x49, 0x7a],
  H: [0x7f, 0x08, 0x08, 0x08, 0x7f],
  I: [0x00, 0x41, 0x7f, 0x41, 0x00],
  J: [0x20, 0x40, 0x41, 0x3f, 0x01],
  K: [0x7f, 0x08, 0x14, 0x22, 0x41],
  L: [0x7f, 0x40, 0x40, 0x40, 0x40],
  M: [0x7f, 0x02, 0x0c, 0x02, 0x7f],
  N: [0x7f, 0x04, 0x08, 0x10, 0x7f],
  O: [0x3e, 0x41, 0x41, 0x41, 0x3e],
  P: [0x7f, 0x09, 0x09, 0x09, 0x06],
  Q: [0x3e, 0x41, 0x51, 0x21, 0x5e],
  R: [0x7f, 0x09, 0x19, 0x29, 0x46],
  S: [0x46, 0x49, 0x49, 0x49, 0x31],
  T: [0x01, 0x01, 0x7f, 0x01, 0x01],
  U: [0x3f, 0x40, 0x40, 0x40, 0x3f],
  V: [0x1f, 0x20, 0x40, 0x20, 0x1f],
  W: [0x3f, 0x40, 0x38, 0x40, 0x3f],
  X: [0x63, 0x14, 0x08, 0x14, 0x63],
  Y: [0x07, 0x08, 0x70, 0x08, 0x07],
  Z: [0x61, 0x51, 0x49, 0x45, 0x43],
};

// 3×5 desenhada para o app: 5 linhas de 3 pontos.
const LINHAS_3X5 = {
  " ": ["...", "...", "...", "...", "..."],
  "!": [".#.", ".#.", ".#.", "...", ".#."],
  "?": ["##.", "..#", ".#.", "...", ".#."],
  ".": ["...", "...", "...", "...", ".#."],
  ",": ["...", "...", "...", ".#.", "#.."],
  ":": ["...", ".#.", "...", ".#.", "..."],
  "-": ["...", "...", "###", "...", "..."],
  "+": ["...", ".#.", "###", ".#.", "..."],
  "=": ["...", "###", "...", "###", "..."],
  "/": ["..#", "..#", ".#.", "#..", "#.."],
  "(": [".#.", "#..", "#..", "#..", ".#."],
  ")": [".#.", "..#", "..#", "..#", ".#."],
  "%": ["#.#", "..#", ".#.", "#..", "#.#"],
  "♥": ["#.#", "###", "###", ".#.", "..."],
  0: [".#.", "#.#", "#.#", "#.#", ".#."],
  1: [".#.", "##.", ".#.", ".#.", "###"],
  2: ["##.", "..#", ".#.", "#..", "###"],
  3: ["##.", "..#", ".#.", "..#", "##."],
  4: ["#.#", "#.#", "###", "..#", "..#"],
  5: ["###", "#..", "##.", "..#", "##."],
  6: [".##", "#..", "###", "#.#", "###"],
  7: ["###", "..#", ".#.", ".#.", ".#."],
  8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "##."],
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#.#", "###", "###", "#.#", "#.#"],
  N: ["##.", "#.#", "#.#", "#.#", "#.#"],
  O: ["###", "#.#", "#.#", "#.#", "###"],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "##.", ".##"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#.#", "#.#", "###", "###", "#.#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
};

const deColunas = (cols) =>
  Array.from({ length: 7 }, (_, l) => cols.map((c) => ((c >> l) & 1 ? "#" : ".")).join(""));

export const FONTES = {
  grande: { nome: "Grande (5×7)", largura: 5, altura: 7, glifos: Object.fromEntries(Object.entries(COLUNAS_5X7).map(([k, v]) => [k, deColunas(v)])) },
  pequena: { nome: "Pequena (3×5)", largura: 3, altura: 5, glifos: LINHAS_3X5 },
};
const ESPACO = 1; // entre letras
const ENTRELINHA = 2;

export function capacidade(fonte) {
  const f = FONTES[fonte];
  return {
    letras: Math.floor((COLUNAS + ESPACO) / (f.largura + ESPACO)),
    linhas: Math.floor((LINHAS + ENTRELINHA) / (f.altura + ENTRELINHA)),
  };
}

/** Maiúsculas, sem acento, "<3" vira coração; o que a fonte não tem vira "?". */
export function normalizar(texto, fonte = "grande") {
  const glifos = FONTES[fonte].glifos;
  return texto
    .replace(/<3|❤️?/g, "♥")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split("")
    .map((ch) => (ch === "\n" || glifos[ch] ? ch : "?"))
    .join("");
}

/** Quebra em linhas de no máximo `letras` caracteres, sem cortar palavras quando dá. */
export function quebrar(texto, letras) {
  const linhas = [];
  for (const paragrafo of texto.split("\n")) {
    let atual = "";
    for (const palavra of paragrafo.split(/ +/).filter(Boolean)) {
      let p = palavra;
      while (p.length > letras) {
        if (atual) linhas.push(atual);
        atual = "";
        linhas.push(p.slice(0, letras));
        p = p.slice(letras);
      }
      if (!atual) atual = p;
      else if (atual.length + 1 + p.length <= letras) atual += " " + p;
      else {
        linhas.push(atual);
        atual = p;
      }
    }
    if (atual || !paragrafo.trim()) linhas.push(atual);
  }
  while (linhas.length && !linhas.at(-1)) linhas.pop();
  return linhas;
}

/**
 * Desenha o texto numa grade nova. Devolve { grade, linhas, cabe }.
 * `cabe` = false quando o texto tem mais linhas do que a fonte comporta (o excesso é cortado).
 */
export function textoParaGrade(texto, { cor = [255, 0, 0], fonte = "grande", alinhamento = "centro" } = {}) {
  const f = FONTES[fonte];
  if (!f) throw new RangeError(`fonte desconhecida: ${fonte}`);
  const cap = capacidade(fonte);
  const todas = quebrar(normalizar(texto, fonte), cap.letras);
  const linhas = todas.slice(0, cap.linhas);
  const grade = novaGrade();
  const alturaTotal = linhas.length * f.altura + Math.max(0, linhas.length - 1) * ENTRELINHA;
  let topo = Math.floor((LINHAS - alturaTotal) / 2);
  for (const linha of linhas) {
    const largura = linha.length * f.largura + Math.max(0, linha.length - 1) * ESPACO;
    let x = alinhamento === "esquerda" ? 0 : alinhamento === "direita" ? COLUNAS - largura : Math.floor((COLUNAS - largura) / 2);
    for (const ch of linha) {
      f.glifos[ch].forEach((fileira, dy) => {
        for (let dx = 0; dx < f.largura; dx++) {
          if (fileira[dx] === "#") grade[topo + dy][x + dx] = [...cor];
        }
      });
      x += f.largura + ESPACO;
    }
    topo += f.altura + ENTRELINHA;
  }
  return { grade, linhas, cabe: todas.length <= cap.linhas };
}
