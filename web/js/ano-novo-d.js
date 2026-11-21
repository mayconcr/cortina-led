// Coleção de Ano Novo (parte D): 25 cenas de Réveillon que andam nos quatro sentidos da cortina.
//
// - "baixo" (coisas caindo) e "cima" (coisas subindo): a cortina rola as 20 LINHAS em loop, então
//   tudo dá a volta em cima e embaixo (ajudantes PV/CV), os desenhos se espalham por todas as linhas,
//   sem chão nem horizonte, e os padrões repetidos têm período de linhas que divide 20. O que sobe
//   leva o rastro embaixo da cabeça; o que cai, em cima. O que é igual em todas as linhas (tubo,
//   borda, trilho) parece parado enquanto a textura corre por ele.
// - "direita" e "esquerda" (padrão): a cortina rola as 20 COLUNAS; o que cruza a borda dá a volta
//   (P/C) e as faixas contínuas (mar, estrada, ponte) têm período que divide 20. Nas cenas "direita",
//   tudo olha para a direita.
// Fundo apagado, cores saturadas e pouco `b`/`k` (quase somem no LED). Cada cena acende de 40 a 220 LEDs.

import { N, carimbar, escrever, novaGrade, ponto, recolorir } from "./pixelart.js";

// ---------- ajudantes locais ----------

const mod = (a) => ((a % N) + N) % N;

/** Cenas horizontais: ponto e carimbo com a COLUNA dando a volta na borda. */
const P = (g, x, y, c) => ponto(g, Math.round(x), Math.round(y), c, true);
const C = (g, sprite, x, y) => carimbar(g, sprite, x, y, true);

/** Cenas verticais: ponto e carimbo com a LINHA dando a volta (em cima e embaixo). */
const PV = (g, x, y, c) => ponto(g, Math.round(x), mod(Math.round(y)), c);
const CV = (g, s, x, y) => s.forEach((f, dy) => Array.from(f).forEach((ch, dx) => ch !== "." && ch !== " " && PV(g, x + dx, y + dy, ch)));

/** Ponto "atrás": só acende onde ainda está apagado (estrelas de fundo, varais de luz). */
function atras(g, x, y, c, vertical = false) {
  const col = vertical ? Math.round(x) : mod(Math.round(x));
  const lin = vertical ? mod(Math.round(y)) : Math.round(y);
  if (c && col >= 0 && col < N && lin >= 0 && lin < N && !g[lin][col]) ponto(g, col, lin, c);
}

/** Sorteio com semente fixa: a mesma cena sai sempre igual. */
function sorteio(semente) {
  let s = semente >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** `n` raios de fogos saindo de (cx, cy), do raio r0 ao r1; corDe(d, k) devolve a letra (ou null). */
function raios(g, cx, cy, n, r0, r1, corDe, fase = 0, pt = P) {
  for (let k = 0; k < n; k++) {
    const a = fase + (2 * Math.PI * k) / n;
    for (let d = r0; d <= r1 + 1e-9; d += 1) pt(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, corDe(d, k));
  }
}

/** Brilho em cruz (+) com centro e braços de cores diferentes. */
function brilho(g, x, y, centro = "W", braco = "Y", pt = P) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pt(g, x + dx, y + dy, braco);
  pt(g, x, y, centro);
}

/** Linha reta entre pontos reais; corDe(t) recebe 0..1 do início ao fim (ou é uma letra). */
function traco(g, x0, y0, x1, y1, corDe, pt = P) {
  const passos = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    pt(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, typeof corDe === "function" ? corDe(t) : corDe);
  }
}

/** Carimba um desenho de "#" numa cor só. */
function glifo(g, desenho, x, y, c, pt = P) {
  desenho.forEach((fileira, dy) => Array.from(fileira).forEach((ch, dx) => ch === "#" && pt(g, x + dx, y + dy, c)));
}

/**
 * Faixa de ondas sem emenda (cenas horizontais): crista pontuda em x ≡ fase (mod período).
 * `cores` = cores de cima para baixo a partir da superfície; a crista vira `espuma`.
 */
