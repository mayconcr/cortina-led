// Mais 30 cenas de Natal que rolam (Animações), no mesmo estilo de natal.js.
//
// Cada cena é uma grade 20×20 que a cortina rola da direita para a esquerda, em loop:
// a coluna 0 volta logo depois da 19, então chão, água, fios e faixas têm período que divide 20
// e o que cruza a borda usa `envolver = true`. Fundo apagado e cores saturadas.

import {
  ESTRELINHA,
  FLOCO_P,
  N,
  anel,
  arte,
  carimbar,
  disco,
  escrever,
  linha,
  novaGrade,
  pintar,
  ponto,
  retangulo,
} from "./pixelart.js";
import { FONTES } from "./fonte.js";

// ---------- ajudantes locais ----------

/** Linha horizontal com um padrão que se repete (o tamanho do padrão deve dividir 20). */
function faixa(g, lin, padrao) {
  for (let x = 0; x < N; x++) ponto(g, x, lin, padrao[x % padrao.length]);
}

/** Vários pontos da mesma cor. */
function pontos(g, lista, c = "W") {
  for (const [x, y] of lista) ponto(g, x, y, c);
}

/** Chão de neve em duas linhas (período 5). */
function neve(g, lin = 18) {
  faixa(g, lin, "WWWWw");
  if (lin + 1 < N) faixa(g, lin + 1, "w");
}

// ============================================================
//                          CENAS
// ============================================================

function cenaNoelAcenando() {
  const g = arte([
    "....................",
    ".......WW...........",
    ".......WWRRRRR......",
    ".........RRRRRR.....",
    "........WWWWWWWW....",
    "........SS.SS.SS.SS.",
    "........WPSSSSPW.SS.",
    "........WWWWWWWW.WW.",
    ".......RWWWWWWWWRR..",
    "......RRRWWWWWWRR...",
    "......RRRRWWWWRRR...",
    "..GYG.RRRRRWWRRRR...",
    "..GYG.RRRRRRRRRRR...",
    "..yKKyWkkkkYYkkkk...",
    ".yyyyySRRRRRRRRRR...",
    "yyyyyy.WWWWWWWWWW...",
    "yyyyyy..RRR..RRR....",
    "yyyyyK..RRR..RRR....",
    ".yyyy..kkkk..kkkk...",
    "WWWWwWWWWwWWWWwWWWWw",
  ]);
  pontos(g, [[19, 4], [16, 3]], "Y");
  return g;
}

function cenaChamine() {
  const g = arte([
    "....................",
    "..........WW....VVV.",
    ".....RRRRRWW.....VVV",
    "....RRRRRR........VV",
    ".S.WWWWWWWW.S.....VV",
    ".S..S.SS.S..S....VVV",
    ".W..WPSSPW..W...VVV.",
    ".RR.WWWWWW.RR.......",
    "..RRRWWWWRRR........",
    "...RRRWWRRR.........",
    "..WWWWWWWWWW........",
    "..RRRRRRRRRR........",
    "...RR.RRR.RR........",
    "...RRRR.RRRR........",
    "...RR.RRR.RR........",
    "...RRRR.RRRR........",
    "WWWWWWWWWWWWWWWWWWWW",
    "KKK.KKK.KKK.KKK.KKK.",
    "K.KKK.KKK.KKK.KKK.KK",
    "....................",
  ]);
  pontos(g, [[14, 9], [18, 11], [15, 14], [0, 1], [13, 3]]);
  return g;
}

function cenaPinguins() {
  const g = novaGrade();
  const pinguim = [
    "....W.",
    "...RR.",
    "..RRR.",
    ".RRRR.",
    "WWWWWW",
    "B.WW.B",
    "BWOOWB",
    "BWWWWB",
    "BWWWWB",
    "BWWWWB",
    ".BWWB.",
    "OO..OO",
  ];
  const filhote = ["...W.", "..RR.", ".RRR.", "WWWWW", "B.W.B", "BWOWB", "BWWWB", ".BWB.", "OO.OO"];
  carimbar(g, pinguim, 0, 6);
  carimbar(g, filhote, 7, 9);
  carimbar(g, pinguim, 13, 6);
  neve(g, 18);
  for (const [x, y] of [[3, 1], [10, 3], [16, 0], [8, 0]]) carimbar(g, FLOCO_P, x - 1, y - 1, true);
  return g;
}

