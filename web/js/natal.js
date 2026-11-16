// Coleção de Natal: 20 desenhos parados (Galeria) e 20 cenas que rolam (Animações).
//
// As animações usam a rolagem nativa da cortina (MODE 03, da direita para a esquerda, em loop):
// cada cena tem 20 colunas que "emendam" na borda, para o movimento parecer contínuo.
// Fundo apagado (LED desligado) e cores saturadas, que ficam melhores em LED do que tons escuros.
// Testes: tests/natal.test.mjs

import { textoParaGrade } from "./fonte.js";
import {
  CORES,
  ESTRELINHA,
  FLOCO,
  FLOCO_P,
  N,
  PINHEIRO,
  PINHEIRO_ALTO,
  PINHEIRO_NEVE,
  arte,
  carimbar,
  disco,
  linha,
  novaGrade,
  pintar,
  ponto,
} from "./pixelart.js";

export { CORES };

// ============================================================
//                     GALERIA — 20 desenhos
// ============================================================

function arvore() {
  return arte([
    "....................",
    ".........YY.........",
    "........YWWY........",
    ".........YY.........",
    ".........GG.........",
    "........GLGG........",
    ".......GRGGGG.......",
    "......GLGGGBGG......",
    ".......GGGGGG.......",
    "......GLYGGGGG......",
    ".....GLGGGGGRGG.....",
    "....GBGGGGGGGGGG....",
    ".....GLGRGGGGGG.....",
    "....GLGGGGGGYGGG....",
    "...GLYGGGGGGGGBGG...",
    "..GRGGGGGPGGGGGGRG..",
    "..RRYRR.KKKK.BBYBB..",
    "..YYYYY.KKKK.YYYYY..",
    "..RRYRR......BBYBB..",
    "..RRYRR......BBYBB..",
  ]);
}

function papaiNoel() {
  return arte([
    "....................",
    "..............WW....",
    "...........RRRWW....",
    ".........RRRRRR.....",
    ".......RRRRRRRR.....",
    "......RRRRRRRRRR....",
    "....WWWWWWWWWWWW....",
    "....wWWWWWWWWWWw....",
    ".....SSSSSSSSSS.....",
    ".....SS.SSSS.SS.....",
    ".....SPSSRRSSPS.....",
    "....WWWWWWWWWWWW....",
    "....wWWWWRRWWWWw....",
    "....wWWWWWWWWWWw....",
    ".....wWWWWWWWWw.....",
    "......wWWWWWWw......",
    ".......wWWWWw.......",
    "........wWWw........",
    ".........ww.........",
    "....................",
  ]);
}

function bonecoNeve() {
  return arte([
    "........BBBB........",
    "........BBBB........",
    "........RRRR........",
    "......BBBBBBBB......",
    ".......WWWWWw.......",
    "......WW.WW.Ww......",
    "......WWWWOOOO......",
    ".......W.WW.w.......",
    "......RRRRRRRR......",
    ".....WWWWWWRRWw.....",
    "..K.WWWWWWWRRWWw.K..",
    "...KWWWWW.WWWWWwK...",
    "....WWWWWWWWWWWw....",
    "...WWWWWW.WWWWWww...",
    "...WWWWWWWWWWWWww...",
    "...WWWWWW.WWWWWww...",
    "....WWWWWWWWWWww....",
    ".....wWWWWWWWww.....",
    "..wwwwwwwwwwwwwwww..",
    "....................",
  ]);
}

function rena() {
  return arte([
    "....................",
    "..y..y........y..y..",
    "..yy.y........y.yy..",
    "...yyy........yyy...",
    "....yy........yy....",
    ".....yy......yy.....",
    "......KKKKKKKK......",
    ".....KKKKKKKKKK.....",
    "....KKK.KKKK.KKK....",
    ".....KKKKKKKKKK.....",
    "......KKKKKKKK......",
    "......SSSSSSSS......",
    ".......SSRRSS.......",
    ".......SRRRRS.......",
    "........SRRS........",
    ".........SS.........",
    ".......GGYYGG.......",
    "........GYYG........",
    "....................",
    "....................",
  ]);
}

function estrela() {
  return arte([
    ".........YY.........",
    ".W.......YY.........",
    ".........YY......W..",
    "...y.....YY.....y...",
    "....y....YY....y....",
    ".....Y..YYYY..Y.....",
    "......YYYYYYYY......",
    "yyYYYYYYWWYYYYYYYYyy",
    "yyYYYYYYWWYYYYYYYYyy",
    "......YYYYYYYY......",
    ".....Y..YYYY..Y.....",
    "....y....YY....y....",
    "...y.....YY.....y...",
    ".........YY.........",
    "..W......YY.........",
    ".........YY.........",
    ".........yy.......W.",
    ".........yy.........",
    ".........yy.........",
    "....................",
  ]);
}

