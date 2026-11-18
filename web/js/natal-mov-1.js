// Animações de Natal com movimento — parte 1 (modelos).
import { arte, carimbar, espelhar, linha, ponto, retangulo } from "./pixelart.js";
import { atras, balanco, cintilar, circulo, fluxo, mod, pontos, pulo, quadros, rastro } from "./movimento.js";

// ============================================================
// Trenó do Papai Noel (de perto, voando para a esquerda; a câmera acompanha):
// a rena galopa, o nariz brilha, o Noel acena, o pompom balança, um brilho corre no patim
// e as estrelas passam para trás (umas rápidas, outras devagar).
// ============================================================

const TRENO_FUNDO = [
  "..y..y..............",
  "..yy.yy.............",
  "...yyy..............",
  "...KKK..............",
  "..K.KK..............",
  ".KKKKK..............",
  "....KK..............",
  "....KRKKKKKKW.......",
  "....KRKKKKKKK.......",
  "....YRKKKKKK........",
  "....................",
  ".............RRR....",
  "............RRRR....",
  "...........WWWWW..K.",
  "...........S.SSS.KKK",
  "..........WWWWW..KKK",
  ".........Y.WWWRRKKKK",
  ".........YYRRRRRRRRR",
  "..........YRRRRRRRRR",
  ".........YYYYYYYYYY.",
];

// pernas da rena (linhas 10 e 11): uma dianteira (perto da coluna 5) e uma traseira (perto da 11)
const TRENO_PERNAS = [
  [[4, 10], [3, 11], [11, 10], [12, 11]], // esticadas
  [[5, 10], [5, 11], [10, 10], [10, 11]], // embaixo
  [[5, 10], [6, 11], [10, 10], [9, 11]], // encolhidas
  [[5, 10], [5, 11], [10, 10], [11, 11]], // empurrando
];

function treno() {
  const fundo = arte(TRENO_FUNDO);
  const estrelas = [[8, 1], [2, 14], [15, 6], [12, 3]];
  return quadros(40, (g, t) => {
    fundo.forEach((l, y) => l.forEach((c, x) => c && ponto(g, x, y, c)));
    // quadros pares: a rena troca a pata; ímpares: as estrelas andam 2 colunas (custa o mesmo que 1)
    const p = Math.floor(t / 2);
    pontos(g, TRENO_PERNAS[p % 4], "K");
    ponto(g, 0, 5, p % 2 ? "O" : "R"); // nariz brilhando
    ponto(g, Math.floor((t + 1) / 4) % 2 ? 17 : 16, 11, "W"); // pompom balançando
    // o Noel acena: a luva vai e volta
    pontos(g, [[17, 15], [18, 14]], "R");
    ponto(g, Math.floor((t + 3) / 4) % 2 ? 19 : 18, 13, "W");
    // brilho correndo no patim
    ponto(g, 9 + mod(p, 10), 19, "W");
    // estrelas passando para trás (a câmera acompanha o trenó, que vai para a esquerda)
    fluxo(g, Math.floor((t + 1) / 2), estrelas, { vx: 2, cor: "W" });
  });
}



// ============================================================
// Guerra de bolas de neve: duas crianças se revezam; a bola voa num arco (com rastro),
// estoura em flocos na cabeça do outro, que leva as mãos à cabeça e devolve.
// ============================================================

// criança de 4 colunas × 7 linhas, virada para a direita (o olho fica do lado para onde ela olha)
const crianca = (gorro, casaco) => {
  const c4 = casaco.repeat(4);
  return [".W..", gorro.repeat(4), "SSkS", "YYYY", c4, c4, "B..B"];
};

