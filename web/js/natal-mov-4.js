// Animações de Natal com movimento — parte 4: cenas.
import { FONTES } from "./fonte.js";
import { carimbar, ponto, retangulo } from "./pixelart.js";
import { atras, balanco, cintilar, circulo, mod, pontos, quadros } from "./movimento.js";

// ============================================================
// Chuva de doces: bengalas, balas de hortelã (que giram) e estrelinhas caem em velocidades
// diferentes e somem no chão.
// ============================================================

function chuvaDeDoces() {
  // [x, y inicial, tipo, quadros por passo, tamanho do passo]
  const DOCES = [
    [2, 0, "bengala", 3, 1],
    [14, 9, "bengala", 3, 1],
    [9, 4, "bala", 3, 1],
    [17, 15, "bala", 3, 1],
    [6, 11, "estrela", 2, 2],
    [12, 2, "estrela", 2, 2],
  ];
  const BENGALA = [
    [0, 0, "R"], [1, 0, "W"], [2, 0, "R"],
    [0, 1, "W"], [2, 1, "W"],
    [0, 2, "R"], [0, 3, "W"],
  ];
  const P = 60;
  return quadros(P, (g, t) => {
    retangulo(g, 0, 19, 19, 19, "W");
    DOCES.forEach(([x, y0, tipo, cada, passo], i) => {
      const k = Math.floor((t + i) / cada);
      const y = mod(y0 + k * passo, 20) - 1;
      if (tipo === "bengala") {
        BENGALA.forEach(([dx, dy, c]) => atras(g, [[x + dx, y + dy]], c));
      } else if (tipo === "bala") {
        const gira = k % 2;
        atras(g, [[x, y], [x + 1, y + 1]], gira ? "R" : "W");
        atras(g, [[x + 1, y], [x, y + 1]], gira ? "W" : "R");
      } else {
        atras(g, [[x, y]], k % 2 ? "Y" : "V");
      }
    });
  });
}

// ============================================================
// Trenó no morro: a criança desce o morro de trenó, voa na rampa, aterrissa e sai;
// a neve espirra atrás.
// ============================================================

function trenoNoMorro() {
  const CRIANCA = ["..B.", "..S.", ".GG.", "RRRR", "Y..Y"];
  // chão: desce de (0,6) até (11,12), rampa, e plano em 15
  const chao = (x) => (x <= 11 ? 6 + Math.round(x * 0.55) : x <= 13 ? 12 - (x - 11) : 16);
  // trajeto (canto de baixo à esquerda do trenó): desce pelo morro, voa em arco, aterrissa
  const caminho = [];
  for (let x = -4; x <= 10; x++) caminho.push([x, chao(x + 2) - 5]);
  const voo = [[11, 4], [12, 3], [13, 3], [14, 3], [15, 4], [16, 6], [17, 9], [18, 11]];
  caminho.push(...voo);
  for (let x = 19; x <= 21; x++) caminho.push([x, 11]);
  return quadros(caminho.length + 4, (g, t) => {
    for (let x = 0; x < 20; x++) {
      const y = chao(x);
      ponto(g, x, y, "W");
      if (y + 1 < 20) ponto(g, x, y + 1, "w");
    }
    carimbar(g, [".G.", "GGG", ".K."], 16, 13);
    const p = caminho[t];
    if (p) {
      carimbar(g, CRIANCA, p[0], p[1]);
      // neve espirrando atrás do trenó quando está no chão
      if (t < 15 && t % 2) atras(g, [[p[0] - 1, p[1] + 3], [p[0] - 2, p[1] + 2]], "W");
    }
    cintilar(g, t, [[3, 1], [10, 2], [17, 1], [14, 7]], { fraca: null, cada: 3 });
  });
}

// ============================================================
// Árvore se enfeitando: as bolas caem do céu e pousam nos galhos uma a uma; a estrela sobe
// até o topo e brilha; depois as bolas caem e tudo recomeça.
// ============================================================