function sino() {
  return arte([
    "....................",
    "......RR....RR......",
    ".....R..R..R..R.....",
    "......RR.RR.RR......",
    ".........RR.........",
    "........YYYY........",
    ".......YYYYYY.......",
    "......YWYYYYYy......",
    "......YWYYYYYy......",
    "......YWYYYYYy......",
    ".....YYWYYYYYYy.....",
    ".....YYYYYYYYYy.....",
    "....YYYYYYYYYYYy....",
    "...YYYYYYYYYYYYYy...",
    "..YYYYYYYYYYYYYYYy..",
    "..yyyyyyyyyyyyyyyy..",
    ".........YY.........",
    "........YYYY........",
    ".........YY.........",
    "....................",
  ]);
}

function presente() {
  return arte([
    "....................",
    "....................",
    ".....YYY....YYY.....",
    "....Y...Y..Y...Y....",
    "....Y....YY....Y....",
    ".....YYYYYYYYYY.....",
    "..RRRRRRRYYRRRRRRR..",
    "..RRRRRRRYYRRRRRRR..",
    "..rrrrrrrYYrrrrrrr..",
    "...RWRRRRYYRRRWRR...",
    "...RRRRWRYYRRRRRR...",
    "...RRRRRRYYRWRRRR...",
    "...YYYYYYYYYYYYYY...",
    "...RRWRRRYYRRRRWR...",
    "...RRRRRRYYRRRRRR...",
    "...RRRRWRYYRWRRRR...",
    "...RRRRRRYYRRRRRR...",
    "...rrrrrrYYrrrrrr...",
    "....................",
    "....................",
  ]);
}

function bengala() {
  const g = novaGrade();
  const forma = [
    "....................",
    "........XXXX........",
    "......XXXXXXXX......",
    ".....XXXX..XXXX.....",
    "....XXX......XXX....",
    "....XXX......XXX....",
    "....XXX......XXX....",
    ".....X.......XXX....",
    ".............XXX....",
    ".............XXX....",
    ".............XXX....",
    ".............XXX....",
    ".............XXX....",
    ".............XXX....",
    ".............XXX....",
    ".............XXX....",
    ".............XXX....",
    ".............XXX....",
    "..............X.....",
    "....................",
  ];
  forma.forEach((l, lin) =>
    Array.from(l).forEach((x, col) => {
      if (x === "X") ponto(g, col, lin, (col - lin + 40) % 4 < 2 ? "R" : "W");
    }),
  );
  // laço verde no cabo
  carimbar(g, ["GG...GG", "LGG.GGL", "..GRG..", "LGG.GGL", "GG...GG", ".G...G."], 11, 9);
  return g;
}

function meia() {
  return arte([
    "..............YY....",
    "......WWWWWWWWWY....",
    "......WWWWWWWWW.....",
    "......wWWWWWWWw.....",
    ".......RRRRRRR......",
    ".......RRRRRRR......",
    ".......GWGWGWG......",
    ".......RRRRRRR......",
    ".......RRRYRRR......",
    ".......RRYYYRR......",
    ".......RRRYRRR......",
    "......RRRRRRRR......",
    "....RRRRRRRRRR......",
    "..RRRRRRRRRRRGG.....",
    ".GRRRRRRRRRRRGG.....",
    ".GGRRRRRRRRRRG......",
    "..GGGRRRRRRR........",
    "....................",
    "....................",
    "....................",
  ]);
}

function guirlanda() {
  const g = novaGrade();
  const cx = 9.5;
  const cy = 9;
  pintar(g, (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    if (d < 4.6 || d > 8.6) return null;
    const ang = Math.atan2(y - cy, x - cx);
    return (Math.round(ang * 6) + Math.round(d)) % 3 === 0 ? "g" : (Math.round(ang * 4 + d) % 5 === 0 ? "L" : "G");
  });
  for (const [x, y] of [[5, 4], [14, 4], [2, 9], [17, 9], [9, 1], [5, 14], [14, 14], [3, 6], [16, 6]]) ponto(g, x, y, "R");
  for (const [x, y] of [[7, 2], [12, 2], [2, 12], [17, 12]]) ponto(g, x, y, "Y");
  carimbar(g, ["RR....RR", "RRR..RRR", ".RRRRRR.", "..RRRR..", ".RR..RR.", "RR....RR"], 6, 14);
  return g;
}