function ondas(g, base, periodo, amp, cores, { fase = 0, espuma = "C", largEspuma = 0.12 } = {}) {
  for (let x = 0; x < N; x++) {
    const t = mod(x - fase) % periodo / periodo;
    const y = base + Math.round(amp * Math.sin(Math.PI * t));
    cores.forEach((c, k) => P(g, x, y + k, k === 0 && espuma && (t < largEspuma || t > 1 - largEspuma) ? espuma : c));
  }
}

// ============================================================
//                 CAINDO (movimento "baixo")
// ============================================================

// 1. Pétalas brancas: pétalas de rosa branca caindo, cada uma virada para um lado (base creme).
const PETALAS = [
  ["..W", ".WW", "VWw"], // inclinada /
  ["W..", "WW.", "wWV"], // inclinada \
  [".WW.", "WWWw", ".Vw."], // em concha, de frente
  ["WWw", ".VW"], // deitada
  ["W", "W", "V"], // de perfil, girando
];

function cenaPetalas() {
  const g = novaGrade();
  const lugares = [
    [1, 0, 2], [7, 2, 0], [12, 1, 3], [17, 3, 4],
    [3, 6, 1], [9, 7, 4], [14, 7, 2],
    [0, 12, 3], [6, 11, 2], [12, 13, 0], [17, 11, 1],
    [3, 16, 0], [8, 17, 1], [15, 17, 3],
  ];
  for (const [x, y, f] of lugares) CV(g, PETALAS[f], x, y);
  return g;
}

// 2. Diamantes caindo: pedras lapidadas (gelo, rosa e champanhe) com rastro curto em cima e brilhos.
const GEMA_G = [".WWCCC.", "WCCCCCB", ".CWCCB.", "..CCB..", "...B..."];
const GEMA_M = [".WCC.", "WCCCB", ".CCB.", "..B.."];

function cenaDiamantes() {
  const g = novaGrade();
  const rosa = { C: "P", B: "F" };
  const ouro = { C: "V", B: "Y" };
  const lista = [
    [1, 2, GEMA_G, null],
    [10, 0, GEMA_M, rosa],
    [14, 6, GEMA_G, null],
    [6, 9, GEMA_M, null],
    [1, 14, GEMA_M, ouro],
    [10, 13, GEMA_G, null],
    [16, 16, GEMA_M, rosa],
  ];
  for (const [x, y, s, troca] of lista) {
    CV(g, troca ? recolorir(s, troca) : s, x, y);
    const cx = x + Math.floor(s[0].length / 2);
    const [c1, c2] = troca ? [troca.C, troca.B] : ["C", "B"];
    PV(g, cx, y - 1, c1);
    PV(g, cx, y - 2, c2);
    PV(g, cx, y - 4, c2);
  }
  for (const [x, y] of [[6, 4], [18, 2], [15, 12], [5, 18]]) brilho(g, x, y, "W", "C", PV);
  return g;
}

// 3. Estrelas da meia-noite: estrelas douradas e prateadas caindo com rastro comprido em cima.
const ESTRELA5 = ["..Y..", "..Y..", "YYWYY", ".YVY.", ".Y.Y."];

function cenaEstrelasMeiaNoite() {
  const g = novaGrade();
  const prata = { Y: "C", V: "W" };
  const estrelas = [
    [1, 4, null, 6],
    [8, 10, prata, 5],
    [14, 1, null, 6],
    [15, 13, prata, 5],
    [3, 15, null, 4],
  ];
  for (const [x, y, troca, n] of estrelas) {
    CV(g, troca ? recolorir(ESTRELA5, troca) : ESTRELA5, x, y);
    const cores = troca ? ["W", "C", "C", "B", "B", "B"] : ["V", "Y", "O", "O", "y", "y"];
    for (let i = 1; i <= n; i++) if (i < 4 || i % 2 === 0) PV(g, x + 2, y - i, cores[i - 1]);
  }
  for (const [x, y, c] of [[10, 3, "Y"], [6, 2, "C"], [19, 8, "Y"], [11, 17, "C"]]) {
    brilho(g, x, y, "W", c, PV);
    PV(g, x, y - 2, c);
  }
  for (const [x, y] of [[0, 10], [18, 19], [7, 7], [12, 9]]) PV(g, x, y, "W");
  return g;
}

