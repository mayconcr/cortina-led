// Animações de Natal COM MOVIMENTO (quadro a quadro), no estilo do trenó guardado na cortina (`ANIM 0E`):
// não é só rolar para o lado — pernas galopam, chamas tremulam, braços acenam, luzes correm.
//
// Cada animação é uma lista de grades 20×20 em loop. Na cortina, só os LEDs que mudam de um quadro para
// o outro vão pelo Bluetooth (~32 ms cada; ver animacao.js). Por isso cada cena separa o FUNDO PARADO das
// PARTES QUE SE MEXEM e muda poucos LEDs por quadro (alvo: até ~12), para rodar a 3–6 quadros/s.
// Testes: tests/natal-movimento.test.mjs

import { FONTES } from "./fonte.js";
import { N, anel, carimbar, linha, novaGrade, ponto, retangulo } from "./pixelart.js";

/** Cria `n` quadros: f(g, t) desenha o quadro t numa grade nova. */
const quadros = (n, f) =>
  Array.from({ length: n }, (_, t) => {
    const g = novaGrade();
    f(g, t);
    return g;
  });

/** Vários pontos da mesma cor. */
const pontos = (g, lista, c) => lista.forEach(([x, y]) => ponto(g, x, y, c));

/** Pontos que só acendem onde está apagado (estrelas e neve passam "atrás" dos desenhos). */
const atras = (g, lista, c) => lista.forEach(([x, y]) => x >= 0 && x < N && y >= 0 && y < N && !g[y][x] && ponto(g, x, y, c));

const mod = (a, n) => ((a % n) + n) % n;

// ============================================================
// 1. Trenó do Papai Noel — recriação do ANIM 0E: o trenó "voa no lugar" (câmera seguindo o Noel):
//    a rena galopa (4 poses), o nariz pisca, o Noel acena e as estrelas passam para trás.
// ============================================================

const RENA_P = [
  "..y..y...",
  "..yy.y...",
  "...yyy...",
  "...KK....",
  "RKKKK....",
  "...KKKKKK",
  "..KKKKKKK",
  "...KKKKKK",
];
const PERNAS_P = [
  ["..K....K.", ".K......K"],
  ["...K...K.", "..K....K."],
  ["...K..K..", "...K..K.."],
  ["...K...K.", "...K....K"],
];

function treno() {
  const estrelas = [[15, 2], [3, 16], [10, 0]];
  return quadros(20, (g, t) => {
    // trenó com o Noel (embaixo, à direita)
    carimbar(
      g,
      [
        ".....RRW....",
        "....RRRR....",
        "....SSS.KKK.",
        "....WWW.KKKK",
        "R...RRRRKKKK",
        "RR..RRRRRKKK",
        "RRRRRRRRRRRR",
        "RYYYYYYYYYYR",
        ".RRRRRRRRRR.",
        "YYYYYYYYYYY.",
      ],
      8,
      9,
    );
    // a rena voando na frente (em cima, à esquerda), galopando
    carimbar(g, RENA_P, 0, 1);
    carimbar(g, PERNAS_P[t % 4], 0, 9);
    ponto(g, 0, 5, t % 2 ? "R" : "O");
    linha(g, 8, 8, 11, 11, "Y");
    // o Noel acena de tempos em tempos
    if (t % 8 < 4) pontos(g, [[11, 12], [11, 11]], "R"), ponto(g, 11, 10, "W");
    else pontos(g, [[11, 13], [10, 13]], "R"), ponto(g, 9, 13, "W");
    // estrelas passando para trás (uma coluna a cada 2 quadros)
    atras(g, estrelas.map(([x, y]) => [mod(x - Math.floor(t / 2), N), y]), "W");
  });
}

// ============================================================
// 2. Rena galopando: rena grande correndo no lugar; marcas no chão passam para trás.
// ============================================================

function renaGalopando() {
  const corpo = [
    ".y..y.......",
    ".yy.yy......",
    "..yyy.......",
    "..KKK.......",
    ".KKSK.......",
    "RKKKK.......",
    "...KKKKKKKKK",
    "...KKKKKKKKK",
    "...KKWKKKKK.",
    "...K.....K..",
  ];
  // parte de cima das pernas fica parada; a de baixo galopa (esticada, embaixo, dobrada, alcançando)
  const pernas = [
    ["..K.......K.", ".K.........K"],
    ["...K.....K..", "...K.....K.."],
    ["....K...K...", "....K...K..."],
    ["..K.....K...", "..K....K...."],
  ];
  return quadros(8, (g, t) => {
    carimbar(g, corpo, 4, 3);
    carimbar(g, pernas[t % 4], 4, 13);
    ponto(g, 4, 8, t % 2 ? "R" : "O");
    retangulo(g, 0, 16, 19, 16, "W");
    ponto(g, mod(6 - 2 * t, N), 16, "w");
    pontos(g, [[17, 1], [2, 2]], t % 4 < 2 ? "W" : "w");
  });
}

// ============================================================
// 3. Árvore com pisca-pisca: metade das luzes troca de cor a cada quadro; a estrela cintila.
// ============================================================