function guerraDeNeve() {
  const esq = { x: 1, gorro: "R", casaco: "G" };
  const dir = { x: 15, gorro: "M", casaco: "C" };
  const Y0 = 12; // linha do pompom
  // braço (relativo ao canto da criança virada para a direita): parado, preparando, jogando, assustada
  const BRACO = {
    parado: [[4, 4, "c"], [4, 5, "S"]],
    prepara: [[-1, 4, "c"], [-1, 3, "S"]],
    joga: [[4, 4, "c"], [5, 3, "S"]],
    susto: [[-1, 4, "c"], [-1, 3, "S"], [4, 4, "c"], [4, 3, "S"]],
  };
  const desenhar = (g, k, viradoEsq, braco) => {
    const sprite = crianca(k.gorro, k.casaco);
    carimbar(g, viradoEsq ? espelhar(sprite) : sprite, k.x, Y0);
    for (const [dx, dy, c] of BRACO[braco]) {
      const x = viradoEsq ? k.x + 3 - dx : k.x + dx;
      ponto(g, x, Y0 + dy, c === "c" ? k.casaco : c);
    }
  };
  // arco da bola: 9 posições da mão de quem joga até a cabeça do outro
  const arco = (de, ate) =>
    Array.from({ length: 9 }, (_, i) => [Math.round(de + ((ate - de) * i) / 8), Math.round(Y0 + 3 - 10 * 4 * (i / 8) * (1 - i / 8))]);
  const idaArco = arco(6, 15);
  const voltaArco = arco(13, 4);
  const flocos = [[4, 1], [11, 6], [17, 3]];
  const T = 14; // quadros de cada jogada
  return quadros(2 * T, (g, t) => {
    retangulo(g, 0, 19, 19, 19, "W");
    pontos(g, [[0, 18], [8, 18], [9, 18], [19, 18]], "W");
    const vez = t < T ? 0 : 1; // 0: a da esquerda joga
    const k = t % T;
    const [quem, alvo] = vez === 0 ? [esq, dir] : [dir, esq];
    const caminho = vez === 0 ? idaArco : voltaArco;
    const bracoQuem = k < 2 ? "prepara" : k < 5 ? "joga" : "parado";
    const bracoAlvo = k >= 11 && k < 13 ? "susto" : "parado";
    desenhar(g, quem, quem === dir, bracoQuem);
    desenhar(g, alvo, alvo === dir, bracoAlvo);
    // a bola voa nos quadros 2 a 9 (posições 1 a 8 do arco), com rastro
    if (k >= 2 && k <= 9) {
      const i = k - 1;
      rastro(g, [caminho[i], caminho[i - 1]].filter(Boolean), ["W", "w"]);
    }
    // estouro na cabeça
    if (k === 10 || k === 11) {
      const [cx, cy] = caminho[8];
      const d = k - 9;
      pontos(g, [[cx - d, cy - d], [cx + d, cy - d], [cx - d, cy + d - 1], [cx + d, cy + d - 1]], k === 10 ? "W" : "C");
    }
    // flocos caindo devagar
    fluxo(g, Math.floor(t / 2), flocos, { vy: 1, cor: "w" });
  });
}

// ============================================================
// Árvore de luzes em espiral: o fio verde dá voltas num cone e as luzes sobem por ele;
// a estrela do topo pisca.
// ============================================================

function espiralCaminho() {
  const pts = [];
  const voltas = 3;
  for (let i = 0; i <= 600; i++) {
    const s = i / 600;
    const y = Math.round(17 - 14 * s);
    const r = 8.2 * (1 - s) + 0.4;
    const x = Math.round(9.5 + r * Math.sin(2 * Math.PI * voltas * s));
    const ultimo = pts.at(-1);
    if (!ultimo || ultimo[0] !== x || ultimo[1] !== y) pts.push([x, y]);
  }
  return pts;
}

function arvoreEspiral() {
  const fio = espiralCaminho();
  const cores = ["R", "Y", "B", "F", "W", "O", "L"];
  const n = fio.length;
  if (!n) return [];
  const passo = 14; // uma luz a cada 14 pontos do fio
  return quadros((passo / 2) * cores.length, (g, t) => {
    pontos(g, fio, "g");
    retangulo(g, 9, 18, 10, 19, "K");
    // as luzes sobem pelo fio, 2 pontos por quadro (custa o mesmo que 1)
    for (let i = mod(2 * t, passo); i < n; i += passo) {
      const c = cores[mod(Math.floor((i - 2 * t) / passo), cores.length)];
      ponto(g, ...fio[i], c);
    }
    // estrela no topo
    carimbar(g, [".Y.", "YWY", ".Y."], 8, 0);
    if (t % 6 < 3) pontos(g, [[7, 1], [11, 1]], "V");
  });
}