function cenaUrsoPolar() {
  const g = arte([
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "...ww...............",
    "..WWWW.....RGR......",
    ".WW.WWW..RGR........",
    "kWWWWWWRGR..........",
    ".wWWWWRGRWWWWWWWW...",
    "....WWGRGWWWWWWWWWW.",
    ".....WRGRWWWWWWWWWW.",
    ".....WWWWWWWWWWWWWW.",
    ".....wWWWWWWWWWWWWW.",
    ".....wWWWwwwwwwWWWw.",
    "......WWW.....WWW...",
    "......WWW.....WWW...",
    ".....WWWW....WWWW...",
    "WWWWwWWWWwWWWWwWWWWw",
    "wwwwwwwwwwwwwwwwwwww",
  ]);
  return g;
}

function cenaQuebraNozes() {
  const g = novaGrade();
  const soldado = (perna) => [
    "...R...",
    "..BBB..",
    ".BBBBB.",
    ".BBBBB.",
    ".YYYYY.",
    ".S.S.S.",
    ".PSSSP.",
    ".WWWWW.",
    ".WRRRW.",
    "..WWW..",
    "YRRRRRY",
    "RRRYRRR",
    "RRRYRRR",
    "SWWYWWS",
    ".BBBBB.",
    ...perna,
  ];
  const passoA = [".BB.BB.", ".BB.kk.", ".kk...."];
  const passoB = [".BB.BB.", ".kk.BB.", "....kk."];
  carimbar(g, soldado(passoA), 1, 1);
  carimbar(g, soldado(passoB), 11, 1);
  faixa(g, 19, "yyyyY");
  return g;
}

function cenaLareira() {
  const g = novaGrade();
  // pedras em volta da boca da lareira
  for (let y = 6; y <= 17; y++) {
    for (let x = 3; x <= 16; x++) {
      const boca = x >= 6 && x <= 13 && y >= 9;
      if (!boca && (x + (y % 2) * 2) % 4 !== 0) ponto(g, x, y, "w");
    }
  }
  // fogo e lenha
  carimbar(g, ["...Y....", "..YY..Y.", ".YOY.YY.", ".YOOYOY.", "YOROOROY", "OORRRROO", "KKKKKKKK", "kKK..KKk"], 6, 10);
  // consolo de madeira com festão
  faixa(g, 4, "GGRGG");
  retangulo(g, 1, 5, 18, 5, "K");
  for (const x of [0, 19]) ponto(g, x, 4, null);
  g[4][0] = null;
  g[4][19] = null;
  // meias
  carimbar(g, ["WWW.", "RRR.", "RRR.", "RRR.", "RRRR", ".RRR"], 2, 6);
  carimbar(g, ["WWW.", "GGG.", "GGG.", "GGG.", "GGGG", ".GGG"], 14, 6);
  faixa(g, 18, "w");
  return g;
}

function cenaJanela() {
  const g = novaGrade();
  // céu lá fora
  pontos(g, [[6, 4], [12, 3], [7, 10], [13, 11], [11, 6]]);
  pontos(g, [[5, 7], [14, 5], [8, 12], [12, 9]], "C");
  carimbar(g, [".VV", "VV.", ".VV"], 6, 3);
  // moldura e travessas
  retangulo(g, 4, 1, 15, 1, "K");
  retangulo(g, 4, 14, 15, 14, "K");
  retangulo(g, 4, 1, 4, 14, "K");
  retangulo(g, 15, 1, 15, 14, "K");
  retangulo(g, 9, 1, 10, 14, "K");
  retangulo(g, 4, 7, 15, 7, "K");
  // neve acumulada no vidro
  carimbar(g, ["W..W", "WWWW"], 5, 12);
  carimbar(g, ["W..W", "WWWW"], 11, 12);
  // cortinas
  carimbar(g, ["RRR", "RRR", "RRR", "RR.", "RR.", "RR.", "RR.", "YY.", "RR.", "RRR", "RRR", "RRR", "RRR", "RRR"], 1, 1);
  carimbar(g, ["RRR", "RRR", "RRR", ".RR", ".RR", ".RR", ".RR", ".YY", ".RR", "RRR", "RRR", "RRR", "RRR", "RRR"], 16, 1);
  // parapeito com vela
  retangulo(g, 2, 15, 17, 15, "y");
  carimbar(g, [".Y.", "YWY", ".O.", "RRR", "RRR", "RRR"], 8, 9);
  carimbar(g, ["G.G"], 8, 14);
  return g;
}

