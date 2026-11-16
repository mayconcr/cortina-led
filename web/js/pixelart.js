// Ferramentas de pixel art para a grade 20×20 (usadas pelas coleções de Natal e Ano Novo).
//
// Grade: g[linha][coluna] = [r, g, b] ou null (LED apagado). Linha 0 em cima, coluna 0 à esquerda.
// Cores por letra (CORES). "." ou " " = apagado. Com `envolver = true`, a coluna dá a volta na borda
// (para as cenas que rolam com MODE 03 emendarem sem corte).

import { FONTES } from "./fonte.js";
import { novaGrade } from "./grade.js";

export { novaGrade };
export const N = 20;

export const CORES = {
  R: [255, 0, 0], // vermelho
  r: [140, 0, 0], // vermelho escuro (sombra)
  P: [255, 40, 120], // rosa
  O: [255, 80, 0], // laranja
  Y: [255, 180, 0], // dourado
  y: [180, 90, 0], // caramelo / dourado escuro
  G: [0, 200, 30], // verde
  g: [0, 95, 20], // verde escuro
  L: [120, 255, 30], // verde-limão
  C: [0, 190, 255], // azul-gelo
  B: [0, 60, 255], // azul
  b: [0, 22, 110], // azul-marinho (escuro: use pouco, quase some em LED)
  M: [150, 0, 255], // roxo
  W: [255, 255, 255], // branco
  w: [90, 110, 150], // neve na sombra / fumaça / prata
  K: [160, 65, 10], // marrom
  k: [80, 30, 5], // marrom escuro (use pouco)
  S: [255, 140, 90], // pele
  V: [255, 230, 120], // champanhe / ouro claro
  T: [0, 255, 170], // turquesa / verde-água
  F: [255, 0, 200], // fúcsia / magenta
};

export function cor(letra) {
  if (letra === "." || letra === " ") return null;
  const c = CORES[letra];
  if (!c) throw new Error(`cor desconhecida na arte: ${letra}`);
  return [...c];
}

/** 20 linhas de 20 letras → grade. */
export function arte(linhas) {
  if (linhas.length !== N || linhas.some((l) => l.length !== N)) {
    throw new Error(`arte precisa ter 20 linhas de 20 letras (${linhas.map((l) => l.length).join(",")})`);
  }
  return linhas.map((l) => Array.from(l, cor));
}

/** Põe um pixel. `c` é uma letra de CORES ou [r, g, b]. Fora da grade é ignorado (ou dá a volta com `envolver`). */
export function ponto(g, col, lin, c, envolver = false) {
  if (envolver) col = ((col % N) + N) % N;
  if (col < 0 || col >= N || lin < 0 || lin >= N || !c) return;
  g[lin][col] = Array.isArray(c) ? [...c] : cor(c);
}

/** Carimba um desenho pequeno (lista de strings) com o canto superior esquerdo em (col, lin). */
export function carimbar(g, sprite, col, lin, envolver = false) {
  sprite.forEach((fileira, dy) => {
    Array.from(fileira).forEach((letra, dx) => {
      if (letra !== "." && letra !== " ") ponto(g, col + dx, lin + dy, letra, envolver);
    });
  });
}

/** Espelha um sprite na horizontal (útil para virar um personagem para o outro lado). */
export const espelhar = (sprite) => sprite.map((l) => Array.from(l).reverse().join(""));

/** Troca letras de um sprite: recolorir(sprite, { R: "B" }). */
export const recolorir = (sprite, troca) => sprite.map((l) => Array.from(l, (ch) => troca[ch] ?? ch).join(""));

/** Linha reta de (c0, l0) até (c1, l1). */
export function linha(g, c0, l0, c1, l1, c, envolver = false) {
  const passos = Math.max(Math.abs(c1 - c0), Math.abs(l1 - l0));
  for (let i = 0; i <= passos; i++) {
    const t = passos ? i / passos : 0;
    ponto(g, Math.round(c0 + (c1 - c0) * t), Math.round(l0 + (l1 - l0) * t), c, envolver);
  }
}

/** Retângulo cheio de (c0, l0) até (c1, l1), inclusive. */
export function retangulo(g, c0, l0, c1, l1, c, envolver = false) {
  for (let l = l0; l <= l1; l++) for (let x = c0; x <= c1; x++) ponto(g, x, l, c, envolver);
}

/** Preenche onde f(col, lin) devolve uma letra de cor (ou null). */
export function pintar(g, f) {
  for (let lin = 0; lin < N; lin++) for (let col = 0; col < N; col++) ponto(g, col, lin, f(col, lin));
  return g;
}

/** Círculo cheio. */
export const disco = (g, cx, cy, raio, c) => pintar(g, (x, y) => (Math.hypot(x - cx, y - cy) <= raio ? c : null));

/** Anel (círculo vazado) entre os raios r0 e r1. */
export const anel = (g, cx, cy, r0, r1, c) =>
  pintar(g, (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    return d >= r0 && d <= r1 ? c : null;
  });

/**
 * Explosão de fogos: `raios` braços saindo de (cx, cy) até o comprimento `tamanho`,
 * com as cores da ponta para o centro em `cores` (ex.: ["W", "Y", "O"]).
 */
export function explosao(g, cx, cy, tamanho, cores, { raios = 8, envolver = false, fase = 0 } = {}) {
  for (let k = 0; k < raios; k++) {
    const a = fase + (2 * Math.PI * k) / raios;
    for (let d = 1; d <= tamanho; d++) {
      const idx = Math.min(cores.length - 1, Math.floor(((tamanho - d) / tamanho) * cores.length));
      ponto(g, Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), cores[idx], envolver);
    }
  }
  ponto(g, Math.round(cx), Math.round(cy), cores[0], envolver);
}

/**
 * Escreve um texto com a fonte do app ("pequena" 3×5 ou "grande" 5×7), letra a letra,
 * a partir de (col, lin). `c` é a letra de cor. Devolve a largura usada.
 */
export function escrever(g, texto, col, lin, c, { fonte = "pequena", espaco = 1, envolver = false } = {}) {
  const f = FONTES[fonte];
  let x = col;
  for (const ch of texto.toUpperCase()) {
    const glifo = f.glifos[ch] || f.glifos["?"];
    glifo.forEach((fileira, dy) => {
      for (let dx = 0; dx < f.largura; dx++) if (fileira[dx] === "#") ponto(g, x + dx, lin + dy, c, envolver);
    });
    x += f.largura + espaco;
  }
  return x - col - espaco;
}

// ---------- desenhos pequenos reaproveitados ----------

export const PINHEIRO = ["..G..", ".GGG.", "..G..", ".GGG.", "GGGGG", "..K.."];
export const PINHEIRO_NEVE = ["...W...", "..WGW..", "..GGG..", ".WGGGW.", ".GGGGG.", "WGGGGGW", "GGGGGGG", "...K..."];
export const PINHEIRO_ALTO = ["...Y...", "...G...", "..GGG..", "...G...", "..GGG..", ".GGGGG.", "..GGG..", ".GGGGG.", "GGGGGGG", "...K..."];
export const FLOCO = ["..W..", "W.W.W", ".WWW.", "W.W.W", "..W.."];
export const FLOCO_P = [".C.", "CWC", ".C."];
export const ESTRELINHA = [".Y.", "YWY", ".Y."];
