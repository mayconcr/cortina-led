// Animações de Natal com movimento — parte 3: personagens e brinquedos.
import { arte, carimbar, espelhar, linha, ponto, retangulo } from "./pixelart.js";
import { atras, balanco, cintilar, mod, pontos, quadros, vaiVolta } from "./movimento.js";

// ============================================================
// Duende malabarista: o duende joga três bolinhas para o alto, em arcos que se cruzam;
// as mãos sobem e descem alternadas.
// ============================================================

const DUENDE = [
  "...GY..",
  "..GGG..",
  ".WWWWW.",
  "SSkSkSS",
  ".SSSSS.",
  "..GGG..",
  ".GGYGG.",
  "..R.R..",
  "..K.K..",
];

function duendeMalabarista() {
  const X = 6;
  const Y = 10;
  // arco de uma bolinha: sai de uma mão e cai na outra (12 posições)
  const arco = (de, ate) =>
    Array.from({ length: 12 }, (_, i) => {
      const f = (i + 0.5) / 12;
      return [Math.round(de + (ate - de) * f), Math.round(15 - 13 * 4 * f * (1 - f))];
    });
  const caminho = [...arco(X + 7, X - 1), ...arco(X - 1, X + 7)]; // 24 posições em volta
  const cores = ["R", "Y", "C"];
  return quadros(24, (g, t) => {
    carimbar(g, DUENDE, X, Y);
    // mãos: a direita joga nos quadros 0–5 de cada 12, a esquerda nos 12–17
    const joga = mod(t, 12) < 3;
    const lado = Math.floor(t / 12) % 2; // 0: direita joga
    const maoDir = lado === 0 && joga ? [[X + 7, Y + 4], [X + 7, Y + 3]] : [[X + 7, Y + 5], [X + 7, Y + 6]];
    const maoEsq = lado === 1 && joga ? [[X - 1, Y + 4], [X - 1, Y + 3]] : [[X - 1, Y + 5], [X - 1, Y + 6]];
    pontos(g, [maoDir[0], maoEsq[0]], "G");
    pontos(g, [maoDir[1], maoEsq[1]], "S");
    // três bolinhas espaçadas no caminho; andam 1 posição por quadro (em alguns trechos, 2 casas)
    cores.forEach((c, i) => {
      const [x, y] = caminho[mod(t + i * 8, caminho.length)];
      atras(g, [[x, y]], c);
    });
    retangulo(g, 0, 19, 19, 19, "W");
    cintilar(g, t, [[2, 2], [17, 3], [16, 10], [2, 9]], { fraca: null, cada: 3 });
  });
}

// ============================================================
// Patinadora no lago: desliza de um lado para o outro do lago congelado, deixando brilhos
// no gelo, e dá um giro quando chega em cada margem.
// ============================================================

function patinadora() {
  const DIR = [".RR.", ".SS.", "YMM.", "MMMM", ".WWW"];
  const FRENTE = [".RR.", ".SS.", "MYYM", "MMMM", ".WW."];
  const ESQ = espelhar(DIR);
  const IDA = 14; // colunas percorridas
  const GIRO = 3;
  const seq = [];
  for (let i = 0; i <= IDA; i++) seq.push(["d", 1 + i]);
  for (let i = 0; i < GIRO; i++) seq.push([i === 1 ? "f" : i === 0 ? "e" : "d", 1 + IDA].map((v, j) => (j === 0 ? ["f", "e", "f"][i] : v)));
  for (let i = 0; i <= IDA; i++) seq.push(["e", 1 + IDA - i]);
  for (let i = 0; i < GIRO; i++) seq.push([["f", "d", "f"][i], 1]);
  return quadros(seq.length, (g, t) => {
    const [lado, x] = seq[t];
    carimbar(g, lado === "d" ? DIR : lado === "e" ? ESQ : FRENTE, x, 13);
    retangulo(g, 0, 18, 19, 18, "C");
    retangulo(g, 0, 19, 19, 19, "w");
    // brilhos que ficam no gelo atrás dela
    const antes = seq[mod(t - 3 - (t % 2), seq.length)];
    if (antes[0] !== "f") atras(g, [[antes[1] + (antes[0] === "d" ? 0 : 3), 17]], "W");
    // pinheiros nas margens
    carimbar(g, [".G.", "GGG", ".G.", "GGG"], 0, 13);
    cintilar(g, t, [[3, 2], [10, 1], [16, 4], [13, 8]], { fraca: null, cada: 3 });
  });
}

