// Coleção de Ano Novo (parte C): 25 cenas da virada para 2027, cada uma com o seu movimento.
//
// Movimento "cima" ou "baixo": a cortina rola as 20 LINHAS em loop, então tudo dá a volta na
// vertical (PV/CV), os desenhos ficam espalhados pelas 20 linhas e não há chão nem horizonte.
// O que sobe vai para "cima" com o rastro embaixo; o que cai vai para "baixo" com o rastro em cima.
// O que é igual em todas as linhas parece parado e a textura corre pelos fios da cortina; por isso
// os padrões que se repetem na vertical têm período que divide 20 (4, 5, 10 ou 20 linhas).
// Movimento "esquerda" (o padrão) ou "direita": a cortina rola as 20 colunas; o que cruza a borda
// dá a volta (P/C) e as faixas contínuas têm período que divide 20. Nas cenas "direita", tudo olha
// para a direita.
// Fundo apagado, cores saturadas e entre 40 e 220 LEDs por cena.

import { N, carimbar, escrever, novaGrade, ponto, recolorir } from "./pixelart.js";

// ---------- ajudantes locais ----------

/** Ponto com coordenadas reais; a COLUNA dá a volta na borda (cenas que rolam para os lados). */
const P = (g, x, y, c) => ponto(g, Math.round(x), Math.round(y), c, true);

/** Carimbo em que a coluna dá a volta (cenas que rolam para os lados). */
const C = (g, sprite, x, y) => carimbar(g, sprite, x, y, true);

/** Ponto em que a LINHA dá a volta (cenas que rolam para cima ou para baixo). */
const PV = (g, x, y, c) => ponto(g, Math.round(x), ((Math.round(y) % N) + N) % N, c);

/** Carimbo em que a linha dá a volta. */
const CV = (g, s, x, y) =>
  s.forEach((f, dy) => Array.from(f).forEach((ch, dx) => ch !== "." && ch !== " " && PV(g, x + dx, y + dy, ch)));

/** Sorteio com semente fixa: a mesma cena sai sempre igual. */
function sorteio(semente) {
  let s = semente >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** `n` raios de fogos saindo de (cx, cy), do raio r0 ao r1; corDe(d, k) devolve a letra (ou null). */
function raios(g, cx, cy, n, r0, r1, corDe, fase = 0, pen = P) {
  for (let k = 0; k < n; k++) {
    const a = fase + (2 * Math.PI * k) / n;
    for (let d = r0; d <= r1 + 1e-9; d += 1) pen(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, corDe(d, k));
  }
}

/** Brilho em cruz (+) com centro e braços de cores diferentes. */
function brilho(g, x, y, centro = "W", braco = "Y", pen = P) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pen(g, x + dx, y + dy, braco);
  pen(g, x, y, centro);
}

/** Linha reta entre pontos reais; corDe(t) recebe 0..1 do início ao fim (ou é uma letra). */
function traco(g, x0, y0, x1, y1, corDe, pen = P) {
  const passos = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    pen(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, typeof corDe === "function" ? corDe(t) : corDe);
  }
}

/** Contorno de círculo amostrado em `n` pontos; `c` pode ser letra ou função (k) => letra. */
function aro(g, cx, cy, r, c, n, pen = P) {
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    pen(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, typeof c === "function" ? c(k) : c);
  }
}

/** Desenho de "#" numa cor só (letras feitas à mão). Devolve a largura. */
function glifo(g, desenho, x, y, cor, pen = P) {
  desenho.forEach((f, dy) => Array.from(f).forEach((ch, dx) => ch === "#" && pen(g, x + dx, y + dy, cor)));
  return desenho[0].length;
}

// ============================================================
//                 SOBEM (movimento "cima")
// ============================================================

// Lanternas dos desejos: balões de papel acesos por dentro, de vários tamanhos (as pequenas estão
// mais longe). A chama fica embaixo, na boca da lanterna.
const LANTERNA_G = [".111.", "11111", "12221", "12221", ".232.", "..W.."];
const LANTERNA_M = ["111", "121", "232", ".W."];
const lanterna = (s, a, b, c) => recolorir(s, { 1: a, 2: b, 3: c });