function floco() {
  const g = novaGrade();
  // braço de cima; os outros três saem girando 90° em volta do centro: (x, y) -> (19 - y, x)
  const braco = [];
  for (let y = 0; y <= 8; y++) braco.push([9, y, "W"], [10, y, "W"]);
  for (const y of [2, 5]) braco.push([8, y - 1, "C"], [7, y - 2, "C"], [11, y - 1, "C"], [12, y - 2, "C"]);
  for (let k = 1; k <= 5; k++) braco.push([10 + k, 9 - k, "C"]);
  braco.push([16, 3, "W"]);
  for (let volta = 0; volta < 4; volta++) {
    for (const p of braco) ponto(g, p[0], p[1], p[2]);
    for (const p of braco) [p[0], p[1]] = [19 - p[1], p[0]];
  }
  carimbar(g, [".CC.", "CWWC", "CWWC", ".CC."], 8, 8);
  return g;
}

function bola() {
  const g = novaGrade();
  disco(g, 9.5, 11.5, 7.6, "R");
  pintar(g, (x, y) => (g[y][x] && (y === 10 || y === 13) ? "Y" : null));
  pintar(g, (x, y) => (g[y][x] && y >= 11 && y <= 12 && (x + y) % 3 === 0 ? "W" : null));
  pintar(g, (x, y) => (g[y][x] && Math.hypot(x - 9.5, y - 11.5) > 6.6 && x + y > 22 ? "r" : null));
  carimbar(g, ["WW", "W.", "W."], 5, 6);
  carimbar(g, ["..YY..", ".YYYY.", "YYYYYY"], 7, 2);
  carimbar(g, [".yy.", "y..y"], 8, 0);
  return g;
}

function biscoito() {
  return arte([
    "....................",
    "........KKKK........",
    ".......KKKKKK.......",
    ".......K.KK.K.......",
    ".......KKWWKK.......",
    "........KKKK........",
    "..KKKKKKKKKKKKKKKK..",
    "..KWKKKKKKKKKKKKWK..",
    "......KKKKKKKK......",
    "......KKKRRKKK......",
    "......KKKKKKKK......",
    "......KKKGGKKK......",
    "......KKKKKKKK......",
    ".....KKKKKKKKKK.....",
    "....KKKK....KKKK....",
    "...KKKK......KKKK...",
    "...KWKK......KKWK...",
    "...KKK........KKK...",
    "....................",
    "....................",
  ]);
}

function vela() {
  return arte([
    "....................",
    ".........YY.........",
    "........YWWY........",
    ".......yYWWYy.......",
    "........YOOY........",
    ".........OO.........",
    ".........kk.........",
    ".......WWWWWW.......",
    ".......RWRRWR.......",
    ".......RWRRRR.......",
    ".......RPRRRR.......",
    ".......RPRRRr.......",
    ".......RPRRRr.......",
    ".......RPRRRr.......",
    ".......RRRRRr.......",
    ".......RRRRRr.......",
    "....GLGGRGGRGGLG....",
    ".....GGRGGGGRGG.....",
    "......GGGGGGGG......",
    "....................",
  ]);
}

function gorro() {
  return arte([
    "....................",
    "....................",
    "....................",
    "...............WWW..",
    "............RRWWWWW.",
    "..........RRRRRWWW..",
    "........RRRRRR......",
    ".......RRRRRRr......",
    "......RRRRRRRr......",
    ".....RRRRRRRRr......",
    ".....RRRRRRRRRr.....",
    "....RRRRRRRRRRr.....",
    "....RRRRRRRRRRRr....",
    "...RRRRRRRRRRRRRr...",
    "..WWWWWWWWWWWWWWWW..",
    "..WWWWWWWWWWWWWWWW..",
    "..wwwwwwwwwwwwwwww..",
    "....................",
    "....................",
    "....................",
  ]);
}

function azevinho() {
  return arte([
    "....................",
    "....................",
    "....................",
    "..G..............G..",
    ".GGG............GGG.",
    "..GGGG........GGGG..",
    ".GGLGGG......GGGLGG.",
    "..GGLGGG....GGGLGG..",
    "...GGLGGG..GGGLGG...",
    "..GGGGLGGGGGGLGGGG..",
    "....GGGLGGGGLGGG....",
    "......GGLGGLGG......",
    "........RR..RR......",
    ".......RWRRRWRR.....",
    ".......RRRRRRRR.....",
    "........RRRRRR......",
    ".........RWRR.......",
    ".........RRRR.......",
    "..........RR........",
    "....................",
  ]);
}