// 4. Glitter colorido: pontinhos de todas as cores e brilhos maiores com rastro.
function cenaGlitter() {
  const g = novaGrade();
  const r = sorteio(2027);
  const cores = ["F", "C", "Y", "L", "M", "O", "T", "P", "R", "W"];
  let i = 0;
  for (let cy = 0; cy < 5; cy++)
    for (let cx = 0; cx < 5; cx++)
      for (let k = 0; k < 3; k++) PV(g, cx * 4 + Math.floor(r() * 4), cy * 4 + Math.floor(r() * 4), cores[i++ % cores.length]);
  for (const [x, y, c] of [[3, 3, "F"], [12, 6, "C"], [7, 13, "Y"], [17, 15, "L"], [16, 1, "M"]]) {
    brilho(g, x, y, "W", c, PV);
    PV(g, x, y - 3, c);
    PV(g, x, y - 5, c);
  }
  return g;
}

// 5. Chuva de luzes: em cada fio da cortina, um risco de luz caindo (cabeça clara embaixo, cauda em cima).
function cenaChuvaLuzes() {
  const g = novaGrade();
  const caudas = {
    W: ["W", "W", "w", "w", null, "w"],
    V: ["W", "V", "Y", "y", null, "y"],
    F: ["W", "F", "F", "M", null, "M"],
    C: ["W", "C", "C", "B", null, "B"],
    M: ["W", "M", "M", "M", null, "M"],
  };
  const ordem = ["F", "C", "V", "M", "W"];
  for (let x = 0; x < N; x++) {
    const cabeca = mod(x * 7 + (x % 2 ? 3 : 0));
    const cauda = caudas[ordem[(x * 3) % ordem.length]];
    const comp = x % 2 ? 3 : 6;
    for (let i = 0; i < comp; i++) if (cauda[i]) PV(g, x, cabeca - i, cauda[i]);
  }
  return g;
}

// 6. Serpentinas em espiral: três fitas enroladas no próprio eixo (frente clara, verso escuro).
function cenaSerpentinasEspiral() {
  const g = novaGrade();
  const fitas = [
    [3.5, 0, "F", "M"],
    [10, (2 * Math.PI) / 3, "Y", "O"],
    [16.5, (4 * Math.PI) / 3, "T", "B"],
  ];
  for (const [eixo, fase, frente, verso] of fitas) {
    for (let k = 0; k < N * 6; k++) {
      const y = k / 6;
      const t = (2 * Math.PI * y) / 10 + fase;
      const naFrente = Math.cos(t) > 0;
      PV(g, eixo + 2.5 * Math.sin(t), y, naFrente ? frente : verso);
    }
  }
  return g;
}

// 7. Caça-níquel da sorte: três rolos com 7, estrela, trevo e diamante girando entre bordas paradas.
const SIMBOLOS = {
  sete: ["RRRRR", "...R.", "..R..", ".R..."],
  estrela: ["..Y..", "YYYYY", ".YVY.", ".Y.Y."],
  trevo: ["GG.GG", "GLGLG", ".GGG.", "..G.."],
  diamante: [".CWC.", "CCCCC", ".CCC.", "..C.."],
};

function cenaCacaNiquel() {
  const g = novaGrade();
  for (const x of [0, 6, 12, 18]) for (let y = 0; y < N; y++) PV(g, x, y, "y");
  const rolos = [
    [1, 0, ["sete", "estrela", "trevo", "diamante"]],
    [7, 2, ["estrela", "diamante", "sete", "trevo"]],
    [13, 1, ["trevo", "sete", "diamante", "estrela"]],
  ];
  for (const [x, desloc, lista] of rolos) lista.forEach((nome, i) => CV(g, SIMBOLOS[nome], x, desloc + i * 5));
  for (let y = 0; y < N; y += 4) PV(g, 19, y, y % 8 ? "Y" : "W");
  return g;
}

// ============================================================
//                 SUBINDO (movimento "cima")
// ============================================================

// 8. Corações subindo: corações de tamanhos e cores diferentes, com bolinhas no rastro embaixo.
const CORACAO7 = [".RR.RR.", "RWRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."];
const CORACAO5 = ["RR.RR", "RWRRR", ".RRR.", "..R.."];
const CORACAO3 = ["R.R", "RRR", ".R."];

