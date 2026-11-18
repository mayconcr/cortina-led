// Animações de Natal com movimento — parte 2: céu e bichos.
import { N, carimbar, disco, ponto, retangulo } from "./pixelart.js";
import { atras, balanco, cintilar, fluxo, mod, pontos, quadros, rastro } from "./movimento.js";

/** Apaga um LED (fora da grade é ignorado). */
function apagar(g, x, y) {
  if (x >= 0 && x < N && y >= 0 && y < N) g[y][x] = null;
}

// ============================================================
// Noel na frente da lua: a rena e o trenó passam na frente da lua cheia. Em cima da lua viram
// silhueta (LEDs apagados); fora dela aparecem coloridos. A rena anda e o trenó vem atrás,
// um de cada vez, como se puxasse.
// ============================================================

const LUA = { cx: 10, cy: 8, r: 5.5 };
const naLua = (x, y) => Math.hypot(x - LUA.cx, y - LUA.cy) <= LUA.r;

const RENA_LUA = [
  ["y.y....", ".y.....", "RKKKKKK", "..KKKKK", ".K....K"],
  ["y.y....", ".y.....", "RKKKKKK", "..KKKKK", "..K..K."],
];
const TRENO_LUA = ["....R", "...RR", "YRRRR", ".YYYY"];

function silhueta(g, sprite, x0, y0) {
  sprite.forEach((fileira, dy) =>
    Array.from(fileira).forEach((c, dx) => {
      if (c === ".") return;
      if (naLua(x0 + dx, y0 + dy)) apagar(g, x0 + dx, y0 + dy);
      else ponto(g, x0 + dx, y0 + dy, c);
    }),
  );
}

function luaNoel() {
  const crateras = [[8, 6], [12, 10], [13, 5], [7, 11]];
  const estrelas = [[2, 2], [17, 1], [1, 15], [18, 17], [4, 18]];
  const LR = 7; // largura da rena
  const DR = 9; // distância da rena até o trenó (rena + rédeas)
  const L = 20 + DR + 5; // passos de uma passagem completa
  const seq = [];
  for (let s = 0; s < L; s++) seq.push([s + 1, s], [s + 1, s + 1]);
  return quadros(seq.length, (g, t) => {
    disco(g, LUA.cx, LUA.cy, LUA.r, "V");
    pontos(g, crateras, "Y");
    const [sr, st] = seq[t];
    const xr = 20 - sr;
    const xt = 20 + DR - st;
    const y0 = 6;
    silhueta(g, RENA_LUA[Math.floor(t / 2) % 2], xr, y0);
    for (let x = xr + LR; x < xt; x++) silhueta(g, ["y"], x, y0 + 2);
    silhueta(g, TRENO_LUA, xt, y0 + 1);
    cintilar(g, t, estrelas, { cada: 2 });
  });
}

// ============================================================
// Cardeal voando: o passarinho vermelho atravessa em ondas, batendo as asas; neve caindo.
// ============================================================

function cardeal() {
  const corpo = ["..R.", ".RRO", "RRR."];
  // asa (vermelho escuro): em cima, embaixo — troca nos quadros pares
  const ASAS = [
    [[1, 0], [1, -1], [0, -1]],
    [[1, 3], [2, 3]],
  ];
  const flocos = [[3, 2], [9, 12], [15, 6], [18, 15]];
  return quadros(30, (g, t) => {
    const x = -5 + t;
    const y = 8 + balanco(t, 30, 2);
    carimbar(g, corpo, x, y);
    pontos(g, ASAS[Math.floor(t / 2) % 2].map(([dx, dy]) => [x + dx, y + dy]), "r");
    pontos(g, [[0, 19], [1, 19], [2, 18], [17, 19], [18, 18], [19, 19]], "W");
    flocos.forEach(([fx, fy], i) => fluxo(g, Math.floor((t + i) / 4), [[fx, fy]], { vy: 2, cor: "w" }));
  });
}

// ============================================================
// Anjo voando: o anjinho atravessa batendo as asas e deixa um rastro de brilhos.
// ============================================================

