// Coleção de Ano Novo (parte B): 25 cenas que rolam na aba Animações (virada para 2027).
//
// A cortina rola cada cena da direita para a esquerda, em loop (MODE 03): a coluna 0 volta logo
// depois da 19. Por isso tudo o que é contínuo (mar, ondas, areia, calçadão, varal) tem período que
// divide 20, o que cruza a borda usa `envolver = true`, e os textos deixam um vão maior no fim,
// para a rolagem ler "2027  2027  …".
// Fundo apagado, cores saturadas e só áreas pequenas de branco (a fonte é 5 V/USB).

import { N, arte, carimbar, escrever, linha, novaGrade, pintar, ponto } from "./pixelart.js";

// ---------- ajudantes locais ----------

/** Ponto que sempre dá a volta na borda (as cenas rolam). */
const P = (g, x, y, c) => ponto(g, Math.round(x), Math.round(y), c, true);

/** Carimba um desenho de "#" com uma cor por linha (degradê) ou uma cor só. */
function glifo(g, desenho, x, y, cores) {
  desenho.forEach((fileira, dy) => {
    const c = Array.isArray(cores) ? cores[Math.min(dy, cores.length - 1)] : cores;
    Array.from(fileira).forEach((ch, dx) => {
      if (ch === "#") P(g, x + dx, y + dy, c);
    });
  });
}

/** Brilho: 1 = ponto, 3 = cruzinha 3×3, 5 = cruz 5×5 (centro branco). */
function brilho(g, x, y, c = "V", tam = 3) {
  if (tam === 1) return P(g, x, y, c);
  P(g, x, y, "W");
  for (let d = 1; d <= (tam - 1) / 2; d++) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P(g, x + dx * d, y + dy * d, c);
  }
}

/**
 * Faixa de ondas sem emenda: crista pontuda em x ≡ fase (mod período), vale arredondado no meio.
 * `cores` = cores de cima para baixo a partir da superfície; a crista vira `espuma`.
 */
function ondas(g, base, periodo, amp, cores, { fase = 0, espuma = "W", largEspuma = 0.12 } = {}) {
  for (let x = 0; x < N; x++) {
    const t = ((((x - fase) % periodo) + periodo) % periodo) / periodo;
    const y = base + Math.round(amp * Math.sin(Math.PI * t));
    cores.forEach((c, k) => P(g, x, y + k, k === 0 && espuma && (t < largEspuma || t > 1 - largEspuma) ? espuma : c));
  }
}

/** Fogos pequenos: `raios` braços de d = 2 até `raio`, com a cor da ponta primeiro em `cores`. */
function fogo(g, cx, cy, raio, cores, raios = 8, fase = 0) {
  for (let k = 0; k < raios; k++) {
    const a = fase + (2 * Math.PI * k) / raios;
    for (let d = 2; d <= raio; d++) P(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, cores[Math.min(cores.length - 1, raio - d)]);
  }
  P(g, cx, cy, "W");
}

// ---------- algarismos grandes desenhados à mão ----------

const D4 = {
  2: [".##.", "#..#", "...#", "...#", "..#.", ".#..", "#...", "#...", "####"],
  0: [".##.", "#..#", "#..#", "#..#", "#..#", "#..#", "#..#", "#..#", ".##."],
  7: ["###", "..#", "..#", "..#", ".#.", ".#.", ".#.", ".#.", ".#."],
};
const OURO = ["V", "V", "Y", "Y", "Y", "Y", "Y", "O", "O"];

const D5 = {
  3: [".###.", "##.##", "...##", "...##", "..##.", "...##", "...##", "##.##", ".###."],
  2: [".###.", "##.##", "...##", "...##", "..##.", ".##..", "##...", "##...", "#####"],
  1: [".##.", "###.", ".##.", ".##.", ".##.", ".##.", ".##.", ".##.", "####"],
};

// ============================================================
//                         AS 25 CENAS
// ============================================================