function cenaCoracoes() {
  const g = novaGrade();
  const lista = [
    [1, 1, CORACAO7, "R", "P"],
    [13, 3, CORACAO5, "P", "F"],
    [8, 9, CORACAO3, "F", "P"],
    [12, 11, CORACAO7, "F", "P"],
    [2, 12, CORACAO5, "P", "R"],
    [16, 17, CORACAO3, "R", "P"],
  ];
  for (const [x, y, s, c, rastro] of lista) {
    CV(g, recolorir(s, { R: c }), x, y);
    const cx = x + Math.floor(s[0].length / 2);
    const base = y + s.length;
    PV(g, cx, base + 1, rastro);
    PV(g, cx - 1, base + 3, rastro);
    if (s.length > 4) PV(g, cx, base + 5, rastro);
  }
  return g;
}

// 9. Faíscas subindo: brasas de fogueira com a cabeça clara em cima e o rastro curvo embaixo.
function cenaFaiscas() {
  const g = novaGrade();
  const cores = ["W", "V", "Y", "Y", "O", "O", "R", "R"];
  const faiscas = [
    [1, 2, 5, 1], [4, 12, 6, -1], [6, 5, 4, 1], [8, 16, 5, -1], [10, 8, 6, 1],
    [12, 1, 4, -1], [13, 13, 5, 1], [15, 6, 6, -1], [17, 17, 4, 1], [18, 9, 5, -1],
    [2, 18, 3, 1], [9, 0, 3, -1],
  ];
  for (const [x, y, comp, curva] of faiscas) {
    for (let i = 0; i <= comp; i++) {
      if (i > 3 && i % 2) continue;
      const dx = curva * Math.round(Math.sin((i / comp) * Math.PI * 0.75) * 1.4);
      PV(g, x + dx, y + i, cores[Math.min(cores.length - 1, Math.round((i / comp) * (cores.length - 1)))]);
    }
  }
  for (const [x, y] of [[5, 9], [11, 4], [16, 14], [7, 19], [19, 2]]) PV(g, x, y, "O");
  return g;
}

// 10. Fogos em coluna: três colunas de lançamento, cada uma com um estouro e o próximo foguete subindo.
function cenaFogosColuna() {
  const g = novaGrade();
  const colunas = [
    [3, 3, ["Y", "O", "R"], 12],
    [10, 10, ["W", "C", "B"], 1],
    [16, 16, ["P", "F", "M"], 6],
  ];
  for (const [x, ey, cores, fy] of colunas) {
    raios(g, x, ey, 8, 1, 3, (d) => cores[Math.min(cores.length - 1, Math.round(3 - d))], 0, PV);
    PV(g, x, ey, "W");
    ["W", "V", "Y", "O", null, "O", null, "R"].forEach((c, i) => c && PV(g, x, fy + i, c));
  }
  return g;
}

// 11. Fonte de fogos: jatos de faíscas subindo, brancos no meio e laranja nas pontas.
function cenaFonte() {
  const g = novaGrade();
  const jatos = [
    [9, 0, 5, ["W", "W", "w"]],
    [10, 2, 5, ["W", "V", "w"]],
    [7, 1, 5, ["V", "Y", "Y"]],
    [12, 3, 5, ["V", "Y", "Y"]],
    [5, 4, 10, ["Y", "O", "O"]],
    [14, 7, 10, ["Y", "O", "O"]],
    [3, 8, 10, ["O", "R", "R"]],
    [16, 2, 10, ["O", "R", "R"]],
  ];
  for (const [x, y0, per, cores] of jatos) {
    for (let y = y0; y < y0 + N; y += per) cores.forEach((c, i) => PV(g, x, y + i, c));
  }
  return g;
}

// 12. Tubos de neon: cinco tubos fracos, parados, com pulsos de luz forte correndo para cima.
function cenaTubosNeon() {
  const g = novaGrade();
  const tubos = [
    [2, "r", ["W", "R", "R"], 0, 10],
    [6, "y", ["W", "V", "Y"], 3, 5],
    [10, "M", ["W", "F", "P"], 7, 10],
    [14, "g", ["W", "L", "G"], 1, 5],
    [18, "w", ["W", "C", "C"], 5, 10],
  ];
  for (const [x, fraca, pulso, y0, per] of tubos) {
    for (let y = 0; y < N; y++) PV(g, x, y, fraca);
    for (let y = y0; y < y0 + N; y += per) {
      pulso.forEach((c, i) => PV(g, x, y + i, c));
      PV(g, x - 1, y, pulso[1]);
      PV(g, x + 1, y, pulso[1]);
    }
  }
  return g;
}