function anjo() {
  const corpo = ["..YY", "..SS", ".WWW", "WWWW"];
  // asas (azul-gelo) presas nas costas: em cima e embaixo
  const ASAS = [
    [[0, 1], [-1, 0]],
    [[0, 2], [-1, 3]],
  ];
  const DUR = 32;
  return quadros(DUR, (g, t) => {
    const x = -4 + t;
    const y = 6;
    carimbar(g, corpo, x, y);
    pontos(g, ASAS[Math.floor(t / 2) % 2].map(([dx, dy]) => [x + dx, y + dy]), "C");
    // rastro: um brilho deixado a cada 2 quadros, que apaga devagar
    const b = t - (t % 2);
    for (const [k, c] of [[3, "V"], [5, "y"]]) atras(g, [[-4 + b - k, y + 4 + ((b / 2) % 2)]], c);
    cintilar(g, t, [[3, 2], [16, 1], [12, 15], [2, 16]], { fraca: null, cada: 3 });
  });
}

// ============================================================
// Fogos na noite de Natal: foguetes sobem com rastro e estouram em estrelas coloridas
// sobre uma arvorezinha.
// ============================================================

function fogos() {
  const DISPAROS = [
    { x: 5, alto: 5, cor: "R", ini: 0 },
    { x: 14, alto: 4, cor: "Y", ini: 10 },
    { x: 9, alto: 3, cor: "G", ini: 20 },
    { x: 15, alto: 7, cor: "F", ini: 30 },
  ];
  const RAIOS = [[1, 0], [-1, 0], [0.5, 0.87], [-0.5, 0.87], [0.5, -0.87], [-0.5, -0.87]];
  return quadros(40, (g, t) => {
    carimbar(g, ["..Y..", "..G..", ".GGG.", "GGGGG", "..K.."], 1, 15);
    carimbar(g, ["..G..", ".GGG.", "GGGGG", "..K.."], 15, 16);
    for (const d of DISPAROS) {
      const k = mod(t - d.ini, 40);
      const subida = Math.ceil((18 - d.alto) / 2);
      if (k < subida) {
        const y = 18 - 2 * k;
        ponto(g, d.x, y, "W");
        atras(g, [[d.x, y + 1]], "O");
      } else if (k < subida + 5) {
        const r = k - subida + 1; // 1, 2, 3, 4 (some), 5 (some)
        if (r <= 3) {
          const c = r === 3 ? "V" : d.cor;
          atras(g, RAIOS.map(([dx, dy]) => [Math.round(d.x + dx * r * 1.6), Math.round(d.alto + dy * r * 1.6)]), c);
          if (r === 1) ponto(g, d.x, d.alto, "W");
        } else if (r === 4) {
          atras(g, RAIOS.map(([dx, dy]) => [Math.round(d.x + dx * 5), Math.round(d.alto + dy * 5 + 1)]), "y");
        }
      }
    }
  });
}

// ============================================================
// Rudolph no céu: na noite escura só se vê o nariz vermelho do Rudolph puxando o cordão de
// sininhos dourados das renas e o trenó; eles atravessam o céu dando loopings, com brilho atrás.
// ============================================================

function caminhoLoopings() {
  // trocoide (curva com laços): x = a·θ − b·sen θ, y = c − b·cos θ, com b > a
  const bruto = [];
  for (let i = 0; i <= 2000; i++) {
    const th = -0.6 + (4 * Math.PI + 1.2) * (i / 2000);
    bruto.push([Math.round(-7 + 2.6 * th + 1.5 - 4.2 * Math.sin(th)), Math.round(8 - 4.2 * Math.cos(th))]);
  }
  const pts = [];
  for (const p of bruto) {
    const u = pts.at(-1);
    if (!u || u[0] !== p[0] || u[1] !== p[1]) pts.push(p);
  }
  return pts;
}

function renaLooping() {
  const caminho = caminhoLoopings();
  // do nariz para trás: nariz, renas (sininhos), rédea, trenó, Noel, brilhos
  const CORDAO = ["R", "K", "Y", "K", "Y", "K", "Y", "y", "R", "R", "W", "V", "y"];
  const n = caminho.length + CORDAO.length;
  const casas = [[1, 16], [8, 15], [14, 16]];
  return quadros(n, (g, t) => {
    // vila dormindo lá embaixo
    casas.forEach(([x, y]) => {
      carimbar(g, ["..W..", ".WWW.", "WKKKW", ".KYK."], x, y);
    });
    retangulo(g, 0, 19, 19, 19, "W");
    CORDAO.forEach((c, k) => {
      const p = caminho[t - k];
      if (p) ponto(g, p[0], p[1], c);
    });
    if (caminho[t]) ponto(g, caminho[t][0], caminho[t][1], t % 2 ? "R" : "O"); // nariz brilhando
    cintilar(g, t, [[2, 2], [16, 3], [11, 1], [5, 9]], { fraca: null, cada: 3 });
  });
}