const ARVORE = [
  ".........GG.........",
  "........GGGG........",
  ".......GGGGGG.......",
  "......GGGGGGGG......",
  "........GGGG........",
  ".......GGGGGG.......",
  "......GGGGGGGG......",
  ".....GGGGGGGGGG.....",
  ".......GGGGGG.......",
  "......GGGGGGGG......",
  ".....GGGGGGGGGG.....",
  "....GGGGGGGGGGGG....",
  "...GGGGGGGGGGGGGG...",
  ".........KK.........",
  "........KKKK........",
];

function arvorePisca() {
  const luzes = [[9, 4], [7, 6], [11, 7], [8, 9], [12, 10], [6, 10], [10, 12], [5, 14], [14, 14], [8, 15]];
  const cores = ["R", "Y", "B", "F"];
  return quadros(8, (g, t) => {
    carimbar(g, ARVORE, 0, 3);
    luzes.forEach(([x, y], i) => ponto(g, x, y + 1, cores[mod(i + Math.floor((t + (i % 2)) / 2), cores.length)]));
    carimbar(g, [".Y.", "YVY", ".Y."], 8, 0);
    ponto(g, 9, 1, t % 2 ? "W" : "V");
  });
}

// ============================================================
// 4. Vela com a chama tremulando (5 formas) e um brilho que vai e volta.
// ============================================================

function velaChama() {
  const chamas = [
    ["..Y..", ".YVY.", ".YVY.", "..O.."],
    [".Y...", ".YVY.", "..VY.", "..O.."],
    ["...Y.", ".YVY.", ".YV..", "..O.."],
    ["..Y..", "..VY.", ".YVY.", "..O.."],
    ["..Y..", ".YV..", ".YVY.", "..O.."],
  ];
  return quadros(10, (g, t) => {
    carimbar(g, chamas[[0, 1, 0, 2, 3, 0, 4, 1, 0, 2][t]], 8, 2);
    ponto(g, 10, 6, "k");
    retangulo(g, 8, 7, 12, 16, "R");
    pontos(g, [[9, 7], [9, 8], [9, 9], [12, 7]], "W");
    pontos(g, [[8, 8], [8, 9], [8, 10], [8, 11]], "P");
    carimbar(g, ["GGLGGRGGLGG", ".GGGRGGGG..", "..GGGGGGG.."], 5, 17);
    if (t % 3 === 0) pontos(g, [[6, 4], [14, 3]], "y");
  });
}

// ============================================================
// 5. Lareira acesa: o corpo do fogo fica, as pontas das chamas dançam e sobem faíscas.
// ============================================================

function lareira() {
  const pontas = [
    [[6, 11, "O"], [9, 10, "Y"], [12, 11, "O"], [7, 12, "Y"], [11, 12, "Y"]],
    [[7, 11, "O"], [10, 10, "Y"], [13, 12, "O"], [8, 12, "Y"], [12, 12, "Y"]],
    [[6, 12, "O"], [9, 11, "Y"], [11, 10, "O"], [8, 11, "Y"], [12, 11, "Y"]],
  ];
  return quadros(9, (g, t) => {
    retangulo(g, 2, 4, 17, 5, "K");
    retangulo(g, 3, 6, 4, 17, "w");
    retangulo(g, 15, 6, 16, 17, "w");
    retangulo(g, 3, 6, 16, 6, "w");
    linha(g, 1, 3, 18, 3, "R");
    pontos(g, [[3, 3], [7, 3], [11, 3], [15, 3]], "G");
    carimbar(g, [".OYYOOYYO.", "OYVYYYYVYO", "YYVYYYYVYY"], 5, 13);
    pontas[t % 3].forEach(([x, y, c]) => ponto(g, x, y, c));
    retangulo(g, 5, 16, 14, 16, "k");
    retangulo(g, 2, 18, 17, 18, "K");
    ponto(g, 8 + (t % 2), 9 - (t % 3), "Y");
  });
}

// ============================================================
// 6. Boneco de neve acenando com o galho, piscando, com neve caindo.
// ============================================================

function bonecoAcenando() {
  const flocos = [[2, 0], [17, 6], [14, 11]];
  return quadros(16, (g, t) => {
    carimbar(
      g,
      [
        "....BBBB....",
        "....BBBB....",
        "....RRRR....",
        "..BBBBBBBB..",
        "...WWWWWW...",
        "..WW.WW.WW..",
        "..WWWWOOO...",
        "...W.WW.W...",
        "..RRRRRRRR..",
        ".WWWWWWRRWW.",
        "WWWWWWWRRWWW",
        "WWWWW.WWWWWW",
        "WWWWWWWWWWWW",
        ".WWWW.WWWWW.",
        "..WWWWWWWW..",
      ],
      4,
      3,
    );
    linha(g, 4, 13, 1, 11, "K");
    const bracos = [
      [[16, 12], [17, 11], [18, 10]],
      [[16, 12], [17, 12], [18, 12]],
      [[16, 12], [17, 13], [18, 14]],
    ];
    pontos(g, bracos[[0, 1, 2, 1][t % 4]], "K");
    if (t === 9) pontos(g, [[8, 8], [11, 8]], "W");
    atras(g, flocos.map(([x, y]) => [x, mod(y + t, 16)]), "W");
    retangulo(g, 0, 18, 19, 18, "W");
    retangulo(g, 0, 19, 19, 19, "w");
  });
}

