// Coleção de Natal (parte C): 25 cenas que andam na cortina, cada uma com o seu movimento.
//
// Cada cena é uma grade 20×20 (g[linha][coluna] = [r, g, b] ou null) e o campo `movimento` diz para
// onde a cortina leva o desenho, em loop:
//   - "baixo" e "cima": as 20 LINHAS dão a volta. O que cruza a borda de cima ou de baixo emenda (PV/CV),
//     não há chão nem horizonte, e os elementos ficam espalhados por todas as linhas. O que cai anda
//     para baixo (rastro ACIMA dele); o que sobe anda para cima (rastro ABAIXO). Uma forma igual em
//     todas as linhas (bengala, corda, tronco) parece parada enquanto a textura dela corre.
//   - "esquerda" (padrão, sem o campo) e "direita": as 20 COLUNAS dão a volta (P/C) e as faixas
//     contínuas têm período que divide 20. Nas cenas para a direita, quem anda olha para a direita.
// Fundo apagado e cores saturadas. Cada cena acende entre 40 e 220 LEDs.

import { N, carimbar, novaGrade, ponto, recolorir } from "./pixelart.js";

// ---------- ajudantes locais ----------

/** Ponto com coordenadas reais; a coluna dá a volta (cenas que andam para os lados). */
const P = (g, x, y, c) => ponto(g, Math.round(x), Math.round(y), c, true);

/** Carimbo cuja coluna dá a volta. */
const C = (g, sprite, x, y) => carimbar(g, sprite, x, y, true);

/** Ponto cuja linha dá a volta (cenas que andam para cima ou para baixo). */
const PV = (g, x, y, c) => ponto(g, Math.round(x), ((Math.round(y) % N) + N) % N, c);

/** Carimbo cuja linha dá a volta. */
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

/** Linha inteira com um padrão que se repete (o tamanho do padrão divide 20); "." fica apagado. */
function faixa(g, lin, padrao) {
  for (let x = 0; x < N; x++) {
    const c = padrao[x % padrao.length];
    if (c !== ".") ponto(g, x, lin, c);
  }
}

/** Reta entre pontos reais, com a coluna dando a volta. */
function traco(g, x0, y0, x1, y1, c) {
  const passos = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= passos; i++) P(g, x0 + ((x1 - x0) * i) / passos, y0 + ((y1 - y0) * i) / passos, c);
}

/** Brilho em cruz (+). `p` é P (cenas para os lados) ou PV (cenas para cima e para baixo). */
function brilho(g, x, y, centro, braco, p = P) {
  p(g, x - 1, y, braco);
  p(g, x + 1, y, braco);
  p(g, x, y - 1, braco);
  p(g, x, y + 1, braco);
  p(g, x, y, centro);
}

/** Floco 11×11 com simetria de 8 lados, a partir dos pontos [x, y, cor] de um oitavo dele (0 ≤ x ≤ -y). */
function flocoSimetrico(pontos) {
  const s = Array.from({ length: 11 }, () => Array(11).fill("."));
  for (const [x, y, c] of pontos)
    for (const [a, b] of [[x, y], [y, x]])
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) s[5 + b * sy][5 + a * sx] = c;
  return s.map((l) => l.join(""));
}

// ============================================================
//                 CAINDO (movimento "baixo")
// ============================================================

// Neve caindo: flocos de três tamanhos espalhados por todas as linhas.
function cenaNeveCaindo() {
  const g = novaGrade();
  const grande = ["C.W.C", ".CWC.", "WWWWW", ".CWC.", "C.W.C"];
  const medio = [".W.", "WCW", ".W."];
  for (const [x, y] of [[1, 1], [13, 7], [6, 14]]) CV(g, grande, x, y);
  for (const [x, y] of [[9, 3], [16, 1], [1, 9], [8, 9], [15, 15], [1, 17]]) CV(g, medio, x, y);
  for (const [x, y] of [[8, 0], [18, 5], [4, 7], [12, 13], [13, 18], [19, 12], [3, 13], [13, 2], [18, 19], [11, 7]]) PV(g, x, y, "W");
  return g;
}