function cenaLanternas() {
  const g = novaGrade();
  CV(g, lanterna(LANTERNA_G, "O", "Y", "V"), 1, 1);
  CV(g, lanterna(LANTERNA_G, "R", "O", "Y"), 13, 11);
  CV(g, lanterna(LANTERNA_M, "O", "Y", "V"), 8, 5);
  CV(g, lanterna(LANTERNA_M, "Y", "V", "W"), 16, 2);
  CV(g, lanterna(LANTERNA_M, "R", "O", "Y"), 4, 12);
  for (const [x, y] of [[11, 0], [18, 8], [1, 17], [9, 15], [16, 18], [6, 9]]) {
    PV(g, x, y, "O");
    PV(g, x, y + 1, "Y");
  }
  return g;
}

// Rojões em fila: duas salvas de cinco rojões subindo lado a lado, cada um com o rastro de faíscas embaixo.
function cenaRojoes() {
  const g = novaGrade();
  const rastro = ["V", "Y", "Y", "O", "O", null, "R", null, "r"];
  for (const [x0, y0, cores] of [
    [1, 1, ["R", "C", "F", "L", "Y"]],
    [3, 11, ["M", "O", "T", "P", "C"]],
  ]) {
    cores.forEach((c, i) => {
      const x = x0 + i * 4;
      const y = y0 + (i % 2);
      PV(g, x, y, "W");
      PV(g, x, y + 1, c);
      PV(g, x, y + 2, c);
      rastro.forEach((t, d) => t && PV(g, x, y + 3 + d, t));
      PV(g, x - 1, y + 5, "Y");
      PV(g, x + 1, y + 7, "O");
    });
  }
  return g;
}

// Fogos em espiral: estouros que giram em espiral (dois braços de cores diferentes), subindo.
function espiral(g, cx, cy, raio, voltas, cores, fase) {
  cores.forEach(([c1, c2], b) => {
    for (let t = 0; t <= 1.0001; t += 0.01) {
      const a = fase + (2 * Math.PI * b) / cores.length + t * voltas * 2 * Math.PI;
      const r = 0.7 + t * (raio - 0.7);
      if (t > 0.8 && Math.round(t * 100) % 8 > 3) continue; // a ponta vira faísca
      PV(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, t < 0.15 ? "W" : t < 0.55 ? c1 : c2);
    }
  });
}

function cenaFogosEspiral() {
  const g = novaGrade();
  espiral(g, 6, 5, 5.5, 0.9, [["Y", "O"], ["F", "M"]], 0);
  espiral(g, 13.5, 14.5, 5.5, 0.9, [["C", "B"], ["L", "G"]], 2);
  espiral(g, 16, 3.5, 2.6, 0.7, [["P", "F"], ["V", "Y"]], 1);
  espiral(g, 3.5, 15.5, 2.6, 0.7, [["T", "C"], ["Y", "O"]], 4);
  for (const [x, y] of [[11, 9], [1, 10], [18, 9], [9, 19]]) PV(g, x, y, "W");
  return g;
}

// Espiral dourada: hélice dupla de faíscas em volta de um eixo (período de 20 linhas). A parte da
// frente é clara e a de trás, escura; subindo, parece girar como um chafariz de fogos.
function cenaEspiralDourada() {
  const g = novaGrade();
  const cx = 9.5;
  const amp = 7;
  const cor = (p) => (p > 0.75 ? "W" : p > 0.25 ? "V" : p > -0.25 ? "Y" : p > -0.7 ? "O" : "y");
  for (const tras of [true, false])
    for (const fase of [0, Math.PI])
      for (let y = 0; y < N; y += 0.05) {
        const th = fase + (2 * Math.PI * y) / N;
        const prof = Math.cos(th);
        if (prof < 0 === tras) PV(g, cx + amp * Math.sin(th), y, cor(prof));
      }
  // faíscas soltas que escapam pelos lados
  for (const [x, y, c] of [[1, 4, "Y"], [0, 7, "O"], [18, 14, "Y"], [19, 17, "O"], [1, 16, "V"], [18, 3, "V"], [6, 10, "Y"], [13, 0, "Y"]]) PV(g, x, y, c);
  return g;
}