// ============================================================
// 7. Papai Noel acenando: a luva sobe e desce ao lado do rosto e ele dá uma piscadinha.
// ============================================================

function noelAcenando() {
  return quadros(8, (g, t) => {
    carimbar(
      g,
      [
        "..........WW..",
        ".......RRRWW..",
        ".....RRRRRR...",
        "....RRRRRRRR..",
        "..WWWWWWWWWWWW",
        "...SSSSSSSSSS.",
        "...SS.SSSS.SS.",
        "...SPSSRRSSPS.",
        "..WWWWWWWWWWWW",
        "..WWWWWRRWWWWW",
        "..wWWWWWWWWWWw",
        "...wWWWWWWWWw.",
        "....wWWWWWWw..",
        ".....wWWWWw...",
        "......wWWw....",
      ],
      3,
      2,
    );
    if (t === 5) ponto(g, 13, 8, "S");
    const maos = [
      [[1, 6], [2, 6], [1, 7], [2, 7]],
      [[1, 8], [2, 8], [1, 9], [2, 9]],
      [[1, 10], [2, 10], [1, 11], [2, 11]],
      [[1, 8], [2, 8], [1, 9], [2, 9]],
    ];
    pontos(g, maos[t % 4], "W");
    pontos(g, [[2, 12], [3, 12]], "R");
  });
}

// ============================================================
// 8. Presente surpresa: a caixa fica, saem estrelinhas em leque e um brilho corre pela fita.
// ============================================================

function presenteSurpresa() {
  return quadros(10, (g, t) => {
    retangulo(g, 4, 11, 15, 12, "R");
    retangulo(g, 5, 13, 14, 19, "R");
    retangulo(g, 9, 11, 10, 19, "Y");
    retangulo(g, 4, 12, 15, 12, "r");
    pontos(g, [[6, 15], [12, 17], [7, 18], [13, 14]], "W");
    carimbar(g, ["YY..YY", "Y.YY.Y", ".YYYY."], 7, 8);
    const k = t % 5;
    if (k > 0) {
      const d = 2 * k;
      pontos(g, [[9 - d, 8 - d]], "Y");
      pontos(g, [[10 + d, 8 - d]], "C");
      pontos(g, [[9, 7 - d], [10, 7 - d]], k === 4 ? "W" : "V");
    }
    ponto(g, 9 + (t % 2), 13 + (t % 6), "W");
  });
}

// ============================================================
// 9. Sino balançando: só a parte de baixo do sino vai e volta; badalo e "ondas do som".
// ============================================================

function sinoBalancando() {
  const cima = ["...YYY...", "..YYYYY..", "..YWYYY.."];
  const baixo = {
    c: [".YYWYYYY.", ".YYYYYYY.", ".yyyyyyy."],
    e: ["YYWYYYY..", "YYYYYYY..", "yyyyyyy.."],
    d: ["..YYWYYYY", "..YYYYYYY", "..yyyyyyy"],
  };
  const seq = ["c", "e", "c", "d"];
  return quadros(8, (g, t) => {
    carimbar(g, ["RR...RR", "R.R.R.R", ".RRRRR.", "...R..."], 6, 1);
    ponto(g, 9, 5, "Y");
    carimbar(g, cima, 5, 6);
    const p = seq[t % 4];
    carimbar(g, baixo[p], 5, 9);
    ponto(g, p === "e" ? 10 : p === "d" ? 8 : 9, 12, "Y");
    if (p === "e") pontos(g, [[3, 8], [2, 10]], "C");
    if (p === "d") pontos(g, [[16, 8], [17, 10]], "C");
  });
}

// ============================================================
// 10. Estrela cadente: atravessa o céu na diagonal deixando um rastro.
// ============================================================

function estrelaCadente() {
  const ceu = [[2, 3], [15, 2], [6, 15], [17, 13], [11, 18]];
  return quadros(14, (g, t) => {
    ceu.forEach(([x, y], i) => ponto(g, x, y, (t + i) % 4 === 0 ? "Y" : "w"));
    const x = 22 - 2 * t;
    const y = -2 + t;
    for (let k = 3; k >= 1; k--) ponto(g, x + 2 * k, y - k, k > 2 ? "r" : "O");
    carimbar(g, [".Y.", "YWY", ".Y."], x - 1, y - 1);
  });
}

// ============================================================
// 11. Neve caindo em camadas: flocos rápidos e lentos sobre pinheiros nevados.
// ============================================================

function neveCaindo() {
  const rapidos = [[2, 0], [9, 5], [16, 10], [12, 13]];
  const lentos = [[5, 3], [14, 1], [18, 8], [7, 11]];
  return quadros(32, (g, t) => {
    carimbar(g, ["..W..", ".WGW.", ".GGG.", "WGGGW", "GGGGG", "..K.."], 1, 12);
    carimbar(g, ["...W...", "..WGW..", "..GGG..", ".WGGGW.", ".GGGGG.", "WGGGGGW", "..KKK.."], 11, 11);
    retangulo(g, 0, 18, 19, 18, "W");
    retangulo(g, 0, 19, 19, 19, "w");
    atras(g, rapidos.map(([x, y]) => [x, mod(y + t, 16)]), "W");
    atras(g, lentos.map(([x, y]) => [x, mod(y + Math.floor(t / 2), 16)]), "C");
  });
}