// ============================================================
//              PARA A DIREITA (movimento "direita")
// ============================================================

// 13. Navio de cruzeiro: proa para a direita, janelas acesas, varal de luzes e fogos no céu.
const NAVIO = [
  ".....RR..........",
  ".....RR..........",
  "....wWWWWW.......",
  "...WYWYWYWC......",
  "..WWWWWWWWWWW....",
  "..WYYWYYWYYWC....",
  "BBBBBBBBBBBBBBBBB",
  "BYBYBYBYBYBYBBBB.",
  ".BBBBBBBBBBBBBB..",
];

function cenaNavio() {
  const g = novaGrade();
  const x0 = 1;
  const y0 = 6;
  const luzes = ["R", "Y", "G", "C", "F"];
  // mastro e varal de luzes até a proa e a popa
  for (let y = y0 - 3; y < y0; y++) P(g, x0 + 8, y, "w");
  P(g, x0 + 8, y0 - 4, "R");
  for (let i = 1; i <= 8; i += 2) {
    P(g, x0 + 8 + i, y0 - 4 + (i * 10) / 8, luzes[i % 5]);
    P(g, x0 + 8 - i, y0 - 4 + (i * 10) / 8, luzes[(i + 2) % 5]);
  }
  C(g, NAVIO, x0, y0);
  raios(g, 3, 2, 8, 1, 2, (d) => (d > 1 ? "F" : "P"));
  raios(g, 16, 2, 8, 1, 2, (d) => (d > 1 ? "Y" : "O"), Math.PI / 8);
  ondas(g, 16, 5, 1, ["B"], { espuma: "C" });
  ondas(g, 19, 10, 0, ["B"], { fase: 3, espuma: "C", largEspuma: 0.2 });
  for (const [x, y] of [[4, 15], [7, 17], [10, 15], [13, 17], [6, 18]]) P(g, x, y, "Y");
  return g;
}

// 14. Carro com latinhas: carro de festa indo para a direita, puxando latinhas e balões.
const CARRO = [
  "...RRRR....",
  "..RCCRCCR..",
  ".RRRRRRRRRR",
  "ORRRRRRRRRY",
  "RRwWwRRwWwR",
  "...w....w..",
];
const LATA = ["WW", "YY", "ww"];
const BALAO = [".FF.", "FWFF", "FFFF", ".FF."];

function cenaCarro() {
  const g = novaGrade();
  const x0 = 8;
  const y0 = 12;
  // latinhas pulando atrás, presas no para-choque
  for (const [x, y, c] of [[1, 15, "Y"], [4, 16, "C"], [2, 12, "L"]]) {
    traco(g, x0, y0 + 3, x + 1, y, "w");
    C(g, recolorir(LATA, { Y: c }), x, y);
  }
  // balões amarrados, voando para trás
  for (const [x, y, c, s] of [[2, 3, "F", "P"], [8, 1, "C", "B"]]) {
    traco(g, x0 + 1, y0, x + 2, y + 4, "w");
    C(g, recolorir(BALAO, { F: c }), x, y);
  }
  C(g, CARRO, x0, y0);
  for (let x = 0; x < N; x++) if (x % 5 < 3) P(g, x, 19, "w");
  return g;
}

// 15. Barquinho de Iemanjá: barco de oferendas com flores brancas e velas, indo para a direita.
const BARQUINHO = [
  "...Y.....Y.....",
  "...O.....O.....",
  "...W.....W....C",
  ".WVWPW.WVWPW.CC",
  "CCCCCCCCCCCCCC.",
  ".WWWWWWWWWWWW..",
  "..BBBBBBBBBB...",
];

function cenaBarquinho() {
  const g = novaGrade();
  C(g, BARQUINHO, 3, 8);
  ondas(g, 15, 5, 1, ["B"], { espuma: "C" });
  ondas(g, 18, 10, 1, ["B"], { fase: 4, espuma: "C" });
  for (const [x, y, c] of [[6, 16, "Y"], [12, 16, "O"], [1, 14, "W"], [0, 17, "W"], [17, 17, "W"]]) P(g, x, y, c);
  for (const [x, y] of [[2, 2], [9, 0], [15, 3], [19, 1], [12, 5]]) P(g, x, y, "W");
  return g;
}