function cenaArvoreLagoa() {
  const g = novaGrade();
  carimbar(g, ESTRELINHA, 8, 0);
  const luzes = ["Y", "R", "C", "P", "W"];
  for (let y = 3; y <= 11; y++) {
    const meia = Math.floor((y - 2) * 0.75);
    for (let x = 9 - meia; x <= 10 + meia; x++) {
      const borda = x === 9 - meia || x === 10 + meia;
      const luz = (x + y * 2) % 5 === 0;
      ponto(g, x, y, luz ? luzes[(x + y) % luzes.length] : borda || y % 2 === 1 ? "G" : "g");
    }
  }
  // base flutuante
  retangulo(g, 5, 12, 14, 12, "w");
  // reflexo (mais escuro, tremido)
  for (let y = 13; y <= 18; y++) {
    const fonte = 24 - y;
    for (let x = 0; x < N; x++) {
      const c = g[fonte][x];
      if (c && (x + y) % 2 === 0) ponto(g, x, y, c[1] > c[0] ? "g" : "y");
    }
  }
  for (const y of [14, 16, 18]) for (let x = 0; x < N; x++) if ((x + y) % 5 === 0) ponto(g, x, y, "B");
  faixa(g, 19, "BB.C.");
  pontos(g, [[2, 2], [16, 1], [18, 6], [1, 8]]);
  return g;
}

function cenaNoelSurfista() {
  const g = novaGrade();
  disco(g, 16.5, 2.5, 2.3, "Y");
  pontos(g, [[13, 2], [16, 6], [19, 4]], "O");
  // onda que quebra atrás do Noel
  carimbar(
    g,
    [
      "....WWW.",
      "..WWCCCW",
      ".WCC..CC",
      "WCC....C",
      "CC.....C",
      "C......C",
      "C.....CB",
      "B....CBB",
      "B...CBBB",
      "BBBCBBBB",
    ],
    12,
    7,
  );
  // Noel surfando, virado para a esquerda
  carimbar(
    g,
    [
      "...RRW..",
      "..RRRWW.",
      ".WWWW...",
      ".S.SS...",
      "SWWWW.S.",
      ".SWWRRS.",
      "..RRRR..",
      "..RRRR..",
      "..YYYY..",
      "..RR.RR.",
      ".SS...SS",
    ],
    3,
    5,
  );
  carimbar(g, ["OOOOOOOOOO", ".YYYYYYYY."], 1, 16);
  faixa(g, 18, "CCBBBCCBBB");
  faixa(g, 19, "BBBBB");
  return g;
}

function cenaCoqueiro() {
  const g = novaGrade();
  const cores = ["R", "Y", "B", "P"];
  // tronco curvo com luzes enroladas
  const tronco = [[8, 17], [8, 16], [8, 15], [9, 14], [9, 13], [9, 12], [10, 11], [10, 10], [10, 9], [11, 8]];
  tronco.forEach(([x, y], i) => {
    ponto(g, x, y, "K");
    ponto(g, x + 1, y, "K");
    ponto(g, x + (i % 2), y, cores[i % cores.length]);
  });
  // folhas
  const folhas = [
    [[11, 6], [9, 5], [7, 5], [5, 6], [4, 7], [3, 9]],
    [[11, 6], [10, 4], [8, 3], [6, 3]],
    [[12, 6], [13, 4], [15, 3], [17, 3]],
    [[12, 6], [14, 6], [16, 6], [17, 7], [18, 9]],
    [[11, 6], [10, 7], [9, 8], [8, 9]],
    [[12, 6], [13, 7], [14, 8], [15, 9]],
  ];
  for (const f of folhas) {
    for (let i = 0; i < f.length - 1; i++) linha(g, f[i][0], f[i][1], f[i + 1][0], f[i + 1][1], "G");
    const [x, y] = f[f.length - 1];
    ponto(g, x, y, "L");
    ponto(g, f[2][0], f[2][1], cores[(x + y) % cores.length]);
  }
  carimbar(g, ["KK", "KK"], 11, 7);
  carimbar(g, ["WW"], 11, 6);
  faixa(g, 17, "C.CC.");
  faixa(g, 18, "YYYYy");
  faixa(g, 19, "yyYyy");
  pontos(g, [[2, 1], [16, 0], [19, 12], [3, 13], [14, 13]]);
  return g;
}

