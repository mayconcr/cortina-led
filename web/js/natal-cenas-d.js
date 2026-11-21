// Coleção de Natal (parte D): 25 cenas que rolam na aba Animações, em quatro direções.
//
// Cada cena diz para onde a cortina a rola, em loop (`movimento`):
//   - "esquerda" (padrão) e "direita": as 20 COLUNAS rolam. O que cruza a borda dá a volta
//     (`envolver`) e as faixas contínuas (chão, cachecol, montanhas) têm período que divide 20.
//     Nas cenas "direita", os personagens olham para a direita.
//   - "baixo" e "cima": as 20 LINHAS rolam. Tudo dá a volta na vertical (PV/CV), os elementos se
//     espalham pelas 20 linhas e não há chão nem horizonte. O que cai vai para baixo (rastro em
//     cima); o que sobe vai para cima (rastro embaixo). Postes, fios e trilhos iguais em toda linha
//     ficam parados enquanto a textura corre por eles; todo padrão vertical tem período que divide 20.
// Fundo apagado e cores saturadas. Cada cena acende entre 40 e 220 LEDs.

import { FLOCO, FLOCO_P, N, carimbar, escrever, espelhar, novaGrade, ponto, recolorir } from "./pixelart.js";

// ---------- ajudantes locais ----------

/** Ponto com coordenadas reais (arredonda) e coluna que dá a volta na borda (cenas na horizontal). */
const P = (g, x, y, c) => ponto(g, Math.round(x), Math.round(y), c, true);

/** Carimbo que dá a volta na borda (cenas na horizontal). */
const C = (g, sprite, x, y) => carimbar(g, sprite, x, y, true);

/** Ponto cuja LINHA dá a volta (cenas que rolam para cima ou para baixo). */
const PV = (g, x, y, c) => ponto(g, Math.round(x), ((Math.round(y) % N) + N) % N, c);

/** Carimbo cujas linhas dão a volta (cenas na vertical). */
const CV = (g, s, x, y) =>
  s.forEach((f, dy) => Array.from(f).forEach((ch, dx) => ch !== "." && ch !== " " && PV(g, x + dx, y + dy, ch)));

/** Vários pontos da mesma cor (a coluna dá a volta). */
const pontos = (g, lista, c) => lista.forEach(([x, y]) => P(g, x, y, c));

/** Vários pontos da mesma cor (a linha dá a volta). */
const pontosV = (g, lista, c) => lista.forEach(([x, y]) => PV(g, x, y, c));

/** Linha inteira com um padrão que se repete (o tamanho do padrão divide 20, para a emenda sumir). */
function faixa(g, lin, padrao) {
  for (let x = 0; x < N; x++) ponto(g, x, lin, padrao[x % padrao.length]);
}

/** Chão de neve numa linha (período 5). */
const chaoNeve = (g, lin) => faixa(g, lin, "WWWWw");

// ---------- desenhos reaproveitados ----------

const ESTRELA5 = ["..Y..", ".YYY.", "YYWYY", ".YYY.", ".Y.Y."];
const GORRO = [".....WW", "....RWW", "...RRR.", "..RRRR.", ".RRRRR.", "WWWWWWW", "wWWWWWw"];
const GORRO_CHEIO = ["....WW..", "...RWW..", "..RRR...", "..RRRR..", ".RRRRRR.", "WWWWWWWW", "WWWWWWWW"];

// ============================================================
//                   CAINDO (movimento "baixo")
// ============================================================

// 1. Chuva de bengalas: bengalas grandes (listras em diagonal) e pequenas, viradas para os dois lados.
const BENGALA = [".XXXX.", "XXXXXX", "XX..XX", "XX..XX", "....XX", "....XX", "....XX", "....XX", "....XX", "....XX"];
const BENGALINHA = [".XX.", "X..X", "X..X", "...X", "...X", "...X", "...X"];

function bengalaCaindo(g, forma, x, y, [c1, c2], virar = false) {
  const fina = forma === BENGALINHA;
  (virar ? espelhar(forma) : forma).forEach((l, dy) =>
    Array.from(l).forEach((ch, dx) => {
      if (ch !== "X") return;
      const listra = fina ? (dx + dy) % 2 === 0 : (((dx - dy) % 4) + 4) % 4 < 2;
      PV(g, x + dx, y + dy, listra ? c1 : c2);
    }),
  );
}