// ============================================================
// 12. Biscoito dançando: braços sobem e descem alternados e as pernas chutam.
// ============================================================

function biscoitoDancando() {
  return quadros(8, (g, t) => {
    carimbar(
      g,
      [
        "....KKKK....",
        "...KKKKKK...",
        "...K.KK.K...",
        "...KKWWKK...",
        "....KKKK....",
        "...KKKKKK...",
        "...KKRRKK...",
        "...KKKKKK...",
        "...KKGGKK...",
        "...KKKKKK...",
        "...KK..KK...",
      ],
      4,
      3,
    );
    // braços trocam nos quadros pares, pernas nos ímpares (assim muda pouco de cada vez)
    const bracos = Math.floor(t / 2) % 2;
    const pernas = Math.floor((t + 1) / 2) % 2;
    const esq = bracos ? [[6, 8], [5, 7], [4, 6]] : [[6, 8], [5, 9], [4, 10]];
    const dir = bracos ? [[13, 8], [14, 9], [15, 10]] : [[13, 8], [14, 7], [15, 6]];
    pontos(g, esq, "K");
    pontos(g, dir, "K");
    ponto(g, ...esq.at(-1), "W");
    ponto(g, ...dir.at(-1), "W");
    pontos(g, pernas ? [[6, 14], [5, 15]] : [[7, 14], [7, 15]], "K");
    pontos(g, pernas ? [[12, 14], [12, 15]] : [[12, 14], [13, 15]], "K");
    retangulo(g, 2, 17, 17, 17, "y");
  });
}

// ============================================================
// 13. Pinguim bamboleando: nadadeiras sobem e descem, pés alternam e o pompom do gorro balança.
// ============================================================

function pinguim() {
  return quadros(8, (g, t) => {
    carimbar(
      g,
      [
        "...RRRR.....",
        "..RRRRRR....",
        ".WWWWWWWW...",
        "..BBBBBB....",
        ".BBWWWWBB...",
        ".BW.WW.WB...",
        ".BWWOOWWB...",
        ".BWWWWWWB...",
        ".BWWWWWWB...",
        ".BWWWWWWB...",
        "..BWWWWB....",
        "..BBBBBB....",
        "..OO..OO....",
      ],
      5,
      4,
    );
    const p = t % 4;
    ponto(g, p < 2 ? 13 : 12, p < 2 ? 4 : 3, "W");
    pontos(g, p % 2 ? [[5, 10], [4, 11]] : [[5, 11], [5, 12]], "B");
    pontos(g, p % 2 ? [[14, 11], [14, 12]] : [[14, 10], [15, 11]], "B");
    retangulo(g, 0, 17, 19, 17, "C");
    pontos(g, [[2, 2], [17, 1]], t % 4 < 2 ? "W" : "w");
  });
}

// ============================================================
// 14. Guirlanda de luzes: as luzinhas em volta trocam de cor em sequência, em dois grupos.
// ============================================================

function guirlandaLuzes() {
  const cores = ["R", "Y", "W", "B"];
  const luzes = [];
  for (let k = 0; k < 10; k++) {
    const a = (2 * Math.PI * k) / 10 - Math.PI / 2;
    luzes.push([Math.round(9.5 + Math.cos(a) * 6.6), Math.round(9 + Math.sin(a) * 6.6)]);
  }
  return quadros(8, (g, t) => {
    anel(g, 9.5, 9, 5, 8.4, "G");
    anel(g, 9.5, 9, 5, 5.6, "g");
    luzes.forEach(([x, y], i) => ponto(g, x, y, cores[mod(i + Math.floor((t + (i % 2)) / 2), cores.length)]));
    carimbar(g, ["RR....RR", "RRR..RRR", ".RRRRRR.", "..RRRR..", ".RR..RR.", "RR....RR"], 6, 14);
  });
}

// ============================================================
// 15. Bengala listrada girando: as listras correm pela bengala (como poste de barbearia).
// ============================================================

function bengalaGirando() {
  const caminho = [[6, 6], [6, 5], [6, 4], [7, 3], [8, 2], [9, 2], [10, 2], [11, 2], [12, 3], [13, 4], [13, 5], [13, 6]];
  for (let y = 7; y <= 18; y++) caminho.push([13, y]);
  return quadros(4, (g, t) => {
    caminho.forEach(([x, y], i) => {
      ponto(g, x, y, mod(i - t, 4) < 2 ? "R" : "W");
      ponto(g, x + 1, y + (y < 4 ? 1 : 0), "r");
    });
    carimbar(g, ["GG.GG", "LGRGL", "GG.GG"], 11, 9);
  });
}

// ============================================================
// 16. Estrela de Belém pulsando: os raios crescem e encolhem, como se respirasse.
// ============================================================