// ============================================================
// Nevasca: o vento leva a neve quase na horizontal (rápida e devagar) e a ponta dos
// pinheiros balança.
// ============================================================

function nevasca() {
  const arvores = [2, 9, 16];
  const rapidos = [[18, 1], [10, 6], [4, 11]];
  const lentos = [[14, 3], [7, 9]];
  return quadros(20, (g, t) => {
    retangulo(g, 0, 19, 19, 19, "W");
    arvores.forEach((x0, i) => {
      carimbar(g, [".....", ".GGG.", "..G..", ".GGG.", "GGGGG", "..K.."], x0 - 1, 13);
      // a ponta balança com o vento (cada árvore no seu tempo)
      const vento = Math.floor((t + i * 2) / 3) % 2;
      ponto(g, x0 + 1 - vento, 13, "G");
      ponto(g, x0 + 1 - 2 * vento, 12, "W");
    });
    // neve rápida: 2 colunas por quadro para a esquerda, 1 linha a cada 2 quadros
    rapidos.forEach(([x, y]) => atras(g, [[mod(x - 2 * t, 20), mod(y + Math.floor(t / 2), 12)]], "W"));
    // neve lenta: 2 colunas a cada 2 quadros
    lentos.forEach(([x, y]) => atras(g, [[mod(x - 2 * Math.floor(t / 2), 20), mod(y + Math.floor(t / 4), 12)]], "w"));
  });
}

// ============================================================
// Biscoito correndo: o boneco de gengibre atravessa correndo, braços e pernas alternando.
// ============================================================

function biscoito() {
  // o biscoito corre no lugar (a câmera acompanha) e as bengalas e confeitos passam para trás
  const corpo = [".KKK.", ".KWK.", ".KKK.", "..K..", ".KKK.", ".KWK.", ".KKK."];
  const POSES = [
    { bracos: [[0, 4], [-1, 5], [4, 4], [5, 3]], pernas: [[1, 7], [0, 8], [3, 7], [4, 8]] },
    { bracos: [[0, 4], [0, 5], [4, 4], [4, 5]], pernas: [[1, 7], [1, 8], [3, 7], [3, 8]] },
    { bracos: [[0, 4], [-1, 3], [4, 4], [5, 5]], pernas: [[1, 7], [2, 8], [3, 7], [2, 8]] },
    { bracos: [[0, 4], [0, 5], [4, 4], [4, 5]], pernas: [[1, 7], [1, 8], [3, 7], [3, 8]] },
  ];
  const BENGALA = [".WR", "R..", "W..", "R..", "W.."];
  const confeitos = [[3, 18, "R"], [13, 18, "G"]];
  return quadros(40, (g, t) => {
    const x = 7;
    const y = 9;
    carimbar(g, corpo, x, y);
    // quadros pares: troca a pose e os confeitos andam; ímpares: a bengala anda 2 colunas
    const p = POSES[Math.floor(t / 2) % 4];
    pontos(g, p.bracos.map(([dx, dy]) => [x + dx, y + dy]), "K");
    pontos(g, p.pernas.map(([dx, dy]) => [x + dx, y + dy]), "K");
    retangulo(g, 0, 19, 19, 19, "y");
    const pc = 2 * Math.floor(t / 2);
    confeitos.forEach(([cx, cy, c]) => atras(g, [[mod(cx - pc, 20), cy]], c));
    const pb = 2 * Math.floor((t + 1) / 2);
    carimbar(g, BENGALA, 22 - mod(pb, 40), 14);
  });
}

// ============================================================
// Pinguim deslizando: anda gingando para a direita e volta deslizando de barriga.
// ============================================================

