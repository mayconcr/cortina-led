// Ferramentas para animações quadro a quadro com MOVIMENTO (usadas pelas animações de Natal).
//
// Como a cortina recebe só os LEDs que mudam (~19 ms cada, ver animacao.js), cabem uns 50 LEDs trocados
// por segundo. O segredo de uma animação viva é gastar esse orçamento com MOVIMENTO:
//   - coisas pequenas que andam (neve, estrelas, faíscas, presentes, bolas): cada ponto que anda custa 2 LEDs;
//   - personagens com poses (pernas, asas, braços): custa só os pontos que trocam;
//   - desenhos que andam na horizontal custam ~2 LEDs por linha se cada linha tiver uma cor só
//     (e na vertical, ~2 por coluna se cada coluna tiver uma cor só);
//   - fundo parado e enxuto (poucos LEDs), para o 1º quadro aparecer rápido.

import { N, carimbar, novaGrade, ponto } from "./pixelart.js";

export const mod = (a, n) => ((a % n) + n) % n;

/** Cria `n` quadros: f(g, t) desenha o quadro t numa grade nova. */
export const quadros = (n, f) =>
  Array.from({ length: n }, (_, t) => {
    const g = novaGrade();
    f(g, t);
    return g;
  });

/** Vários pontos da mesma cor. */
export const pontos = (g, lista, c) => lista.forEach(([x, y]) => ponto(g, x, y, c));

/** Pontos que só acendem onde está apagado (passam "atrás" dos desenhos). */
export const atras = (g, lista, c) =>
  lista.forEach(([x, y]) => x >= 0 && x < N && y >= 0 && y < N && !g[y][x] && ponto(g, x, y, c));

/**
 * Pontos que andam em linha reta e dão a volta na tela (estrelas passando, neve caindo, faíscas subindo).
 * Cada ponto anda (vx, vy) a cada `cada` quadros. Ficam atrás do resto (chame depois dos desenhos).
 * Para o loop fechar certinho, o nº de quadros deve ser múltiplo de 20 × cada / |velocidade|.
 */
export function fluxo(g, t, lista, { vx = 0, vy = 0, cada = 1, cor = "W" } = {}) {
  const passo = Math.floor(t / cada);
  atras(g, lista.map(([x, y]) => [mod(x + vx * passo, N), mod(y + vy * passo, N)]), cor);
}

/** Pose do quadro t, seguindo uma sequência de índices (ex.: [0, 1, 2, 1]). */
export const pose = (poses, seq, t) => poses[seq[mod(t, seq.length)]];

/** Balanço suave: inteiro de -amp a +amp, com período de `p` quadros. */
export const balanco = (t, p, amp, fase = 0) => Math.round(amp * Math.sin((2 * Math.PI * (t + fase)) / p));

/** Altura de um pulo (parábola) no quadro t de um pulo de `dur` quadros e altura máxima `h`. */
export const pulo = (t, dur, h) => {
  const f = mod(t, dur) / dur;
  return Math.round(4 * h * f * (1 - f));
};

/** Vai e volta: 0, 1, …, n-1, n-2, …, 1, 0, 1, … */
export const vaiVolta = (t, n) => {
  const p = mod(t, 2 * (n - 1));
  return p < n ? p : 2 * (n - 1) - p;
};

/** n posições (arredondadas) ao redor de (cx, cy), raio r, começando no ângulo `fase` (radianos). */
export const circulo = (cx, cy, r, n, fase = 0) =>
  Array.from({ length: n }, (_, k) => {
    const a = fase + (2 * Math.PI * k) / n;
    return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))];
  });

/** Rastro: posições da cabeça para a cauda, pintadas com as cores da cabeça para a cauda. */
export function rastro(g, pts, cores) {
  pts.forEach(([x, y], i) => ponto(g, x, y, cores[Math.min(i, cores.length - 1)]));
}

/**
 * Estrelas que cintilam: cada estrela [x, y] fica acesa e apaga por um instante na sua vez
 * (uma de cada vez, em sequência), o que custa 1 a 2 LEDs por quadro.
 */
export function cintilar(g, t, lista, { cor = "W", fraca = "w", cada = 2 } = {}) {
  const vez = mod(Math.floor(t / cada), lista.length);
  lista.forEach(([x, y], i) => atras(g, [[x, y]], i === vez ? fraca : cor));
}

export { carimbar, novaGrade, ponto };