function estrelaBelem() {
  const tamanhos = [3, 4, 5, 6, 5, 4];
  return quadros(6, (g, t) => {
    const r = tamanhos[t];
    carimbar(g, ["WV", "VW"], 9, 7);
    for (let d = 2; d <= r; d++) {
      pontos(g, [[9, 8 - d], [10, 8 - d], [9 - d + 1, 7], [10 + d - 1, 8]], "Y");
    }
    pontos(g, [[8, 8], [11, 7]], "Y");
    for (let d = 1; d <= 2; d++) pontos(g, [[9 - d, 7 - d], [10 + d, 7 - d], [9 - d, 8 + d], [10 + d, 8 + d]], "V");
    for (let y = 9; y <= 18; y++) ponto(g, 9 + (y % 2), y, y < 13 ? "Y" : y < 16 ? "O" : "y");
    if (t % 3 === 0) pontos(g, [[2, 3], [17, 15], [16, 2]], "W");
  });
}

// ============================================================
// 17. Anjo batendo asas: as pontas das asas sobem e descem e a auréola cintila.
// ============================================================

function anjoAsas() {
  return quadros(6, (g, t) => {
    carimbar(
      g,
      [
        "......YYYYYYYY......",
        "....................",
        "........YYYY........",
        ".......YSSSSY.......",
        ".......Y.SS.Y.......",
        "........SSSS........",
        "...CC...WWWW...CC...",
        "..CCCC.WWWWWW.CCCC..",
        "..CCCCSWWWWWWSCCCC..",
        "...CCCWWWWWWWWCCC...",
        "....CCWWWWWWWWCC....",
        ".....wWWWWWWWWw.....",
        ".....wWWWWWWWWw.....",
        "....wWWWWWWWWWWw....",
        "....wWWWWWWWWWWw....",
        "...wWWWWWWWWWWWWw...",
        "...YYYYYYYYYYYYYY...",
      ],
      0,
      2,
    );
    const p = [0, 1, 2, 1, 0, 1][t];
    const y = 6 + p;
    pontos(g, [[1, y], [0, y + 1], [18, y], [19, y + 1]], "C");
    ponto(g, 6 + (t % 4) * 2, 2, "W");
  });
}

// ============================================================
// 18. Chocolate quente: fios de vapor sobem serpenteando e o marshmallow boia.
// ============================================================

function chocolateQuente() {
  return quadros(8, (g, t) => {
    carimbar(
      g,
      [
        "RRRRRRRRRRR....",
        "RWRRRRRRRRRRRR.",
        "RRRRWRRRRRR..RR",
        "RRRRRRRRRRR..RR",
        "RRRWRRRRWRR..RR",
        "RRRRRRRRRRRRRR.",
        "RRRRRRRRRRR....",
        ".RRRRRRRRR.....",
      ],
      2,
      10,
    );
    retangulo(g, 3, 9, 11, 9, "K");
    pontos(g, [[5, 9], [8, 9]], "W");
    retangulo(g, 1, 18, 15, 18, "w");
    for (const [x0, fase] of [[5, 0], [9, 4]]) {
      for (let k = 0; k < 2; k++) {
        const s = mod(t + fase + k * 4, 8);
        ponto(g, x0 + (s % 4 < 2 ? 0 : 1), 8 - s, "w");
      }
    }
  });
}

// ============================================================
// 19. Bolas brilhando: três bolas penduradas com um reflexo que gira em cada uma.
// ============================================================

function bolasBrilhando() {
  const bolas = [[4, 6, "R", "r"], [10, 10, "B", "b"], [15, 5, "M", "b"]];
  const giro = [[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 0]];
  return quadros(10, (g, t) => {
    for (const [cx, cy, c, s] of bolas) {
      linha(g, cx, 0, cx, cy - 3, "w");
      carimbar(g, [".Y.", "YYY"], cx - 1, cy - 3);
      carimbar(g, [`.${c}${c}${c}.`, `${c}${c}${c}${c}${s}`, `${c}${c}${c}${c}${s}`, `.${s}${s}${s}.`], cx - 2, cy - 1);
    }
    bolas.forEach(([cx, cy], i) => {
      const [dx, dy] = giro[mod(t + i * 2, giro.length)];
      ponto(g, cx + dx, cy + dy, "W");
    });
    ponto(g, 8 + (t % 3) * 3, 17, t % 2 ? "Y" : "V");
  });
}

// ============================================================
// 20. Elfo martelando: o martelo sobe e bate no presente, soltando faíscas.
// ============================================================


// ============================================================
// 21. Casinha acendendo: as janelas acendem uma a uma, sai fumaça e depois apaga tudo.
// ============================================================

function casinhaAcendendo() {
  const janelas = [
    [[5, 12], [6, 12], [5, 13], [6, 13]],
    [[13, 12], [14, 12], [13, 13], [14, 13]],
    [[10, 16]],
  ];
  return quadros(14, (g, t) => {
    carimbar(
      g,
      [
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
        "....KyyKKKKKKyyK....",
        "....KyyKKKKKKyyK....",
        "....KKKKGGGGKKKK....",
        "....KKKKGGGGKKKK....",
        "....KKKKGGyGKKKK....",
        "....KKKKGGGGKKKK....",
      ],
      0,
      3,
    );
    const acesas = t < 7 ? Math.min(3, t) : Math.max(0, 10 - t);
    for (let j = 0; j < acesas; j++) pontos(g, janelas[j], "Y");
    if (t >= 3 && t <= 9) ponto(g, 15 + ((t - 3) % 2), 2 - Math.min(2, t - 3) + 2, "w");
    retangulo(g, 0, 19, 19, 19, "W");
  });
}