// ============================================================
// Noel esquiando: desce a encosta na diagonal, levantando neve, e some lá embaixo;
// os pinheiros ficam na beira da pista.
// ============================================================

function noelEsquiando() {
  const NOEL = [".RW.", ".SW.", "RRR.", "YYYY"];
  const PASSOS = 30;
  const encosta = (x) => Math.round(3 + x / 3); // linha da neve (desce 1 a cada 3 colunas)
  return quadros(PASSOS, (g, t) => {
    for (let x = 0; x < 20; x++) {
      const y = encosta(x) + 4;
      ponto(g, x, y, "W");
      if (y + 1 < 20) ponto(g, x, y + 1, "w");
    }
    carimbar(g, [".G.", "GGG", "GGG", ".K."], 3, encosta(3) + 1);
    carimbar(g, [".G.", "GGG", "GGG", ".K."], 15, encosta(15) + 1);
    const x = -5 + t;
    carimbar(g, NOEL, x, encosta(x + 2));
    ponto(g, x - 1, encosta(x + 2) + 2, "w"); // bastão
    // neve espirrando atrás dos esquis
    if (t % 3 === 1) atras(g, [[x - 2, encosta(x + 2) + 1], [x - 3, encosta(x + 2) + 2]], "W");
    else if (t % 3 === 2) atras(g, [[x - 2, encosta(x + 2) + 2]], "C");
  });
}

// ============================================================
// Rena pulando cercas: a rena galopa (a câmera acompanha) e as cercas vêm da direita;
// quando chega uma cerca, ela estica as patas num salto e a cerca passa por baixo.
// ============================================================

const RENA_GRANDE = espelhar([
  "..y..y.......",
  "..yy.yy......",
  "...yyy.......",
  "...KKK.......",
  "..K.KK.......",
  ".KKKKK.......",
  "....KK.......",
  "....KRKKKKKKW",
  "....KRKKKKKKK",
  "....YRKKKKKK.",
]).map((l) => l.slice(0));

// pernas (linhas 10 e 11 do desenho): galope e salto, já viradas para a direita
const PERNAS_RENA = [
  [[8, 10], [9, 11], [1, 10], [0, 11]],
  [[7, 10], [7, 11], [2, 10], [2, 11]],
  [[7, 10], [6, 11], [2, 10], [3, 11]],
  [[7, 10], [7, 11], [2, 10], [1, 11]],
];
const SALTO = [[8, 10], [10, 10], [2, 10], [0, 10]];

function renaCercas() {
  const X = 4;
  const Y = 5;
  const CERCA = ["y.y", "yyy", "y.y"];
  const P = 30; // uma cerca a cada 30 quadros
  return quadros(P, (g, t) => {
    carimbar(g, RENA_GRANDE, X, Y);
    // a cerca anda 2 colunas a cada 2 quadros (nos quadros ímpares)
    const xc = 22 - 2 * Math.floor((t + 1) / 2);
    const pulando = xc >= X - 2 && xc <= X + 12;
    // pernas (nos quadros pares)
    const pernas = pulando ? SALTO : PERNAS_RENA[Math.floor(t / 2) % 4];
    pontos(g, pernas.map(([dx, dy]) => [X + dx, Y + dy]), "K");
    ponto(g, X + 12, Y + 5, Math.floor(t / 2) % 2 ? "O" : "R"); // nariz
    retangulo(g, 0, 19, 19, 19, "W");
    carimbar(g, CERCA, xc, 16);
    atras(g, [[mod(5 - 2 * Math.floor((t + 1) / 2), 20), 18], [mod(15 - 2 * Math.floor((t + 1) / 2), 20), 18]], "w");
    cintilar(g, t, [[1, 1], [9, 2], [16, 1], [18, 6]], { fraca: null, cada: 3 });
  });
}