// ============================================================
//               PARA A ESQUERDA (movimento padrão)
// ============================================================

// 16. Fogos em estrela: o estouro desenha uma estrela de cinco pontas, com raios até as pontas.
function cenaFogosEstrela() {
  const g = novaGrade();
  const cx = 9.5;
  const cy = 10.3;
  const v = Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const r = k % 2 ? 3.6 : 9.2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  for (let k = 0; k < 10; k++) {
    const [x0, y0] = v[k];
    const [x1, y1] = v[(k + 1) % 10];
    const passos = Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.25);
    for (let i = 0; i <= passos; i++) P(g, x0 + ((x1 - x0) * i) / passos, y0 + ((y1 - y0) * i) / passos, i % 2 ? "Y" : "O");
  }
  for (let k = 0; k < 10; k += 2) {
    for (let d = 1.5; d < 7.5; d += 1.5) P(g, cx + ((v[k][0] - cx) * d) / 9.2, cy + ((v[k][1] - cy) * d) / 9.2, "F");
    P(g, v[k][0], v[k][1], "W");
  }
  brilho(g, cx, cy, "W", "V");
  return g;
}

// 17. Fogos sorridentes: estouros em forma de carinha feliz.
function carinha(g, cx, cy, r, aro, olho, boca) {
  const n = Math.max(12, Math.round((2 * Math.PI * r) / 1.5));
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    P(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, k % 2 ? aro[1] : aro[0]);
  }
  for (const s of [-1, 1]) {
    P(g, cx + s * r * 0.38, cy - r * 0.3, olho);
    if (r > 4) P(g, cx + s * r * 0.38, cy - r * 0.3 + 1, olho);
  }
  const m = r > 4 ? 7 : 3;
  for (let k = 0; k < m; k++) {
    const a = Math.PI * (0.18 + (0.64 * k) / (m - 1));
    P(g, cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, boca);
  }
}

function cenaSorridentes() {
  const g = novaGrade();
  carinha(g, 7.5, 10, 7, ["Y", "O"], "W", "Y");
  carinha(g, 16.5, 3.5, 3, ["P", "F"], "W", "P");
  for (const [x, y, c] of [[17, 13, "C"], [1, 1, "L"], [14, 18, "Y"]]) brilho(g, x, y, "W", c);
  return g;
}

// 18. Arco-íris de fogos: meio estouro com as cores do arco-íris em faixas, do centro para fora.
function cenaArcoIris() {
  const g = novaGrade();
  const faixas = ["M", "B", "C", "G", "Y", "O", "R"];
  const n = 15;
  for (let k = 0; k < n; k++) {
    const a = Math.PI + (Math.PI * (k + 0.5)) / n;
    for (let d = 3; d <= 9; d += 1) P(g, 9.5 + Math.cos(a) * d, 19.5 + Math.sin(a) * d * 1.8, faixas[d - 3]);
    P(g, 9.5 + Math.cos(a) * 10.2, 19.5 + Math.sin(a) * 10.2 * 1.8, "W");
  }
  return g;
}

// 19. Neon 2027: letreiro de tubos finos entre dois tubos contínuos, com um coração no vão.
const NEON = {
  2: [".#.", "#.#", "..#", ".#.", "#..", "#..", "###"],
  0: [".#.", "#.#", "#.#", "#.#", "#.#", "#.#", ".#."],
  7: ["###", "..#", "..#", ".#.", ".#.", ".#.", ".#."],
};

function cenaNeon2027() {
  const g = novaGrade();
  for (let x = 0; x < N; x++) {
    P(g, x, 3, "M");
    P(g, x, 16, "M");
  }
  const cores = ["F", "C", "F", "C"];
  Array.from("2027").forEach((d, i) => glifo(g, NEON[d], 1 + i * 4, 6, cores[i]));
  C(g, ["R.R", "RRR", ".R."], 17, 8);
  for (const [x, y, c] of [[3, 0, "Y"], [12, 1, "L"], [8, 18, "Y"], [17, 19, "L"]]) P(g, x, y, c);
  return g;
}