// ============================================================
// 22. Trenzinho na árvore: o trem de brinquedo dá a volta no trilho, soltando fumaça.
// ============================================================

function trenzinho() {
  return quadros(40, (g, tt) => {
    const t = Math.floor(tt / 2);
    carimbar(g, ARVORE.slice(0, 13), 0, -1);
    retangulo(g, 9, 12, 10, 13, "K");
    retangulo(g, 0, 18, 19, 18, "w");
    const x = mod(t - 8, N);
    carimbar(g, ["...K...", "RRRR.GG", "RRRR.GG", ".w..w.."], x, 14, true);
    if (tt % 2 === 1) ponto(g, mod(x + 3, N), 13 - (t % 2), "w");
  });
}

// ============================================================
// 23. Nariz do Rudolph: o nariz acende, brilha com um halo e apaga; os olhos piscam.
// ============================================================

function narizRudolph() {
  const brilho = ["r", "R", "R", "R", "r", "r"];
  return quadros(12, (g, t) => {
    carimbar(
      g,
      [
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
        ".......SS..SS.......",
        ".......S....S.......",
        "........S..S........",
        ".........SS.........",
      ],
      0,
      1,
    );
    const b = brilho[t % 6];
    retangulo(g, 9, 12, 10, 13, b);
    if (t % 6 === 2) pontos(g, [[9, 11], [10, 11], [8, 12], [11, 12], [8, 13], [11, 13], [9, 14], [10, 14]], "O");
    if (t === 7) pontos(g, [[7, 8], [12, 8]], "K");
    retangulo(g, 7, 17, 12, 17, "G");
    ponto(g, 9 + (t % 2), 17, "Y");
  });
}

// ============================================================
// 24. Coruja piscando num galho, com neve caindo atrás.
// ============================================================

function corujaPiscando() {
  const olhos = {
    aberto: ["YYY..YYY", "Y.Y..Y.Y", "YYY..YYY"],
    meio: ["YYY..YYY", "WWW..WWW", "YYY..YYY"],
    fechado: ["WWW..WWW", "WWW..WWW", "YYY..YYY"],
  };
  const seq = ["aberto", "aberto", "aberto", "aberto", "aberto", "meio", "fechado", "meio", "aberto", "aberto"];
  return quadros(10, (g, t) => {
    carimbar(
      g,
      [
        ".W......W.",
        ".WWWWWWWW.",
        "WWWWWWWWWW",
        "WWWWWWWWWW",
        "WWWWWWWWWW",
        "WWWWOOWWWW",
        ".WWWWWWWW.",
        "WWwWWWWwWW",
        "WWWWwWWWWw",
        "wWwWWWwWWw",
        ".WwWWWWwW.",
        "..WWWWWW..",
        "...Y..Y...",
      ],
      5,
      3,
    );
    carimbar(g, olhos[seq[t]], 6, 5);
    retangulo(g, 0, 16, 19, 16, "K");
    pontos(g, [[2, 15], [16, 15], [17, 15]], "G");
    atras(g, [[2, mod(t, 14)], [17, mod(t + 7, 14)]], "W");
  });
}

// ============================================================
// 25. Floco cintilante: um brilho dourado corre do centro para as pontas dos braços.
// ============================================================

function flocoCintilante() {
  const braco = [];
  for (let y = 0; y <= 8; y++) braco.push([9, y], [10, y]);
  for (const y of [2, 5]) braco.push([8, y - 1], [7, y - 2], [11, y - 1], [12, y - 2]);
  const diagonal = [];
  for (let k = 1; k <= 5; k++) diagonal.push([10 + k, 9 - k]);
  const girar = ([x, y]) => [19 - y, x];
  return quadros(8, (g, t) => {
    let b = braco;
    let dg = diagonal;
    for (let v = 0; v < 4; v++) {
      pontos(g, b, "C");
      pontos(g, dg, "W");
      b = b.map(girar);
      dg = dg.map(girar);
    }
    carimbar(g, [".WW.", "WWWW", "WWWW", ".WW."], 8, 8);
    // brilho dourado correndo do centro para a ponta nos 4 braços
    let p = [[9 + (t % 2), 8 - t]];
    for (let v = 0; v < 4; v++) {
      pontos(g, p, "Y");
      p = p.map(girar);
    }
  });
}

// ============================================================
// 26. Noel na chaminé: o Noel sobe da chaminé, acena e desce de volta.
// ============================================================

function noelChamine() {
  const noel = ["...RW", "..RR.", ".RRRR", "WWWWW", "SS.S.", "SSSSS", "WWRWW", "WWWWW"];
  const alturas = [0, 1, 2, 3, 4, 5, 5, 5, 5, 4, 3, 2, 1, 0];
  return quadros(14, (g, t) => {
    const h = alturas[t];
    carimbar(noel.length ? g : g, noel.slice(0, h + 3), 8, 9 - h);
    retangulo(g, 7, 10, 13, 11, "R");
    retangulo(g, 7, 10, 13, 10, "W");
    retangulo(g, 8, 12, 12, 15, "r");
    pontos(g, [[8, 13], [10, 13], [12, 13], [9, 15], [11, 15]], "R");
    for (let x = 0; x < N; x++) ponto(g, x, 16 + (x % 4 === 0 ? 0 : 1), x % 4 === 0 ? "W" : "w");
    retangulo(g, 0, 18, 19, 19, null);
    if (h === 5) ponto(g, t % 2 ? 6 : 7, 6 - (t % 2), "W");
    pontos(g, [[2, 2], [17, 3]], "Y");
  });
}

