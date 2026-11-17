// Coleção de Ano Novo (parte A): 25 cenas que rolam na aba Animações.
//
// Cada cena tem 20 colunas que "emendam" na borda: a cortina rola da direita para a esquerda
// em loop (MODE 03), então tudo que cruza a borda dá a volta (`envolver`) e as faixas contínuas
// (prédios, água, fitas, piso) têm período que divide 20.
// Fundo apagado e cores saturadas. Cada cena acende entre 40 e 220 LEDs.

import { N, carimbar, espelhar, novaGrade, ponto } from "./pixelart.js";

// ---------- ajudantes locais ----------

/** Ponto com coordenadas reais (arredonda) e coluna que dá a volta na borda. */
const P = (g, x, y, c) => ponto(g, Math.round(x), Math.round(y), c, true);

/** Carimbo que dá a volta na borda. */
const C = (g, sprite, x, y) => carimbar(g, sprite, x, y, true);

/** Sorteio com semente fixa: a mesma cena sai sempre igual. */
function sorteio(semente) {
  let s = semente >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** `n` raios de fogos saindo de (cx, cy), do raio r0 ao r1; corDe(d, k) devolve a letra (ou null). */
function raios(g, cx, cy, n, r0, r1, corDe, fase = 0) {
  for (let k = 0; k < n; k++) {
    const a = fase + (2 * Math.PI * k) / n;
    for (let d = r0; d <= r1 + 1e-9; d += 1) P(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, corDe(d, k));
  }
}

/** Brilho em cruz (+) com centro e braços de cores diferentes. */
function brilho(g, x, y, centro = "W", braco = "Y") {
  P(g, x - 1, y, braco);
  P(g, x + 1, y, braco);
  P(g, x, y - 1, braco);
  P(g, x, y + 1, braco);
  P(g, x, y, centro);
}

/** Contorno de círculo amostrado em `n` pontos; `c` pode ser letra ou função (k) => letra. */
function aro(g, cx, cy, r, c, n) {
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    P(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, typeof c === "function" ? c(k) : c);
  }
}

/** Linha reta entre pontos reais, com a coluna dando a volta; corDe(t) recebe 0..1 do início ao fim. */
function traco(g, x0, y0, x1, y1, corDe) {
  const passos = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    P(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, typeof corDe === "function" ? corDe(t) : corDe);
  }
}

/** Monta uma arte simétrica: cada linha é a metade esquerda (10 letras), espelhada para a direita. */
const simetrica = (metades) => metades.map((m) => m + espelhar([m])[0]);

// ============================================================
//                          FOGOS
// ============================================================

// 1. Crisântemo: esfera grande e cheia, raios de várias cores com pontas claras.
function cenaCrisantemo() {
  const g = novaGrade();
  const cores = ["R", "C", "Y", "F", "L", "O", "M", "T"];
  raios(g, 9.5, 9.5, 16, 3.2, 7.2, (d, k) => (k % 2 && d > 6.5 ? null : cores[k % cores.length]), 0.2);
  raios(g, 9.5, 9.5, 16, 8.4, 8.4, (d, k) => (k % 2 ? null : "W"), 0.2);
  raios(g, 9.5, 9.5, 16, 7.2, 7.2, (d, k) => (k % 2 ? "V" : null), 0.2);
  C(g, [".VV.", "VWWV", "VWWV", ".VV."], 8, 8);
  return g;
}

// 2. Palmeira: braços dourados grossos que caem, e o rastro do foguete como tronco.
function cenaPalmeira() {
  const g = novaGrade();
  const copa = simetrica([
    "..........",
    "..........",
    "....YYYY..",
    "...YyyyyY.",
    "..Yy....yV",
    "..V....YYW",
    ".W...YYy..",
    "....Yyy...",
    ".O.Yy.....",
    "...V......",
    "..W.......",
    "..........",
    "..O.......",
  ]);
  C(g, copa, 0, 1);
  for (let y = 7; y <= 19; y++) {
    const x = 9.5 - 1.8 * ((y - 7) / 12) ** 2;
    const c = y <= 9 ? "V" : y <= 12 ? "O" : y <= 15 ? "y" : y % 2 ? "y" : null;
    P(g, x, y, c);
  }
  return g;
}