// 20. DJ na festa: DJ de fone atrás da mesa com os dois toca-discos, holofotes e notas musicais.
const DJ = [
  "......MMMMMM......",
  ".....MKKKKKKM.....",
  ".....MKKKKKKM.....",
  "....MMSSSSSSMM....",
  "....MMSSSSSSMM....",
  "......SSSSSS......",
  ".......SSSS.......",
  ".....TTTTTTTT.....",
  "....TTTTTTTTTT....",
  "...STTTTTTTTTTS...",
  "..S..TTTTTTTT..S..",
  ".wWWWw......wWWWw.",
  "wwwwwwwwwwwwwwwwww",
  "w.R.Y.L.C.M.F.P..w",
  "wwwwwwwwwwwwwwwwww",
];
const NOTA = [".YY", ".Y.", "YY."];

function cenaDJ() {
  const g = novaGrade();
  C(g, DJ, 1, 3);
  C(g, NOTA, 0, 0);
  C(g, recolorir(NOTA, { Y: "C" }), 17, 1);
  C(g, recolorir(NOTA, { Y: "F" }), 19, 14);
  return g;
}

// 21. Equalizador: barras de som (período 20) do verde ao vermelho, com o pico flutuando em cima.
function cenaEqualizador() {
  const g = novaGrade();
  const alturas = [6, 10, 14, 9, 12, 16, 11, 7, 13, 8];
  const corDaAltura = (h) => (h >= 14 ? "R" : h >= 11 ? "O" : h >= 8 ? "Y" : h >= 4 ? "L" : "G");
  alturas.forEach((alt, i) => {
    for (let h = 0; h < alt; h++) P(g, i * 2, 19 - h, corDaAltura(h));
    P(g, i * 2, 19 - alt - 1, "W");
  });
  return g;
}

// 22. Sino da meia-noite: sino dourado com "12" vazado, badalo, ondas de som e estrelas.
const SINO = [
  "......y......",
  ".....y.y.....",
  ".....YYY.....",
  "...YVYYYYy...",
  "..YVYYYYYYy..",
  "..YV.Y.YY.y..",
  "..YV.Y...Yy..",
  "..YY.Y.YYYy..",
  ".YYV.Y.Y.YYy.",
  ".YYV.Y.YYYYy.",
  "YVYYYYYYYYYYy",
  "OOOOOOOOOOOOO",
  "......W......",
];

function cenaSino() {
  const g = novaGrade();
  C(g, SINO, 3, 3);
  for (const s of [-1, 1]) {
    const x = s < 0 ? 1 : 17;
    for (const [dx, dy] of [[0, 0], [-s, 1], [-s, 2], [0, 3]]) P(g, x + dx * 1 + (s < 0 ? 0 : 0), 7 + dy, "C");
  }
  for (const [x, y] of [[1, 1], [18, 2], [16, 18], [2, 17]]) P(g, x, y, "W");
  return g;
}

// 23. Ponte iluminada: ponte pênsil (período 10) com o cabo de luzes, torres e o reflexo na água.
function cenaPonte() {
  const g = novaGrade();
  const tabuleiro = 11;
  for (const tx of [2, 12]) {
    for (let y = 3; y <= 13; y++) P(g, tx, y, "w");
    P(g, tx, 2, "R");
  }
  const luzes = ["Y", "V", "C", "F"];
  for (let x = 0; x < N; x++) {
    const t = mod(x - 2) % 10 / 10;
    const y = 3 + 7 * 4 * t * (1 - t);
    P(g, x, y, luzes[x % 4]);
    P(g, x, tabuleiro, x % 2 ? "Y" : "W");
  }
  for (let x = 0; x < N; x++) {
    if (x % 2 === 0) P(g, x + (x % 4 ? 1 : 0), 14, "Y");
    if (x % 4 === 1) P(g, x, 16, "O");
    if (x % 5 === 0) P(g, x, 18, "B");
  }
  return g;
}