// ============================================================
// 27. Árvore sendo montada: monta de baixo para cima, ganha bolas e estrela, e desmonta.
// ============================================================

function arvoreMontada() {
  const ordem = [];
  // tronco, depois cada andar de baixo para cima
  for (let y = 17; y >= 3; y--) {
    for (let x = 0; x < N; x++) {
      const ch = ARVORE[y - 3]?.[x];
      if (ch && ch !== ".") ordem.push([x, y, ch]);
    }
  }
  const bolas = [[9, 5, "R"], [7, 7, "Y"], [11, 8, "B"], [8, 10, "F"], [12, 11, "Y"], [6, 11, "R"], [10, 13, "B"], [5, 15, "Y"], [14, 15, "F"]];
  const passos = Math.ceil(ordem.length / 10);
  const total = passos + bolas.length + 4;
  return quadros(total * 2, (g, tt) => {
    const t = tt < total ? tt : 2 * total - 1 - tt; // monta e depois desmonta
    const n = Math.min(ordem.length, t * 10);
    ordem.slice(0, n).forEach(([x, y, ch]) => ponto(g, x, y, ch));
    const nb = Math.max(0, Math.min(bolas.length, t - passos));
    bolas.slice(0, nb).forEach(([x, y, c]) => ponto(g, x, y + 1, c));
    if (t >= passos + bolas.length) carimbar(g, [".Y.", "YWY", ".Y."], 8, 0);
    if (t >= passos + bolas.length + 2) pontos(g, [[3, 2], [16, 2]], "W");
  });
}

// ============================================================
// 28. Letreiro NATAL: as letras acendem uma a uma, as estrelas piscam e as letras apagam.
// ============================================================

function letreiroNatal() {
  const cores = ["R", "G", "Y", "G", "R"];
  const glifos = FONTES.pequena.glifos;
  const letra = (g, i) => {
    glifos["NATAL"[i]].forEach((fileira, dy) => {
      for (let dx = 0; dx < 3; dx++) if (fileira[dx] === "#") ponto(g, i * 4 + dx, 8 + dy, cores[i]);
    });
  };
  return quadros(18, (g, t) => {
    const n = t < 6 ? t : t < 12 ? 5 : 17 - t;
    for (let i = 0; i < Math.min(5, n); i++) letra(g, i);
    if (t >= 5 && t < 12) {
      pontos(g, [[2, 3], [17, 4], [9, 15]], t % 2 ? "W" : "Y");
      pontos(g, [[6, 16], [13, 2]], t % 2 ? "Y" : "W");
    }
  });
}

// ============================================================
// 29. Pisca-pisca correndo: uma luz forte corre por cada fio, sobre as luzinhas fracas.
// ============================================================

function piscaCorrendo() {
  const fios = [4, 13];
  const cores = ["R", "Y", "G", "B", "F"];
  return quadros(10, (g, t) => {
    fios.forEach((base, f) => {
      for (let x = 0; x < N; x++) {
        const y = base + Math.round(1.4 * Math.sin((2 * Math.PI * x) / N + f * Math.PI));
        ponto(g, x, y, "g");
        if (x % 2 === 1) {
          const i = (x - 1) / 2;
          const corre = mod(t + f * 5, 10) === i;
          ponto(g, x, y + 1, corre ? "W" : cores[i % cores.length]);
          if (corre) ponto(g, x, y + 2, "V");
        }
      }
    });
  });
}

// ============================================================
// 30. Meias balançando no varal: uma meia de cada vez balança o pé.
// ============================================================

function meiasBalancando() {
  const meia = (c, d, lado) => [
    "Y.....",
    "WWWW..",
    "WWWW..",
    `.${c}${c}${c}..`,
    `.${c}${d}${c}..`,
    `.${c}${c}${c}..`,
    lado ? `.${c}${c}${c}${c}.` : `${c}${c}${c}${c}..`,
    lado ? `..${c}${c}${c}.` : `${c}${c}${c}...`,
  ];
  const cores = [["R", "W"], ["G", "R"], ["B", "W"]];
  return quadros(12, (g, t) => {
    retangulo(g, 0, 4, 19, 4, "w");
    cores.forEach(([c, d], i) => {
      const balanca = Math.floor(t / 2) % 3 === i && t % 2 === 1;
      carimbar(g, meia(c, d, balanca), 1 + i * 6, 3);
    });
    pontos(g, [[3, 16], [9, 17], [15, 15]], t % 2 ? "C" : "W");
  });
}

// ============================================================
// 31. Pião girando: uma faixa clara atravessa o pião e risquinhos de movimento piscam ao lado.
// ============================================================