// ============================================================
// Presentes pulando: três presentes pulam um de cada vez (pulo em parábola), com o laço
// balançando no alto e um "amassadinho" quando caem; o chão brilha embaixo de quem pula.
// ============================================================

function presentesPulando() {
  const caixas = [
    { x: 2, c: "R", f: "Y" },
    { x: 8, c: "G", f: "R" },
    { x: 14, c: "B", f: "W" },
  ];
  const ALTURAS = [1, 3, 4, 5, 5, 4, 3, 1, 0, 0]; // o 9º quadro é o pouso (amassada)
  const DUR = ALTURAS.length;
  const caixa = (g, x, y, c, f, amassada) => {
    if (amassada) {
      retangulo(g, x - 1, y + 2, x + 3, y + 3, c);
      retangulo(g, x + 1, y + 2, x + 1, y + 3, f);
      ponto(g, x + 1, y + 1, f);
    } else {
      retangulo(g, x, y + 1, x + 2, y + 3, c);
      retangulo(g, x + 1, y + 1, x + 1, y + 3, f);
      ponto(g, x + 1, y, f);
    }
  };
  return quadros(DUR * 3, (g, t) => {
    retangulo(g, 0, 19, 19, 19, "W");
    const vez = Math.floor(t / DUR);
    const k = t % DUR;
    caixas.forEach((cx, i) => {
      const noAr = i === vez;
      const h = noAr ? ALTURAS[k] : 0;
      const amassada = noAr && k === 8;
      caixa(g, cx.x, 15 - h, cx.c, cx.f, amassada);
      // laço balança quando está no alto
      if (noAr && h >= 4) ponto(g, cx.x + (k % 2 ? 0 : 2), 15 - h, cx.f);
    });
    // brilhos no chão embaixo de quem pula
    const x0 = caixas[vez].x;
    if (k >= 3 && k <= 7) pontos(g, [[x0 - 1, 18], [x0 + 3, 18]], k % 2 ? "Y" : "V");
    cintilar(g, t, [[3, 2], [10, 4], [16, 1], [6, 8], [17, 9]], { fraca: null });
  });
}

// ============================================================
// Sino badalando: o sino balança como pêndulo (a boca vai mais longe que o topo), o badalo
// vai para o lado contrário e, a cada batida, saem ondas de som do lado da batida.
// ============================================================

function sinoBadalando() {
  // linhas do sino: [deslocamento relativo do topo (0) à boca (1), início, fim, cor]
  const LINHAS = [
    [0, 9, 10, "Y"],
    [0.12, 8, 11, "Y"],
    [0.25, 7, 12, "Y"],
    [0.37, 7, 12, "Y"],
    [0.5, 7, 12, "Y"],
    [0.62, 6, 13, "Y"],
    [0.75, 5, 14, "Y"],
    [0.87, 4, 15, "O"],
  ];
  const P = 20; // quadros de uma ida e volta
  return quadros(P, (g, t) => {
    // laço vermelho parado em cima
    carimbar(g, ["RR..RR", "R.RR.R", "RR..RR", "..RR.."], 7, 0);
    ponto(g, 9, 4, "Y");
    ponto(g, 10, 4, "Y");
    const ang = Math.sin((2 * Math.PI * t) / P); // -1 … 1
    LINHAS.forEach(([f, x0, x1, c], i) => {
      const d = Math.round(ang * 3 * f);
      retangulo(g, x0 + d, 5 + i, x1 + d, 5 + i, c);
      if (i > 1 && i < 7) ponto(g, x0 + d, 5 + i, "W"); // brilho na borda esquerda
    });
    // badalo: atrasado em relação ao sino
    const db = Math.round(Math.sin((2 * Math.PI * (t - 3)) / P) * 3);
    retangulo(g, 9 + db, 13, 10 + db, 13, "y");
    // ondas de som quando o sino chega no ponto mais alto de cada lado
    const lado = t === 5 || t === 6 ? 1 : t === 15 || t === 16 ? -1 : 0;
    if (lado) {
      const r = t === 5 || t === 15 ? 0 : 1;
      const x = lado > 0 ? 17 + r : 2 - r;
      pontos(g, [[x, 8], [x + lado, 9], [x + lado, 10], [x, 11]], "C");
    }
    cintilar(g, t, [[2, 2], [16, 3], [3, 16], [17, 17], [9, 18]], { fraca: null });
  });
}