// Decolagem 2027: foguete de três corpos com "2027" na faixa do meio, a chama e o rastro embaixo
// e estrelas em volta.
function cenaDecolagem() {
  const g = novaGrade();
  CV(g, [
    ".........W.........",
    "........RRR........",
    "...W...RRRRR...W...",
    "..RRR..WWWWW..RRR..",
    ".RRRRR.WWWWW.RRRRR.",
    ".WWWWWWWWWWWWWWWWW.",
  ], 0, 0);
  escrever(g, "2027", 2, 6, "Y");
  CV(g, [
    ".WWWWWWWWWWWWWWWWW.",
    "R.www...www...www.R",
    "R..Y....VWV....Y..R",
    "...O....YVY....O...",
    "...R....OYO....R...",
    ".........O.........",
    "...y.....R.....y...",
    ".........O.........",
  ], 0, 11);
  for (const [x, y] of [[0, 1], [5, 0], [13, 1], [19, 3], [0, 8], [19, 9], [6, 17], [12, 18], [1, 19], [18, 16]]) PV(g, x, y, "W");
  return g;
}

// Balões subindo: os balões de número "2027" (dourados) e balões de coração, redondo e estrela.
const NUM_BALAO = {
  2: [".YY.", "W..Y", "..YY", ".YY.", "YY..", "YYYY"],
  0: [".YY.", "W..Y", "Y..Y", "Y..Y", "Y..Y", ".YY."],
  7: ["WYYY", "..YY", "..Y.", ".YY.", ".Y..", ".Y.."],
};
const BALOES = {
  coracao: ["11.11", "1W111", "11112", ".112.", "..2.."],
  redondo: [".11.", "1W11", "1112", ".12.", "..1."],
  estrela: ["..1..", ".111.", "11W11", ".111.", ".1.1."],
};

function cenaBaloesSubindo() {
  const g = novaGrade();
  const fio = (x, y, n) => {
    for (let i = 0; i < n; i++) PV(g, x + (i % 2), y + i, "w");
  };
  [..."2027"].forEach((d, i) => {
    const x = i * 5;
    const y = 1 + (i % 2);
    CV(g, NUM_BALAO[d], x, y);
    fio(x + 1, y + 6, 3);
  });
  for (const [forma, x, y, c, s] of [
    ["coracao", 0, 11, "R", "r"],
    ["redondo", 6, 12, "C", "B"],
    ["estrela", 10, 10, "F", "M"],
    ["redondo", 16, 12, "L", "G"],
  ]) {
    const b = BALOES[forma];
    CV(g, recolorir(b, { 1: c, 2: s }), x, y);
    fio(x + Math.floor(b[0].length / 2), y + b.length, 3);
  }
  return g;
}