function anjo() {
  return arte([
    "......YYYYYYYY......",
    "....................",
    "........YYYY........",
    ".......YSSSSY.......",
    ".......Y.SS.Y.......",
    "........SSSS........",
    "..CC....WWWW....CC..",
    ".CCCC..WWWWWW..CCCC.",
    ".CCCCCSWWWWWWSCCCCC.",
    "..CCCCWWWWWWWWCCCC..",
    "...CCCWWWWWWWWCCC...",
    "....CCwWWWWWWwCC....",
    ".....wWWWWWWWWw.....",
    ".....wWWWWWWWWw.....",
    "....wWWWWWWWWWWw....",
    "....wWWWWWWWWWWw....",
    "...wWWWWWWWWWWWWw...",
    "...YYYYYYYYYYYYYY...",
    "....................",
    "....................",
  ]);
}

function presepio() {
  return arte([
    ".........YY.........",
    "........YWWY........",
    ".........YY.........",
    "........y..y........",
    "....................",
    ".........KK.........",
    "........KKKK........",
    ".......KK..KK.......",
    "......KK....KK......",
    ".....KK......KK.....",
    "....KK........KK....",
    "...KKKKKKKKKKKKKK...",
    "...K..BB....KK..K...",
    "...K..BS....SK..K...",
    "...K.BBBB..GGGG.K...",
    "...K.BBBB..GGGG.K...",
    "...K.BB.WSSW.GG.K...",
    "...K.BB.KKKK.GG.K...",
    "...K.BB.K..K.GG.K...",
    "..wwwwwwwwwwwwwwww..",
  ]);
}

function casinha() {
  return arte([
    "...............w....",
    "..............w.....",
    "..............KK....",
    ".........WW...KK....",
    "........WRRW..KK....",
    ".......WRRRRW.KK....",
    "......WRRRRRRWKK....",
    ".....WRRRRRRRRW.....",
    "....WRRRRRRRRRRW....",
    "...WRRRRRRRRRRRRW...",
    "..WWWWWWWWWWWWWWWW..",
    "....KKKKKKKKKKKK....",
    "....KYYKKKKKKYYK....",
    "....KYYKKKKKKYYK....",
    "....KKKKGGGGKKKK....",
    "....KKKKGGGGKKKK....",
    "....KKKKGGYGKKKK....",
    "....KKKKGGGGKKKK....",
    "WWwWWWWwWWWWWwWWWWwW",
    "....................",
  ]);
}

function felizNatal() {
  const { grade } = textoParaGrade("FELIZ\nNATAL", { fonte: "pequena", cor: CORES.R });
  pintar(grade, (x, y) => (y >= 10 && grade[y][x] ? "G" : null));
  for (const [x, y] of [[1, 1], [16, 1], [1, 16], [16, 16]]) carimbar(grade, ESTRELINHA, x, y);
  return grade;
}

export const DESENHOS_NATAL = [
  { id: "arvore", nome: "Árvore de Natal", criar: arvore },
  { id: "papai-noel", nome: "Papai Noel", criar: papaiNoel },
  { id: "boneco-neve", nome: "Boneco de neve", criar: bonecoNeve },
  { id: "rena", nome: "Rena do nariz vermelho", criar: rena },
  { id: "estrela", nome: "Estrela de Belém", criar: estrela },
  { id: "sino", nome: "Sino dourado", criar: sino },
  { id: "presente", nome: "Presente", criar: presente },
  { id: "bengala", nome: "Bengala doce", criar: bengala },
  { id: "meia", nome: "Meia de Natal", criar: meia },
  { id: "guirlanda", nome: "Guirlanda", criar: guirlanda },
  { id: "floco", nome: "Floco de neve", criar: floco },
  { id: "bola", nome: "Bola de Natal", criar: bola },
  { id: "biscoito", nome: "Biscoito de gengibre", criar: biscoito },
  { id: "vela", nome: "Vela acesa", criar: vela },
  { id: "gorro", nome: "Gorro do Noel", criar: gorro },
  { id: "azevinho", nome: "Azevinho", criar: azevinho },
  { id: "anjo", nome: "Anjo", criar: anjo },
  { id: "presepio", nome: "Presépio", criar: presepio },
  { id: "casinha", nome: "Casinha na neve", criar: casinha },
  { id: "feliz-natal", nome: "Feliz Natal", criar: felizNatal },
];

// ============================================================
//              ANIMAÇÕES — 20 cenas que rolam (MODE 03)
// ============================================================