function cena2027() {
  const g = novaGrade();
  let x = 1;
  for (const ch of "2027") {
    glifo(g, D4[ch], x, 6, OURO);
    x += D4[ch][0].length + 1;
  }
  brilho(g, 8, 2, "V", 5);
  brilho(g, 16, 17, "V");
  brilho(g, 3, 17, "C");
  brilho(g, 11, 18, "F", 1);
  brilho(g, 15, 1, "W", 1);
  brilho(g, 2, 2, "F", 1);
  return g;
}

function cenaContagem() {
  const g = novaGrade();
  glifo(g, D5[3], 1, 4, "C");
  glifo(g, D5[2], 8, 4, "F");
  glifo(g, D5[1], 15, 4, "Y");
  // pontinhos embaixo: 3, 2 e 1, como os bipes da contagem
  for (const x of [1, 3, 5]) P(g, x, 15, "C");
  for (const x of [9, 11]) P(g, x, 15, "F");
  P(g, 16, 15, "Y");
  return g;
}

function cenaRelogio() {
  const g = novaGrade();
  const cx = 9;
  const cy = 9;
  pintar(g, (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    return d > 7.5 && d <= 8.5 ? "Y" : null;
  });
  for (let h = 0; h < 12; h++) {
    const a = (h * Math.PI) / 6;
    P(g, cx + 6 * Math.sin(a), cy - 6 * Math.cos(a), h % 3 === 0 ? "W" : "C");
  }
  // marca do 12 em vermelho e os dois ponteiros juntos, apontando para ela (meia-noite)
  P(g, cx, 3, "R");
  P(g, cx, 2, "R");
  linha(g, cx, 5, cx, 9, "W");
  for (let y = 7; y <= 8; y++) {
    P(g, cx - 1, y, "V");
    P(g, cx + 1, y, "V");
  }
  P(g, cx, 9, "R");
  brilho(g, 19, 3, "V");
  brilho(g, 19, 15, "C");
  brilho(g, 1, 1, "W", 1);
  brilho(g, 17, 18, "F", 1);
  return g;
}

function cenaAmpulheta() {
  return arte([
    "....................",
    ".yKKKKKKKKKKKKKKKy..",
    "..KKKKKKKKKKKKKKK...",
    "..K.C.........C.K...",
    "..K.CW........C.K...",
    "..K..C.......C..K...",
    "..K...CVYYYVC...K...",
    "..K....CYYYC....K...",
    "..K.....CYC.....K...",
    "..K.....CYC.....K...",
    "..K....C.Y.C....K...",
    "..K...C..Y..C...K...",
    "..K..C...Y...C..K...",
    "..K.C....V....C.K...",
    "..K.C...VYV...C.K...",
    "..K.C.VYYYYYV.C.K...",
    "..K.CYYYYYYYYYC.K...",
    "..KKKKKKKKKKKKKKK...",
    ".yKKKKKKKKKKKKKKKy..",
    "....................",
  ]);
}

function cenaCalendario() {
  const g = novaGrade();
  for (let y = 2; y <= 8; y++) for (let x = 3; x <= 16; x++) P(g, x, y, "R");
  escrever(g, "JAN", 4, 3, "W");
  for (const x of [5, 14]) {
    P(g, x, 1, "w");
    P(g, x, 2, "W");
  }
  for (let y = 9; y <= 17; y++) {
    P(g, 3, y, "w");
    P(g, 16, y, "w");
  }
  for (let x = 3; x <= 16; x++) P(g, x, 18, "w");
  glifo(g, [".##.", "###.", ".##.", ".##.", ".##.", ".##.", "####"], 8, 10, "W");
  return g;
}

const LETRAS_3X7 = {
  F: ["###", "#..", "#..", "##.", "#..", "#..", "#.."],
  E: ["###", "#..", "#..", "##.", "#..", "#..", "###"],
  L: ["#..", "#..", "#..", "#..", "#..", "#..", "###"],
  I: ["#", "#", "#", "#", "#", "#", "#"],
  Z: ["###", "..#", "..#", ".#.", "#..", "#..", "###"],
};