// ============================================================
// Noel dançando: braços e pernas trocam de passo (um de cada vez) e as luzes do chão correm.
// ============================================================

const NOEL_FRENTE = [
  "....RRW..",
  "...RRRR..",
  "..WWWWW..",
  "..SkSkS..",
  "..WSRSW..",
  "..WWWWW..",
  ".RRWWWRR.",
  ".RRRRRRR.",
  ".KKKYKKK.",
  ".RRRRRRR.",
];

function noelDancando() {
  const X = 5;
  const Y = 4;
  const BRACOS = {
    baixo: [[0, 7], [0, 8], [0, 9, "W"]],
    cima: [[0, 5], [0, 4], [0, 3, "W"]],
    fora: [[-1, 6], [-2, 5], [-3, 4, "W"]],
  };
  const PASSOS = [
    ["cima", "baixo"],
    ["fora", "fora"],
    ["baixo", "cima"],
    ["fora", "fora"],
  ];
  const PERNAS = [
    ["..RR.RR..", "..KK.KK.."],
    [".RR...RR.", "KK.....KK"],
    ["..RR.RR..", "..KK.KK.."],
    ["..RR..RR.", "..KK...KK"],
  ];
  const luzes = ["R", "Y", "G", "B", "F"];
  return quadros(16, (g, t) => {
    carimbar(g, NOEL_FRENTE, X, Y);
    // braços nos quadros pares, pernas nos ímpares
    const [esq, dir] = PASSOS[Math.floor(t / 2) % 4];
    for (const [dx, dy, c] of BRACOS[esq]) ponto(g, X + dx, Y + dy, c || "R");
    for (const [dx, dy, c] of BRACOS[dir]) ponto(g, X + 8 - dx, Y + dy, c || "R");
    carimbar(g, PERNAS[Math.floor((t + 1) / 2) % 4], X, Y + 10);
    // luzes do chão correndo
    for (let i = 0; i < 3; i++) ponto(g, 3 + i * 7, 18, luzes[mod(i + Math.floor(t / 2), 5)]);
    retangulo(g, 0, 19, 19, 19, "w");
  });
}

// ============================================================
// Bola de neve rolando: desce o morro crescendo, bate no pinheiro e explode em flocos.
// ============================================================

function bolaDeNeve() {
  const BOLAS = [["W"], [".W.", "WWW", ".W."], [".WW.", "WWWW", "WWWW", ".WW."]];
  const morro = (x) => Math.round(4 + x * 0.6); // chão do morro
  const ROLA = 18;
  const EXPLODE = 6;
  return quadros(ROLA + EXPLODE + 4, (g, t) => {
    for (let x = 0; x < 20; x++) {
      const y = Math.min(19, morro(x));
      ponto(g, x, y, "W");
      if (y + 1 < 20) ponto(g, x, y + 1, "w");
    }
    // pinheiro no pé do morro
    const PX = 16;
    const balanca = t >= ROLA && t < ROLA + 3 ? 1 : 0;
    carimbar(g, ["..G..", ".GGG.", "GGGGG", ".GGG.", "GGGGG"], PX - 1 + balanca, 9);
    ponto(g, PX + 1, 14, "K");
    if (t < ROLA) {
      const x = -2 + t;
      const b = BOLAS[t < 6 ? 0 : t < 12 ? 1 : 2];
      carimbar(g, b, x - Math.floor(b[0].length / 2), morro(x) - b.length);
      if (t >= 6 && t % 2) atras(g, [[x - 2, morro(x - 2) - 1]], "w"); // rastro de neve
    } else if (t < ROLA + EXPLODE) {
      const d = t - ROLA + 1;
      const cx = 14;
      const cy = 11;
      atras(g, [[cx - d, cy - d], [cx + 1, cy - d - 1], [cx - d - 1, cy], [cx - 1, cy - d * 2 + 1], [cx - d + 1, cy + 1]].filter(([, y]) => y >= 0), d < 4 ? "W" : "C");
    }
  });
}