const RENA_LADO = ["y.y...", ".yy...", "KKK...", "..KKKK", "..KKKK", "..K..K"];
const RENA_RUDOLPH = ["y.y...", ".yy...", "RKK...", "..KKKK", "..KKKK", "..K..K"];

function cenaTreno() {
  const g = novaGrade();
  for (const [x, y] of [[3, 1], [12, 0], [17, 2], [8, 3], [1, 17], [15, 17], [9, 18], [19, 15]]) ponto(g, x, y, "W");
  // Rudolph voando para a esquerda, com o nariz vermelho na frente
  carimbar(g, [".y.y...", "..yy...", ".KKK...", "RKKK...", "...KKKK", "...KKKK", "..K..K."], 0, 7);
  // rédea dourada até as mãos do Noel
  linha(g, 4, 10, 12, 10, "Y");
  carimbar(
    g,
    [
      "....RRW....",
      "...RRR.....",
      "...SS..KKK.",
      "...WW.KKKKK",
      "R..RRRRKKKK",
      "RRRRRRRRRRR",
      "RYYYYYYYYYR",
      ".RRRRRRRRR.",
      "..Y.....Y..",
      "YYYYYYYYYY.",
    ],
    9,
    5,
  );
  return g;
}

function cenaTrem() {
  const g = novaGrade();
  carimbar(g, ["..ww", ".w..", "ww.."], 1, 4);
  carimbar(
    g,
    [
      "..KK...RRR",
      "..KK...RYR",
      ".RRRRRRRRR",
      "YRRRRRRRRR",
      ".RRYRRRRRR",
      "..ww..ww..",
    ],
    0,
    7,
  );
  carimbar(g, [".BYB.", ".BBB.", "GGGGG", "GYGYG", "GGGGG", ".w.w."], 10, 7);
  carimbar(g, [".PYP.", ".PPP.", "BBBBB", "BYBYB", "BBBBB", ".w.w."], 15, 7);
  linha(g, 0, 13, 19, 13, "w");
  for (let x = 1; x < N; x += 3) ponto(g, x, 14, "k");
  for (const [x, y] of [[6, 1], [13, 2], [18, 0], [10, 17], [3, 18]]) ponto(g, x, y, "W");
  return g;
}

function cenaLuzes() {
  const g = novaGrade();
  const cores = ["R", "Y", "G", "B", "P"];
  for (const [base, fase] of [[4, 0], [13, Math.PI]]) {
    for (let x = 0; x < N; x++) {
      const y = Math.round(base + 1.6 * Math.sin((2 * Math.PI * x) / N + fase));
      ponto(g, x, y, "g");
      if (x % 4 === 1) {
        ponto(g, x, y + 1, "y");
        ponto(g, x, y + 2, cores[(x >> 2) % cores.length]);
        ponto(g, x, y + 3, cores[(x >> 2) % cores.length]);
      }
    }
  }
  return g;
}

function cenaBengala() {
  const g = novaGrade();
  for (let y = 7; y <= 12; y++) for (let x = 0; x < N; x++) ponto(g, x, y, (x + y) % 4 < 2 ? "R" : "W");
  for (let x = 0; x < N; x++) {
    ponto(g, x, 6, "G");
    ponto(g, x, 13, "G");
  }
  for (const [x, y] of [[2, 2], [10, 3], [16, 1], [6, 17], [14, 16]]) carimbar(g, FLOCO_P, x - 1, y - 1);
  return g;
}

function cenaFloresta() {
  const g = novaGrade();
  carimbar(g, [".YY.", "YY..", "YY..", ".YY."], 15, 1);
  for (const [x, y] of [[2, 1], [8, 3], [12, 0], [5, 5]]) ponto(g, x, y, "W");
  carimbar(g, PINHEIRO_ALTO, 0, 8, true);
  carimbar(g, PINHEIRO, 7, 12, true);
  carimbar(g, PINHEIRO_NEVE, 11, 10, true);
  carimbar(g, PINHEIRO, 17, 12, true);
  for (let x = 0; x < N; x++) {
    ponto(g, x, 18, x % 5 === 2 ? "w" : "W");
    ponto(g, x, 19, "w");
  }
  return g;
}