function cenaFeliz() {
  const g = novaGrade();
  let x = 1;
  const cores = { F: "F", E: "Y", L: "C", I: "L", Z: "O" };
  for (const ch of "FELIZ") {
    glifo(g, LETRAS_3X7[ch], x, 6, cores[ch]);
    x += LETRAS_3X7[ch][0].length + 1;
  }
  brilho(g, 4, 2, "V", 5);
  brilho(g, 14, 2, "C");
  brilho(g, 9, 16, "V", 5);
  brilho(g, 18, 16, "F");
  brilho(g, 1, 17, "W", 1);
  brilho(g, 19, 1, "W", 1);
  return g;
}

function cenaAnoNovo() {
  const g = novaGrade();
  escrever(g, "ANO", 4, 3, "Y");
  escrever(g, "NOVO", 2, 11, "W");
  brilho(g, 19, 5, "V");
  brilho(g, 18, 13, "C", 1);
  brilho(g, 9, 0, "F", 1);
  brilho(g, 15, 18, "V", 1);
  return g;
}

function cenaSeteOndas() {
  const g = novaGrade();
  // sete ondas chegando, uma em cada faixa: as do fundo menores e mais escuras, as da frente com espuma
  const faixas = [
    [0, 5, 1, ["B"], "C", 0],
    [3, 5, 1, ["B"], "C", 2.5],
    [6, 10, 1, ["B"], "C", 4],
    [9, 10, 1, ["C"], "W", 9],
    [12, 10, 1, ["C"], "W", 3],
    [15, 10, 1, ["T"], "W", 7],
    [18, 10, 1, ["T"], "W", 1],
  ];
  for (const [base, per, amp, cores, espuma, fase] of faixas) ondas(g, base, per, amp, cores, { fase, espuma, largEspuma: 0.2 });
  return g;
}

function cenaCopacabana() {
  const g = novaGrade();
  fogo(g, 4, 4, 4, ["F", "F", "P"], 10);
  fogo(g, 14, 3, 3, ["Y", "O"], 8, Math.PI / 8);
  for (const [y, c] of [[8, "y"], [7, "O"], [6, "Y"], [5, "W"]]) P(g, 10, y, c);
  // horizonte com as balsas dos fogos
  for (const x of [3, 13]) P(g, x, 9, "Y");
  ondas(g, 10, 5, 1, ["B"], { espuma: "C" });
  for (const [x, y, c] of [[4, 12, "F"], [5, 13, "P"], [14, 12, "Y"], [13, 13, "O"]]) P(g, x, y, c);
  ondas(g, 13, 10, 1, ["W"], { fase: 8, espuma: "W" });
  for (let x = 0; x < N; x++) {
    P(g, x, 15, "y");
    if (x % 2 === 0) P(g, x, 16, x % 4 === 0 ? "Y" : "y");
    // o calçadão de ondas pretas e brancas
    P(g, x, 18 + Math.round(Math.sin((2 * Math.PI * x) / 10)), "W");
  }
  return g;
}

function cenaCalcadao() {
  // o desenho de Copacabana: faixas de ondas brancas sobre o fundo apagado (preto), período 10
  return pintar(novaGrade(), (x, y) => {
    const s = y + 0.5 - 1.3 * Math.sin((2 * Math.PI * (x + 0.5)) / 10);
    return ((s % 5) + 5) % 5 < 2 ? "W" : null;
  });
}

const FLOR = [".WW.WW.", "WWwWwWW", ".wwYww.", "WWwWwWW", ".WW.WW."];
const FLOR_P = [".W.W.", "WWYWW", ".W.W."];

function cenaFloresMar() {
  const g = novaGrade();
  ondas(g, 12, 10, 2, ["C", "B"], { fase: 4 });
  ondas(g, 17, 5, 1, ["T"], { fase: 1, espuma: "C" });
  carimbar(g, FLOR, 1, 8, true);
  carimbar(g, FLOR, 11, 7, true);
  for (const [x, y] of [[0, 13], [7, 13], [10, 12], [17, 12]]) carimbar(g, ["GG"], x, y, true);
  carimbar(g, FLOR_P, 6, 15, true);
  carimbar(g, FLOR_P, 16, 16, true);
  for (const [x, y] of [[3, 2], [9, 1], [16, 3], [13, 0]]) P(g, x, y, "W");
  return g;
}