// Chapéus voando: chapéus de festa jogados para o alto, girando, com tracinhos de movimento embaixo.
function chapeu(g, bx, by, graus, alt, meia, c1, c2, pompom) {
  const a = (graus * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  for (let y = Math.floor(by - alt - 2); y <= by + 2; y++)
    for (let x = Math.floor(bx - alt - 2); x <= bx + alt + 2; x++) {
      const dx = x - bx;
      const dy = y - by;
      const t = dx * ux + dy * uy; // ao longo do chapéu (0 na aba, alt na ponta)
      const s = -dx * uy + dy * ux; // de lado
      if (t < -0.5 || t > alt) continue;
      if (Math.abs(s) > meia * (1 - t / alt) + 0.5) continue;
      PV(g, x, y, t < 0.5 ? "V" : Math.floor((t + s * 0.6) / 1.6) % 2 ? c1 : c2);
    }
  PV(g, bx + ux * (alt + 0.8), by + uy * (alt + 0.8), pompom);
  for (const k of [-1, 1]) {
    PV(g, bx + k * meia * 0.7, by + 2.2, "w");
    PV(g, bx + k * meia * 0.7, by + 3.2, "w");
  }
}

function cenaChapeus() {
  const g = novaGrade();
  chapeu(g, 4, 7, -20, 6, 2.6, "F", "T", "Y");
  chapeu(g, 14, 5, 25, 5, 2.2, "Y", "R", "W");
  chapeu(g, 9.5, 16, 8, 6, 2.6, "C", "M", "W");
  chapeu(g, 17, 15.5, -30, 4.5, 2, "L", "O", "Y");
  chapeu(g, 3, 16.5, 30, 4, 1.8, "P", "Y", "W");
  return g;
}

// Bolhas de champanhe: dentro de uma taça bem alta. As paredes são iguais em todas as linhas (ficam
// paradas) e as bolhas sobem em fileiras sinuosas, crescendo no caminho.
const BOLHA = { 1: ["V"], 2: ["WV", "VY"], 3: [".V.", "W.V", ".Y."], 4: [".VV.", "W..V", "V..Y", ".YY."] };

function cenaBolhasChampanhe() {
  const g = novaGrade();
  for (let y = 0; y < N; y++) {
    PV(g, 2, y, "C");
    PV(g, 3, y, y % 5 ? "y" : "Y");
    PV(g, 17, y, "C");
    PV(g, 16, y, y % 5 === 2 ? "Y" : "y");
  }
  const subida = [[0, 1], [2, 1], [4, 1], [6.5, 2], [10, 3], [14.5, 4]];
  for (const [x0, y0] of [[6.5, 19], [10, 6], [13, 13]]) {
    for (const [s, tam] of subida) {
      const y = y0 - s;
      const x = x0 + 1.4 * Math.sin((2 * Math.PI * y) / 20);
      const b = BOLHA[tam];
      CV(g, b, Math.round(x - (b[0].length - 1) / 2), Math.round(y - (b.length - 1) / 2));
    }
  }
  return g;
}

// Torre de bolhas: colunas de argolinhas e de pontinhos subindo em ritmos diferentes.
function cenaTorreBolhas() {
  const g = novaGrade();
  const anel = [".V.", "W.V", ".V."];
  [[1, 0], [6, 2], [11, 4], [16, 1]].forEach(([x, fase]) => {
    for (let y = fase; y < N; y += 5) CV(g, anel, x, y);
  });
  [[4, 1], [9, 3], [14, 0]].forEach(([x, fase]) => {
    for (let y = fase; y < N; y += 4) PV(g, x, y, (y - fase) % 8 ? "Y" : "W");
  });
  return g;
}

// ============================================================
//                 CAEM (movimento "baixo")
// ============================================================

// Chuva de confete: papeizinhos de formatos diferentes (coração, estrelinha, argola, tirinhas).
const FORMAS_CONFETE = [
  ["1.1", "111", ".1."],
  [".1.", "111", ".1."],
  [".1.", "1.1", ".1."],
  ["11", "11"],
  ["111"],
  ["1", "1", "1"],
  ["1.", ".1"],
  [".1", "1."],
];

function cenaChuvaConfete() {
  const g = novaGrade();
  const r = sorteio(31);
  const cores = ["R", "Y", "C", "F", "L", "O", "M", "T", "P", "W", "G", "B"];
  let i = 0;
  for (let cy = 0; cy < 5; cy++)
    for (let cx = 0; cx < 4; cx++) {
      const forma = FORMAS_CONFETE[(i * 3 + cy) % FORMAS_CONFETE.length];
      const x = cx * 5 + Math.floor(r() * (6 - forma[0].length));
      const y = cy * 4 + Math.floor(r() * 2);
      CV(g, recolorir(forma, { 1: cores[i % cores.length] }), x, y);
      i++;
    }
  return g;
}

// Chuva de serpentina: serpentinas enroladas em caracol caindo (cada volta mostra a frente e o verso).
function serpentina(g, cx, y0, comp, c1, c2) {
  const r = 2.3;
  const k = 0.8;
  for (let t = 0; t <= comp / k; t += 0.02) PV(g, cx + r * Math.sin(t), y0 + k * t - r * Math.cos(t), Math.cos(t) < 0 ? c1 : c2);
}

function cenaChuvaSerpentina() {
  const g = novaGrade();
  serpentina(g, 3, 2, 14, "F", "M");
  serpentina(g, 10, 12, 13, "Y", "O");
  serpentina(g, 16.5, 6, 14, "C", "B");
  return g;
}

// Chuva de estrelas: estrelas de cinco pontas e estrelinhas coloridas caindo, com um rastro curto em cima.
const ESTRELA5 = ["..1..", ".111.", "11211", ".111.", ".1.1."];
const ESTRELA3 = [".1.", "121", ".1."];

function cenaChuvaEstrelas() {
  const g = novaGrade();
  const grandes = [[1, 2, "Y"], [12, 9, "W"], [6, 15, "Y"]];
  for (const [x, y, c] of grandes) {
    CV(g, recolorir(ESTRELA5, { 1: c, 2: c === "W" ? "C" : "W" }), x, y);
    ["V", "Y", null, "y"].forEach((t, d) => t && PV(g, x + 2, y - 1 - d, t));
  }
  const pequenas = [[15, 1, "C"], [8, 4, "P"], [17, 14, "Y"], [1, 10, "L"], [11, 17, "C"], [16, 7, "F"]];
  for (const [x, y, c] of pequenas) {
    CV(g, recolorir(ESTRELA3, { 1: c, 2: "W" }), x, y);
    PV(g, x + 1, y - 2, "w");
  }
  for (const [x, y] of [[5, 9], [19, 19], [9, 12], [3, 6]]) PV(g, x, y, "W");
  return g;
}

// Meteoros dourados: riscos que descem pelos fios, cabeça clara embaixo e cauda que apaga para cima.
function cenaMeteorosDourados() {
  const g = novaGrade();
  const cauda = ["Y", "Y", "O", "O", "y", "y"];
  for (let x = 0; x < N; x += 2) {
    const base = (x * 7 + 3) % 20;
    [[0, 6], [10, 4]].forEach(([desloc, comp], i) => {
      const y = base + desloc;
      PV(g, x, y, (x + i) % 4 ? "V" : "W");
      for (let d = 1; d <= comp - (x % 3 === 0 ? 1 : 0); d++) PV(g, x, y - d, cauda[d - 1]);
    });
  }
  return g;
}

// Cachoeira de faíscas: um fio aceso solta faíscas prateadas que escorrem pelos fios da cortina.
function cenaCachoeira() {
  const g = novaGrade();
  const r = sorteio(2031);
  for (let x = 0; x < N; x++) {
    PV(g, x, 0, x % 2 ? "C" : "W");
    const comp = 9 + Math.floor(r() * 9);
    let y = 1 + Math.floor(r() * 2);
    while (y <= comp) {
      PV(g, x, y, y < 5 ? "W" : y < 10 ? "C" : y < 14 ? "w" : "B");
      y += y < 6 ? 2 : 2 + Math.floor(r() * 2);
    }
  }
  return g;
}

// Chuva de moedas: moedas girando enquanto caem (de frente, de lado, de quina), com brilho em cima.
const MOEDAS = {
  frente: [".YYY.", "YVVVy", "YVWVy", "YVVVy", ".yyy."],
  tres: [".YY.", "YVVy", "YWVy", "YVVy", ".yy."],
  lado: [".Y.", "YVy", "YWy", "YVy", ".y."],
  quina: ["Y", "V", "W", "V", "y"],
  mini: [".Y.", "YVy", ".y."],
};

function cenaChuvaMoedas() {
  const g = novaGrade();
  for (const [m, x, y] of [
    ["frente", 1, 1],
    ["lado", 8, 4],
    ["quina", 13, 0],
    ["tres", 15, 7],
    ["frente", 9, 12],
    ["quina", 4, 13],
    ["mini", 16, 16],
    ["mini", 1, 9],
  ]) {
    const s = MOEDAS[m];
    CV(g, s, x, y);
    const meio = x + Math.floor(s[0].length / 2);
    PV(g, meio, y - 2, "V");
    PV(g, meio, y - 4, "y");
  }
  return g;
}

// ============================================================
//                 PARA A DIREITA (movimento "direita")
// ============================================================

// Rolha voando: a rolha do espumante voa para a direita deixando um rastro de espuma.
function cenaRolha() {
  const g = novaGrade();
  const r = sorteio(11);
  const cy = 10;
  for (let d = 1; d <= 11; d++) {
    const x = 13 - d;
    const meia = 0.8 + d * 0.38;
    for (let y = Math.ceil(cy - meia); y <= Math.floor(cy + meia); y++) {
      const chance = d <= 2 ? 1 : 0.95 - d * 0.06 - (Math.abs(y - cy) / meia) * 0.3;
      if (r() > chance) continue;
      const s = r();
      P(g, x, y, d <= 2 ? "W" : d <= 5 ? (s < 0.6 ? "W" : "V") : s < 0.5 ? "V" : s < 0.8 ? "Y" : "C");
    }
  }
  C(g, ["...KK.", "yyyKKV", "yVyKKV", "yyyKKV", "...KK."], 13, cy - 2);
  for (const [x, y] of [[4, 3], [9, 16], [16, 4], [1, 15]]) brilho(g, x, y, "W", "V");
  return g;
}

// São Silvestre: corredores na rua, com bandeirinhas em cima e tracinhos de velocidade atrás.
const CORREDOR_A = ["....KK.", "....SS.", "...11.S", "..S11S.", ".S.11..", "...BB..", "..B..B.", ".B....B", "W.....W"];
const CORREDOR_B = ["....KK.", "....SS.", "...11..", "...11S.", "..S11.S", "...BB..", "...BBB.", "...B..B", "..WW..W"];

function cenaSaoSilvestre() {
  const g = novaGrade();
  const cores = ["R", "Y", "C", "F", "L"];
  for (let x = 0; x < N; x++) {
    const k = Math.floor(x / 4);
    if (x % 4 < 3) P(g, x, 1, cores[k % cores.length]);
    if (x % 4 === 1) P(g, x, 2, cores[k % cores.length]);
    if (x % 4 === 3) P(g, x, 0, "w");
  }
  for (const [spr, x, camisa, cabelo] of [
    [CORREDOR_A, 0, "R", "K"],
    [CORREDOR_B, 7, "C", "Y"],
    [CORREDOR_A, 13, "Y", "K"],
  ]) {
    C(g, recolorir(spr, { 1: camisa, K: cabelo }), x, 7);
    P(g, x - 1, 10, "w");
    P(g, x - 2, 10, "w");
    P(g, x - 1, 12, "w");
  }
  for (let x = 0; x < N; x++) if (x % 5 < 3) P(g, x, 18, "w");
  return g;
}

// Avião com faixa 2027: um aviãozinho puxando a faixa de Ano Novo.
function cenaAviao() {
  const g = novaGrade();
  C(g, ["R....", "RW...", "WWWCW", ".WWW.", "..R.."], 15, 3);
  P(g, 14, 7, "w");
  P(g, 14, 8, "w");
  for (let x = 0; x <= 14; x++) {
    P(g, x, 9, x % 2 ? "R" : "W");
    P(g, x, 15, x % 2 ? "R" : "W");
  }
  escrever(g, "2027", 0, 10, "Y");
  for (const [x, y] of [[3, 2], [10, 1], [18, 12], [6, 18], [16, 17], [12, 5]]) P(g, x, y, "W");
  return g;
}

// Cometa da sorte: cabeça clara indo para a direita, cauda dourada curva e cauda azul reta atrás.
function cenaCometa() {
  const g = novaGrade();
  const r = sorteio(14);
  const hx = 15;
  const hy = 8;
  for (let d = 2; d <= 15; d++) {
    const x = hx - d;
    const yc = hy + 0.022 * d * d + 0.15 * d;
    const meia = 0.4 + d * 0.22;
    for (let y = Math.floor(yc - meia); y <= Math.ceil(yc + meia); y++) {
      const dist = Math.abs(y - yc) / meia;
      if (dist > 1 || r() > 1 - d / 18 - dist * 0.4) continue;
      P(g, x, y, d < 4 ? "V" : d < 8 ? (r() < 0.6 ? "Y" : "V") : d < 12 ? (r() < 0.6 ? "O" : "Y") : "R");
    }
    if (d % 2 === 0 || d < 6) P(g, x, hy - 0.12 * d - 0.6, d < 5 ? "W" : d < 10 ? "C" : "B");
  }
  C(g, [".CC.", "CWWC", "CWWC", ".CC."], hx - 1, hy - 1);
  for (const [x, y] of [[2, 2], [9, 1], [19, 4], [4, 17], [17, 16], [11, 18]]) P(g, x, y, "W");
  return g;
}

// ============================================================
//                 PARA A ESQUERDA (movimento padrão)
// ============================================================

// Relógio 23:59: relógio digital de mesa com algarismos de sete segmentos.
const SEG = {
  2: ["###", "..#", "..#", "###", "#..", "#..", "###"],
  3: ["###", "..#", "..#", "###", "..#", "..#", "###"],
  5: ["###", "#..", "#..", "###", "..#", "..#", "###"],
  9: ["###", "#.#", "#.#", "###", "..#", "..#", "###"],
};

function cenaRelogio2359() {
  const g = novaGrade();
  for (let x = 1; x <= 17; x++) {
    P(g, x, 5, "B");
    P(g, x, 15, "B");
  }
  for (let y = 6; y <= 14; y++) {
    P(g, 0, y, "B");
    P(g, 18, y, "B");
  }
  glifo(g, SEG[2], 1, 7, "R");
  glifo(g, SEG[3], 5, 7, "R");
  P(g, 9, 9, "R");
  P(g, 9, 11, "R");
  glifo(g, SEG[5], 11, 7, "R");
  glifo(g, SEG[9], 15, 7, "R");
  for (const x of [3, 15]) P(g, x, 16, "B");
  brilho(g, 4, 2, "W", "Y");
  brilho(g, 14, 1, "W", "C");
  P(g, 9, 2, "V");
  P(g, 7, 18, "W");
  return g;
}

// Fogos verde e amarelo: estouros nas cores do Brasil.
function cenaVerdeAmarelo() {
  const g = novaGrade();
  raios(g, 5, 6, 12, 1.5, 5.5, (d) => (d < 3 ? "Y" : d < 5 ? "G" : "L"), 0.2);
  P(g, 5, 6, "W");
  aro(g, 15, 12.5, 4.5, (k) => (k % 2 ? "Y" : "V"), 16);
  raios(g, 15, 12.5, 8, 1, 2.5, () => "G", Math.PI / 8);
  P(g, 15, 12.5, "W");
  raios(g, 14, 3, 6, 1, 2, (d) => (d > 1 ? "L" : "Y"), 0.5);
  raios(g, 4, 16, 8, 1, 2, (d) => (d > 1 ? "Y" : "G"));
  for (let y = 13; y <= 19; y += 2) P(g, 9, y, "Y");
  return g;
}

// Roda-gigante da virada: aro de luzes coloridas, cabines e fogos atrás.
function cenaRodaGigante() {
  const g = novaGrade();
  const cx = 9.5;
  const cy = 8.5;
  // fogos pequenos nos cantos de cima
  raios(g, 1.5, 1.5, 8, 1, 1.5, () => "F");
  raios(g, 18, 1.5, 8, 1, 1.5, () => "C", Math.PI / 8);
  // estrutura em A, do eixo até o chão (por baixo do aro)
  traco(g, cx - 0.5, cy + 1, 5, 18, "w");
  traco(g, cx + 0.5, cy + 1, 14, 18, "w");
  // raios curtos e discretos
  for (let k = 0; k < 8; k++) {
    const a = (2 * Math.PI * k) / 8 + Math.PI / 8;
    traco(g, cx + Math.cos(a) * 1.6, cy + Math.sin(a) * 1.6, cx + Math.cos(a) * 4.6, cy + Math.sin(a) * 4.6, "w");
  }
  // aro de luzes: branco e dourado alternados, bem redondo
  aro(g, cx, cy, 6, (k) => (k % 2 ? "Y" : "W"), 40);
  // cabines coloridas por fora do aro, nas pontas dos raios
  const cabines = ["R", "C", "L", "F", "O", "T", "M", "P"];
  for (let k = 0; k < 8; k++) {
    const a = (2 * Math.PI * k) / 8 + Math.PI / 8;
    const x = cx + Math.cos(a) * 7.6;
    const y = cy + Math.sin(a) * 7.6;
    P(g, x - 0.5, y, cabines[k]);
    P(g, x + 0.5, y, cabines[k]);
  }
  P(g, cx - 0.5, cy, "Y");
  P(g, cx + 0.5, cy, "Y");
  for (let x = 0; x < N; x++) P(g, x, 19, x % 2 ? "y" : "Y");
  return g;
}

// PAZ: a palavra em branco, uma pomba e brilhos.
function cenaPaz() {
  const g = novaGrade();
  escrever(g, "PAZ", 1, 8, "W", { fonte: "grande" });
  C(g, ["....W...", "...WW...", ".WWWW...", "YWWWWWWW", "...WWWW.", ".G......"], 11, 0);
  brilho(g, 3, 3, "W", "C");
  brilho(g, 7, 17, "W", "V");
  brilho(g, 16, 17, "W", "C");
  for (const [x, y] of [[19, 9], [12, 19], [1, 18], [8, 3]]) P(g, x, y, "V");
  return g;
}

// AMOR: letras vermelhas e corações em volta.
const LETRAS_7 = {
  A: [".#.", "#.#", "#.#", "###", "#.#", "#.#", "#.#"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  O: [".#.", "#.#", "#.#", "#.#", "#.#", "#.#", ".#."],
  R: ["##.", "#.#", "#.#", "##.", "#.#", "#.#", "#.#"],
  S: [".##", "#..", "#..", ".#.", "..#", "..#", "##."],
  U: ["#.#", "#.#", "#.#", "#.#", "#.#", "#.#", "###"],
  D: ["##.", "#.#", "#.#", "#.#", "#.#", "#.#", "##."],
  E: ["##", "#.", "#.", "##", "#.", "#.", "##"],
};

function palavra(g, texto, x, y, cor) {
  for (const ch of texto) x += glifo(g, LETRAS_7[ch], x, y, cor) + 1;
}

const CORACAO = ["11.11", "1W111", ".111.", "..1.."];
const CORACAO_P = ["1.1", "111", ".1."];

function cenaAmor() {
  const g = novaGrade();
  palavra(g, "AMOR", 1, 7, "R");
  C(g, recolorir(CORACAO, { 1: "F" }), 2, 1);
  C(g, recolorir(CORACAO, { 1: "P" }), 13, 15);
  for (const [x, y, c] of [[10, 2, "R"], [17, 3, "P"], [4, 16, "R"], [9, 16, "F"]]) C(g, recolorir(CORACAO_P, { 1: c }), x, y);
  return g;
}

// SAÚDE: a palavra em verde, com acento, e a linha do batimento do coração embaixo.
function cenaSaude() {
  const g = novaGrade();
  palavra(g, "SAUDE", 1, 4, "L");
  P(g, 10, 3, "L");
  P(g, 11, 2, "L");
  const pulso = [17, 17, 16, 17, 18, 13, 19, 17, 16, 17];
  for (let x = 0; x < N; x++) {
    const y0 = pulso[x % 10];
    const y1 = pulso[(x + 1) % 10];
    traco(g, x, y0, x + 1, y1, "R");
  }
  brilho(g, 18, 1, "W", "V");
  P(g, 4, 0, "W");
  return g;
}

export const ANIMACOES_ANO_NOVO_C = [
  { id: "ano3-lanternas", nome: "Lanternas dos desejos", criar: cenaLanternas, movimento: "cima" },
  { id: "ano3-rojoes", nome: "Rojões em fila", criar: cenaRojoes, movimento: "cima" },
  { id: "ano3-fogos-espiral", nome: "Fogos em espiral", criar: cenaFogosEspiral, movimento: "cima" },
  { id: "ano3-espiral-dourada", nome: "Espiral dourada", criar: cenaEspiralDourada, movimento: "cima" },
  { id: "ano3-decolagem", nome: "Decolagem 2027", criar: cenaDecolagem, movimento: "cima" },
  { id: "ano3-baloes-subindo", nome: "Balões subindo", criar: cenaBaloesSubindo, movimento: "cima" },
  { id: "ano3-chapeus", nome: "Chapéus voando", criar: cenaChapeus, movimento: "cima" },
  { id: "ano3-bolhas-champanhe", nome: "Bolhas de champanhe", criar: cenaBolhasChampanhe, movimento: "cima" },
  { id: "ano3-torre-bolhas", nome: "Torre de bolhas", criar: cenaTorreBolhas, movimento: "cima" },
  { id: "ano3-chuva-confete", nome: "Chuva de confete", criar: cenaChuvaConfete, movimento: "baixo" },
  { id: "ano3-chuva-serpentina", nome: "Chuva de serpentina", criar: cenaChuvaSerpentina, movimento: "baixo" },
  { id: "ano3-chuva-estrelas", nome: "Chuva de estrelas", criar: cenaChuvaEstrelas, movimento: "baixo" },
  { id: "ano3-meteoros-dourados", nome: "Meteoros dourados", criar: cenaMeteorosDourados, movimento: "baixo" },
  { id: "ano3-cachoeira", nome: "Cachoeira de faíscas", criar: cenaCachoeira, movimento: "baixo" },
  { id: "ano3-chuva-moedas", nome: "Chuva de moedas", criar: cenaChuvaMoedas, movimento: "baixo" },
  { id: "ano3-rolha", nome: "Rolha voando", criar: cenaRolha, movimento: "direita" },
  { id: "ano3-sao-silvestre", nome: "São Silvestre", criar: cenaSaoSilvestre, movimento: "direita" },
  { id: "ano3-aviao-faixa", nome: "Avião com faixa 2027", criar: cenaAviao, movimento: "direita" },
  { id: "ano3-cometa", nome: "Cometa da sorte", criar: cenaCometa, movimento: "direita" },
  { id: "ano3-relogio-2359", nome: "Relógio 23:59", criar: cenaRelogio2359 },
  { id: "ano3-verde-amarelo", nome: "Fogos verde e amarelo", criar: cenaVerdeAmarelo },
  { id: "ano3-roda-gigante", nome: "Roda-gigante da virada", criar: cenaRodaGigante },
  { id: "ano3-paz", nome: "PAZ", criar: cenaPaz },
  { id: "ano3-amor", nome: "AMOR", criar: cenaAmor },
  { id: "ano3-saude", nome: "SAÚDE", criar: cenaSaude },
];