// Presentes caindo: caixas com fita e laço; os risquinhos de vento ficam ACIMA (eles caem).
function cenaPresentesCaindo() {
  const g = novaGrade();
  const grande = (c, f) => [`.${f}.${f}.`, `${c}${c}${f}${c}${c}`, `${c}${c}${f}${c}${c}`, `${f}${f}${f}${f}${f}`, `${c}${c}${f}${c}${c}`, `${c}${c}${f}${c}${c}`];
  const pequeno = (c, f) => [`${f}.${f}`, `${c}${f}${c}`, `${f}${f}${f}`, `${c}${f}${c}`];
  const vento = (x, y, larg, comp) => {
    for (const dx of [0, larg - 1]) for (let dy = 2; dy < 2 + comp; dy++) PV(g, x + dx, y - dy, "w");
  };
  for (const [x, y, c, f] of [[1, 2, "R", "Y"], [13, 5, "G", "R"], [6, 12, "B", "W"], [14, 15, "Y", "R"]]) {
    CV(g, grande(c, f), x, y);
    vento(x, y, 5, 2);
  }
  for (const [x, y, c, f] of [[9, 3, "M", "Y"], [1, 11, "P", "W"], [16, 0, "C", "R"]]) {
    CV(g, pequeno(c, f), x, y);
    vento(x, y, 3, 1);
  }
  return g;
}

// Noel de paraquedas: o velhinho de braços para cima segurando as cordas, e um presente de paraquedas.
const NOEL_PARAQUEDAS = [
  "...WRRRW...",
  ".RWWRRRWWR.",
  "RRWWRRRWWRR",
  "R.W..R..W.R",
  ".w.......w.",
  "..w.....w..",
  "..S.....S..",
  "..R..W..R..",
  "..R.RRR.R..",
  "..RWWWWWR..",
  "...SkSkS...",
  "...WWWWW...",
  "..RRWWWRR..",
  "...RRWRR...",
  "...YYYYY...",
  "...RRRRR...",
  "...RR.RR...",
  "...KK.KK...",
];
const PRESENTE_PARAQUEDAS = [".GLG.", "GLGLG", "w...w", ".w.w.", ".RYR.", ".YYY.", ".RYR."];

function cenaNoelParaquedas() {
  const g = novaGrade();
  CV(g, NOEL_PARAQUEDAS, 1, 0);
  CV(g, PRESENTE_PARAQUEDAS, 14, 10);
  for (const [x, y] of [[16, 2], [13, 5], [18, 7], [5, 19], [12, 18], [19, 17]]) PV(g, x, y, "W");
  return g;
}

// Chuva de estrelas: estrelas douradas, prateadas e rosa caindo, com o rastro ACIMA.
function cenaChuvaEstrelas() {
  const g = novaGrade();
  const grande = (c, m) => [`..${c}..`, `.${c}${c}${c}.`, `${c}${c}${m}${c}${c}`, `.${c}${c}${c}.`, `${c}...${c}`];
  const pequena = (c, m) => [`.${c}.`, `${c}${m}${c}`, `.${c}.`];
  const rastro = (x, y, cores) => cores.forEach((c, i) => PV(g, x, y - 1 - i, c));
  for (const [x, y, c, m, cauda] of [
    [1, 4, "Y", "W", ["Y", "Y", "O", "y"]],
    [13, 9, "C", "W", ["C", "C", "B"]],
    [6, 15, "Y", "W", ["Y", "Y", "O", "y"]],
  ]) {
    CV(g, grande(c, m), x, y);
    rastro(x + 2, y, cauda);
  }
  for (const [x, y, c, m, cauda] of [
    [10, 2, "P", "W", ["P", "F"]],
    [17, 15, "Y", "W", ["Y", "y"]],
    [2, 12, "W", "Y", ["W", "w"]],
    [15, 0, "R", "Y", ["R", "r"]],
  ]) {
    CV(g, pequena(c, m), x, y);
    rastro(x + 1, y, cauda);
  }
  for (const [x, y] of [[8, 8], [19, 9], [11, 13], [0, 17], [6, 1]]) PV(g, x, y, "W");
  return g;
}