function cenaChuvaBengalas() {
  const g = novaGrade();
  bengalaCaindo(g, BENGALA, 0, 0, ["R", "W"]);
  bengalaCaindo(g, BENGALINHA, 1, 12, ["G", "W"]);
  bengalaCaindo(g, BENGALA, 7, 6, ["R", "W"], true);
  bengalaCaindo(g, BENGALINHA, 8, 17, ["R", "W"], true);
  bengalaCaindo(g, BENGALA, 14, 12, ["G", "W"]);
  bengalaCaindo(g, BENGALINHA, 15, 3, ["R", "W"], true);
  return g;
}

// 2. Chuva de biscoitos: bonequinhos de gengibre com glacê, uma estrela e um biscoito confeitado.
const BONEQUINHO = [
  "..KKK..",
  ".KKKKK.",
  ".KWKWK.",
  ".KKKKK.",
  "..KKK..",
  "KKKKKKK",
  "W.KRK.W",
  "..KGK..",
  ".KK.KK.",
  ".W...W.",
];

function cenaChuvaBiscoitos() {
  const g = novaGrade();
  CV(g, BONEQUINHO, 0, 0);
  CV(g, BONEQUINHO, 13, 6);
  CV(g, BONEQUINHO, 6, 12);
  CV(g, ESTRELA5, 8, 3);
  CV(g, [".KKK.", "KRKGK", "KKYKK", "KGKRK", ".KKK."], 1, 13);
  CV(g, ESTRELA5, 14, 0);
  return g;
}

// 3. Cascata de luzes: tubos de luz que pingam, com a ponta branca embaixo e o rastro colorido em cima.
const RASTROS = {
  azul: ["W", "C", "C", "B", "B"],
  ouro: ["W", "V", "Y", "Y", "O", "y"],
  rosa: ["W", "P", "P", "F", "M"],
  verde: ["W", "L", "L", "G", "G"],
  vermelho: ["W", "P", "R", "R", "r"],
};

function cenaCascataLuzes() {
  const g = novaGrade();
  // [coluna, linha da ponta, cor]
  const gotas = [
    [1, 5, "ouro"], [1, 15, "azul"],
    [4, 10, "rosa"], [4, 19, "verde"],
    [7, 2, "vermelho"], [7, 13, "ouro"],
    [10, 7, "azul"], [10, 17, "rosa"],
    [13, 0, "verde"], [13, 11, "vermelho"],
    [16, 4, "rosa"], [16, 14, "ouro"],
    [19, 9, "azul"], [19, 18, "vermelho"],
  ];
  for (const [x, y, nome] of gotas) RASTROS[nome].forEach((c, i) => PV(g, x, y - i, c));
  return g;
}

// 4. Neve colorida: flocos grandes e pequenos de várias cores, espalhados pelas 20 linhas.
function cenaNeveColorida() {
  const g = novaGrade();
  for (const [x, y, c] of [[1, 1, "C"], [12, 2, "P"], [6, 8, "Y"], [15, 9, "L"], [0, 14, "F"], [10, 15, "T"]]) {
    CV(g, recolorir(FLOCO, { W: c }), x, y);
  }
  for (const [x, y, c] of [[8, 0, "M"], [18, 4, "O"], [3, 6, "B"], [12, 12, "R"], [17, 16, "C"], [5, 18, "P"]]) {
    CV(g, recolorir(FLOCO_P, { C: c }), x - 1, y - 1);
  }
  pontosV(g, [[9, 4], [19, 1], [1, 10], [14, 6], [8, 13], [19, 13], [3, 17], [15, 19]], "W");
  return g;
}

// 5. Gorros caindo: gorros do Noel e de duende virados para os dois lados, com neve.
function cenaGorrosCaindo() {
  const g = novaGrade();
  CV(g, GORRO, 0, 0);
  CV(g, espelhar(recolorir(GORRO, { R: "G" })), 12, 4);
  CV(g, GORRO_CHEIO, 4, 10);
  CV(g, espelhar(GORRO), 13, 14);
  pontosV(g, [[10, 1], [17, 0], [2, 9], [9, 7], [18, 11], [1, 16], [11, 18], [7, 19]], "W");
  return g;
}