function arvoreEnfeitando() {
  // contorno do pinheiro em 3 andares
  const contorno = [];
  const andares = [[3, 7, 3], [6, 11, 5], [9, 16, 7]]; // [topo, base, meia-largura da base]
  for (const [y0, y1, m] of andares) {
    for (let y = y0; y <= y1; y++) {
      const w = Math.round(((y - y0) / (y1 - y0)) * m);
      contorno.push([9 - w, y], [10 + w, y]);
    }
    for (let x = 9 - m; x <= 10 + m; x++) contorno.push([x, y1]);
  }
  const BOLAS = [[7, 10, "R"], [12, 9, "Y"], [10, 13, "B"], [5, 15, "F"], [14, 14, "R"], [9, 6, "C"], [8, 15, "Y"]];
  const QUEDA = 5; // quadros de queda de cada bola
  const fimBolas = BOLAS.length * QUEDA;
  const ESTRELA = 8;
  const BRILHA = 12;
  const CAI = 14;
  const total = fimBolas + ESTRELA + BRILHA + CAI;
  return quadros(total, (g, t) => {
    pontos(g, contorno, "G");
    retangulo(g, 9, 17, 10, 18, "K");
    retangulo(g, 0, 19, 19, 19, "W");
    BOLAS.forEach(([x, y, c], i) => {
      const ini = i * QUEDA;
      if (t < ini) return;
      let yy = y;
      if (t < ini + QUEDA) yy = Math.min(y, Math.round(y - (QUEDA - 1 - (t - ini)) * (y / (QUEDA - 1))));
      const cai = t - (fimBolas + ESTRELA + BRILHA) - i; // no fim caem, uma depois da outra
      if (cai >= 0) yy = y + 2 * cai + 1;
      if (yy <= 18) ponto(g, x, yy, c);
    });
    // a estrela sobe pelo meio até o topo
    const e = t - fimBolas;
    if (e >= 0 && t < fimBolas + ESTRELA + BRILHA) {
      const y = e < ESTRELA ? 16 - 2 * e : 1;
      carimbar(g, [".Y.", "YWY", ".Y."], 8 + (e % 2 && e < ESTRELA ? 1 : 0), Math.max(1, y) - 1);
      if (e >= ESTRELA) {
        // brilho: as bolas piscam uma de cada vez
        const [bx, by] = BOLAS[mod(e, BOLAS.length)];
        ponto(g, bx, by, "W");
        if (e % 2) pontos(g, [[7, 0], [12, 0]], "V");
      }
    }
  });
}

// ============================================================
// Meia de Natal: presentinhos e doces caem dentro da meia, um a um; a meia balança e
// engorda; no fim os presentes aparecem na boca da meia e brilham.
// ============================================================

function meiaDeNatal() {
  const MEIA = ["WWWW..", "WWWW..", ".RRR..", ".RRR..", ".RRR..", ".RRRR.", ".RRRRR", "..RRRR"];
  const ITENS = [["G", "Y"], ["B", "W"], ["P", "Y"]];
  const QUEDA = 8;
  const total = ITENS.length * (QUEDA + 3) + 10;
  return quadros(total, (g, t) => {
    retangulo(g, 0, 4, 19, 5, "K"); // lareira (prateleira)
    pontos(g, [[2, 3], [5, 3], [14, 3], [17, 3]], "G");
    const cheios = Math.min(ITENS.length, Math.floor(t / (QUEDA + 3)));
    const k = t % (QUEDA + 3);
    // balanço da meia logo depois de cada presente cair
    const bal = k >= QUEDA && k < QUEDA + 3 && t < ITENS.length * (QUEDA + 3) ? (k % 2 ? 1 : -1) : 0;
    const X = 7;
    carimbar(g, MEIA.slice(0, 5), X, 6);
    carimbar(g, MEIA.slice(5), X + bal, 11);
    if (cheios >= 2) pontos(g, [[X, 9], [X + 4, 10]], "R"); // engordou
    // presentes que já caíram aparecem na boca da meia
    for (let i = 0; i < cheios; i++) ponto(g, X + 1 + i, 5, ITENS[i][0]);
    // presente caindo
    if (cheios < ITENS.length && k < QUEDA) {
      const y = -1 + k;
      const [c, f] = ITENS[cheios];
      pontos(g, [[X + 1 + cheios, y], [X + 2 + cheios, y]].filter(([, yy]) => yy < 4), c);
      if (y - 1 < 4) ponto(g, X + 1 + cheios, y - 1, f);
    }
    // no fim, brilhos
    if (t >= ITENS.length * (QUEDA + 3)) {
      const b = t - ITENS.length * (QUEDA + 3);
      if (b < 8) pontos(g, b % 2 ? [[X - 1, 2], [X + 5, 1]] : [[X + 2, 0], [X + 6, 3]], "Y");
    }
    cintilar(g, t, [[1, 12], [17, 10], [15, 16], [2, 17]], { fraca: null, cada: 3 });
  });
}