// 3. Anel: um círculo de estrelas azul-gelo com um anel fúcsia por dentro.
function cenaAnel() {
  const g = novaGrade();
  aro(g, 9.5, 9.5, 7.6, (k) => (k % 3 === 0 ? "W" : "C"), 24);
  aro(g, 9.5, 9.5, 6.5, (k) => (k % 3 === 0 ? "B" : null), 24);
  aro(g, 9.5, 9.5, 3.4, (k) => (k % 2 ? "F" : "P"), 12);
  C(g, ["YY", "YY"], 9, 9);
  return g;
}

// 4. Coração: estouro em forma de coração, rosa e fúcsia, com brilhos em volta.
function cenaCoracao() {
  const g = novaGrade();
  for (let k = 0; k < 140; k++) {
    const t = (2 * Math.PI * k) / 140;
    const x = 9.5 + 8 * Math.sin(t) ** 3;
    const y = 8 - 0.5 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    P(g, x, y, k % 10 < 5 ? "F" : "P");
  }
  for (const [x, y] of [[2, 16], [17, 16]]) brilho(g, x, y, "W", "P");
  for (const [x, y] of [[10, 0], [0, 9], [19, 6]]) P(g, x, y, "W");
  return g;
}

// 5. Chorão: rastros dourados que sobem em arco e caem até embaixo, como um salgueiro.
function cenaChorao() {
  const g = novaGrade();
  const cx = 9.5;
  const cy = 5;
  for (const graus of [-160, -125, -90, -55, -20, 25, 155]) {
    const a = (graus * Math.PI) / 180;
    let x = cx;
    let y = cy;
    let vx = Math.cos(a) * 1.8;
    let vy = Math.sin(a) * 1.8;
    for (let s = 0; s < 60 && y < 19.5; s++) {
      const nx = x + vx;
      const ny = y + vy;
      for (let i = 1; i <= 3; i++) {
        const px = x + ((nx - x) * i) / 3;
        const py = y + ((ny - y) * i) / 3;
        if (py > 19.4 || (s === 0 && i < 3)) continue;
        P(g, px, py, py < 6 ? "V" : py < 10 ? "Y" : py < 14 ? "y" : Math.round(py) % 2 ? "O" : null);
      }
      x = nx;
      y = ny;
      vx *= 0.8;
      vy = vy * 0.8 + 0.22;
    }
  }
  C(g, [".V.", "VWV", ".V."], 8, 4);
  return g;
}

// 6. Chuva de fogos: vários estouros pequenos de cores e formatos diferentes.
function cenaChuvaFogos() {
  const g = novaGrade();
  raios(g, 3, 4, 8, 1, 3, (d) => (d > 2 ? "Y" : "R"));
  raios(g, 13, 3, 6, 1, 2, (d) => (d > 1 ? "C" : "W"), 0.5);
  raios(g, 8.5, 10.5, 8, 1, 3, (d) => (d > 2 ? "L" : "G"), Math.PI / 8);
  raios(g, 17, 10, 4, 1, 2, () => "F");
  raios(g, 17, 10, 4, 1, 1, () => "P", Math.PI / 4);
  raios(g, 3, 16, 8, 1, 2, (d) => (d > 1 ? "O" : "Y"));
  raios(g, 13.5, 16, 10, 1, 3, (d) => (d > 2 ? "M" : "F"));
  return g;
}

// 7. Foguete subindo com rastro de faíscas, e um estouro azul ao lado.
function cenaFoguete() {
  const g = novaGrade();
  C(g, ["...Y...", "..YYY..", "..RRR..", "..RWR..", "..RRR..", "..WWW..", "..RRR..", ".RRRRR.", "RR.V.RR", "...Y..."], 1, 1);
  const r = sorteio(77);
  for (let y = 11; y <= 19; y++) {
    const largura = (y - 10) * 0.35;
    const n = y < 13 ? 1 : 2;
    for (let i = 0; i < n; i++) {
      const x = 4 + (i ? -1 : 1) * r() * largura;
      P(g, x, y, y < 13 ? "O" : y < 16 ? (r() < 0.5 ? "Y" : "O") : r() < 0.6 ? "O" : "R");
    }
  }
  raios(g, 14.5, 6.5, 12, 2, 5, (d) => (d > 4.5 ? "W" : d > 3.5 ? "C" : "B"), 0.26);
  P(g, 14.5, 6.5, "W");
  for (const [x, y] of [[11, 15], [17, 17], [14, 13], [19, 1]]) P(g, x, y, "W");
  return g;
}