// 6. Fita espiral: um poste vermelho (igual em toda linha) com uma fita dourada em diagonal.
// A fita tem período 5 nas linhas: rolando para baixo, o poste parece girar.
function cenaFitaEspiral() {
  const g = novaGrade();
  for (let y = 0; y < N; y++) {
    for (let i = 0; i < 4; i++) {
      const fita = (y + i) % 5 < 2;
      const borda = i === 0 || i === 3;
      ponto(g, 8 + i, y, fita ? (borda ? "y" : i === 1 ? "V" : "Y") : borda ? "r" : "R");
    }
    // a fita aparece dos lados quando dá a volta no poste
    if (y % 5 === 0) ponto(g, 7, y, "y");
    if (y % 5 === 3) ponto(g, 12, y, "y");
  }
  for (const [x, y] of [[3, 2], [16, 6], [4, 11], [15, 15], [2, 18]]) CV(g, FLOCO_P, x - 1, y - 1);
  pontosV(g, [[17, 1], [1, 7], [18, 11], [6, 15], [14, 19]], "W");
  return g;
}

// 7. Cascata de neve: filetes de neve caindo como uma cachoeira (flocos a cada 2 ou 4 linhas,
// em fases diferentes), com alguns flocos maiores descendo junto.
function cenaCascataNeve() {
  const g = novaGrade();
  // [coluna, espaço entre os flocos (divide 20), fase]
  const filetes = [[1, 4, 0], [4, 2, 1], [7, 4, 2], [10, 2, 0], [13, 4, 3], [16, 2, 1], [19, 4, 1]];
  for (const [x, passo, fase] of filetes) {
    for (let y = fase; y < N; y += passo) PV(g, x, y, passo === 2 ? (y % 4 === fase ? "W" : "C") : "W");
    if (passo === 4) for (let y = fase - 1; y < N; y += passo) PV(g, x, y, "C");
  }
  for (const [x, y] of [[4, 4], [13, 9], [7, 15], [16, 17], [1, 11]]) CV(g, FLOCO_P, x - 1, y - 1);
  return g;
}

// 8. Pisca-pisca nos fios: fios verdes (iguais em toda linha) com lâmpadas a cada 4 linhas.
// Rolando para baixo, as lâmpadas parecem correr pelos fios.
function cenaPiscaFios() {
  const g = novaGrade();
  const cores = ["R", "Y", "B", "P", "L", "O", "C", "F"];
  [2, 6, 10, 14, 18].forEach((x, k) => {
    for (let y = 0; y < N; y++) ponto(g, x, y, "g");
    for (let j = 0; j < 5; j++) {
      const y = j * 4 + ((k * 3) % 4);
      const lado = j % 2 ? 1 : -1;
      const c = cores[(j * 3 + k) % cores.length];
      PV(g, x + lado, y, c);
      PV(g, x + lado, y + 1, c);
    }
  });
  return g;
}

// ============================================================
//                   SUBINDO (movimento "cima")
// ============================================================

// 9. Sinos subindo: sinos dourados e prateados, com o tilintar (rastro) embaixo.
const SINO = [".RR.RR.", "..RRR..", "..YYY..", ".YVYYY.", ".YVYYY.", ".YYYYY.", "YYYYYYY", "...y..."];
const SINO_LISO = ["...R...", "..YYY..", ".YVYYy.", ".YVYYy.", ".YYYYy.", "YYYYYYy", "yyyyyyy", "...Y..."];
const SININHO = ["..R..", ".YYY.", ".VYY.", ".YYY.", "YYYYY", "..y.."];

function cenaSinosSubindo() {
  const g = novaGrade();
  const prata = { Y: "W", V: "W", y: "w" };
  /** Rastro de quem sobe: um risquinho que vai sumindo embaixo da boca do sino. */
  const rastro = (x, y, c1, c2) => {
    PV(g, x, y, c1);
    PV(g, x, y + 1, c2);
  };
  CV(g, SINO, 0, 2);
  rastro(2, 11, "V", "y");
  rastro(4, 11, "V", "y");
  CV(g, recolorir(SININHO, prata), 8, 5);
  rastro(10, 12, "C", "w");
  CV(g, SINO_LISO, 13, 10);
  rastro(15, 19, "V", "y");
  rastro(17, 19, "V", "y");
  CV(g, SININHO, 1, 13);
  rastro(3, 20, "V", "y");
  CV(g, recolorir(SININHO, prata), 14, 0);
  rastro(16, 7, "C", "w");
  CV(g, SININHO, 8, 15);
  rastro(10, 22, "V", "y");
  return g;
}