function piaoGirando() {
  const forma = [
    ".........K..........",
    ".........K..........",
    "......RRRRRRRR......",
    ".....RRRRRRRRRR.....",
    "....YYYYYYYYYYYY....",
    "....BBBBBBBBBBBB....",
    ".....YYYYYYYYYY.....",
    "......RRRRRRRR......",
    ".......RRRRRR.......",
    "........RRRR........",
    ".........RR.........",
    ".........KK.........",
  ];
  return quadros(12, (g, t) => {
    carimbar(g, forma, 0, 4);
    pontos(g, [[4 + t, 9], [4 + mod(t + 6, 12), 9]], "W");
    if (t % 2) pontos(g, [[2, 8], [2, 10], [17, 9], [17, 11]], "w");
    retangulo(g, 6, 17, 13, 17, "y");
  });
}

function elfoMartelando() {
  return quadros(6, (g, t) => {
    carimbar(
      g,
      [
        "..GG...",
        ".GGGG..",
        "GGGGGW.",
        ".SSS...",
        ".S.S...",
        ".SSS...",
        "GGGGG..",
        "GGYGG..",
        "GGGGG..",
        ".G.G...",
        ".K.K...",
      ],
      3,
      6,
    );
    // presente na mesa
    retangulo(g, 11, 14, 16, 16, "R");
    retangulo(g, 13, 14, 14, 16, "Y");
    retangulo(g, 9, 17, 18, 17, "K");
    pontos(g, [[10, 18], [17, 18]], "K");
    // braço com o martelo: em cima, em cima, bate (faísca), embaixo
    const bate = t % 3 === 2;
    if (!bate) {
      pontos(g, [[8, 12], [9, 11]], "S");
      linha(g, 10, 10, 10, 8, "K");
      pontos(g, [[9, 8], [10, 8], [11, 8]], "w");
    } else {
      pontos(g, [[8, 12], [9, 13]], "S");
      linha(g, 10, 13, 12, 13, "K");
      pontos(g, [[12, 12], [12, 13]], "w");
      pontos(g, [[13, 11], [15, 12], [11, 11]], "Y");
    }
  });
}

export const ANIMACOES_MOVIMENTO = [
  { id: "mov-treno", nome: "Trenó do Papai Noel", ms: 150, criar: treno },
  { id: "mov-rena", nome: "Rena galopando", ms: 150, criar: renaGalopando },
  { id: "mov-arvore", nome: "Árvore com pisca-pisca", ms: 300, criar: arvorePisca },
  { id: "mov-vela", nome: "Vela tremulando", ms: 150, criar: velaChama },
  { id: "mov-lareira", nome: "Lareira acesa", ms: 200, criar: lareira },
  { id: "mov-boneco", nome: "Boneco acenando", ms: 200, criar: bonecoAcenando },
  { id: "mov-noel", nome: "Noel acenando", ms: 200, criar: noelAcenando },
  { id: "mov-presente", nome: "Presente surpresa", ms: 200, criar: presenteSurpresa },
  { id: "mov-sino", nome: "Sino balançando", ms: 250, criar: sinoBalancando },
  { id: "mov-estrela-cadente", nome: "Estrela cadente", ms: 120, criar: estrelaCadente },
  { id: "mov-neve", nome: "Neve caindo", ms: 150, criar: neveCaindo },
  { id: "mov-biscoito", nome: "Biscoito dançando", ms: 250, criar: biscoitoDancando },
  { id: "mov-pinguim", nome: "Pinguim bamboleando", ms: 250, criar: pinguim },
  { id: "mov-guirlanda", nome: "Guirlanda de luzes", ms: 300, criar: guirlandaLuzes },
  { id: "mov-bengala", nome: "Bengala listrada", ms: 250, criar: bengalaGirando },
  { id: "mov-belem", nome: "Estrela de Belém", ms: 200, criar: estrelaBelem },
  { id: "mov-anjo", nome: "Anjo batendo asas", ms: 200, criar: anjoAsas },
  { id: "mov-chocolate", nome: "Chocolate quente", ms: 250, criar: chocolateQuente },
  { id: "mov-bolas", nome: "Bolas brilhando", ms: 200, criar: bolasBrilhando },
  { id: "mov-elfo", nome: "Elfo martelando", ms: 200, criar: elfoMartelando },
  { id: "mov-casinha", nome: "Casinha acendendo", ms: 400, criar: casinhaAcendendo },
  { id: "mov-trenzinho", nome: "Trenzinho na árvore", ms: 200, criar: trenzinho },
  { id: "mov-rudolph", nome: "Nariz do Rudolph", ms: 200, criar: narizRudolph },
  { id: "mov-coruja", nome: "Coruja piscando", ms: 200, criar: corujaPiscando },
  { id: "mov-floco", nome: "Floco cintilante", ms: 150, criar: flocoCintilante },
  { id: "mov-chamine", nome: "Noel na chaminé", ms: 200, criar: noelChamine },
  { id: "mov-montando", nome: "Árvore sendo montada", ms: 200, criar: arvoreMontada },
  { id: "mov-letreiro", nome: "Letreiro NATAL", ms: 300, criar: letreiroNatal },
  { id: "mov-pisca", nome: "Pisca-pisca correndo", ms: 150, criar: piscaCorrendo },
  { id: "mov-meias", nome: "Meias balançando", ms: 250, criar: meiasBalancando },
  { id: "mov-piao", nome: "Pião girando", ms: 150, criar: piaoGirando },
];