// 8. Fogos na cidade: prédios com janelas acesas (emendam na borda) e estouros no céu.
function cenaFogosCidade() {
  const g = novaGrade();
  const predios = [
    [0, 2, 5, "B"],
    [3, 6, 7, "M"],
    [7, 8, 4, "B"],
    [9, 11, 6, "M"],
    [12, 14, 8, "B"],
    [15, 16, 4, "M"],
    [17, 19, 6, "B"],
  ];
  for (const [x0, x1, alt, c] of predios) {
    const topo = 20 - alt;
    for (let y = topo; y < N; y++)
      for (let x = x0; x <= x1; x++) {
        const janela = y > topo && y < 19 && (y - topo) % 2 === 0 && (x - x0) % 2 === 1;
        P(g, x, y, janela ? "Y" : c);
      }
  }
  P(g, 13, 11, "R");
  P(g, 13, 10, "w");
  raios(g, 5, 5, 12, 2, 4, (d) => (d > 3.5 ? "W" : d > 2.5 ? "Y" : "O"), 0.26);
  P(g, 5, 5, "Y");
  raios(g, 15.5, 4, 8, 1, 3, (d) => (d > 2 ? "L" : d > 1 ? "G" : null), Math.PI / 8);
  P(g, 15.5, 4, "L");
  return g;
}

// 22. Chuva de meteoros: riscos com cabeça branca e cauda azul, todos na mesma direção.
function cenaMeteoros() {
  const g = novaGrade();
  for (const [x, y, comp] of [[1, 8, 12], [9, 3, 9], [11, 15, 11], [2, 18, 7], [16, 10, 8]]) {
    for (let i = comp - 1; i >= 1; i--) {
      const t = i / (comp - 1);
      P(g, x + i, y - i / 2, t < 0.25 ? "W" : t < 0.55 ? "C" : t < 0.8 || i % 2 ? "B" : null);
    }
    P(g, x, y, "W");
    P(g, x - 1, y, "C");
    P(g, x, y + 1, "C");
    P(g, x + 1, y + 1, "B");
  }
  for (const [x, y] of [[6, 1], [17, 2], [1, 13], [8, 10], [19, 15], [15, 19], [7, 14]]) P(g, x, y, "w");
  return g;
}

// 23. Lua da virada: lua crescente, estrelas e dois fogos pequenos.
function cenaLua() {
  const g = novaGrade();
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - 6, y - 9);
      if (d <= 6.2 && Math.hypot(x - 9, y - 7) > 5.6) P(g, x, y, d > 5.3 ? "Y" : "V");
    }
  raios(g, 15, 5, 8, 2, 3, (d) => (d > 2.5 ? "P" : "F"));
  P(g, 15, 5, "W");
  raios(g, 15.5, 14.5, 6, 1.5, 2.5, (d) => (d > 2 ? "W" : "C"), 0.3);
  brilho(g, 11, 2, "W", "w");
  for (const [x, y] of [[1, 1], [19, 9], [10, 17], [3, 18], [12, 10]]) P(g, x, y, "W");
  return g;
}