// 10. Noel de balão: o Noel acena do cesto de um balão listrado; um balão menor sobe ao lado.
const BALAO = [
  "...RRRRR...",
  ".RRWRRRWRR.",
  "RRWRRYRRWRR",
  "RWRRYYYRRWR",
  "RWRRYYYRRWR",
  "RWRRRYRRRWR",
  ".RWRRRRRWR.",
  "..RWRRRWR..",
  "...RWRWR...",
  "....RRR....",
  "...w.O.w...",
  "...w.W.w...",
  "...wRRRw...",
  "...wSSSw...",
  "...KWWWK...",
  "...KKKKK...",
];
const BALAO_P = ["..BBB..", ".BCBCB.", "BBCBCBB", "BBCBCBB", ".BCBCB.", "..BCB..", "..w.w..", "..YYY.."];

function cenaNoelBalao() {
  const g = novaGrade();
  CV(g, BALAO, 0, 2);
  CV(g, BALAO_P, 13, 12);
  pontosV(g, [[16, 2], [13, 6], [18, 8], [6, 19]], "W");
  pontosV(g, [[17, 5], [11, 0]], "Y");
  return g;
}

// 11. Estrelinhas subindo: estrelas de várias cores com o rastro embaixo.
function cenaEstrelinhasSubindo() {
  const g = novaGrade();
  const grande = (x, y, c, r1, r2) => {
    CV(g, recolorir(ESTRELA5, { Y: c }), x, y);
    pontosV(g, [[x + 2, y + 4], [x + 2, y + 5]], r1);
    pontosV(g, [[x + 2, y + 6], [x + 2, y + 8]], r2);
  };
  const pequena = (x, y, c, r1, r2) => {
    CV(g, [`.${c}.`, `${c}W${c}`, `.${c}.`], x, y);
    pontosV(g, [[x + 1, y + 3]], r1);
    pontosV(g, [[x + 1, y + 4], [x + 1, y + 6]], r2);
  };
  grande(1, 1, "Y", "O", "y");
  grande(13, 8, "C", "C", "B");
  grande(5, 13, "P", "F", "M");
  pequena(9, 2, "L", "G", "G");
  pequena(16, 1, "P", "F", "M");
  pequena(1, 10, "C", "B", "B");
  pequena(10, 9, "Y", "O", "y");
  pequena(16, 16, "L", "G", "G");
  pequena(12, 16, "W", "C", "w");
  return g;
}

// 12. Pinheiro sem fim: andares de pinheiro empilhados que se repetem a cada 10 linhas, com bolas.
// Subindo, parece um pinheiro gigante passando.
const ANDAR = [
  ".........GG.........",
  "........GGGG........",
  "........GGGG........",
  ".......GGGGGG.......",
  ".......GGGGGG.......",
  "......GGGGGGGG......",
  "......GGGGGGGG......",
  ".....GGGGGGGGGG.....",
  ".....GGGGGGGGGG.....",
  "....GGGGGGGGGGGG....",
];

function cenaPinheiroSemFim() {
  const g = novaGrade();
  CV(g, ANDAR, 0, 0);
  CV(g, ANDAR, 0, 10);
  // pontas dos galhos mais claras
  for (const y of [9, 19]) pontosV(g, [[4, y], [15, y]], "L");
  // festão dourado em diagonal e bolas coloridas
  pontosV(g, [[7, 4], [8, 5], [9, 5], [10, 6], [11, 7], [12, 7], [13, 8]], "Y");
  pontosV(g, [[12, 13], [11, 14], [10, 15], [9, 15], [8, 16], [7, 17], [6, 17]], "V");
  pontosV(g, [[9, 2], [5, 9], [14, 9], [7, 7]], "R");
  pontosV(g, [[10, 12], [6, 19], [13, 18], [11, 17]], "B");
  pontosV(g, [[11, 3], [8, 8]], "W");
  pontosV(g, [[9, 13], [8, 19], [12, 16]], "P");
  pontosV(g, [[1, 3], [18, 6], [2, 13], [17, 16]], "W");
  return g;
}

