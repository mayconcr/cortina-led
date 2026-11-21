// Folha de prévia (PNG) de uma coleção de pixel art 20×20, com os LEDs desenhados como bolinhas.
//
//   node ferramentas/previa_pixelart.mjs web/js/natal.js ANIMACOES_NATAL saida.png [--repetir 2] [--colunas 4]
//
// --repetir 2 mostra cada cena duas vezes lado a lado (para conferir se a emenda da rolagem fica boa).
// Também imprime, para cada item: posição, id, LEDs acesos e problemas (tamanho errado, LEDs demais ou de menos).
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import zlib from "node:zlib";

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(nome);
  return i >= 0 ? Number(args.splice(i, 2)[1]) : padrao;
};
const repetir = opcao("--repetir", 1);
const colunas = opcao("--colunas", 4);
const [modulo, nomeExport, saida] = args;
if (!modulo || !nomeExport || !saida) {
  console.error("uso: node ferramentas/previa_pixelart.mjs <modulo.js> <EXPORT> <saida.png> [--repetir 2] [--colunas 4]");
  process.exit(2);
}
const lista = (await import(pathToFileURL(resolve(modulo)).href))[nomeExport];
if (!Array.isArray(lista)) {
  console.error(`${nomeExport} não é uma lista em ${modulo}`);
  process.exit(2);
}

function png(w, h, rgb) {
  const linhas = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) rgb.copy(linhas, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const bloco = (tipo, dados) => {
    const t = Buffer.from(tipo);
    const tam = Buffer.alloc(4);
    tam.writeUInt32BE(dados.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, dados])) >>> 0);
    return Buffer.concat([tam, t, dados, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloco("IHDR", ihdr), bloco("IDAT", zlib.deflateSync(linhas)), bloco("IEND", Buffer.alloc(0))]);
}

const passo = 11;
const raio = 4.3;
const margem = 14;
// Cenas com `movimento: "cima"` ou `"baixo"` andam na vertical: a repetição (emenda) é mostrada empilhada.
const vertical = (item) => item.movimento === "cima" || item.movimento === "baixo";
const temVertical = repetir > 1 && lista.some(vertical);
const larg = 20 * passo * repetir;
const alt = 20 * passo * (temVertical ? repetir : 1);
const W = colunas * (larg + margem) + margem;
const H = Math.ceil(lista.length / colunas) * (alt + margem) + margem;
const img = Buffer.alloc(W * H * 3, 30);
const px = (x, y, c) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
};

let problemas = 0;
lista.forEach((item, k) => {
  let g;
  try {
    g = item.criar();
  } catch (erro) {
    console.log(`${k + 1}. ${item.id}: ERRO ${erro.message}`);
    problemas++;
    return;
  }
  const valida = Array.isArray(g) && g.length === 20 && g.every((l) => l.length === 20);
  const acesos = valida ? g.flat().filter((c) => c && (c[0] | c[1] | c[2])).length : 0;
  const avisos = [];
  if (!valida) avisos.push("NÃO É 20×20");
  if (acesos < 40) avisos.push("poucos LEDs (<40)");
  if (acesos > 220) avisos.push("LEDs demais (>220, envio lento)");
  if (avisos.length) problemas++;
  const mov = item.movimento || "esquerda";
  console.log(`${k + 1}. ${item.id} — ${item.nome} — ${mov} — ${acesos} LEDs${avisos.length ? "  ⚠ " + avisos.join(", ") : ""}`);
  if (!valida) return;
  const ox = margem + (k % colunas) * (larg + margem);
  const oy = margem + Math.floor(k / colunas) * (alt + margem);
  const empilhar = vertical(item);
  const [w, h] = empilhar ? [20 * passo, 20 * passo * repetir] : [20 * passo * repetir, 20 * passo];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px(ox + x, oy + y, [5, 6, 8]);
  for (let rep = 0; rep < repetir; rep++) {
    for (let lin = 0; lin < 20; lin++) {
      for (let col = 0; col < 20; col++) {
        const c = g[lin][col] || [28, 31, 38];
        const r = g[lin][col] ? raio : raio * 0.6;
        const cx = ox + ((empilhar ? 0 : rep * 20) + col + 0.5) * passo;
        const cy = oy + ((empilhar ? rep * 20 : 0) + lin + 0.5) * passo;
        for (let y = Math.floor(cy - r); y <= cy + r; y++) {
          for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) px(x, y, c);
        }
      }
    }
  }
});
writeFileSync(saida, png(W, H, img));
console.log(`${saida}: ${lista.length} itens, ${problemas} com problema`);