// ============================================================
// Noel na chaminé: o gorro aparece, o Noel sobe até o ombro, olha para os lados, acena,
// desce rapidinho e a chaminé solta fumaça.
// ============================================================

const NOEL_CABECA = [
  "...RW", // ponta do gorro com o pompom
  ".RRR.",
  "WWWWW", // aba do gorro
  "S.SS.", // rosto e olho (o olho é o pixel apagado)
  "WSSSW", // bigode e bochechas
  "WWWWW", // barba
  ".WWW.",
];

function noelChamine() {
  // altura visível do Noel em cada quadro (0 = escondido)
  const ALT = [1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const TOPO = 9; // linha da borda da chaminé
  return quadros(ALT.length, (g, t) => {
    // telhado em diagonal com neve, e a chaminé
    for (let x = 0; x < 20; x++) {
      const y = 12 + Math.floor(x / 3);
      if (y < 20) ponto(g, x, y, "W");
      if (y + 1 < 20) ponto(g, x, y + 1, "r");
    }
    retangulo(g, 6, TOPO, 12, TOPO, "W");
    retangulo(g, 7, TOPO + 1, 11, 13, "R");
    pontos(g, [[8, 11], [10, 11], [9, 13]], "r");
    // o Noel: só a parte de cima aparece acima da chaminé
    const h = ALT[t];
    const linhas = NOEL_CABECA.slice(0, h);
    carimbar(g, linhas, 7, TOPO - h);
    // olha para a esquerda e para a direita
    if (h >= 4 && t >= 6 && t <= 8) {
      // olha para o outro lado: o olho muda de coluna
      ponto(g, 8, TOPO - h + 3, "S");
      g[TOPO - h + 3][10] = null;
    }
    // acena (braço vermelho e luva branca indo e voltando ao lado da chaminé)
    if (t >= 9 && t <= 12) {
      ponto(g, 12, TOPO - 1, "R");
      ponto(g, 13, TOPO - 2 + (t % 2), "W");
    }
    // fumaça depois que ele desce
    if (t >= 19) {
      const k = t - 19;
      pontos(g, [[9 + (k % 2), TOPO - 1 - k], [8 + ((k + 1) % 2), TOPO - k + 2]].filter(([, y]) => y < TOPO), "w");
    }
    pontos(g, [[2, 2], [16, 1], [18, 6]], "W");
    carimbar(g, [".VV", "VV.", "VV.", ".VV"], 1, 3);
  });
}

// ============================================================
// Boneco de neve se montando: a bola grande chega rolando, a do meio e a cabeça caem do céu,
// aparecem cartola, olhos, nariz e braços; ele acena e depois derrete.
// ============================================================

function bonecoMontando() {
  // boneco centrado na coluna 9: base 9×6 (linhas 13–18), meio 7×5 (8–12), cabeça 5×4 (4–7)
  const BASE = ["..WWWWW..", ".WWWWWWW.", "WWWWWWWWW", "WWWWWWWWW", ".WWWWWWW.", "..WWWWW.."];
  const MEIO = ["..WWW..", ".WWWWW.", "WWWWWWW", ".WWWWW.", "..WWW.."];
  const CABECA = [".WWW.", "WWWWW", "WWWWW", ".WWW."];
  const FASES = { rola: 13, meio: 12, cabeca: 7, enfeita: 8, acena: 8, derrete: 18, seca: 5 };
  const ini = {};
  let total = 0;
  for (const [nome, n] of Object.entries(FASES)) {
    ini[nome] = total;
    total += n;
  }
  const giro = [[2, 1], [6, 1], [6, 4], [2, 4]]; // pontinho que mostra a bola girando
  return quadros(total, (g, t) => {
    retangulo(g, 0, 19, 19, 19, "W");
    cintilar(g, t, [[2, 3], [17, 2], [16, 8], [2, 10]], { fraca: null, cada: 3 });
    const k = (fase) => t - ini[fase];
    if (t < ini.derrete + FASES.derrete) {
      // 1) a bola grande chega rolando da esquerda
      const xb = t < ini.meio ? 5 - (FASES.rola - 1 - t) : 5;
      carimbar(g, BASE, xb, 13);
      if (t < ini.meio) ponto(g, xb + giro[t % 4][0], 13 + giro[t % 4][1], "w");
      // 2) a bola do meio cai do céu; 3) depois a cabeça
      if (k("meio") >= 0) carimbar(g, MEIO, 6, Math.min(8, -3 + k("meio")));
      if (k("cabeca") >= 0) carimbar(g, CABECA, 7, Math.min(4, -2 + k("cabeca")));
      // 4) enfeites, um por quadro: aba, cartola, olhos, nariz, botões, braço, braço, cachecol
      const e = k("enfeita");
      if (e >= 0) retangulo(g, 7, 3, 11, 3, "B");
      if (e >= 1) {
        retangulo(g, 8, 1, 10, 1, "B");
        retangulo(g, 8, 2, 10, 2, "R");
      }
      if (e >= 2) pontos(g, [[8, 5], [10, 5]], "k");
      if (e >= 3) ponto(g, 9, 6, "O");
      if (e >= 4) pontos(g, [[9, 10], [9, 15], [9, 17]], "R");
      if (e >= 5) pontos(g, [[5, 10], [4, 9], [3, 8]], "K");
      if (e >= 6) {
        const cima = k("acena") >= 0 && k("acena") < FASES.acena && Math.floor(k("acena") / 2) % 2 === 0;
        pontos(g, cima ? [[13, 10], [14, 9], [15, 8]] : [[13, 10], [14, 11], [15, 12]], "K");
      }
      if (e >= 7) pontos(g, [[7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [11, 9]], "G");
      // 5) derrete: some uma linha por quadro, de cima para baixo
      const d = k("derrete");
      if (d >= 0) for (let y = 0; y <= Math.min(18, d + 1); y++) g[y].fill(null);
    }
    // a poça cresce enquanto derrete e depois seca
    const d = k("derrete");
    const largura = d < 0 ? -1 : t < ini.seca ? Math.min(4, Math.floor(d / 4)) : 4 - k("seca");
    if (largura >= 0) retangulo(g, 9 - largura, 19, 9 + largura, 19, "C");
  });
}

// ============================================================
// Roda-gigante de Natal: as cabines coloridas giram em volta do aro, o centro pisca,
// e as luzes do chão correm.
// ============================================================

function rodaGigante() {
  const CX = 9.5;
  const CY = 8;
  const R = 6.6;
  const cores = ["R", "Y", "G", "B", "F", "O"];
  const P = 36; // quadros por volta completa
  const aro = circulo(CX, CY, R, 48);
  return quadros(P, (g, t) => {
    pontos(g, aro, "w");
    // pernas da roda até o chão
    linha(g, 9, 9, 5, 18, "w");
    linha(g, 10, 9, 14, 18, "w");
    retangulo(g, 0, 19, 19, 19, "W");
    // cabines: metade anda nos quadros pares, metade nos ímpares, 2 casas de cada vez
    // (um ponto que salta 2 casas custa o mesmo que 1: a roda gira o dobro de rápido)
    cores.forEach((c, i) => {
      const tt = t - mod(t - i, 2);
      const [[x, y]] = circulo(CX, CY, R, 1, (2 * Math.PI * tt) / P + (2 * Math.PI * i) / cores.length);
      ponto(g, x, y, c);
    });
    // centro piscando
    carimbar(g, ["YY", "YY"], 9, 7);
    if (t % 4 < 2) ponto(g, 9, 7, "W");
    cintilar(g, t, [[1, 2], [18, 1], [2, 15], [17, 13]], { fraca: null });
  });
}

// ============================================================
// Neve dançando: flocos grandes caem girando (+ e ×) e balançando para os lados;
// flocos pequenos caem mais rápido; dois pinheirinhos no chão.
// ============================================================

const FLOCO_MAIS = [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]];
const FLOCO_X = [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]];