// 13. Elevador de presentes: dois trilhos (iguais em toda linha) e plataformas a cada 10 linhas
// levando presentes para cima.
function cenaElevadorPresentes() {
  const g = novaGrade();
  for (let y = 0; y < N; y++) {
    ponto(g, 3, y, "w");
    ponto(g, 16, y, "w");
  }
  const andar = (p, [c1, f1], [c2, f2]) => {
    for (let x = 4; x <= 15; x++) PV(g, x, p, "y");
    CV(g, [`.${f1}.${f1}.`, `${c1}${c1}${f1}${c1}${c1}`, `${f1}${f1}${f1}${f1}${f1}`, `${c1}${c1}${f1}${c1}${c1}`, `${c1}${c1}${f1}${c1}${c1}`], 5, p - 5);
    CV(g, [`${f2}..${f2}`, `${c2}${f2}${f2}${c2}`, `${c2}${f2}${f2}${c2}`, `${c2}${f2}${f2}${c2}`], 10, p - 4);
  };
  andar(9, ["R", "Y"], ["G", "W"]);
  andar(19, ["B", "W"], ["P", "Y"]);
  return g;
}

// ============================================================
//                 PARA A DIREITA (movimento "direita")
// ============================================================

// 14. Desfile de renas: duas renas marchando para a direita (uma é o Rudolph), com sininhos.
const RENA = [
  ".....y..y.",
  ".....yyy..",
  ".....yy...",
  ".....KKK..",
  ".....K.KK.",
  "....KKKKKN",
  "WKKKKKRK..",
  "KKKKKKY...",
  ".KKKKKK...",
  ".K.K..K.K.",
  ".K.K..K.K.",
];

function cenaDesfileRenas() {
  const g = novaGrade();
  C(g, recolorir(RENA, { N: "R" }), 0, 6);
  C(g, recolorir(RENA, { N: "K", R: "G" }), 10, 6);
  chaoNeve(g, 17);
  faixa(g, 18, "w....");
  pontos(g, [[3, 1], [12, 2], [17, 0], [8, 4], [15, 4]], "W");
  return g;
}

// 15. Avião do Noel: o Noel pilota um aviãozinho puxando uma faixa "HO" (em loop: HO HO HO...).
const AVIAO = [
  "B....W...",
  "BB..RR..W",
  "BB..SS..W",
  "BBBBBBBYW",
  ".BWWWWBYW",
  "..YYYY..W",
  "...w..w..",
];

function cenaAviaoNoel() {
  const g = novaGrade();
  for (let y = 4; y <= 10; y++) for (let x = 1; x <= 9; x++) ponto(g, x, y, "W");
  escrever(g, "HO", 2, 5, "R");
  ponto(g, 10, 7, "w");
  C(g, AVIAO, 11, 4);
  C(g, ["..WW..", ".WWWW.", "WWWWWW"], 2, 15);
  C(g, [".WW.", "WWWW"], 13, 16);
  pontos(g, [[5, 1], [14, 0], [18, 2], [9, 13], [18, 18]], "W");
  return g;
}

// 16. Burrinho e a estrela: o burrinho de manta vermelha segue a estrela pela estrada.
const BURRINHO = [
  ".........w.w....",
  ".........w.w....",
  ".........wwww...",
  "........wwwwww..",
  "........wwKwwW..",
  ".........wwWWW..",
  "........www.....",
  "wwwwwwwwwww.....",
  "wRRRRRRwwww.....",
  "wRYYYYRwww......",
  "wwwwwwwwww......",
  ".wwwwwwww.......",
  ".w.w...w.w......",
  ".w.w...w.w......",
  ".K.K...K.K......",
];

function cenaBurrinhoEstrela() {
  const g = novaGrade();
  C(g, BURRINHO, 1, 4);
  P(g, 0, 12, "w");
  P(g, -1, 13, "w");
  C(g, ESTRELA5, 15, 0);
  pontos(g, [[14, 2], [13, 2]], "Y");
  pontos(g, [[12, 2], [10, 2]], "y");
  faixa(g, 19, "yyyyK");
  pontos(g, [[4, 1], [18, 10], [7, 4]], "W");
  return g;
}

// ============================================================
//                 PARA A ESQUERDA (padrão)
// ============================================================