// 24. Céu de Réveillon: muitas estrelas e alguns estouros pequenos, lá longe.
function cenaCeu() {
  const g = novaGrade();
  for (const [x, y, cores] of [[4, 4, ["F", "P"]], [14, 3, ["Y", "O"]], [9, 12, ["C", "W"]], [17, 14, ["L", "G"]], [2, 15, ["M", "F"]]]) {
    raios(g, x, y, 8, 1, 2, (d) => (d > 1 ? cores[0] : cores[1]));
    P(g, x, y, "W");
  }
  const r = sorteio(31);
  for (let i = 0; i < 28; i++) atras(g, Math.floor(r() * N), Math.floor(r() * N), r() < 0.7 ? "W" : "C");
  return g;
}

// 25. 2027 com fogos: "20" em cima e "27" embaixo, com brilho de faísca e dois estouros no vão.
function cena2027Fogos() {
  const g = novaGrade();
  escrever(g, "20", 3, 1, "Y", { fonte: "grande", envolver: true });
  escrever(g, "27", 3, 11, "Y", { fonte: "grande", envolver: true });
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const c = g[y][x];
      if (c && (x + 2 * y) % 5 === 0) g[y][x] = [255, 255, 255];
    }
  raios(g, 17, 5, 8, 1, 3, (d) => (d > 2 ? "F" : d > 1 ? "P" : "W"));
  raios(g, 17.5, 15, 8, 1, 2, (d) => (d > 1 ? "C" : "W"), Math.PI / 8);
  return g;
}

export const ANIMACOES_ANO_NOVO_D = [
  { id: "ano4-petalas-brancas", nome: "Pétalas brancas", criar: cenaPetalas, movimento: "baixo" },
  { id: "ano4-diamantes", nome: "Diamantes caindo", criar: cenaDiamantes, movimento: "baixo" },
  { id: "ano4-estrelas-meia-noite", nome: "Estrelas da meia-noite", criar: cenaEstrelasMeiaNoite, movimento: "baixo" },
  { id: "ano4-glitter", nome: "Glitter colorido", criar: cenaGlitter, movimento: "baixo" },
  { id: "ano4-chuva-luzes", nome: "Chuva de luzes", criar: cenaChuvaLuzes, movimento: "baixo" },
  { id: "ano4-serpentinas-espiral", nome: "Serpentinas em espiral", criar: cenaSerpentinasEspiral, movimento: "baixo" },
  { id: "ano4-caca-niquel", nome: "Caça-níquel da sorte", criar: cenaCacaNiquel, movimento: "baixo" },
  { id: "ano4-coracoes", nome: "Corações subindo", criar: cenaCoracoes, movimento: "cima" },
  { id: "ano4-faiscas", nome: "Faíscas subindo", criar: cenaFaiscas, movimento: "cima" },
  { id: "ano4-fogos-coluna", nome: "Fogos em coluna", criar: cenaFogosColuna, movimento: "cima" },
  { id: "ano4-fonte", nome: "Fonte de fogos", criar: cenaFonte, movimento: "cima" },
  { id: "ano4-tubos-neon", nome: "Tubos de neon", criar: cenaTubosNeon, movimento: "cima" },
  { id: "ano4-navio", nome: "Navio de cruzeiro", criar: cenaNavio, movimento: "direita" },
  { id: "ano4-carro", nome: "Carro com latinhas", criar: cenaCarro, movimento: "direita" },
  { id: "ano4-iemanja", nome: "Barquinho de Iemanjá", criar: cenaBarquinho, movimento: "direita" },
  { id: "ano4-fogos-estrela", nome: "Fogos em estrela", criar: cenaFogosEstrela },
  { id: "ano4-sorridentes", nome: "Fogos sorridentes", criar: cenaSorridentes },
  { id: "ano4-arco-iris", nome: "Arco-íris de fogos", criar: cenaArcoIris },
  { id: "ano4-neon-2027", nome: "Neon 2027", criar: cenaNeon2027 },
  { id: "ano4-dj", nome: "DJ na festa", criar: cenaDJ },
  { id: "ano4-equalizador", nome: "Equalizador", criar: cenaEqualizador },
  { id: "ano4-sino", nome: "Sino da meia-noite", criar: cenaSino },
  { id: "ano4-ponte", nome: "Ponte iluminada", criar: cenaPonte },
  { id: "ano4-ceu", nome: "Céu de Réveillon", criar: cenaCeu },
  { id: "ano4-2027-fogos", nome: "2027 com fogos", criar: cena2027Fogos },
];