function cenaPanetone() {
  return arte([
    "................W...",
    "..............W....W",
    "...............W.W..",
    "..............CVVVC.",
    "..............CVVVC.",
    "...KKKKK......CVVVC.",
    "..KKKKKKK.....CVVVC.",
    ".KKyKKKKyK.....CVC..",
    ".KKKKKyKKK......C...",
    ".YYYYYYYYY......C...",
    ".YRYYYYRYY......C...",
    ".YYYYYYYYY......C...",
    ".RRRRRRRRR......C...",
    ".RRRRYRRRR......C...",
    ".YYYYYYYYY.....CCC..",
    ".YYRYYYYRY....CCCCC.",
    ".YYYYYYYYY..........",
    "....................",
    "....................",
    "....................",
  ]);
}

function cenaLeiteBiscoitos() {
  const g = novaGrade();
  // copo de leite com canudo listrado
  carimbar(g, ["....R", "....W", "...R.", "...W.", "C.R.C", "CWWWC", "CWWWC", "CWWWC", "CWWWC", "CWWWC", "CWWWC", ".CCC."], 2, 4);
  // biscoitos de gotas de chocolate
  disco(g, 9.5, 12, 2.6, "y");
  disco(g, 14.5, 10.5, 2.6, "y");
  pontos(g, [[9, 11], [10, 13], [8, 13], [14, 10], [15, 12], [13, 9]], null);
  for (const [x, y] of [[9, 11], [10, 13], [8, 13], [14, 10], [15, 12], [13, 9]]) g[y][x] = null;
  // prato
  retangulo(g, 6, 15, 18, 15, "C");
  retangulo(g, 8, 16, 16, 16, "B");
  return g;
}

function cenaChocolate() {
  return arte([
    "....................",
    "......w....w........",
    ".......w....w.......",
    "......w....w........",
    ".......w....w.......",
    "......w....w........",
    "....................",
    "...WRW..............",
    "...R.R..............",
    "....WKKWKKKWKK......",
    "...RRRRRRRRRRRR.....",
    "...RRRRRRRRRRRRRRR..",
    "...RRWRRRRRRWRRR..R.",
    "...RRRWRRRRWRRRR..R.",
    "...RRWRWRRWRWRRR..R.",
    "...RRRWRRRRWRRRRRR..",
    "...RRWRRRRRRWRRR....",
    "....RRRRRRRRRRR.....",
    "..wwwwwwwwwwwwwww...",
    "....................",
  ]);
}

function cenaTremArvore() {
  const g = novaGrade();
  carimbar(g, ESTRELINHA, 8, 0);
  const copa = [
    "....G....",
    "...GGG...",
    "..GRGGG..",
    "...GGG...",
    "..GGGYG..",
    ".GGGGGGG.",
    "..GBGGG..",
    ".GGGGGRG.",
    "GGYGGGGGG",
    ".GGGGPGG.",
    "GGGGGGGGG",
  ];
  carimbar(g, copa, 5, 2);
  // trenzinho de brinquedo
  carimbar(g, ["..YY...", ".KKK.RR", "RRRRRRR", "RRRRRRR", "Y.w.w.."], 1, 13);
  carimbar(g, [".PB.", "GGGG", "GGGG", ".w.w"], 9, 14);
  carimbar(g, ["YR..", "BBBB", "BBBB", ".w.w"], 14, 14);
  faixa(g, 18, "w");
  faixa(g, 19, "K...");
  return g;
}

function cenaCoralAnjos() {
  const g = novaGrade();
  const anjo = (manto) => [
    "..YYYYY..",
    ".........",
    "...YYY...",
    "..YSSSY..",
    "..Y.S.Y..",
    "...SOS...",
    "CC.WWW.CC",
    "CCCWWWCCC",
    ".CSRRRSC.",
    "..WRRRW..",
    `..${manto}${manto}${manto}${manto}${manto}..`,
    `.${manto}${manto}${manto}${manto}${manto}${manto}${manto}.`,
    `.${manto}${manto}${manto}${manto}${manto}${manto}${manto}.`,
    ".YYYYYYY.",
  ];
  carimbar(g, anjo("W"), 0, 4);
  carimbar(g, anjo("W"), 10, 5);
  carimbar(g, ["YY", "Y.", "Y.", "YY", "YY"], 9, 1);
  carimbar(g, ["MMM", "M.M", "M.M", "MM.", "MM."], 17, 0);
  return g;
}