// 17. Casa de biscoito: casinha de gengibre com glacê, balas no telhado, bengala e pirulito.
function cenaCasaBiscoito() {
  const g = novaGrade();
  // telhado: bordas de glacê, gengibre por dentro e balas coloridas
  for (let r = 0; r <= 5; r++) {
    const y = 5 + r;
    for (let x = 9 - r; x <= 10 + r; x++) ponto(g, x, y, x === 9 - r || x === 10 + r ? "W" : "K");
  }
  pontos(g, [[9, 7], [7, 9], [12, 8], [10, 10], [14, 10], [5, 10]], "K");
  pontos(g, [[9, 7], [12, 9]], "R");
  pontos(g, [[7, 9], [10, 10]], "G");
  pontos(g, [[11, 8], [13, 10]], "Y");
  for (let x = 3; x <= 16; x++) ponto(g, x, 11, "W");
  // paredes, janelas acesas e porta
  for (let y = 12; y <= 17; y++) for (let x = 5; x <= 14; x++) ponto(g, x, y, "K");
  for (const x of [5, 7, 9, 11, 13]) ponto(g, x, 12, "W");
  for (const [x, y] of [[6, 13], [7, 13], [6, 14], [7, 14], [12, 13], [13, 13], [12, 14], [13, 14]]) ponto(g, x, y, "Y");
  for (let y = 14; y <= 17; y++) for (let x = 9; x <= 10; x++) ponto(g, x, y, "R");
  ponto(g, 10, 16, "Y");
  pontos(g, [[6, 16], [13, 16]], "P");
  pontos(g, [[7, 17], [12, 17]], "G");
  // chaminé com neve e fumaça
  pontos(g, [[13, 6], [14, 6], [13, 7], [14, 7]], "K");
  pontos(g, [[13, 5], [14, 5]], "W");
  pontos(g, [[14, 3], [15, 2], [14, 1]], "w");
  // bengala e pirulito
  C(g, [".WR", "R.W", "..R", "..W", "..R", "..W"], 1, 12);
  C(g, ["RWR", "WRW", "RWR", ".W.", ".W.", ".W.", ".W."], 16, 11);
  chaoNeve(g, 18);
  pontos(g, [[2, 2], [18, 4], [6, 1]], "W");
  return g;
}

// 18. Árvore de presentes: caixas empilhadas em forma de pinheiro, com a estrela no topo.
function cenaArvorePresentes() {
  const g = novaGrade();
  const caixa = (x, y, c, f) => C(g, [`${c}${c}${f}${c}${c}`, `${f}${f}${f}${f}${f}`, `${c}${c}${f}${c}${c}`, `${c}${c}${f}${c}${c}`], x, y);
  caixa(1, 14, "R", "Y");
  caixa(7, 14, "G", "W");
  caixa(13, 14, "B", "Y");
  caixa(4, 10, "Y", "R");
  caixa(10, 10, "P", "W");
  caixa(7, 6, "M", "Y");
  C(g, ESTRELA5, 7, 1);
  chaoNeve(g, 18);
  pontos(g, [[2, 3], [16, 2], [18, 8], [1, 8]], "W");
  return g;
}

// 19. Globo de neve: um pinheiro com neve dentro do vidro, sobre uma base vermelha e dourada.
function cenaGloboNeve() {
  const g = novaGrade();
  const cx = 9.5;
  const cy = 7.5;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > 6.6 && d <= 7.6 && y <= 13) ponto(g, x, y, x + y < 12 ? "W" : "C");
      else if (d <= 6.6 && y >= 11 && y <= 13) ponto(g, x, y, "W");
    }
  }
  carimbar(g, ["..Y..", "..G..", ".GGG.", "..G..", ".GRGG", "GGGGG", "..K.."], 7, 4);
  pontos(g, [[5, 4], [13, 3], [12, 8], [6, 9], [9, 1], [15, 6]], "W");
  carimbar(g, ["..YYYYYYYYYYYY..", ".RRRRRRRRRRRRRR.", ".RRYRRRYRRRYRRR.", "rrrrrrrrrrrrrrrr"], 2, 14);
  pontos(g, [[0, 2], [19, 11], [1, 17]], "W");
  return g;
}

// 20. Cachecol listrado: um cachecol de tricô sem fim, ondulando (período 20, listras de período 10).
function cenaCachecol() {
  const g = novaGrade();
  const listras = "RRRWWGGGWW";
  for (let x = 0; x < N; x++) {
    const topo = Math.round(7.5 + 3 * Math.sin((2 * Math.PI * x) / N));
    for (let k = 0; k < 5; k++) P(g, x, topo + k, listras[x % listras.length]);
  }
  for (const [x, y] of [[4, 2], [14, 15], [1, 16], [17, 3], [9, 18]]) C(g, FLOCO_P, x - 1, y - 1);
  return g;
}