// ============================================================
// Gato e a bola de Natal: a bola pendurada balança, o gato acompanha com os olhos
// e dá patadas quando ela chega perto; o rabo abana.
// ============================================================

function gatoBola() {
  const GATO = [
    "O...O..",
    "OO.OO..",
    "OOOOO..",
    "O.O.O..",
    "OOyOO..",
    ".OWO...",
    "OOWOO..",
    "OOWOO..",
    "OOOOO..",
  ];
  const P = 16;
  // a bola anda nos quadros pares; o gato reage (olhos, pata, rabo) nos ímpares
  const desvio = (tt) => balanco(tt - mod(tt, 2), P, 2);
  return quadros(P, (g, t) => {
    retangulo(g, 4, 0, 19, 0, "g");
    pontos(g, [[8, 1], [15, 1]], "G");
    const d = desvio(t);
    linha(g, 12, 1, 12 + Math.round(d / 2), 4, "w");
    const bx = 11 + d;
    carimbar(g, [".Y.", "RRR", "RRR", ".R."], bx, 5);
    ponto(g, bx, 6, "W"); // brilho
    const GX = 3;
    const GY = 10;
    carimbar(g, GATO, GX, GY);
    const dg = desvio(t - 1); // o gato vê com um quadro de atraso
    const olhar = dg > 0 ? 1 : 0;
    pontos(g, [[GX + 1 + olhar, GY + 3], [GX + 3, GY + 3]], "L");
    if (dg <= -1) pontos(g, [[GX + 5, GY + 5], [GX + 6, GY + 4], [GX + 7, GY + 3]], "O");
    else pontos(g, [[GX + 5, GY + 7], [GX + 5, GY + 8]], "O");
    pontos(g, Math.floor((t + 3) / 8) % 2 ? [[GX - 1, GY + 8], [GX - 2, GY + 7], [GX - 2, GY + 6]] : [[GX - 1, GY + 8], [GX - 2, GY + 8], [GX - 3, GY + 7]], "O");
    retangulo(g, 0, 19, 19, 19, "y");
  });
}

// ============================================================
// Pião girando: as listras giram, o pião bambeia e passeia pelo chão, deixando um risquinho.
// ============================================================

function piao() {
  // faixas de uma cor por linha (andar para o lado custa pouco); o brilho branco corre pela
  // faixa do meio (dá a ideia de giro) e o pião passeia de um lado para o outro
  const PIAO = ["..K..", ".RRR.", "YYYYY", "GGGGG", ".RRR.", "..K.."];
  const PASSOS = 13; // colunas de passeio
  return quadros(4 * (PASSOS - 1), (g, t) => {
    const cx = 1 + vaiVolta(Math.floor(t / 2), PASSOS);
    carimbar(g, PIAO, cx, 9);
    ponto(g, cx + mod(t, 5), 11, "W"); // brilho girando na faixa amarela
    retangulo(g, 0, 15, 19, 15, "y");
    // risquinhos de movimento dos dois lados (trocam nos quadros ímpares)
    pontos(g, Math.floor(t / 2) % 2 ? [[cx - 2, 10], [cx + 6, 12]] : [[cx - 2, 12], [cx + 6, 10]], "w");
    cintilar(g, t, [[2, 2], [16, 1], [9, 3], [17, 6]], { fraca: null, cada: 3 });
  });
}

// ============================================================
// Trem de Natal: a locomotiva puxa um vagão de presentes (a câmera acompanha); as rodas giram,
// a fumaça sai e fica para trás, e os pinheiros passam.
// ============================================================

const TREM = arte([
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "..............K.....",
  "........RRR...K.....",
  "........R.R..KKK....",
  "..RGB...RRRRRRRRR...",
  "..GYG...RRRRRRRRRY..",
  ".KKKKK..KKKKKKKKKK..",
  ".KKKKK.KKKKKKKKKKKK.",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
]);