// Flocos gigantes: dois flocos enormes (um em cruz, outro em xis) e flocos pequenos nos vãos.
const FLOCO_CRUZ = flocoSimetrico([[0, 0, "W"], [0, -1, "W"], [0, -2, "W"], [0, -3, "W"], [0, -4, "W"], [0, -5, "W"], [1, -4, "C"], [1, -1, "C"], [2, -2, "C"], [3, -3, "C"]]);
const FLOCO_XIS = flocoSimetrico([[0, 0, "W"], [1, -1, "C"], [2, -2, "C"], [3, -3, "C"], [4, -4, "C"], [5, -5, "W"], [2, -4, "W"], [0, -1, "W"], [0, -2, "W"], [0, -3, "C"]]);

function cenaFlocosGigantes() {
  const g = novaGrade();
  CV(g, FLOCO_CRUZ, 0, 0);
  CV(g, FLOCO_XIS, 9, 10);
  const pequeno = [".C.", "CWC", ".C."];
  for (const [x, y] of [[14, 2], [3, 13]]) CV(g, pequeno, x, y);
  for (const [x, y] of [[18, 6], [12, 7], [6, 18], [1, 11]]) PV(g, x, y, "W");
  return g;
}

// Bengala girando: um doce reto e listrado em diagonal. O doce é igual em todas as linhas e fica
// parado; as listras correm para baixo e parece que ele gira.
function cenaBengalaGirando() {
  const g = novaGrade();
  for (let y = 0; y < N; y++)
    for (let x = 7; x <= 12; x++) {
      const vermelho = (x + y) % 4 < 2;
      const borda = x === 7 || x === 12;
      ponto(g, x, y, vermelho ? (borda ? "r" : "R") : borda ? "w" : "W");
    }
  for (const [x, y] of [[3, 2], [16, 6], [2, 12], [17, 15]]) brilho(g, x, y, "W", "Y", PV);
  for (const [x, y] of [[5, 7], [15, 1], [4, 17], [18, 10], [14, 19], [1, 5]]) PV(g, x, y, "Y");
  return g;
}

// Luzes escorrendo: "chuva de meteoros" nos fios da cortina. Cabeça branca embaixo e cauda que
// some para cima (cor e depois cor fraca), em alturas desencontradas.
function cenaLuzesEscorrendo() {
  const g = novaGrade();
  const cores = [["R", "r"], ["G", "g"], ["Y", "y"], ["W", "w"]];
  for (let x = 0; x < N; x++) {
    const [c, f] = cores[x % 4];
    const y0 = (x * 7) % N;
    for (const y of x % 2 ? [y0] : [y0, y0 + 10]) {
      PV(g, x, y, "W");
      PV(g, x, y - 1, c);
      PV(g, x, y - 2, c);
      PV(g, x, y - 3, f);
    }
  }
  return g;
}

// Noel de rapel: a corda passa por todas as linhas (parece parada) e o Noel desce por ela com o saco.
const NOEL_RAPEL = [
  "....SyS....",
  "...W.y.W...",
  "..R..W..R..",
  "..R..R..R..",
  "..R.RRR.R..",
  "..R.WWW.R..",
  "..R.SSS.R..",
  "..RWWWWWR..",
  "..RRWWWRR..",
  "...RRWRR...",
  "...YYYYY...",
  "...RRRRR...",
  "...RR.RR...",
  "...KK.KK...",
];
const SACO = ["....y", ".GRYy", "..y..", ".KKK.", "KKKKK", "KKKKK", ".KKK."];

function cenaNoelRapel() {
  const g = novaGrade();
  for (let y = 0; y < N; y++) ponto(g, 11, y, "y");
  CV(g, NOEL_RAPEL, 6, 2);
  CV(g, SACO, 3, 9);
  for (const [x, y] of [[2, 2], [17, 4], [15, 11], [1, 17], [18, 16], [5, 0]]) PV(g, x, y, "W");
  return g;
}

// ============================================================
//                 SUBINDO (movimento "cima")
// ============================================================