// 21. Noel e Mamãe Noel: lado a lado, ela de óculos e avental.
function cenaNoelMamae() {
  const g = novaGrade();
  carimbar(
    g,
    [
      "W........",
      "WRRRR....",
      "..RRRRR..",
      ".WWWWWWW.",
      ".SKSSSKS.",
      ".PWWWWWP.",
      ".WWWSWWW.",
      "RRWWWWWRR",
      "RRRWWWRRR",
      "SRRRWRRRS",
      ".KKKYKKK.",
      ".RRRRRRR.",
      ".WWWWWWW.",
      "..RR.RR..",
      ".KKK.KKK.",
    ],
    0,
    2,
  );
  carimbar(
    g,
    [
      "..WW....",
      ".WWWW...",
      "WWWWWW..",
      "WSSSSW..",
      "WYKKYW..",
      ".PSSP...",
      ".WWWW...",
      "RRRRRR..",
      "SRWWRS..",
      "RRWWRR..",
      "RRWWRR..",
      "RRRWWRRR",
      "RRRRRRRR",
      "WWWWWWWW",
      "..KK.KK.",
    ],
    10,
    2,
  );
  C(g, ["P.P", "PPP", ".P."], 16, 2);
  chaoNeve(g, 18);
  return g;
}

// 22. Chalé na montanha: montanhas com neve no pico (período 20), chalé de janela acesa e pinheiros.
function cenaChale() {
  const g = novaGrade();
  const crista = [7, 6, 5, 4, 3, 2, 3, 4, 5, 6, 7, 6, 5, 4, 4, 5, 6, 7, 8, 8];
  crista.forEach((h, x) => {
    ponto(g, x, h, h <= 4 ? "W" : "w");
    if (h <= 3) ponto(g, x, h + 1, "W");
    if (h <= 2) ponto(g, x, h + 2, "W");
  });
  carimbar(
    g,
    [
      "....W....",
      "...WRW...",
      "..WRRRW..",
      ".WRRRRRW.",
      "WRRRRRRRW",
      ".KKKKKKK.",
      ".KYYKYYK.",
      ".KKKKKKK.",
      ".KKKRKKK.",
      ".KKKRKKK.",
    ],
    6,
    8,
  );
  pontos(g, [[12, 9], [12, 10]], "K");
  pontos(g, [[13, 7], [12, 6]], "w");
  C(g, ["..G..", ".GGG.", "..G..", ".GGG.", "GGGGG", "..K.."], 0, 12);
  C(g, ["..G..", ".GGG.", "GGGGG", "..K.."], 15, 14);
  chaoNeve(g, 18);
  C(g, [".VV", "VV.", "VV.", ".VV"], 16, 0);
  pontos(g, [[1, 1], [10, 0], [13, 2]], "W");
  return g;
}

// 23. Gatinho de gorro: um gato laranja sentado, de gorro do Noel e bigodes.
function cenaGatinho() {
  const g = novaGrade();
  carimbar(
    g,
    [
      ".........WW.......",
      "......RRRWW.......",
      ".....RRRRR........",
      "O...RRRRRRR.......",
      "OO.WWWWWWWWW......",
      "OOOOOOOOOOOO......",
      "OOOOOOOOOOOO......",
      "OLLOOOOOOLLO......",
      "OOOOOPPOOOOO......",
      "OOOOWWWWOOOO......",
      ".OOOOWWOOOO.......",
      "..OOOOOOOO........",
      ".OOOWWWWOOO.......",
      ".OOWWWWWWOO...OO..",
      "OOOWWWWWWOOO...O..",
      "OOOWWWWWWOOO..OO..",
      "OOOOWWWWOOOOOOO...",
      ".WW.OOOO.WW.......",
    ],
    2,
    1,
  );
  pontos(g, [[0, 9], [1, 10], [0, 11], [15, 9], [14, 10], [15, 11]], "w");
  pontos(g, [[17, 2], [18, 6], [1, 2]], "W");
  return g;
}

// 24. Cachorrinho de gorro: orelhas caídas, focinho branco, língua de fora e coleira com plaquinha.
function cenaCachorrinho() {
  const g = novaGrade();
  carimbar(
    g,
    [
      ".........WW.....",
      "......RRRWW.....",
      ".....RRRRR......",
      "....RRRRRRR.....",
      "...WWWWWWWWW....",
      "..KWWWWWWWWWK...",
      ".KKWW.WWW.WWKK..",
      ".KKWWWWWWWWWKK..",
      ".KKWWWKKKWWWKK..",
      ".KK.WWWKWWW.KK..",
      "..K..WWPWW..K...",
      "......WPW.......",
      "....RRRYRRR.....",
      "....WWWWWWW.....",
      "...WWKKWWWWW....",
      "...WKKKWWWWW....",
      "...WWW...WWW....",
      "...KKK...KKK....",
    ],
    2,
    1,
  );
  pontos(g, [[17, 3], [1, 2], [17, 14]], "C");
  return g;
}