function neveDancando() {
  const grandes = [
    { x: 4, y: 0, fase: 0 },
    { x: 11, y: 7, fase: 5 },
    { x: 16, y: 13, fase: 10 },
  ];
  const pequenos = [[1, 3], [8, 12], [14, 5], [18, 16]];
  const P = 60;
  return quadros(P, (g, t) => {
    carimbar(g, ["..G..", ".GGG.", "GGGGG", "..K.."], 0, 15);
    carimbar(g, ["..G..", ".GGG.", "GGGGG", "..K.."], 15, 15);
    retangulo(g, 0, 19, 19, 19, "W");
    // flocos grandes: um anda por quadro (revezando), descendo 1 linha a cada 3 quadros
    grandes.forEach((f, i) => {
      const passos = Math.floor((t + i) / 3);
      const y = mod(f.y + passos, 20) - 1;
      const x = f.x + balanco(passos + f.fase, 10, 1);
      const forma = passos % 2 ? FLOCO_X : FLOCO_MAIS;
      forma.forEach(([dx, dy]) => atras(g, [[x + dx, y + dy]], dx === 0 && dy === 0 ? "W" : "C"));
    });
    // flocos pequenos: cada um desce 2 linhas a cada 4 quadros, um por quadro
    pequenos.forEach(([x, y], i) => fluxo(g, Math.floor((t + i) / 4), [[x, y]], { vy: 2, cor: "W" }));
  });
}