function cenaPresentes() {
  const g = novaGrade();
  carimbar(g, [".Y.Y.", "..Y..", "RRYRR", "RRYRR", "YYYYY", "RRYRR", "RRYRR"], 0, 12);
  carimbar(g, ["Y..Y", ".YY.", "GYGG", "YYYY", "GYGG", "GYGG"], 6, 13);
  carimbar(g, ["..W.W..", "...W...", "BBBWBBB", "BBBWBBB", "WWWWWWW", "BBBWBBB", "BBBWBBB", "BBBWBBB"], 11, 11);
  ponto(g, 19, 16, "M");
  ponto(g, 19, 17, "M");
  ponto(g, 19, 18, "M");
  for (let x = 0; x < N; x++) ponto(g, x, 19, "w");
  for (const [x, y] of [[3, 3], [9, 6], [15, 2], [18, 8]]) carimbar(g, FLOCO_P, x - 1, y - 1);
  return g;
}

function cenaNeve() {
  const g = novaGrade();
  carimbar(g, FLOCO, 1, 2);
  carimbar(g, FLOCO, 12, 10);
  carimbar(g, FLOCO_P, 9, 1);
  carimbar(g, FLOCO_P, 16, 4);
  carimbar(g, FLOCO_P, 4, 13);
  carimbar(g, FLOCO_P, 8, 7);
  for (const [x, y] of [[0, 9], [6, 0], [15, 0], [18, 15], [10, 18], [2, 18], [14, 8], [7, 16]]) ponto(g, x, y, "W");
  return g;
}

function cenaEstrelaCadente() {
  const g = novaGrade();
  carimbar(g, ["..Y..", ".YYY.", "YYWYY", ".YYY.", "Y...Y"], 1, 3);
  const cauda = ["Y", "Y", "Y", "O", "O", "O", "R", "R", "r", "r", "r", "r"];
  cauda.forEach((c, i) => {
    ponto(g, 6 + i, 5 + Math.floor(i / 4), c);
    if (i < 8) ponto(g, 6 + i, 4 + Math.floor(i / 4), i < 4 ? "y" : "r");
  });
  carimbar(g, [".Y.", "YWY", ".Y."], 9, 13);
  linha(g, 12, 14, 16, 15, "y");
  for (const [x, y] of [[4, 11], [17, 10], [14, 1], [2, 17], [18, 18]]) ponto(g, x, y, "W");
  return g;
}

function cenaBiscoitos() {
  const g = novaGrade();
  const boneco = [
    "...KKK....",
    "..KKKKK...",
    "..K.K.K...",
    "..KKWKK...",
    "...KKK....",
    "KKKKKKKKKK",
    "W.KKRKK..W",
    "..KKGKK...",
    "..KKKKK...",
    "..KK.KK...",
    ".KK...KK..",
    ".KW...WK..",
  ];
  carimbar(g, boneco, 0, 4, true);
  carimbar(g, boneco, 10, 4, true);
  return g;
}

function cenaSinos() {
  const g = novaGrade();
  for (let x = 0; x < N; x++) {
    const y = Math.round(2 + Math.sin((2 * Math.PI * x) / N));
    ponto(g, x, y, "G");
    ponto(g, x, y + 1, x % 3 === 0 ? "R" : "g");
  }
  const sinoP = ["..RR..", ".R..R.", "..YY..", ".YYYY.", ".YWYY.", "YYYYYY", "YYYYYY", "yyyyyy", "..YY.."];
  carimbar(g, sinoP, 2, 4);
  carimbar(g, sinoP, 12, 6);
  return g;
}

function cenaMeias() {
  const g = novaGrade();
  for (let x = 0; x < N; x++) ponto(g, x, 3, "w");
  const meiaP = (c, d) => ["Y.", ...[`WWWW.`, `WWWW.`, `.${c}${c}${c}.`, `.${c}${d}${c}.`, `.${c}${c}${c}.`, `${c}${c}${c}${c}.`, `${c}${c}${c}..`]];
  carimbar(g, meiaP("R", "W"), 1, 2);
  carimbar(g, meiaP("G", "R"), 8, 2);
  carimbar(g, meiaP("B", "W"), 15, 2);
  for (const [x, y] of [[4, 14], [11, 15], [18, 13], [6, 18], [13, 12]]) carimbar(g, FLOCO_P, x - 1, y - 1);
  return g;
}

function cenaBonecos() {
  const g = novaGrade();
  carimbar(
    g,
    [
      "..BBB..",
      "..BBB..",
      ".BBBBB.",
      "..WWW..",
      ".W.W.W.",
      ".WWOOO.",
      "..RRR..",
      ".WWWRW.",
      "WWW.WWW",
      "WWWWWWW",
      ".WW.WW.",
      ".WWWWW.",
    ],
    2,
    6,
  );
  carimbar(g, [".RRR.", "RRRRR", ".WWW.", ".W.W.", ".WOO.", "WWWWW", "WW.WW", ".WWW."], 12, 10);
  for (let x = 0; x < N; x++) {
    ponto(g, x, 18, "W");
    ponto(g, x, 19, "w");
  }
  for (const [x, y] of [[1, 1], [9, 2], [16, 4], [11, 0], [18, 8], [6, 3]]) ponto(g, x, y, "W");
  return g;
}