function tremDeNatal() {
  const RODAS = [2, 4, 10, 13, 16];
  return quadros(20, (g, t) => {
    TREM.forEach((l, y) => l.forEach((c, x) => c && ponto(g, x, y, c)));
    // rodas: o raio branco gira (troca a cada 2 quadros)
    RODAS.forEach((x) => ponto(g, x, 15, "w"));
    if (Math.floor(t / 2) % 2) pontos(g, RODAS.map((x) => [x, 15]), "W");
    retangulo(g, 0, 16, 19, 16, "w");
    // fumaça: duas bolinhas saem da chaminé e ficam para trás subindo
    for (let k = 0; k < 2; k++) {
      const idade = mod(t - k * 5, 10);
      atras(g, [[14 - idade, 7 - Math.floor(idade / 2)]], idade < 3 ? "W" : "w");
    }
    // um pinheiro passando (2 colunas a cada 2 quadros, nos quadros ímpares)
    const px = 2 * Math.floor((t + 1) / 2);
    carimbar(g, [".G.", "GGG", ".K."], mod(14 - px, 20) - 1, 17);
    cintilar(g, t, [[2, 2], [8, 1], [17, 3], [4, 6]], { fraca: null, cada: 4 });
  });
}

// ============================================================
// Caixa surpresa: a caixa treme, a tampa abre e o Noel sai numa mola, balança e volta.
// ============================================================

function caixaSurpresa() {
  const CABECA = ["RRR", "SkS", "WWW"];
  // altura da cabeça (0 = guardada): sobe, balança na mola e volta
  const ALT = [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0];
  const ABERTA = (t) => ALT[t] > 0 || ALT[t - 1] > 0;
  return quadros(ALT.length, (g, t) => {
    const X = 7;
    const h = ALT[t];
    // a cabeça e a mola ficam atrás da caixa (desenhadas antes)
    if (h > 0) {
      carimbar(g, CABECA, X + 1, 13 - h);
      for (let y = 16 - h; y <= 12; y++) ponto(g, X + 2 + (y % 2), y, "w");
    }
    retangulo(g, X, 13, X + 5, 18, "G");
    retangulo(g, X + 2, 13, X + 3, 18, "Y");
    retangulo(g, 0, 19, 19, 19, "w");
    if (!ABERTA(t)) {
      retangulo(g, X - 1, 12, X + 6, 12, "R"); // tampa fechada
      pontos(g, [[X + 2, 11], [X + 3, 11]], "Y");
      // a caixa "treme" antes de abrir
      if (t >= 2 && t <= 4) pontos(g, t % 2 ? [[X - 2, 14], [X + 7, 16]] : [[X - 2, 16], [X + 7, 14]], "W");
    } else {
      linha(g, X + 6, 12, X + 8, 8, "R"); // tampa aberta de lado
    }
    if (h === 8) pontos(g, [[X - 2, 4], [X + 6, 3]], "Y"); // estrelinhas no alto
  });
}

export const ANIMACOES_3 = [
  { id: "mov-duende", nome: "Duende malabarista", ms: 110, criar: duendeMalabarista },
  { id: "mov-patinadora", nome: "Patinadora no lago", ms: 100, criar: patinadora },
  { id: "mov-esqui", nome: "Noel esquiando", ms: 110, criar: noelEsquiando },
  { id: "mov-cercas", nome: "Rena pulando cercas", ms: 120, criar: renaCercas },
  { id: "mov-noel-danca", nome: "Noel dançando", ms: 160, criar: noelDancando },
  { id: "mov-bola-neve", nome: "Bola de neve rolando", ms: 120, criar: bolaDeNeve },
  { id: "mov-gato", nome: "Gato e a bola de Natal", ms: 140, criar: gatoBola },
  { id: "mov-piao", nome: "Pião girando", ms: 110, criar: piao },
  { id: "mov-trem", nome: "Trem de Natal", ms: 140, criar: tremDeNatal },
  { id: "mov-caixa", nome: "Caixa surpresa", ms: 140, criar: caixaSurpresa },
];