// ============================================================
// Estrelas cadentes: duas estrelas cruzam o céu em diagonais diferentes, com rastro que apaga,
// e viram um brilho quando somem atrás do morro.
// ============================================================

function estrelasCadentes() {
  const morro = [];
  for (let x = 0; x < 20; x++) morro.push([x, 16 + Math.round(1.5 * Math.cos((x - 4) / 3))]);
  const RASTRO = ["W", "V", "Y", "O", "r"];
  // trajetos: [x0, y0, dx, dy, início, passos]
  const TRAJ = [
    [19, 0, -1, 1, 0, 15],
    [2, 1, 1, 1, 18, 13],
  ];
  const P = 36;
  return quadros(P, (g, t) => {
    morro.forEach(([x, y]) => {
      ponto(g, x, y, "W");
      for (let yy = y + 1; yy < 20; yy++) ponto(g, x, yy, "w");
    });
    carimbar(g, [".VV", "VV.", "VV.", ".VV"], 15, 2);
    for (const [x0, y0, dx, dy, ini, passos] of TRAJ) {
      const k = t - ini;
      if (k < 0 || k > passos + 4) continue;
      if (k <= passos) {
        const pts = [];
        for (let j = 0; j < RASTRO.length; j++) {
          const kk = k - j;
          if (kk >= 0) pts.push([x0 + dx * kk, y0 + dy * kk]);
        }
        pts.forEach(([x, y], j) => atras(g, [[x, y]], RASTRO[j]));
      } else {
        // brilho no fim: 4 pontinhos que se abrem e somem
        const d = k - passos;
        const [cx, cy] = [x0 + dx * passos, y0 + dy * passos];
        if (d <= 2) atras(g, [[cx - d, cy], [cx + d, cy], [cx, cy - d], [cx, cy + d]], d === 2 ? "V" : "W");
      }
    }
    cintilar(g, t, [[5, 3], [11, 1], [8, 8], [17, 9], [3, 11], [12, 12]], { fraca: null });
  });
}

export const ANIMACOES_1 = [
  { id: "mov-treno", nome: "Trenó do Papai Noel", ms: 140, criar: treno },
  { id: "mov-guerra-neve", nome: "Guerra de bolas de neve", ms: 120, criar: guerraDeNeve },
  { id: "mov-espiral", nome: "Árvore de luzes", ms: 110, criar: arvoreEspiral },
  { id: "mov-presentes", nome: "Presentes pulando", ms: 110, criar: presentesPulando },
  { id: "mov-sino", nome: "Sino badalando", ms: 110, criar: sinoBadalando },
  { id: "mov-chamine", nome: "Noel na chaminé", ms: 150, criar: noelChamine },
  { id: "mov-boneco", nome: "Boneco de neve", ms: 150, criar: bonecoMontando },
  { id: "mov-roda", nome: "Roda-gigante", ms: 130, criar: rodaGigante },
  { id: "mov-neve", nome: "Neve dançando", ms: 120, criar: neveDancando },
  { id: "mov-cadentes", nome: "Estrelas cadentes", ms: 100, criar: estrelasCadentes },
];