// 24. Fogos no mar: estouros no céu e o reflexo tremido na água, em faixas que estreitam.
function cenaReflexo() {
  const g = novaGrade();
  const fogos = [
    [5, 5, 4, ["Y", "O", "R"], 12],
    [15, 4, 3, ["P", "F", "M"], 8],
  ];
  for (const [cx, cy, tam, cores, n] of fogos) {
    raios(g, cx, cy, n, 2, tam, (d) => cores[Math.round(((tam - d) / Math.max(1, tam - 2)) * (cores.length - 1))], 0.2);
    P(g, cx, cy, "W");
  }
  const horizonte = 11;
  for (let x = 0; x < N; x++) P(g, x, horizonte, x % 5 === 4 ? null : "B");
  // reflexo: traços horizontais que estreitam para baixo, com um tremido
  const traços = [
    [13, [[-3, -1, 0], [1, 3, 0]]],
    [15, [[-2, 1, 1]]],
    [17, [[-1, 1, 2]]],
    [19, [[0, 0, 0]]],
  ];
  fogos.forEach(([cx, , tam, cores], f) => {
    traços.forEach(([y, partes], k) => {
      const desvio = (k + f) % 2 ? 1 : 0;
      for (const [a, b, ci] of partes) {
        const escala = tam / 4;
        for (let x = Math.round(a * escala); x <= Math.round(b * escala); x++) P(g, cx + x + desvio, y, cores[ci]);
      }
    });
  });
  for (const [x, y] of [[10, 13], [0, 15], [9, 16], [19, 17], [11, 18], [1, 18], [8, 14]]) P(g, x, y, "B");
  return g;
}

// 25. Fogos em cascata: cortina de faíscas caindo de um fio, como uma cachoeira.
function cenaCascata() {
  const g = novaGrade();
  const r = sorteio(25);
  for (let x = 0; x < N; x++) P(g, x, 2, x % 2 ? "V" : "W");
  const comprimentos = [13, 15, 11, 16, 12, 14, 16, 10, 13, 15];
  comprimentos.forEach((comp, i) => {
    const x = i * 2;
    for (let d = 1; d <= comp; d++) {
      if (d > 2 && r() < 0.35) continue;
      const brilha = r() < 0.08;
      P(g, x, 2 + d, brilha ? "W" : d < 4 ? "V" : d < comp - 5 ? "Y" : d < comp - 2 ? "O" : "R");
    }
  });
  return g;
}

// ============================================================
//                      FESTA E BRILHO
// ============================================================

// 9. Estrelinhas: duas estrelinhas soltando faíscas finas.
function cenaEstrelinhas() {
  const g = novaGrade();
  const r = sorteio(9);
  for (const [x0, y0, x1, y1] of [[5, 6, 8, 19], [14, 5, 11, 19]]) {
    traco(g, x0, y0, x1, y1, (t) => (t < 0.15 ? "O" : "w"));
    for (let k = 0; k < 12; k++) {
      const a = (2 * Math.PI * k) / 12 + r() * 0.25;
      const comp = k % 2 ? 2.6 : 4.4;
      for (let d = 2; d <= comp; d++) P(g, x0 + Math.cos(a) * d, y0 + Math.sin(a) * d, d < 3 ? "V" : d < 4 ? "Y" : "O");
      if (comp > 4) {
        P(g, x0 + Math.cos(a + 0.35) * 5.2, y0 + Math.sin(a + 0.35) * 5.2, "Y");
        P(g, x0 + Math.cos(a - 0.35) * 5.2, y0 + Math.sin(a - 0.35) * 5.2, "Y");
      }
    }
    brilho(g, x0, y0, "W", "W");
  }
  return g;
}

// 10. Confete: papeizinhos coloridos espalhados.
function cenaConfete() {
  const g = novaGrade();
  const r = sorteio(10);
  const cores = ["R", "Y", "C", "F", "L", "O", "M", "T", "P", "G"];
  const formas = [
    [[0, 0], [1, 0]],
    [[0, 0], [0, 1]],
    [[0, 0], [1, 1]],
    [[1, 0], [0, 1]],
    [[0, 0], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 1]],
  ];
  let i = 0;
  for (let cy = 0; cy < 5; cy++)
    for (let cx = 0; cx < 5; cx++) {
      const x = cx * 4 + Math.floor(r() * 3);
      const y = cy * 4 + Math.floor(r() * 3);
      const forma = formas[Math.floor(r() * formas.length)];
      const c = cores[i++ % cores.length];
      for (const [dx, dy] of forma) P(g, x + dx, y + dy, c);
    }
  return g;
}