function cenaBarcos() {
  const g = novaGrade();
  const luzes = ["R", "Y", "G", "C", "F"];
  // veleiro com varal de luzes do mastro até a proa e a popa
  P(g, 6, 2, "W");
  linha(g, 6, 3, 6, 8, "w");
  for (let k = 1; k <= 6; k++) {
    P(g, 6 - k, 2 + k, luzes[k % 5]);
    P(g, 6 + k, 2 + k, luzes[(k + 2) % 5]);
  }
  carimbar(g, ["W...........W", "WWWWWWWWWWWWW", ".wWYWYWYWYWw.", "..wwwwwwwww.."], 0, 8, true);
  // barquinho com lanterna
  carimbar(g, ["..Y..", "..w..", ".RYR.", "WWWWW", ".www."], 14, 7, true);
  ondas(g, 13, 5, 1, ["B"], { espuma: "C" });
  for (const [x, y, c] of [[3, 15, "R"], [9, 15, "G"], [6, 16, "Y"], [16, 15, "Y"], [17, 16, "R"]]) P(g, x, y, c);
  ondas(g, 18, 10, 1, ["B"], { fase: 5, espuma: "C" });
  for (const [x, y] of [[1, 0], [12, 1], [18, 3]]) P(g, x, y, "W");
  return g;
}

const CAMISETA = [
  ".WWw.wWW.",
  "WWWWwWWWW",
  "WWWWWWWWW",
  "wWWWWWWWw",
  "..WWWWW..",
  "..WWWWw..",
  "..WWWWw..",
  "..wwwww..",
];
const VESTIDO = [".W...W.", ".W...W.", ".WWWWW.", ".WWWWw.", "..YYY..", ".WWWWW.", ".WWWWw.", "WWWWWWw", "WWWWWWw", "wWwWwWw"];

function cenaRoupaBranca() {
  const g = novaGrade();
  for (let x = 0; x < N; x++) P(g, x, 4, "w");
  carimbar(g, CAMISETA, 1, 5, true);
  carimbar(g, VESTIDO, 12, 5, true);
  for (const [x, c] of [[2, "R"], [8, "Y"], [13, "G"], [17, "F"]]) {
    P(g, x, 3, c);
    P(g, x, 4, c);
  }
  for (const [x, y] of [[5, 1], [15, 0], [10, 17], [3, 16], [18, 18]]) P(g, x, y, "W");
  return g;
}

function cenaRoma() {
  const g = arte([
    "....................",
    "....................",
    ".....R..R..R........",
    ".....RR.R.RR........",
    "......RRRRR.........",
    ".......rrr..........",
    ".....RRRRRRR........",
    "...RRPPRRRRRRR......",
    "..RPPWRRRRRRRRR.....",
    "..RPRRRRRRRRRRr.....",
    ".RRPRRRRRRRRRRRr....",
    ".RRRRRRRRRRRRRRr....",
    ".RRRRRRRRRRRRRRr....",
    ".RRRRRRRRRRRRRrr....",
    "..RRRRRRRRRRRrr.....",
    "..RRRRRRRRRRrrr.....",
    "...RRRRRRRRrrr......",
    ".....rrrrrrr........",
    "....................",
    "....................",
  ]);
  // sementes soltas (guardar na carteira dá sorte)
  for (const [x, y] of [[17, 13], [18, 16], [16, 17]]) carimbar(g, ["WP", "PF"], x, y);
  return g;
}

function cenaUvas() {
  const g = novaGrade();
  const uva = [".MM.", "MWMM", "MMMb", ".bb."];
  // 4 + 3 + 3 + 2 = 12 uvas
  const pos = [
    [2, 4], [6, 4], [10, 4], [14, 4],
    [4, 7], [8, 7], [12, 7],
    [4, 10], [8, 10], [12, 10],
    [6, 13], [10, 13],
  ];
  for (const [x, y] of pos) carimbar(g, uva, x, y);
  linha(g, 9, 1, 9, 4, "K");
  P(g, 8, 1, "K");
  carimbar(g, ["..GG.", ".GLGG", "GGGG.", ".G..."], 10, 0);
  return g;
}