// Balões de Natal: balões de ar quente listrados, com a chama acesa e o cestinho.
function cenaBaloesNatal() {
  const g = novaGrade();
  const listrado = (forma, cores) => forma.map((l) => Array.from(l, (ch, i) => (ch === "X" ? cores[i % cores.length] : ch)).join(""));
  const grande = listrado(["..XXX..", ".XXXXX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "..yOy..", "..KKK.."], "RWRGRWR");
  const medio = (cores) => listrado([".XXX.", "XXXXX", "XXXXX", ".XXX.", ".yOy.", ".KKK."], cores);
  const pequeno = (c) => [`.${c}.`, `${c}${c}${c}`, `.${c}.`, ".K."];
  CV(g, grande, 1, 1);
  CV(g, medio("GWGWG"), 12, 7);
  CV(g, medio("YRYRY"), 5, 13);
  CV(g, pequeno("R"), 16, 0);
  CV(g, pequeno("C"), 14, 15);
  for (const [x, y] of [[10, 3], [18, 11], [2, 11], [11, 19], [0, 18]]) PV(g, x, y, "W");
  return g;
}

// Lanternas subindo: lanternas de papel acesas por dentro, com a chama embaixo.
function cenaLanternas() {
  const g = novaGrade();
  const grande = [".OOO.", "OYYYO", "OYVYO", "OYVYO", ".OYO.", "..W.."];
  const media = ["OOO", "OYO", "OVO", ".W."];
  const vermelha = (s) => recolorir(s, { O: "R", Y: "O", V: "Y" });
  CV(g, grande, 1, 1);
  CV(g, vermelha(grande), 12, 9);
  CV(g, media, 8, 4);
  CV(g, vermelha(media), 16, 1);
  CV(g, media, 4, 12);
  CV(g, media, 15, 17);
  for (const [x, y] of [[10, 14], [18, 11], [7, 18], [12, 0], [1, 8]]) {
    PV(g, x, y, "O");
    PV(g, x, y + 1, "Y");
  }
  return g;
}

// Anjinhos subindo: dois anjos com auréola e asas, deixando um rastro de purpurina ABAIXO.
const ANJINHO = ["..YYY..", "..SSS..", "C.SSS.C", "CC.W.CC", "CCWWWCC", ".CWWWC.", "..WWW..", ".WWWWW."];

function cenaAnjinhos() {
  const g = novaGrade();
  for (const [x, y] of [[1, 1], [11, 10]]) {
    CV(g, ANJINHO, x, y);
    for (const [dx, dy, c] of [[3, 9, "V"], [2, 11, "Y"], [4, 12, "y"]]) PV(g, x + dx, y + dy, c);
  }
  for (const [x, y] of [[15, 3], [5, 15]]) brilho(g, x, y, "W", "Y", PV);
  for (const [x, y] of [[9, 6], [19, 8], [0, 14], [10, 18]]) PV(g, x, y, "W");
  return g;
}

// Árvore girando: um tronco verde igual em todas as linhas e uma espiral de luzes em volta.
// Subindo, as luzes parecem dar a volta na árvore.
function cenaArvoreGirando() {
  const g = novaGrade();
  const tronco = ["g", "G", "G", "L", "G", "G", "g"];
  for (let y = 0; y < N; y++) tronco.forEach((c, i) => ponto(g, 6 + i, y, c));
  const luzes = ["R", "Y", "C", "P", "W", "O"];
  let k = 0;
  for (let y = 0; y < N; y++) {
    const a = (2 * Math.PI * y) / 10;
    if (Math.cos(a) > 0.1) ponto(g, Math.round(9 + 3 * Math.sin(a)), y, "Y");
    if (Math.cos(a + Math.PI) > 0.1) ponto(g, Math.round(9 + 3 * Math.sin(a + Math.PI)), y, luzes[k++ % luzes.length]);
  }
  for (const [x, y] of [[2, 3], [16, 8], [3, 14], [17, 17]]) brilho(g, x, y, "W", "Y", PV);
  return g;
}

// Foguete do Noel: o Noel vai sentado no foguete; chama e rastro ABAIXO, estrelas em volta.
const FOGUETE_NOEL = [
  "...W...",
  "..RR...",
  "..RRR..",
  ".WWWWW.",
  ".SkSkS.",
  ".WWWWW.",
  "RRRRRRR",
  ".WWWWW.",
  ".WWYWW.",
  ".WWWWW.",
  "RWWWWWR",
  "RRWWWRR",
  "R.www.R",
  "..YWY..",
  "..OYO..",
  "...O...",
];

function cenaFogueteNoel() {
  const g = novaGrade();
  CV(g, FOGUETE_NOEL, 6, 0);
  for (const [x, y, c] of [[9, 17, "R"], [8, 18, "y"], [10, 19, "y"], [9, 19, "w"]]) PV(g, x, y, c);
  for (const [x, y] of [[2, 3], [16, 10]]) brilho(g, x, y, "W", "C", PV);
  for (const [x, y] of [[1, 9], [4, 15], [17, 2], [18, 16], [14, 6], [3, 19]]) PV(g, x, y, "W");
  return g;
}

// ============================================================
//                 PARA A DIREITA (movimento "direita")
// ============================================================

// Trenó voando: a rena vai na frente (à direita) e o trenó deixa um rastro de brilho para trás.
const RENA_VOANDO = [".....y.y.", "......yy.", "......KKK", "......KKR", "KKKKKKKK.", ".KKKKKK..", "K.K...K.K"];
const TRENO_VOANDO = [
  ".WRR......",
  "..RRRR....",
  "..WWWW....",
  "GG.SkS....",
  "GGGWWWWS..",
  "RGGRRRRR.Y",
  "RRRRRRRRRY",
  ".RRRRRRRR.",
  "..Y....Y..",
  "YYYYYYYYYY",
];

function cenaTrenoVoando() {
  const g = novaGrade();
  C(g, TRENO_VOANDO, 0, 6);
  C(g, RENA_VOANDO, 11, 5);
  traco(g, 8, 10, 11, 9, "Y");
  for (const [x, y, c] of [[19, 15, "Y"], [17, 16, "V"], [15, 16, "W"], [13, 17, "Y"], [11, 17, "y"], [9, 18, "V"]]) P(g, x, y, c);
  for (const [x, y] of [[3, 1], [9, 2], [15, 1], [6, 18], [18, 12]]) P(g, x, y, "W");
  return g;
}

// Rena saltitante: a rena no meio do pulo, de cachecol e sininho, com o arco do pulo para trás.
const RENA_PULO = [
  ".......y.y..",
  "........yy..",
  "........KKK.",
  "....RR..KKKR",
  "W.....RRKK..",
  ".KKKKKKKKY..",
  ".KKKKKKKK...",
  "KK......KK..",
  "K.........K.",
];

function cenaRenaSaltitante() {
  const g = novaGrade();
  C(g, RENA_PULO, 6, 4);
  for (const [x, y] of [[4, 13], [2, 14], [0, 16], [-2, 17]]) P(g, x, y, "W");
  faixa(g, 18, "WWWWw");
  faixa(g, 19, "w.w..");
  for (const [x, y] of [[2, 2], [10, 1], [18, 3], [1, 8]]) P(g, x, y, "W");
  return g;
}

// Noel de bicicleta: pedalando para a direita, com um presente na garupa.
function cenaNoelBicicleta() {
  const g = novaGrade();
  const roda = [".www.", "w...w", "w.Y.w", "w...w", ".www."];
  C(g, roda, 1, 13);
  C(g, roda, 11, 13);
  for (const [x0, y0, x1, y1] of [[3, 15, 8, 15], [3, 15, 6, 11], [8, 15, 6, 11], [6, 11, 11, 11], [8, 15, 11, 11], [11, 11, 13, 15]]) traco(g, x0, y0, x1, y1, "G");
  C(g, ["KKK"], 5, 10);
  C(g, ["W.RRR..", ".RRRR..", ".WWWW..", "..SkSS.", "..WWWW.", ".RRWWRS", ".RRRRR.", ".YYYYY.", "..RR..."], 4, 1);
  C(g, ["SS", "w."], 12, 9);
  C(g, ["RYR", "YYY", "RYR"], 1, 9);
  faixa(g, 18, "w");
  for (const [x, y] of [[17, 7], [18, 9], [16, 11]]) traco(g, x, y, x + 1, y, "w");
  return g;
}

// Estrela guia: a estrela vai na frente e o rastro dourado ondula para trás.
const ESTRELA_GUIA = ["...Y...", "..YYY..", "YYYWYYY", ".YYWYY.", "..YYY..", ".YY.YY.", ".Y...Y."];

function cenaEstrelaGuia() {
  const g = novaGrade();
  for (let i = 1; i <= 11; i++) {
    const x = 12 - i;
    const y = 7 + 1.3 * Math.sin(i * 0.55);
    P(g, x, y, i <= 3 ? "V" : i <= 6 ? "Y" : i <= 9 ? "O" : "y");
    if (i <= 7) P(g, x, y + (i % 2 ? 1 : -1), i <= 4 ? "Y" : "O");
  }
  C(g, ESTRELA_GUIA, 12, 4);
  for (const [x, y, c] of [[4, 4, "W"], [7, 10, "V"], [2, 9, "W"], [9, 3, "V"]]) P(g, x, y, c);
  for (const [x, y] of [[3, 15], [15, 16]]) brilho(g, x, y, "W", "C");
  for (const [x, y] of [[10, 17], [18, 13], [0, 1], [16, 0], [7, 19]]) P(g, x, y, "W");
  return g;
}

// Pombas da paz: pombas brancas voando para a direita com um raminho verde no bico.
const POMBA = ["..W.......", "..WW......", "...WW.....", "...WWW..W.", "WW.WWWWWWO", ".WWWWWWW.G", "WW......GG"];

function cenaPombas() {
  const g = novaGrade();
  C(g, POMBA, 1, 2);
  C(g, POMBA, 10, 11);
  for (const [x, y] of [[15, 3], [5, 14]]) brilho(g, x, y, "Y", "y");
  for (const [x, y] of [[13, 7], [19, 1], [2, 18], [8, 9]]) P(g, x, y, "W");
  return g;
}

// ============================================================
//                 PARA A ESQUERDA (movimento padrão)
// ============================================================

// Pinheiros iluminados: um pinheiro alto e um médio, cheios de luzinhas, no chão de neve.
const PINHEIRO_LUZES = [
  "....Y....",
  "...YWY...",
  "....Y....",
  "....G....",
  "...GRG...",
  "..YGGGC..",
  "...GGG...",
  "..GRGGG..",
  ".PGGYGGB.",
  "..GGGGG..",
  ".GRGGGYG.",
  "CGGGPGGGR",
  "....K....",
];
const PINHEIRO_LUZES_MEDIO = ["...Y...", "..YWY..", "...Y...", "...G...", "..GYG..", ".RGGGB.", "..GGG..", ".YGGPG.", "CGGRGGY", "...K..."];

function cenaPinheirosIluminados() {
  const g = novaGrade();
  C(g, PINHEIRO_LUZES, 0, 5);
  C(g, PINHEIRO_LUZES_MEDIO, 11, 8);
  faixa(g, 18, "WWWWw");
  faixa(g, 19, ".w..w");
  for (const [x, y] of [[3, 1], [9, 3], [14, 1], [18, 5], [7, 0]]) P(g, x, y, "W");
  return g;
}

// Varal de luzes: dois fios ondulados (período 10) com lâmpadas grandes penduradas.
function cenaVaralLuzes() {
  const g = novaGrade();
  const cores = ["R", "Y", "G", "C", "M", "O", "B", "P"];
  const lampada = (c) => [".y.", `${c}${c}${c}`, `${c}${c}${c}`, `.${c}.`];
  [[3, 0], [12, 5]].forEach(([base, fase], fio) => {
    const yFio = (x) => Math.round(base + 1.6 * Math.cos((2 * Math.PI * (x - fase)) / 10));
    for (let x = 0; x < N; x++) P(g, x, yFio(x), "g");
    for (let k = 0; k < 4; k++) {
      const x = fase + 5 * k;
      C(g, lampada(cores[fio * 4 + k]), x - 1, yFio(x) + 1);
    }
  });
  return g;
}

// Fábrica de brinquedos: a esteira leva um soldadinho, um ursinho, uma bola e um carrinho.
function cenaFabrica() {
  const g = novaGrade();
  faixa(g, 15, "W");
  faixa(g, 16, ".y..");
  faixa(g, 17, "w");
  faixa(g, 18, "..K.......");
  faixa(g, 19, "..K.......");
  C(g, ["BBB", "BBB", "SSS", "RYR", "RRR", "B.B", "K.K"], 1, 8);
  C(g, ["K...K", "KKKKK", "K.K.K", ".KyK.", "KKKKK", ".KyK.", ".K.K."], 5, 8);
  C(g, [".R.", "RYR", ".R."], 11, 12);
  C(g, [".CC..", "RRRRR", ".w.w."], 15, 12);
  for (const x of [4, 14]) C(g, [".w.", ".w.", "YYY", ".W."], x - 1, 0);
  return g;
}

// Noel na rede: Natal de verão. A rede vai de um coqueiro ao próximo (o mesmo coqueiro, na emenda).
function cenaNoelRede() {
  const g = novaGrade();
  for (let y = 5; y <= 17; y++) P(g, y < 10 ? 0 : 1, y, y % 3 ? "K" : "y");
  for (const [x, y] of [[1, 3], [2, 2], [3, 2], [4, 3], [5, 4], [1, 4], [2, 5], [3, 6], [-1, 3], [-2, 2], [-3, 2], [-4, 3], [-5, 4], [-1, 5], [-2, 6]]) P(g, x, y, "G");
  for (const [x, y] of [[0, 4], [1, 5]]) P(g, x, y, "y");
  const cores = ["R", "Y", "G", "C"];
  for (let x = 2; x <= 19; x++) {
    const y = 9 + 4 * Math.sin((Math.PI * (x - 1)) / 19);
    P(g, x, y, cores[Math.floor(x / 2) % cores.length]);
    if (x > 4 && x < 16) P(g, x, y + 1, cores[Math.floor(x / 2) % cores.length]);
  }
  C(g, ["......RRR....", "W.SS.WRRRRRR.", "RRSSWWRRYRRKK", ".....WRRRR..K"], 4, 8);
  for (const [x, y] of [[10, 1], [9, 2], [10, 2], [11, 2], [10, 3]]) P(g, x, y, "Y");
  faixa(g, 18, "YYYYy");
  faixa(g, 19, "y.y..");
  return g;
}

// Noel na piscina: de óculos escuros numa boia listrada, com um patinho de borracha.
function cenaNoelPiscina() {
  const g = novaGrade();
  faixa(g, 12, "WCCCC");
  faixa(g, 14, ".B...B....");
  faixa(g, 16, "...BB.....");
  faixa(g, 18, "B......BB.");
  C(g, ["...RRW...", "..RRRR...", ".WWWWWW..", ".SBBSBBS.", ".SWWWWS..", "S.WWWW.S.", "SRRWWRRS.", ".RRRRRR.."], 3, 3);
  C(g, [".RWWRRWW.", "RR.....RW", ".WWRRWWR."], 2, 11);
  C(g, [".YY..", "OYY..", ".YYYY", ".YYY."], 14, 9);
  for (const [x, y] of [[17, 1], [16, 2], [17, 2], [18, 2], [17, 3]]) P(g, x, y, "Y");
  return g;
}

// Ceia de Natal: mesa posta com o peru assado, uma vela e uma taça de vinho.
function cenaCeia() {
  const g = novaGrade();
  faixa(g, 13, "W");
  faixa(g, 14, "RRRRR");
  faixa(g, 15, "R.R.R");
  faixa(g, 16, "..K.......");
  faixa(g, 17, "..K.......");
  C(g, [".W.....W.", "..K...K..", "..KOOOK..", ".KOOVOOK.", "KOOOOOOOK", "KyOOOOOyK", ".KKKKKKK."], 1, 5);
  C(g, ["wwwwwwwwwww"], 0, 12);
  C(g, [".Y.", "YWY", ".O.", "RRR", "RWR", "RRR", "RRR"], 11, 5);
  C(g, ["C.C", "CRC", ".C.", ".C.", "CCC"], 15, 8);
  faixa(g, 1, "G.R.G.....");
  return g;
}

// Pisca-pisca em zigue-zague: o fio desce e sobe pela cortina e as lâmpadas trocam de cor.
function cenaZigueZague() {
  const g = novaGrade();
  const cores = ["R", "Y", "G", "C", "M", "O", "P", "B"];
  let k = 0;
  for (let x = 0; x < N; x++) {
    const fase = x % 10;
    const yTopo = 2;
    const yBase = 17;
    const ya = fase <= 5 ? yTopo + ((yBase - yTopo) * fase) / 5 : yBase - ((yBase - yTopo) * (fase - 5)) / 5;
    const yb = fase < 5 ? yTopo + ((yBase - yTopo) * (fase + 1)) / 5 : yBase - ((yBase - yTopo) * (fase - 4)) / 5;
    for (let y = Math.min(ya, yb); y <= Math.max(ya, yb); y++) P(g, x, y, "g");
  }
  for (let x = 0; x < N; x++) {
    if (x % 2) continue;
    P(g, x, 2 + ((x % 10) <= 5 ? 3 * (x % 10) : 3 * (10 - (x % 10))), cores[k++ % cores.length]);
  }
  return g;
}

// ============================================================
//                         A LISTA
// ============================================================

export const ANIMACOES_NATAL_C = [
  { id: "natal3-neve-caindo", nome: "Neve caindo", criar: cenaNeveCaindo, movimento: "baixo" },
  { id: "natal3-presentes-caindo", nome: "Presentes caindo", criar: cenaPresentesCaindo, movimento: "baixo" },
  { id: "natal3-noel-paraquedas", nome: "Noel de paraquedas", criar: cenaNoelParaquedas, movimento: "baixo" },
  { id: "natal3-chuva-estrelas", nome: "Estrelas caindo", criar: cenaChuvaEstrelas, movimento: "baixo" },
  { id: "natal3-flocos-gigantes", nome: "Flocos gigantes", criar: cenaFlocosGigantes, movimento: "baixo" },
  { id: "natal3-bengala-girando", nome: "Bengala girando", criar: cenaBengalaGirando, movimento: "baixo" },
  { id: "natal3-luzes-escorrendo", nome: "Luzes escorrendo", criar: cenaLuzesEscorrendo, movimento: "baixo" },
  { id: "natal3-noel-rapel", nome: "Noel de rapel", criar: cenaNoelRapel, movimento: "baixo" },
  { id: "natal3-baloes", nome: "Balões de Natal", criar: cenaBaloesNatal, movimento: "cima" },
  { id: "natal3-lanternas", nome: "Lanternas subindo", criar: cenaLanternas, movimento: "cima" },
  { id: "natal3-anjinhos", nome: "Anjinhos subindo", criar: cenaAnjinhos, movimento: "cima" },
  { id: "natal3-arvore-girando", nome: "Árvore girando", criar: cenaArvoreGirando, movimento: "cima" },
  { id: "natal3-foguete-noel", nome: "Foguete do Noel", criar: cenaFogueteNoel, movimento: "cima" },
  { id: "natal3-treno-voando", nome: "Trenó voando", criar: cenaTrenoVoando, movimento: "direita" },
  { id: "natal3-rena-saltitante", nome: "Rena saltitante", criar: cenaRenaSaltitante, movimento: "direita" },
  { id: "natal3-noel-bicicleta", nome: "Noel de bicicleta", criar: cenaNoelBicicleta, movimento: "direita" },
  { id: "natal3-estrela-guia", nome: "Estrela guia", criar: cenaEstrelaGuia, movimento: "direita" },
  { id: "natal3-pombas", nome: "Pombas da paz", criar: cenaPombas, movimento: "direita" },
  { id: "natal3-pinheiros", nome: "Pinheiros iluminados", criar: cenaPinheirosIluminados },
  { id: "natal3-varal-luzes", nome: "Varal de luzes", criar: cenaVaralLuzes },
  { id: "natal3-fabrica", nome: "Fábrica de brinquedos", criar: cenaFabrica },
  { id: "natal3-noel-rede", nome: "Noel na rede", criar: cenaNoelRede },
  { id: "natal3-noel-piscina", nome: "Noel na piscina", criar: cenaNoelPiscina },
  { id: "natal3-ceia", nome: "Ceia de Natal", criar: cenaCeia },
  { id: "natal3-zigue-zague", nome: "Pisca-pisca zigue-zague", criar: cenaZigueZague },
];
