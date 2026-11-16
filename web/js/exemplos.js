// Desenhos prontos da galeria (os três primeiros são os da Fase 3, de ferramentas/desenhos.py).
import { COLUNAS, LINHAS } from "./protocol.js";
import { novaGrade } from "./grade.js";

function smile() {
  const g = novaGrade();
  const centro = (COLUNAS - 1) / 2;
  for (let lin = 0; lin < LINHAS; lin++) {
    for (let col = 0; col < COLUNAS; col++) {
      const d = Math.hypot(col - centro, lin - centro);
      if (d >= 8.0 && d < 9.2) g[lin][col] = [255, 200, 0];
    }
  }
  for (const lin of [6, 7]) for (const col of [6, 7, 12, 13]) g[lin][col] = [0, 80, 255];
  for (let col = 5; col < 15; col++) {
    const lin = Math.round(12 + 2.5 * Math.sin((Math.PI * (col - 5)) / 9));
    g[lin][col] = [255, 0, 0];
  }
  return g;
}

function xadrez() {
  const g = novaGrade();
  for (let lin = 0; lin < LINHAS; lin++) {
    for (let col = 0; col < COLUNAS; col++) if ((Math.floor(lin / 2) + Math.floor(col / 2)) % 2 === 0) g[lin][col] = [255, 0, 0];
  }
  return g;
}

function degrade() {
  const g = novaGrade();
  for (let lin = 0; lin < LINHAS; lin++) {
    const forca = 0.35 + (0.65 * lin) / (LINHAS - 1);
    for (let col = 0; col < COLUNAS; col++) {
      const t = col / (COLUNAS - 1);
      g[lin][col] = [Math.round(255 * (1 - t) * forca), 0, Math.round(255 * t * forca)];
    }
  }
  return g;
}

function coracao() {
  const g = novaGrade();
  for (let lin = 0; lin < LINHAS; lin++) {
    for (let col = 0; col < COLUNAS; col++) {
      const x = (col - 9.5) / 7.5;
      const y = -(lin - 10.5) / 7.5;
      if ((x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0) g[lin][col] = [255, 0, 40];
    }
  }
  return g;
}

function arcoIris() {
  const cores = [[255, 0, 0], [255, 90, 0], [255, 200, 0], [0, 255, 0], [0, 160, 255], [0, 0, 255], [150, 0, 255]];
  const g = novaGrade();
  for (let lin = 0; lin < LINHAS; lin++) {
    const cor = cores[Math.min(cores.length - 1, Math.floor((lin * cores.length) / LINHAS))];
    for (let col = 0; col < COLUNAS; col++) g[lin][col] = [...cor];
  }
  return g;
}

export const EXEMPLOS = [
  { nome: "Smile", criar: smile },
  { nome: "Coração", criar: coracao },
  { nome: "Xadrez", criar: xadrez },
  { nome: "Degradê", criar: degrade },
  { nome: "Arco-íris", criar: arcoIris },
];