// 11. Serpentinas: fitas enroladas penduradas num varal ondulado.
function cenaSerpentinas() {
  const g = novaGrade();
  const cores = [["F", "P"], ["Y", "V"], ["T", "C"], ["O", "Y"], ["L", "G"]];
  const comprimentos = [15, 11, 18, 13, 16];
  for (let i = 0; i < 5; i++) {
    for (let k = 0; k <= comprimentos[i] * 8; k++) {
      const y = 1 + k / 8;
      const fase = (2 * Math.PI * y) / 6 + i * 1.3;
      P(g, i * 4 + 2 + 1.5 * Math.sin(fase), y, Math.cos(fase) > 0 ? cores[i][0] : cores[i][1]);
    }
  }
  for (let x = 0; x < N; x++) P(g, x, x % 4 === 0 || x % 4 === 3 ? 0 : 1, "V");
  return g;
}

// 12. Balões coloridos com cordinhas.
function cenaBaloes() {
  const g = novaGrade();
  const balao = (c, s) => [".ccc.", "cWccc", "cWccs", "ccccs", ".ccs.", "..c.."].map((l) => l.replaceAll("c", c).replaceAll("s", s));
  for (const [x, y, c, s, fio] of [[0, 2, "R", "r", 7], [5, 7, "Y", "O", 6], [10, 1, "T", "G", 9], [15, 6, "F", "M", 7]]) {
    C(g, balao(c, s), x, y);
    for (let i = 0; i < fio; i++) P(g, x + 2 + (i % 4 === 1 ? 1 : i % 4 === 3 ? -1 : 0), y + 6 + i, "w");
  }
  return g;
}

// 13. Chapéu de festa e língua de sogra.
function cenaChapeu() {
  const g = novaGrade();
  const ax = 5;
  const ay = 4;
  for (let y = ay; y <= 15; y++)
    for (let x = 0; x < 11; x++) {
      const meia = ((y - ay) * 4) / 11 + 0.5;
      if (Math.abs(x - ax) <= meia) P(g, x, y, Math.floor((x + y) / 2) % 2 ? "F" : "T");
    }
  for (let x = 0; x <= 10; x++) P(g, x, 16, x % 2 ? "Y" : "V");
  brilho(g, ax, ay - 2, "W", "Y");
  // língua de sogra: bocal, tubo listrado e a ponta enrolada em espiral
  C(g, ["WW"], 10, 15);
  const caminho = [
    [12, 14], [13, 13],
    [13, 12], [13, 11], [13, 10], [13, 9], [13, 8], [14, 7], [15, 6], [16, 6], [17, 6], [18, 7],
    [19, 8], [19, 9], [19, 10], [18, 11], [17, 12], [16, 12], [15, 11], [15, 10], [15, 9], [16, 8], [17, 9], [17, 10],
  ];
  caminho.forEach(([x, y], i) => P(g, x, y, Math.floor(i / 2) % 2 ? "Y" : "R"));
  P(g, 11, 15, "R");
  return g;
}

// 14. Brinde: duas taças de espumante se tocando, com respingos e bolhas.
function cenaTacas() {
  const g = novaGrade();
  const taca = ["CVVVC", "CYVYC", "CYYYC", "CVYYC", "CYYYC", "CYYVC", ".CYC.", "..C..", "..C..", "..C..", "..C..", "CCCCC"];
  const base = 18;
  taca.forEach((fileira, r) => {
    const linhaY = base - (taca.length - 1) + r;
    const desloc = Math.round((taca.length - 1 - r) * 0.25);
    C(g, [fileira], 2 + desloc, linhaY);
    C(g, espelhar([fileira]), 13 - desloc, linhaY);
  });
  C(g, ["W..W", ".WW.", "W..W"], 8, 3);
  for (const [x, y] of [[6, 4], [13, 4], [4, 2], [16, 1], [9, 0], [11, 1]]) P(g, x, y, "V");
  return g;
}