// ============================================================
// Chocolate quente: marshmallows caem na caneca espirrando gotinhas; o vapor sobe em curvas.
// ============================================================

function chocolateQuente() {
  const QUEDA = 9;
  const P = 3 * (QUEDA + 3);
  return quadros(P, (g, t) => {
    // caneca
    retangulo(g, 4, 11, 13, 17, "R");
    retangulo(g, 5, 11, 12, 11, "K"); // chocolate
    pontos(g, [[14, 12], [15, 12], [15, 13], [15, 14], [14, 15]], "R"); // alça
    pontos(g, [[6, 14], [9, 15], [11, 13]], "W"); // bolinhas da caneca
    retangulo(g, 2, 18, 15, 18, "w");
    // marshmallow da vez caindo
    const i = Math.floor(t / (QUEDA + 3));
    const k = t % (QUEDA + 3);
    const xs = [6, 10, 8];
    const x = xs[i];
    if (k < QUEDA) pontos(g, [[x, k + 1], [x + 1, k + 1]].filter(([, y]) => y < 11), "W");
    if (k === QUEDA || k === QUEDA + 1) {
      const d = k - QUEDA + 1;
      pontos(g, [[x - d, 10 - d], [x + 1 + d, 10 - d]], "K"); // gotinhas
    }
    // marshmallows boiando
    for (let j = 0; j < i; j++) ponto(g, xs[j], 11, "W");
    // vapor: dois fios em S subindo
    for (const [x0, fase] of [[7, 0], [11, 3]]) {
      for (let a = 0; a < 2; a++) {
        const s = mod(t + fase + a * 4, 8);
        atras(g, [[x0 + balanco(s, 8, 1), 9 - s]], "w");
      }
    }
  });
}

// ============================================================
// Velas do Advento: o fósforo acende as quatro velas, uma a uma; as chamas tremulam;
// depois um sopro apaga todas e sobe fumacinha.
// ============================================================

function velasAdvento() {
  const VELAS = [[3, "M"], [7, "M"], [11, "P"], [15, "M"]];
  const ACENDE = 5; // quadros para o fósforo ir de uma vela à outra
  const TREMULA = 12;
  const APAGA = 8;
  const total = VELAS.length * ACENDE + TREMULA + APAGA;
  return quadros(total, (g, t) => {
    // coroa de folhas e velas
    retangulo(g, 1, 17, 18, 18, "G");
    pontos(g, [[2, 17], [6, 18], [10, 17], [14, 18], [17, 17]], "R");
    VELAS.forEach(([x, c]) => {
      retangulo(g, x, 11, x + 1, 16, c);
      ponto(g, x, 10, "k");
    });
    const acesas = Math.min(VELAS.length, Math.floor(t / ACENDE));
    const fimAcende = VELAS.length * ACENDE;
    const apagando = t >= fimAcende + TREMULA;
    // fósforo indo até a próxima vela
    if (t < fimAcende) {
      const k = t % ACENDE;
      const alvo = VELAS[acesas][0];
      const x = alvo - 3 + k;
      pontos(g, [[x, 9], [x - 1, 10]], "y");
      ponto(g, x + 1, 8, k % 2 ? "Y" : "O");
    }
    // chamas
    if (!apagando) {
      VELAS.slice(0, acesas).forEach(([x], i) => {
        const dança = mod(t + i, 3);
        ponto(g, x, 9, "O");
        ponto(g, x + (dança === 1 ? 1 : 0), 8, "Y");
        if (dança === 2) ponto(g, x, 7, "V");
      });
    } else {
      // fumacinha subindo das quatro velas
      const s = t - fimAcende - TREMULA;
      VELAS.forEach(([x], i) => {
        if (s < 6) atras(g, [[x + (s % 2), 8 - s + (i % 2)]], "w");
      });
    }
  });
}