function cenaPartitura() {
  const g = novaGrade();
  for (const y of [4, 7, 10, 13, 16]) faixa(g, y, "w");
  carimbar(g, ["..R", "..R", "..R", "..R", "..R", "RRR", "RRR"], 0, 9);
  carimbar(g, ["..GGGGG", "..G...G", "..G...G", "..G...G", "GGG...G", "GGG.GGG", "....GGG"], 4, 2);
  // sino dourado com laço vermelho
  carimbar(g, ["R.RR.R", "RRrrRR", "..YY..", ".YYYY.", ".YWYY.", "YYYYYY", "YYYYYY", "yyyyyy", "..yy.."], 12, 5);
  return g;
}

function cenaEstrelasPapel() {
  const g = novaGrade();
  const estrela = (c, s) => ["...X...", "..XXS..", "XXXXSSS", ".XXXSS.", "..XXS..", ".XX.SS.", ".X...S."].map((l) =>
    l.replace(/X/g, c).replace(/S/g, s),
  );
  linha(g, 3, 0, 3, 3, "w");
  carimbar(g, estrela("Y", "y"), 0, 4);
  linha(g, 10, 0, 10, 9, "w");
  carimbar(g, estrela("R", "r"), 7, 10);
  linha(g, 16, 0, 16, 2, "w");
  carimbar(g, estrela("C", "B"), 13, 3);
  pontos(g, [[6, 1], [13, 16], [2, 15], [18, 13]]);
  return g;
}

function cenaIgreja() {
  return arte([
    ".....Y..............",
    "....YYY.............",
    ".....Y..............",
    ".....W..............",
    "....WRW.............",
    "...WRRRW............",
    "..WRRRRRW...........",
    "...wwwww............",
    "...w.Y.w....WWW.....",
    "...wYYYw...WRRRW....",
    "...wwwwwWWWRRRRRW...",
    "...wwBwwRRRRRRRRRW..",
    "...wBYBwwwwwwwwwww..",
    "...wwBwwwwYwwwYwww..",
    "...wwwwwwwYwwwYwww..",
    "...wwKwwwwwwwwwwww..",
    "...wKKKwwwwwwwwwww..",
    "...wKKKwwwwwwwwwww..",
    "WWWWwWWWWwWWWWwWWWWw",
    "wwwwwwwwwwwwwwwwwwww",
  ]);
}

function cenaACaminho() {
  const g = novaGrade();
  carimbar(g, ["..Y..", ".YWY.", "YWWWY", ".YWY.", "..Y.."], 1, 0);
  linha(g, 6, 2, 10, 3, "y");
  // José com cajado, puxando o burrinho
  carimbar(
    g,
    [
      "y.ww.",
      "y.www",
      "yS.Sw",
      "ySSSw",
      "yKKK.",
      "SGKGK",
      "yGKGy",
      "yGKGy",
      "yGKG.",
      "yGKG.",
      "yK.K.",
      "yK.K.",
    ],
    1,
    6,
  );
  // Maria no burrinho
  carimbar(
    g,
    [
      "......BBB...",
      ".....BSSB...",
      ".....B.SB...",
      ".....BSSB...",
      ".....BBBBB..",
      "..ww.BBBBB..",
      ".www.BBBBB..",
      "wwwwwwwwwww.",
      "wwwwwwwwwwww",
      "....wwwwwwww",
      "....w.w..w.w",
      "....w.w..w.w",
      "...ww.ww.ww.",
    ],
    7,
    5,
  );
  linha(g, 5, 11, 8, 12, "y");
  faixa(g, 18, "yyyyY");
  return g;
}