function cenaNascerSol() {
  const g = novaGrade();
  pintar(g, (x, y) => {
    if (y > 11) return null;
    const d = Math.hypot(x - 9.5, y - 12);
    if (d <= 3.6) return "V";
    if (d <= 5.6) return "Y";
    if (d <= 6.4) return "O";
    return null;
  });
  for (const a of [-62, -31, 0, 31, 62]) {
    const r = (a * Math.PI) / 180;
    for (const d of [7.6, 8.6, 9.6]) P(g, 9.5 + d * Math.sin(r), 12 - d * Math.cos(r), d < 8 ? "Y" : "O");
  }
  for (let x = 0; x < N; x++) P(g, x, 12, x >= 4 && x <= 15 ? "Y" : "O");
  const reflexo = [[6, 13, "Y"], [7, 14, "O"], [8, 15, "Y"], [8, 16, "O"], [9, 17, "Y"]];
  for (const [x0, y, c] of reflexo) for (let x = x0; x <= 19 - x0; x++) if ((x + y) % 3 !== 0) P(g, x, y, c);
  ondas(g, 15, 5, 1, ["B"], { espuma: "C" });
  ondas(g, 18, 10, 1, ["B"], { fase: 5, espuma: "C" });
  // gaivotas
  for (const [x, y] of [[2, 3], [15, 1], [18, 5]]) carimbar(g, ["W.W", ".W."], x, y, true);
  return g;
}

function cenaBaldeGelo() {
  return arte([
    "....................",
    ".........VV.........",
    ".........YV.........",
    ".........YY.........",
    ".........GG.........",
    "........gGGL........",
    "..V.....gGGL........",
    ".VWV....gGGL....W...",
    "..V.CW..gGGL..WC....",
    "...CWWC.gGGL.CWWC...",
    "...WWWWWWWWWWWWWW...",
    "..W.wWwwwwwwwwww.W..",
    "..W.wWwwwwwwwwww.W..",
    "....wWwwwwwwwwww....",
    ".....WWWWWWWWWW.....",
    ".....Wwwwwwwwww.....",
    ".....Wwwwwwwwww.....",
    "......wwwwwwww......",
    "......WWWWWWWW......",
    "....................",
  ]);
}

function cenaCristo() {
  const g = arte([
    "....................",
    "....................",
    ".........WW.........",
    ".........WW.........",
    "....WWWWWWWWWWWW....",
    "....ww..WWWW..ww....",
    "........WWWW........",
    "........WWWW........",
    "........WWWW........",
    "........WWWW........",
    ".......wWWWWw.......",
    ".......wWWWWw.......",
    "........wwww........",
    "........wwww........",
    ".......GGGGGG.......",
    "......GggggggG......",
    ".....GggggggggG.....",
    "...GGggggggggggGG...",
    "GGGggggYggggYggggGGG",
    "ggYggggggggggggYgggg",
  ]);
  fogo(g, 19, 9, 4, ["F", "F", "P"], 10);
  brilho(g, 3, 1, "Y");
  brilho(g, 16, 1, "C");
  return g;
}

function cenaPaoAcucar() {
  // Morro da Urca à esquerda, o Pão de Açúcar à direita e o bondinho no cabo entre os dois
  const g = arte([
    "....................",
    "....................",
    "....................",
    "..............GG....",
    ".............GGGG...",
    "............WWwwwG..",
    "............Wwwwww..",
    "............Wwwwwww.",
    "............Wwwwwww.",
    "...GGG......wwwwwww.",
    ".GGgggGG....wwwwwww.",
    "GgggggggG...wwwwwww.",
    "gggggggggGGGgwwwwwwG",
    "ggggYgggggggggYggggg",
    "....................",
    "BBCBBBBBCBBBBBCBBBBB",
    "....F.........Y.....",
    "......F.........Y...",
    "....................",
    "....................",
  ]);
  linha(g, 5, 9, 12, 4, "w");
  carimbar(g, ["w.", "YY", "RR"], 8, 8);
  fogo(g, 4, 4, 3, ["F", "F"], 10);
  fogo(g, 9, 1, 2, ["Y"], 8, Math.PI / 8);
  return g;
}