// ============================================================
// Globo de neve: dentro do globo, a neve rodopia em volta da casinha e depois assenta devagar;
// o brilho do vidro corre pela borda.
// ============================================================

function globoDeNeve() {
  const borda = circulo(9.5, 8.5, 7.2, 44);
  const RODA = 24;
  const ASSENTA = 16;
  const FLOCOS = 6;
  return quadros(RODA + ASSENTA, (g, t) => {
    pontos(g, borda, "C");
    retangulo(g, 4, 16, 15, 17, "K"); // base
    retangulo(g, 5, 18, 14, 18, "y");
    // casinha e pinheiro dentro
    carimbar(g, ["..R..", ".RRR.", "RRRRR", ".WYW.", ".WWW."], 5, 10);
    carimbar(g, [".G.", "GGG", "GGG"], 11, 12);
    retangulo(g, 4, 15, 15, 15, "W");
    // neve: rodopia em círculos e depois cai até o chão do globo
    for (let i = 0; i < FLOCOS; i++) {
      const ang = (2 * Math.PI * (i / FLOCOS)) + (t < RODA ? t * 0.35 : RODA * 0.35);
      let x = Math.round(9.5 + 5 * Math.cos(ang));
      let y = Math.round(7 + 4 * Math.sin(ang));
      if (t >= RODA) y = Math.min(14, y + Math.floor((t - RODA) / 2));
      atras(g, [[x, y]], "W");
    }
    // brilho do vidro andando pela borda
    ponto(g, ...borda[mod(Math.floor(t / 2), borda.length)], "W");
  });
}

// ============================================================
// Guirlanda girando: as bolinhas coloridas giram em volta da guirlanda e as fitas do laço
// balançam.
// ============================================================

function guirlanda() {
  const anelExt = circulo(9.5, 8.5, 7, 40);
  const anelInt = circulo(9.5, 8.5, 5.5, 32);
  const CORES = ["R", "Y", "B", "W", "F", "O"];
  const P = 30;
  return quadros(P, (g, t) => {
    pontos(g, anelExt, "G");
    pontos(g, anelInt, "g");
    // bolinhas: metade anda nos quadros pares, metade nos ímpares (2 casas por vez)
    CORES.forEach((c, i) => {
      const tt = t - mod(t - i, 2);
      const a = (2 * Math.PI * tt) / P + (2 * Math.PI * i) / CORES.length;
      ponto(g, Math.round(9.5 + 6.3 * Math.cos(a)), Math.round(8.5 + 6.3 * Math.sin(a)), c);
    });
    // laço embaixo, com fitas que balançam
    carimbar(g, ["RR..RR", "RRRRRR", "RR..RR"], 7, 14);
    const b = Math.floor(t / 3) % 2;
    pontos(g, [[8 - b, 17], [7 - b, 18], [11 + b, 17], [12 + b, 18]], "R");
  });
}

// ============================================================
// NATAL saltitante: as letras pulam uma de cada vez, em onda; estrelinhas cintilam.
// ============================================================