function pinguim() {
  const EM_PE = [".BB.", "BWWO", "BWWB", "BWWB"];
  const PES = [".OO.", ".O.O"];
  const DEITADO = [".BBBB", "OBBBB", ".WWWW"];
  const ANDA = 36; // anda 1 coluna a cada 2 quadros (de -4 até 13)
  const DESLIZA = 11; // agacha e volta deslizando 2 colunas por quadro
  return quadros(ANDA + DESLIZA, (g, t) => {
    retangulo(g, 0, 19, 19, 19, "C");
    pontos(g, [[3, 18], [12, 18]], "W");
    if (t < ANDA) {
      // quadros pares: dá o passo; ímpares: troca o pé e a nadadeira (gingando)
      const x = -4 + Math.floor(t / 2);
      const ginga = Math.floor((t + 1) / 2) % 2;
      carimbar(g, EM_PE, x, 13);
      carimbar(g, [PES[ginga]], x, 17);
      ponto(g, ginga ? x - 1 : x + 4, 15, "B");
    } else if (t === ANDA) {
      carimbar(g, [".BBO", "BWWB", ".OO."], 13, 15); // agacha
    } else {
      const k = t - ANDA - 1;
      const x = 12 - 2 * k;
      carimbar(g, DEITADO, x, 16);
      atras(g, [[x + 6, 18]], "W"); // brilho do gelo atrás
    }
    cintilar(g, t, [[2, 3], [9, 1], [17, 4], [14, 9]], { fraca: null, cada: 3 });
  });
}

// ============================================================
// Urso polar passeando: o urso branco atravessa devagar, as patas alternando; neve caindo.
// ============================================================

function ursoPolar() {
  const corpo = [".....WW.", "WWWWWWWk", "WWWWWWW."];
  const PATAS = ["W.W..W.W", ".W.W..W."];
  const flocos = [[3, 0], [10, 7], [16, 3], [7, 12]];
  return quadros(30, (g, t) => {
    const x = -8 + t;
    carimbar(g, corpo, x, 14);
    carimbar(g, [PATAS[t % 2]], x, 17);
    ponto(g, x + 6, 14, "W");
    retangulo(g, 0, 18, 19, 18, "w");
    retangulo(g, 0, 19, 19, 19, "W");
    flocos.forEach(([fx, fy], i) => fluxo(g, Math.floor((t + i) / 3), [[fx, fy]], { vy: 2, cor: "W" }));
  });
}

// ============================================================
// Coelho saltitante: o coelho atravessa pulando em arcos; as pegadas ficam e somem.
// ============================================================

function coelho() {
  const CORPO = [".WWWk", "WWWW.", ".W.W."];
  const ORELHAS = [
    [[3, -2], [3, -1], [4, -1]], // em pé
    [[4, -2], [3, -1], [2, -1]], // deitadas para trás no pulo
  ];
  const PULO = 6; // quadros por pulo
  const ALT = [0, 1, 2, 2, 1, 0];
  return quadros(30, (g, t) => {
    const x = -5 + t;
    const k = t % PULO;
    const y = 15 - ALT[k];
    carimbar(g, CORPO, x, y);
    pontos(g, ORELHAS[ALT[k] ? 1 : 0].map(([dx, dy]) => [x + dx, y + dy]), "W");
    retangulo(g, 0, 19, 19, 19, "W");
    retangulo(g, 0, 18, 19, 18, "w");
    // pegadas de cada pouso, que somem depois de 12 quadros
    for (let p = 0; p <= t; p += PULO) {
      if (t - p < 12) atras(g, [[-5 + p + 1, 18], [-5 + p + 3, 18]], "C");
    }
    cintilar(g, t, [[2, 3], [11, 2], [17, 6], [6, 8]], { fraca: null, cada: 3 });
  });
}

export const ANIMACOES_2 = [
  { id: "mov-lua", nome: "Noel na frente da lua", ms: 110, criar: luaNoel },
  { id: "mov-cardeal", nome: "Cardeal voando", ms: 110, criar: cardeal },
  { id: "mov-anjo", nome: "Anjo voando", ms: 120, criar: anjo },
  { id: "mov-fogos", nome: "Fogos na noite de Natal", ms: 100, criar: fogos },
  { id: "mov-rudolph", nome: "Rudolph no céu", ms: 90, criar: renaLooping },
  { id: "mov-nevasca", nome: "Nevasca", ms: 110, criar: nevasca },
  { id: "mov-biscoito", nome: "Biscoito correndo", ms: 110, criar: biscoito },
  { id: "mov-pinguim", nome: "Pinguim deslizando", ms: 130, criar: pinguim },
  { id: "mov-urso", nome: "Urso polar passeando", ms: 130, criar: ursoPolar },
  { id: "mov-coelho", nome: "Coelho saltitante", ms: 120, criar: coelho },
];