// 25. Pinguim com presente: de cachecol vermelho, segurando uma caixa verde no gelo.
function cenaPinguimPresente() {
  const g = novaGrade();
  carimbar(
    g,
    [
      "...BBBB....",
      "..BBBBBB...",
      ".BBWBBWBB..",
      ".BBBOOBBB..",
      ".RRRRRRRR..",
      ".BRRRRRRB.R",
      "BBWWWWRRBRR",
      "BWGGYGGWBR.",
      "BBGGGYGGGBB",
      "BBYYYYYYYBB",
      ".BGGGYGGGB.",
      ".BGGGYGGGB.",
      ".BWWWWWWWB.",
      "..BWWWWWB..",
      "...OO.OO...",
    ],
    5,
    2,
  );
  faixa(g, 18, "CCCCw");
  for (const [x, y] of [[2, 3], [16, 1], [17, 10], [1, 13]]) C(g, FLOCO_P, x - 1, y - 1);
  return g;
}

// ============================================================

export const ANIMACOES_NATAL_D = [
  { id: "natal4-chuva-bengalas", nome: "Chuva de bengalas", criar: cenaChuvaBengalas, movimento: "baixo" },
  { id: "natal4-chuva-biscoitos", nome: "Chuva de biscoitos", criar: cenaChuvaBiscoitos, movimento: "baixo" },
  { id: "natal4-cascata-luzes", nome: "Cascata de luzes", criar: cenaCascataLuzes, movimento: "baixo" },
  { id: "natal4-neve-colorida", nome: "Neve colorida", criar: cenaNeveColorida, movimento: "baixo" },
  { id: "natal4-gorros-caindo", nome: "Gorros caindo", criar: cenaGorrosCaindo, movimento: "baixo" },
  { id: "natal4-fita-espiral", nome: "Fita espiral", criar: cenaFitaEspiral, movimento: "baixo" },
  { id: "natal4-cascata-neve", nome: "Cascata de neve", criar: cenaCascataNeve, movimento: "baixo" },
  { id: "natal4-pisca-fios", nome: "Pisca-pisca nos fios", criar: cenaPiscaFios, movimento: "baixo" },
  { id: "natal4-sinos-subindo", nome: "Sinos subindo", criar: cenaSinosSubindo, movimento: "cima" },
  { id: "natal4-noel-balao", nome: "Noel de balão", criar: cenaNoelBalao, movimento: "cima" },
  { id: "natal4-estrelinhas-subindo", nome: "Estrelinhas subindo", criar: cenaEstrelinhasSubindo, movimento: "cima" },
  { id: "natal4-pinheiro-sem-fim", nome: "Pinheiro sem fim", criar: cenaPinheiroSemFim, movimento: "cima" },
  { id: "natal4-elevador-presentes", nome: "Elevador de presentes", criar: cenaElevadorPresentes, movimento: "cima" },
  { id: "natal4-desfile-renas", nome: "Desfile de renas", criar: cenaDesfileRenas, movimento: "direita" },
  { id: "natal4-aviao-noel", nome: "Avião do Noel", criar: cenaAviaoNoel, movimento: "direita" },
  { id: "natal4-burrinho-estrela", nome: "Burrinho e a estrela", criar: cenaBurrinhoEstrela, movimento: "direita" },
  { id: "natal4-casa-biscoito", nome: "Casa de biscoito", criar: cenaCasaBiscoito },
  { id: "natal4-arvore-presentes", nome: "Árvore de presentes", criar: cenaArvorePresentes },
  { id: "natal4-globo-neve", nome: "Globo de neve", criar: cenaGloboNeve },
  { id: "natal4-cachecol", nome: "Cachecol listrado", criar: cenaCachecol },
  { id: "natal4-noel-mamae", nome: "Noel e Mamãe Noel", criar: cenaNoelMamae },
  { id: "natal4-chale", nome: "Chalé na montanha", criar: cenaChale },
  { id: "natal4-gatinho", nome: "Gatinho de gorro", criar: cenaGatinho },
  { id: "natal4-cachorrinho", nome: "Cachorrinho de gorro", criar: cenaCachorrinho },
  { id: "natal4-pinguim-presente", nome: "Pinguim com presente", criar: cenaPinguimPresente },
];