const PULANDO = ["S.KK.S", "W.SS.W", ".WWWW.", "..WW..", "..WW..", ".W..W.", "W....W", "S....S"];
const PULANDO_P = ["S.K.S", "W.S.W", ".WWW.", "..W..", ".W.W.", "S...S"];

function cenaPulandoOndas() {
  const g = novaGrade();
  carimbar(g, PULANDO, 0, 5, true);
  carimbar(g, PULANDO_P, 7, 3, true);
  carimbar(g, PULANDO, 13, 4, true);
  ondas(g, 14, 10, 2, ["C", "B"], { fase: 6, largEspuma: 0.2 });
  ondas(g, 18, 5, 1, ["T"], { fase: 2, espuma: "C" });
  for (const [x, y] of [[10, 0], [18, 1], [3, 1], [11, 11]]) P(g, x, y, "W");
  return g;
}

const CORACAO = [
  ".RRRR...RRRR.",
  "RPWRRR.RRRRRR",
  "RPRRRRRRRRRRr",
  "RRRRRRRRRRRRr",
  "RRRRRRRRRRRrr",
  ".RRRRRRRRRRr.",
  "..RRRRRRRRr..",
  "...RRRRRRr...",
  "....RRRRr....",
  ".....RRr.....",
  "......r......",
];

function cenaCoracao2027() {
  const g = novaGrade();
  carimbar(g, CORACAO, 3, 0);
  escrever(g, "2027", 2, 13, "Y");
  brilho(g, 18, 3, "V");
  brilho(g, 0, 8, "F", 1);
  return g;
}

function cenaTrevo() {
  const g = novaGrade();
  // uma folha em coração (ponta no centro), girada 4 vezes em volta de (9,5; 9,5)
  const folha = [
    [".GG..GG.", 2],
    ["GLLGGLLG", 3],
    ["GLGGGLGG", 4],
    [".GGGGGG.", 5],
    ["..GGGG..", 6],
    ["...gg...", 7],
    ["...gg...", 8],
  ];
  const pontos = [];
  for (const [fileira, y] of folha) Array.from(fileira).forEach((c, dx) => c !== "." && pontos.push([6 + dx, y, c]));
  for (let volta = 0; volta < 4; volta++) {
    for (const p of pontos) P(g, p[0], p[1], p[2]);
    for (const p of pontos) [p[0], p[1]] = [19 - p[1], p[0]];
  }
  for (const [x, y] of [[11, 11], [12, 12], [13, 13], [14, 14], [14, 15], [15, 16], [15, 17]]) P(g, x, y, "G");
  brilho(g, 2, 2, "V");
  brilho(g, 18, 9, "W", 1);
  return g;
}

const MOEDA = [
  "...YYY...",
  ".YYVVVYY.",
  ".YVVYVVy.",
  "YVVYYYVVy",
  "YVYYWYYVy",
  "YVVYYYVVy",
  ".YVVYVVy.",
  ".yyVVVyy.",
  "...yyy...",
];

function cenaMoedas() {
  const g = novaGrade();
  carimbar(g, MOEDA, 1, 2);
  const pilha = (x, y, n) => {
    carimbar(g, [".VVVV.", "VVWVVV", ".yyyy."], x, y);
    for (let k = 0; k < n; k++) carimbar(g, ["VYYYYy", ".yyyy."], x + (k === 2 ? 1 : 0), y + 3 + 2 * k);
  };
  pilha(12, 6, 6);
  pilha(3, 13, 2);
  brilho(g, 15, 2, "V");
  brilho(g, 19, 14, "W", 1);
  brilho(g, 10, 13, "V", 1);
  return g;
}