// 15. Espumante estourando: garrafa inclinada, rolha voando e um leque de espuma.
function cenaEspumante() {
  const g = novaGrade();
  const ox = 2.2;
  const oy = 17.8;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = x - ox;
      const dy = y - oy;
      const u = (dx - dy) * Math.SQRT1_2;
      const v = (dx + dy) * Math.SQRT1_2;
      let meia = -1;
      if (u >= -0.4 && u <= 7) meia = 2.3;
      else if (u > 7 && u <= 8.8) meia = 2.3 - (u - 7) * 0.72;
      else if (u > 8.8 && u <= 12.2) meia = 0.95;
      else if (u > 12.2 && u <= 12.9) meia = 1.3;
      if (Math.abs(v) > meia) continue;
      let c = v < -1.2 ? "L" : v > 1.2 ? "g" : "G";
      if (u > 8.2) c = "Y";
      else if (u > 2.2 && u < 5) c = v < -1.2 ? "W" : "V";
      P(g, x, y, c);
    }
  // espuma: gotas em leque saindo do gargalo e caindo para a direita
  const r = sorteio(15);
  for (let k = 0; k < 8; k++) {
    const a = ((-95 + k * 12) * Math.PI) / 180;
    for (let d = 2; d <= 8; d++) {
      if (d > 2 && r() < 0.3) continue;
      const queda = d > 4 ? (d - 4) ** 2 * 0.18 : 0;
      P(g, 12 + Math.cos(a) * d, 8 + Math.sin(a) * d + queda, d < 3 ? "W" : r() < 0.45 ? "V" : r() < 0.6 ? "W" : "C");
    }
  }
  C(g, ["KK.", "KKy", ".y."], 17, 0);
  return g;
}

// 16. Bolhas douradas subindo.
function cenaBolhas() {
  const g = novaGrade();
  const b7 = ["..YYY..", ".Y...Y.", "Y.W...Y", "Y.....Y", "Y.....y", ".Y...y.", "..yyy.."];
  const b5 = [".YYY.", "YW..Y", "Y...Y", "Y...y", ".yyy."];
  const b4 = [".YY.", "YW.Y", "Y..y", ".yy."];
  const b3 = [".V.", "V.Y", ".Y."];
  C(g, b7, 1, 10);
  C(g, b5, 10, 2);
  C(g, b5, 13, 12);
  C(g, b4, 4, 3);
  C(g, b4, 16, 7);
  C(g, b3, 9, 9);
  C(g, b3, 1, 0);
  C(g, b3, 9, 16);
  for (const [x, y] of [[13, 9], [18, 1], [6, 18], [18, 18], [7, 8]]) P(g, x, y, "V");
  return g;
}

// 17. Globo espelhado com raios de luz coloridos.
function cenaGlobo() {
  const g = novaGrade();
  const cx = 9.5;
  const cy = 10;
  for (let y = 0; y < 4; y++) P(g, 9, y, "w");
  const cores = ["F", "Y", "L", "C", "P", "O", "T", "M"];
  raios(g, cx, cy, 8, 7, 9.5, (d, k) => cores[k], Math.PI / 8);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > 5.6) continue;
      let c = (x + y) % 2 ? "w" : "C";
      if (x - cx + (y - cy) < -4) c = (x + y) % 2 ? "W" : "C";
      if (x - cx + (y - cy) > 4.5) c = (x + y) % 2 ? "B" : "w";
      P(g, x, y, c);
    }
  brilho(g, 7, 7, "W", "W");
  return g;
}

// 18. Show de laser: feixes coloridos saindo de um projetor embaixo.
function cenaLaser() {
  const g = novaGrade();
  const cores = ["R", "O", "Y", "G", "C", "M", "F"];
  [-6, -1, 4, 9.5, 15, 20, 25].forEach((alvo, i) => traco(g, 9.5, 18, alvo, 0, cores[i]));
  C(g, ["wWWw"], 8, 19);
  return g;
}

// 19. Pista de dança: piso de ladrilhos coloridos e dois holofotes.
function cenaPista() {
  const g = novaGrade();
  const cores = ["F", "C", "Y", "L", "M"];
  const holofotes = [[4, "F"], [14, "C"]];
  [[12, 0], [15, 2], [18, 4]].forEach(([y0, desloc]) => {
    for (let x = 0; x < N; x++) {
      if (x % 4 === 3) continue;
      let c = cores[(Math.floor(x / 4) + desloc) % cores.length];
      if (y0 === 12 && holofotes.some(([hx]) => Math.floor(x / 4) === Math.floor(hx / 4))) c = "W";
      P(g, x, y0, c);
      P(g, x, y0 + 1, c);
    }
  });
  for (const [hx, c] of holofotes) {
    C(g, ["www", ".W."], hx - 1, 0);
    for (let y = 2; y <= 10; y++) {
      const meia = (y - 1) * 0.33;
      P(g, hx - meia, y, c);
      P(g, hx + meia, y, c);
    }
  }
  return g;
}