function natalSaltitante() {
  const glifos = FONTES.pequena.glifos;
  const CORES = ["R", "G", "Y", "G", "R"];
  const PULO = [1, 2, 3, 2, 1, 0]; // altura do pulo em cada quadro
  const P = 5 * 4 + 8;
  return quadros(P, (g, t) => {
    "NATAL".split("").forEach((letra, i) => {
      const k = t - i * 4;
      const h = k >= 0 && k < PULO.length ? PULO[k] : 0;
      glifos[letra].forEach((fileira, dy) => {
        for (let dx = 0; dx < 3; dx++) if (fileira[dx] === "#") ponto(g, i * 4 + dx, 9 + dy - h, CORES[i]);
      });
    });
    retangulo(g, 0, 16, 19, 16, "w");
    cintilar(g, t, [[1, 2], [6, 4], [12, 1], [18, 3], [3, 19], [15, 18]], { fraca: null, cada: 2 });
  });
}

// ============================================================
// Lareira com faíscas: as pontas do fogo dançam e as faíscas sobem em zigue-zague;
// as meias balançam de leve.
// ============================================================

function lareira() {
  const PONTAS = [
    [[7, 12, "Y"], [10, 11, "Y"], [12, 12, "O"]],
    [[8, 11, "Y"], [10, 12, "O"], [12, 11, "Y"]],
    [[7, 11, "O"], [9, 12, "Y"], [11, 11, "Y"]],
  ];
  const FAISCAS = [[9, 0], [11, 5]];
  return quadros(36, (g, t) => {
    // contorno da lareira
    retangulo(g, 1, 3, 18, 3, "K");
    retangulo(g, 3, 4, 3, 17, "w");
    retangulo(g, 16, 4, 16, 17, "w");
    retangulo(g, 3, 4, 16, 4, "w");
    retangulo(g, 1, 18, 18, 18, "K");
    // meias penduradas, balançando uma de cada vez
    carimbar(g, ["W.", "R.", "RR"], 5 + (Math.floor(t / 6) % 2), 0);
    carimbar(g, ["W.", "G.", "GG"], 13 - (Math.floor((t + 3) / 6) % 2), 0);
    // lenha e fogo
    retangulo(g, 6, 16, 13, 16, "K");
    pontos(g, [[7, 15], [12, 15]], "K");
    carimbar(g, [".OOOO.", "OYYYYO", "ORYYRO"], 7, 13);
    PONTAS[t % 3].forEach(([x, y, c]) => ponto(g, x, y, c));
    // faíscas subindo em zigue-zague (uma linha a cada quadro)
    FAISCAS.forEach(([x, y0]) => {
      const y = 10 - mod(y0 + t, 9);
      atras(g, [[x + balanco(y, 4, 1), y]], mod(y0 + t, 9) < 4 ? "Y" : "O");
    });
  });
}

export const ANIMACOES_4 = [
  { id: "mov-doces", nome: "Chuva de doces", ms: 110, criar: chuvaDeDoces },
  { id: "mov-toboga", nome: "Trenó no morro", ms: 110, criar: trenoNoMorro },
  { id: "mov-enfeitar", nome: "Árvore se enfeitando", ms: 120, criar: arvoreEnfeitando },
  { id: "mov-meia", nome: "Meia de Natal", ms: 130, criar: meiaDeNatal },
  { id: "mov-chocolate", nome: "Chocolate quente", ms: 130, criar: chocolateQuente },
  { id: "mov-velas", nome: "Velas do Advento", ms: 140, criar: velasAdvento },
  { id: "mov-globo", nome: "Globo de neve", ms: 110, criar: globoDeNeve },
  { id: "mov-guirlanda", nome: "Guirlanda girando", ms: 110, criar: guirlanda },
  { id: "mov-letreiro", nome: "NATAL saltitante", ms: 110, criar: natalSaltitante },
  { id: "mov-lareira", nome: "Lareira com faíscas", ms: 130, criar: lareira },
];