function cenaElfo() {
  const g = novaGrade();
  carimbar(
    g,
    [
      "...........",
      "Y..........",
      ".GG........",
      "..GGG...ww.",
      "..GGGG..wwK",
      ".RRRRRR...K",
      "S.SSSS.S.K.",
      "..S.S.S.K..",
      "...SSSSSK..",
      "..RYRYRS...",
      "..GGGGGG...",
      "..GGGGGG...",
      "..kkYkkk...",
      "..GGGGG....",
      "..R...R....",
      "..W...W....",
      "..R...R....",
      ".GG..GG....",
    ],
    1,
    1,
  );
  // bancada e presente
  carimbar(g, ["Y.Y.Y", ".YYY.", "MMYMM", "MMYMM", "MMYMM"], 12, 8);
  retangulo(g, 10, 13, 19, 13, "K");
  linha(g, 11, 14, 11, 18, "K");
  linha(g, 18, 14, 18, 18, "K");
  pontos(g, [[11, 3], [14, 5], [9, 8]], "Y");
  faixa(g, 19, "y");
  return g;
}

function cenaUrsinho() {
  return arte([
    "....................",
    "....KKK......KKK....",
    "....KyKKKKKKKKyK....",
    ".....KKKKKKKKKK.....",
    ".....KK.KKKK.KK.....",
    ".....KKKyyyyKKK.....",
    ".....KKyy..yyKK.....",
    ".....KKKyyyyKKK.....",
    "......KKKKKKKK......",
    ".....RRRKrrKRRR.....",
    "...KKRRKKKKKKRRKK...",
    "..KKKKKKyyyyKKKKKK..",
    "..yKK.KyyyyyyK.KKy..",
    "......KyyyyyyK......",
    "......KKyyyyKK......",
    ".....KKKKKKKKKK.....",
    "....KKKK....KKKK....",
    "....KyyK....KyyK....",
    "....KyyK....KyyK....",
    "....................",
  ]);
}

function cenaDoces() {
  const g = novaGrade();
  const pirulito = (cx, cy, raio, c1, c2) =>
    pintar(g, (x, y) => {
      const d = Math.hypot(x - cx, y - cy);
      if (d > raio) return null;
      const a = Math.atan2(y - cy, x - cx) / (2 * Math.PI);
      return Math.floor((a + d / 3) * 2 + 10) % 2 === 0 ? c1 : c2;
    });
  linha(g, 4, 9, 4, 17, "W");
  pirulito(4, 5, 3.6, "R", "W");
  linha(g, 15, 11, 15, 18, "W");
  pirulito(15, 7, 3.6, "G", "W");
  const bala = (c) => [`${c}.${c}${c}${c}.${c}`, `${c}${c}${c}W${c}${c}${c}`, `${c}.${c}${c}${c}.${c}`];
  carimbar(g, bala("M"), 7, 14);
  carimbar(g, bala("Y"), 8, 2);
  carimbar(g, bala("C"), 16, 15, true);
  return g;
}

function cenaCupcakes() {
  const g = novaGrade();
  carimbar(
    g,
    [
      "...G.G..",
      "..GGRGG.",
      "...WWW..",
      "..WWWWW.",
      ".WRWWGWW",
      "WWWWWWWW",
      "RrRrRrRr",
      ".RrRrRr.",
      ".RrRrRr.",
      "..rRrR..",
    ],
    0,
    7,
  );
  carimbar(
    g,
    [
      "...Y...",
      "..YWY..",
      "...G...",
      "..GGG..",
      "..GRG..",
      ".GGGGG.",
      ".GYGGG.",
      "GGGGGBG",
      "PPPPPPP",
      "PFPFPFP",
      ".PFPFP.",
      ".PFPFP.",
      "..FPF..",
    ],
    11,
    4,
  );
  return g;
}

function cenaPatinacao() {
  const g = novaGrade();
  const patinador = (casaco, cachecol) => [
    "...W...",
    "..RRR..",
    "..SSS..",
    `..${cachecol}${cachecol}${cachecol}${cachecol}.`,
    `.${casaco}${casaco}${casaco}${casaco}.${cachecol}`,
    `S${casaco}${casaco}${casaco}${casaco}S.`,
    `..${casaco}${casaco}${casaco}..`,
    "..BB.B..",
    "..B..BB.",
    ".WW...WW",
  ];
  carimbar(g, patinador("R", "G"), 1, 6);
  carimbar(g, patinador("M", "Y"), 10, 7);
  faixa(g, 17, "C");
  faixa(g, 18, "W..C.C..W.");
  carimbar(g, [".G.", "GGG", "GGG", ".K."], 17, 13);
  pontos(g, [[3, 1], [9, 2], [15, 0], [18, 4], [6, 4]]);
  return g;
}