// 20. Purpurina: brilho dourado e prateado numa faixa ondulada.
function cenaPurpurina() {
  const g = novaGrade();
  const r = sorteio(20);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const centro = 9.5 + 5 * Math.sin((2 * Math.PI * x) / N);
      const dist = Math.abs(y - centro);
      const chance = dist < 1.5 ? 0.7 : dist < 3.5 ? 0.3 : 0.05;
      if (r() < chance) {
        const s = r();
        P(g, x, y, s < 0.35 ? "Y" : s < 0.6 ? "V" : s < 0.75 ? "y" : s < 0.9 ? "w" : "W");
      }
    }
  for (const [x, y] of [[5, 4], [15, 15], [11, 9]]) brilho(g, x, y, "W", "V");
  return g;
}

// 21. Fitas douradas e prateadas ondulando (a torção mostra o verso da fita).
function cenaFitas() {
  const g = novaGrade();
  const fitas = [
    [5.5, 0, ["V", "Y", "y"], ["Y", "O", "O"]],
    [14, Math.PI / 2, ["W", "w", "w"], ["w", "C", "C"]],
  ];
  for (const [base, fase, frente, verso] of fitas) {
    for (let x = 0; x < N; x++) {
      const a = (2 * Math.PI * x) / N + fase;
      const y = Math.round(base + 2.5 * Math.sin(a));
      const torcao = Math.cos((4 * Math.PI * x) / N + fase);
      const grossura = 1 + Math.round(Math.abs(torcao) * 2);
      const cores = torcao >= 0 ? frente : verso;
      for (let i = 0; i < grossura; i++) P(g, x, y - 1 + i, cores[grossura === 1 ? 0 : i]);
    }
  }
  return g;
}

export const ANIMACOES_ANO_NOVO_A = [
  { id: "ano-crisantemo", nome: "Fogos crisântemo", criar: cenaCrisantemo },
  { id: "ano-palmeira", nome: "Fogos palmeira", criar: cenaPalmeira },
  { id: "ano-anel", nome: "Fogos em anel", criar: cenaAnel },
  { id: "ano-coracao", nome: "Fogos de coração", criar: cenaCoracao },
  { id: "ano-chorao", nome: "Fogos chorão", criar: cenaChorao },
  { id: "ano-chuva-fogos", nome: "Chuva de fogos", criar: cenaChuvaFogos },
  { id: "ano-foguete", nome: "Foguete subindo", criar: cenaFoguete },
  { id: "ano-fogos-cidade", nome: "Fogos na cidade", criar: cenaFogosCidade },
  { id: "ano-estrelinhas", nome: "Estrelinhas", criar: cenaEstrelinhas },
  { id: "ano-confete", nome: "Confete", criar: cenaConfete },
  { id: "ano-serpentinas", nome: "Serpentinas", criar: cenaSerpentinas },
  { id: "ano-baloes", nome: "Balões", criar: cenaBaloes },
  { id: "ano-chapeu", nome: "Chapéu de festa", criar: cenaChapeu },
  { id: "ano-tacas", nome: "Brinde", criar: cenaTacas },
  { id: "ano-espumante", nome: "Espumante estourando", criar: cenaEspumante },
  { id: "ano-bolhas", nome: "Bolhas douradas", criar: cenaBolhas },
  { id: "ano-globo", nome: "Globo espelhado", criar: cenaGlobo },
  { id: "ano-laser", nome: "Show de laser", criar: cenaLaser },
  { id: "ano-pista", nome: "Pista de dança", criar: cenaPista },
  { id: "ano-purpurina", nome: "Purpurina", criar: cenaPurpurina },
  { id: "ano-fitas", nome: "Fitas douradas", criar: cenaFitas },
  { id: "ano-meteoros", nome: "Chuva de meteoros", criar: cenaMeteoros },
  { id: "ano-lua", nome: "Lua da virada", criar: cenaLua },
  { id: "ano-reflexo", nome: "Fogos no mar", criar: cenaReflexo },
  { id: "ano-cascata", nome: "Fogos em cascata", criar: cenaCascata },
];