function cenaAurora() {
  const g = novaGrade();
  for (let x = 0; x < N; x++) {
    const a = 2 * Math.PI * (x / N);
    const y1 = Math.round(5 + 2.2 * Math.sin(a));
    const y2 = Math.round(8 + 2 * Math.sin(a + 1.4));
    ponto(g, x, y1 - 1, "M");
    ponto(g, x, y1, "G");
    ponto(g, x, y1 + 1, "L");
    ponto(g, x, y2, "C");
    ponto(g, x, y2 + 1, "G");
  }
  carimbar(g, PINHEIRO, 1, 14, true);
  carimbar(g, PINHEIRO, 13, 14, true);
  carimbar(g, ["...g...", "..ggg..", ".ggggg.", "ggggggg"], 6, 16, true);
  for (let x = 0; x < N; x++) ponto(g, x, 19, "w");
  for (const [x, y] of [[3, 0], [11, 1], [17, 0], [8, 13], [16, 12]]) ponto(g, x, y, "W");
  return g;
}

function cenaVila() {
  const g = novaGrade();
  const casa = (paredes, telhado) => [
    `...W....`,
    `..W${telhado}W...`,
    `.W${telhado}${telhado}${telhado}W..`,
    `W${telhado}${telhado}${telhado}${telhado}${telhado}W.`,
    `WWWWWWW.`,
    `.${paredes}YY${paredes}${paredes}${paredes}.`,
    `.${paredes}YY${paredes}YY.`,
    `.${paredes}${paredes}${paredes}${paredes}YY.`,
  ];
  carimbar(g, casa("K", "R"), 0, 9);
  carimbar(g, casa("y", "B"), 11, 8);
  carimbar(g, PINHEIRO, 7, 11);
  carimbar(g, ["w.", ".w", "w."], 15, 4);
  for (let x = 0; x < N; x++) {
    ponto(g, x, 17, "W");
    ponto(g, x, 18, x % 4 === 1 ? "W" : "w");
  }
  for (const [x, y] of [[2, 2], [8, 1], [18, 3], [12, 0], [5, 5]]) ponto(g, x, y, "W");
  return g;
}

function cenaFita() {
  const g = novaGrade();
  for (let x = 0; x < N; x++) {
    const a = (2 * Math.PI * x) / N;
    const y1 = Math.round(9.5 + 5 * Math.sin(a));
    const y2 = Math.round(9.5 - 5 * Math.sin(a));
    const frente = Math.cos(a) > 0;
    for (const [y, c] of frente ? [[y2, "Y"], [y1, "R"]] : [[y1, "R"], [y2, "Y"]]) {
      ponto(g, x, y, c);
      ponto(g, x, y + 1, c === "R" ? "r" : "y");
    }
  }
  return g;
}

function cenaHoHoHo() {
  const g = novaGrade();
  const H = ["RR...RR", "RR...RR", "RR...RR", "RR...RR", "RRRRRRR", "RRRRRRR", "RR...RR", "RR...RR", "RR...RR", "RR...RR"];
  const O = [".WWWWW.", "WW...WW", "WW...WW", "WW...WW", "WW...WW", "WW...WW", "WW...WW", "WW...WW", "WW...WW", ".WWWWW."];
  carimbar(g, H, 1, 5);
  carimbar(g, O, 10, 5);
  carimbar(g, ESTRELINHA, 17, 1);
  carimbar(g, ESTRELINHA, 17, 16);
  return g;
}

function cenaVelas() {
  const g = novaGrade();
  const vela = (c) => ["..Y..", ".YOY.", "..O..", "..k..", ".WWW.", `.${c}${c}${c}.`, `.${c}${c}${c}.`, `.${c}${c}${c}.`, `.${c}${c}${c}.`];
  ["M", "M", "P", "M"].forEach((c, i) => carimbar(g, vela(c), i * 5, 4 + (i % 2)));
  for (let x = 0; x < N; x++) {
    ponto(g, x, 14, x % 5 === 2 ? "R" : "G");
    ponto(g, x, 15, x % 3 === 0 ? "L" : "G");
    ponto(g, x, 16, "g");
  }
  return g;
}