function cenaRenaLua() {
  const g = novaGrade();
  disco(g, 9.5, 9.5, 8.2, "V");
  pontos(g, [[13, 3], [15, 15], [5, 15], [16, 6]], "Y");
  // silhueta da rena voando para a esquerda, recortada na lua (LEDs apagados)
  const rena = [
    ".X..X...........",
    "..XX............",
    ".XXX............",
    "XXXX............",
    "...XXXXXXXXXXX..",
    "...XXXXXXXXXXXX.",
    "..XX.X.....X.XX.",
    ".XX..X....X...XX",
    "X....X...X......",
  ];
  rena.forEach((l, dy) => Array.from(l).forEach((ch, dx) => ch === "X" && (g[5 + dy][2 + dx] = null)));
  pontos(g, [[0, 1], [19, 2], [0, 18], [19, 17]]);
  return g;
}

function cenaPorta() {
  const g = novaGrade();
  faixa(g, 1, "RYGB.");
  for (let x = 0; x < N; x++) if (x % 5 !== 4) ponto(g, x, 1, "RYGB"[x % 5]);
  retangulo(g, 5, 3, 14, 17, "W");
  retangulo(g, 6, 4, 13, 17, "R");
  // painéis da porta
  retangulo(g, 7, 13, 8, 16, "r");
  retangulo(g, 11, 13, 12, 16, "r");
  anel(g, 9.5, 7.5, 1.6, 3.3, "G");
  pontos(g, [[7, 5], [12, 6], [8, 10], [13, 9]], "R");
  carimbar(g, ["Y..Y", ".YY.", "Y..Y"], 8, 10);
  ponto(g, 13, 11, "Y");
  faixa(g, 18, "w");
  carimbar(g, ["..G..", ".GGG.", "GGGGG", "..K.."], 17, 13, true);
  return g;
}

function cenaLacos() {
  const g = novaGrade();
  const laco = (c, s) => [
    `${c}${c}.....${c}${c}`,
    `${c}${s}${c}${c}.${c}${c}${s}${c}`,
    `${c}${s}${s}${c}${c}${c}${s}${s}${c}`,
    `${c}${s}${c}${c}${c}${c}${c}${s}${c}`,
    `${c}${c}..${c}..${c}${c}`,
    `...${c}.${c}...`,
    `..${c}...${c}..`,
  ];
  faixa(g, 4, "Y");
  carimbar(g, laco("R", "r"), 0, 1);
  carimbar(g, laco("G", "g"), 10, 1);
  faixa(g, 14, "W");
  carimbar(g, laco("M", "B"), 5, 11);
  carimbar(g, laco("Y", "y"), 15, 11, true);
  return g;
}

function cenaLetreiro() {
  const g = novaGrade();
  // letras da fonte pequena (3×5) esticadas na altura (3×10), alternando vermelho e verde
  const glifos = FONTES.pequena.glifos;
  "NATAL".split("").forEach((letra, i) => {
    glifos[letra].forEach((fileira, dy) => {
      for (let dx = 0; dx < 3; dx++) {
        if (fileira[dx] !== "#") continue;
        ponto(g, i * 4 + dx, 5 + dy * 2, i % 2 ? "G" : "R");
        ponto(g, i * 4 + dx, 6 + dy * 2, i % 2 ? "G" : "R");
      }
    });
  });
  carimbar(g, ESTRELINHA, 2, 0);
  carimbar(g, ESTRELINHA, 13, 1);
  carimbar(g, ESTRELINHA, 7, 16);
  carimbar(g, ESTRELINHA, 16, 16);
  pontos(g, [[8, 1], [18, 3], [1, 17], [12, 18]]);
  return g;
}

function cenaCoruja() {
  const g = novaGrade();
  carimbar(
    g,
    [
      "..WWWWWW..",
      ".WWWWWWWW.",
      "WYYYWWYYYW",
      "WY.YWWY.YW",
      "WYYYOOYYYW",
      ".WWWOOWWW.",
      "WWwWWWWwWW",
      "WWWWwWWWWw",
      "wWwWWWwWWw",
      "WWWWWwWWWw",
      ".WwWWWWwW.",
      "..WWWWWW..",
      "...Y..Y...",
    ],
    5,
    3,
  );
  faixa(g, 16, "KKKKk");
  faixa(g, 15, "..WW......WW....W...");
  for (let x = 0; x < N; x++) if ("..WW......WW....W..."[x] === ".") g[15][x] = null;
  carimbar(g, ["G.G", ".G.", "GRG"], 1, 13);
  carimbar(g, ["G.G", ".G.", "GRG"], 16, 13);
  pontos(g, [[1, 1], [17, 2], [3, 8], [16, 9]]);
  return g;
}