function cenaEstrelaSorte() {
  const g = novaGrade();
  const cx = 9.5;
  const cy = 10.4;
  const R = 9.2;
  const r = 3.7;
  const verts = [];
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const raio = k % 2 === 0 ? R : r;
    verts.push([cx + raio * Math.cos(a), cy + raio * Math.sin(a)]);
  }
  const dentro = (x, y) => {
    let d = false;
    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
      const [xi, yi] = verts[i];
      const [xj, yj] = verts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  pintar(g, (x, y) => {
    if (!dentro(x + 0.5, y + 0.5)) return null;
    const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx) + Math.PI / 2;
    const setor = Math.floor((((a * 5) / Math.PI) % 10 + 10) % 10);
    return setor % 2 === 0 ? "Y" : "V";
  });
  brilho(g, 2, 2, "C");
  brilho(g, 17, 1, "W", 1);
  brilho(g, 18, 17, "F");
  brilho(g, 1, 16, "V", 1);
  return g;
}

function cenaFeliz2027() {
  const g = novaGrade();
  let x = 1;
  for (const ch of "FELIZ") {
    if (ch === "I") {
      for (let y = 3; y <= 7; y++) P(g, x, y, "F");
      x += 2;
    } else x += escrever(g, ch, x, 3, "F") + 1;
  }
  escrever(g, "2027", 2, 11, "Y");
  brilho(g, 19, 13, "V");
  brilho(g, 19, 5, "W", 1);
  return g;
}

export const ANIMACOES_ANO_NOVO_B = [
  { id: "ano-2027", nome: "2027", criar: cena2027 },
  { id: "ano-contagem", nome: "Contagem 3, 2, 1", criar: cenaContagem },
  { id: "ano-relogio", nome: "Meia-noite", criar: cenaRelogio },
  { id: "ano-ampulheta", nome: "Ampulheta", criar: cenaAmpulheta },
  { id: "ano-calendario", nome: "Primeiro de janeiro", criar: cenaCalendario },
  { id: "ano-feliz", nome: "FELIZ", criar: cenaFeliz },
  { id: "ano-ano-novo", nome: "ANO NOVO", criar: cenaAnoNovo },
  { id: "ano-sete-ondas", nome: "Sete ondas", criar: cenaSeteOndas },
  { id: "ano-copacabana", nome: "Réveillon em Copacabana", criar: cenaCopacabana },
  { id: "ano-calcadao", nome: "Calçadão", criar: cenaCalcadao },
  { id: "ano-flores-mar", nome: "Flores no mar", criar: cenaFloresMar },
  { id: "ano-barcos", nome: "Barcos iluminados", criar: cenaBarcos },
  { id: "ano-roupa-branca", nome: "Roupa branca", criar: cenaRoupaBranca },
  { id: "ano-roma", nome: "Romã da sorte", criar: cenaRoma },
  { id: "ano-uvas", nome: "Doze uvas", criar: cenaUvas },
  { id: "ano-nascer-sol", nome: "Primeiro nascer do sol", criar: cenaNascerSol },
  { id: "ano-balde-gelo", nome: "Espumante no gelo", criar: cenaBaldeGelo },
  { id: "ano-cristo", nome: "Fogos no Cristo", criar: cenaCristo },
  { id: "ano-pao-acucar", nome: "Pão de Açúcar", criar: cenaPaoAcucar },
  { id: "ano-pulando-ondas", nome: "Pulando ondas", criar: cenaPulandoOndas },
  { id: "ano-coracao-2027", nome: "Coração 2027", criar: cenaCoracao2027 },
  { id: "ano-trevo", nome: "Trevo da sorte", criar: cenaTrevo },
  { id: "ano-moedas", nome: "Moedas da sorte", criar: cenaMoedas },
  { id: "ano-estrela-sorte", nome: "Estrela da sorte", criar: cenaEstrelaSorte },
  { id: "ano-feliz-2027", nome: "Feliz 2027", criar: cenaFeliz2027 },
];