function cenaBolas() {
  const g = novaGrade();
  const bola = (c, s) => ["..Y..", ".YYY.", `.${c}${c}${c}.`, `${c}W${c}${c}${s}`, `${c}${c}${c}${c}${s}`, `${c}${c}${c}${c}${s}`, `.${s}${s}${s}.`];
  for (const [x, comp, c, s] of [[1, 3, "R", "r"], [6, 8, "B", "b"], [11, 2, "Y", "y"], [16, 6, "M", "b"]]) {
    linha(g, x + 2, 0, x + 2, comp - 1, "w");
    carimbar(g, bola(c, s), x, comp);
  }
  for (const [x, y] of [[4, 15], [9, 18], [14, 13], [19, 17], [1, 18]]) ponto(g, x, y, "W");
  return g;
}

function cenaReisMagos() {
  const g = novaGrade();
  carimbar(g, ["..Y..", ".YWY.", "YWWWY", ".YWY.", "..Y.."], 0, 0);
  linha(g, 5, 2, 9, 3, "y");
  // camelo com o rei montado, indo para a esquerda (atrás da estrela)
  carimbar(
    g,
    [
      "......Y.Y....",
      "......YYY....",
      "......MSM....",
      ".KK...MMM....",
      "KKKK.MMMMM...",
      "..KK.KKKKKKK.",
      "..KKKKKKKKKKK",
      "...KKKKKKKKK.",
      "....K.K..K.K.",
      "....K.K..K.K.",
      "...KK.KK.KK.K",
    ],
    1,
    6,
  );
  // segundo rei, a pé
  carimbar(g, ["Y.Y", "YYY", "BSB", "BBB", "BBB", "BBB", "B.B"], 16, 10);
  for (let x = 0; x < N; x++) ponto(g, x, 17, x % 3 === 0 ? "Y" : "y");
  return g;
}

function cenaRenaCorrendo() {
  const g = novaGrade();
  carimbar(
    g,
    [
      ".y..y.........",
      "..yyy.........",
      "...yy.........",
      "..KKK.........",
      ".KK.K.........",
      "RKKKKK........",
      "..KKKKKKKKKKK.",
      "...KKKKKKKKKKK",
      "...KKKKKKKKKK.",
      "..KK.K....KK..",
      ".KK..K....K.K.",
      ".K...K...K...K",
    ],
    1,
    4,
  );
  carimbar(g, ["GYG"], 4, 10);
  for (const [x, y] of [[16, 9], [17, 11], [16, 13]]) linha(g, x, y, x + 2, y, "w");
  for (const [x, y] of [[3, 1], [12, 2], [18, 1], [8, 18], [16, 18]]) ponto(g, x, y, "W");
  return g;
}

export const ANIMACOES_NATAL = [
  { id: "treno", nome: "Trenó do Papai Noel", criar: cenaTreno },
  { id: "trem", nome: "Trem de Natal", criar: cenaTrem },
  { id: "pisca-pisca", nome: "Pisca-pisca", criar: cenaLuzes },
  { id: "faixa-bengala", nome: "Faixa de bengala", criar: cenaBengala },
  { id: "floresta", nome: "Floresta nevada", criar: cenaFloresta },
  { id: "presentes", nome: "Fila de presentes", criar: cenaPresentes },
  { id: "nevasca", nome: "Nevasca", criar: cenaNeve },
  { id: "estrela-cadente", nome: "Estrela cadente", criar: cenaEstrelaCadente },
  { id: "biscoitos", nome: "Biscoitos de mãos dadas", criar: cenaBiscoitos },
  { id: "sinos", nome: "Sinos na guirlanda", criar: cenaSinos },
  { id: "meias", nome: "Meias no varal", criar: cenaMeias },
  { id: "bonecos", nome: "Bonecos de neve", criar: cenaBonecos },
  { id: "aurora", nome: "Aurora de Natal", criar: cenaAurora },
  { id: "vila", nome: "Vila de Natal", criar: cenaVila },
  { id: "fita", nome: "Fita de presente", criar: cenaFita },
  { id: "ho-ho-ho", nome: "Ho ho ho", criar: cenaHoHoHo },
  { id: "velas", nome: "Velas do Advento", criar: cenaVelas },
  { id: "bolas", nome: "Bolas penduradas", criar: cenaBolas },
  { id: "reis-magos", nome: "Reis Magos", criar: cenaReisMagos },
  { id: "rena-correndo", nome: "Rena correndo", criar: cenaRenaCorrendo },
];