function cenaCidade() {
  const g = novaGrade();
  const cores = ["R", "G", "Y", "B", "P"];
  const predios = [
    [0, 4, 8],
    [6, 10, 3],
    [12, 14, 10],
    [16, 18, 6],
  ];
  for (const [x0, x1, topo] of predios) {
    for (let x = x0; x <= x1; x++) ponto(g, x, topo, cores[(x + topo) % cores.length]);
    for (let y = topo + 2; y <= 17; y += 2) {
      for (let x = x0 + 1; x < x1; x += 2) if ((x * 7 + y * 3) % 5 !== 0) ponto(g, x, y, (x + y) % 3 ? "Y" : "V");
    }
    for (let y = topo + 1; y <= 18; y++) {
      ponto(g, x0, y, "B");
      ponto(g, x1, y, "B");
    }
  }
  carimbar(g, ESTRELINHA, 7, 0);
  faixa(g, 19, "w");
  pontos(g, [[2, 2], [14, 1], [18, 3], [13, 6]]);
  return g;
}

export const ANIMACOES_NATAL_MAIS = [
  { id: "natal-noel-acenando", nome: "Noel acenando", criar: cenaNoelAcenando },
  { id: "natal-chamine", nome: "Noel na chaminé", criar: cenaChamine },
  { id: "natal-pinguins", nome: "Pinguins de gorro", criar: cenaPinguins },
  { id: "natal-urso-polar", nome: "Urso polar", criar: cenaUrsoPolar },
  { id: "natal-quebra-nozes", nome: "Soldadinhos marchando", criar: cenaQuebraNozes },
  { id: "natal-lareira", nome: "Lareira acesa", criar: cenaLareira },
  { id: "natal-janela", nome: "Janela com neve", criar: cenaJanela },
  { id: "natal-arvore-lagoa", nome: "Árvore na lagoa", criar: cenaArvoreLagoa },
  { id: "natal-noel-surfista", nome: "Noel surfista", criar: cenaNoelSurfista },
  { id: "natal-coqueiro", nome: "Coqueiro iluminado", criar: cenaCoqueiro },
  { id: "natal-panetone", nome: "Panetone e taça", criar: cenaPanetone },
  { id: "natal-leite-biscoitos", nome: "Leite e biscoitos", criar: cenaLeiteBiscoitos },
  { id: "natal-chocolate", nome: "Chocolate quente", criar: cenaChocolate },
  { id: "natal-trem-arvore", nome: "Trenzinho na árvore", criar: cenaTremArvore },
  { id: "natal-coral-anjos", nome: "Coral de anjos", criar: cenaCoralAnjos },
  { id: "natal-partitura", nome: "Canção de Natal", criar: cenaPartitura },
  { id: "natal-estrelas-papel", nome: "Estrelas de papel", criar: cenaEstrelasPapel },
  { id: "natal-igreja", nome: "Igrejinha na neve", criar: cenaIgreja },
  { id: "natal-a-caminho", nome: "A caminho de Belém", criar: cenaACaminho },
  { id: "natal-elfo", nome: "Elfo na oficina", criar: cenaElfo },
  { id: "natal-ursinho", nome: "Ursinho de pelúcia", criar: cenaUrsinho },
  { id: "natal-doces", nome: "Pirulitos e balas", criar: cenaDoces },
  { id: "natal-cupcakes", nome: "Cupcakes de Natal", criar: cenaCupcakes },
  { id: "natal-patinacao", nome: "Patinação no lago", criar: cenaPatinacao },
  { id: "natal-rena-lua", nome: "Rena e lua cheia", criar: cenaRenaLua },
  { id: "natal-porta", nome: "Porta com guirlanda", criar: cenaPorta },
  { id: "natal-lacos", nome: "Laços de presente", criar: cenaLacos },
  { id: "natal-letreiro", nome: "NATAL", criar: cenaLetreiro },
  { id: "natal-coruja", nome: "Corujinha da neve", criar: cenaCoruja },
  { id: "natal-cidade", nome: "Cidade iluminada", criar: cenaCidade },
];
