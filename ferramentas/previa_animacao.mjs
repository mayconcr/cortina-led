// Folha de prévia (PNG) de animações quadro a quadro: uma linha por animação, com os quadros em sequência.
//
//   node ferramentas/previa_animacao.mjs web/js/natal-movimento.js ANIMACOES_MOVIMENTO saida.png [--max 12] [--ids a,b]
//
// Imprime, para cada animação: quadros, LEDs que mudam por quadro (máximo e média) e quadros/s na cortina
// (cada LED que muda custa ~19 ms pelo Bluetooth).
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import zlib from "node:zlib";

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args.splice(i, 2)[1] : padrao;
};
const maxQuadros = Number(opcao("--max", 12));
const ids = opcao("--ids", "");
const [modulo, nomeExport, saida] = args;
const raiz = resolve(".");
let lista = (await import(pathToFileURL(resolve(modulo)).href))[nomeExport];
const { resumoAnimacao } = await import(pathToFileURL(`${raiz}/web/js/animacao.js`).href);
if (ids) lista = lista.filter((a) => ids.split(",").includes(a.id));

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

const passo = Number(opcao("--passo", 6));
const raio = passo * 0.4;
const margem = 8;
const lado = 20 * passo;
const W = maxQuadros * (lado + 4) + margem * 2;
const H = lista.length * (lado + margem) + margem;
const img = Buffer.alloc(W * H * 3, 34);
const px = (x, y, c) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
};

lista.forEach((anim, k) => {
  let quadros;
  try {
    quadros = anim.criar();
  } catch (erro) {
    console.log(`${k + 1}. ${anim.id}: ERRO ${erro.message}`);
    return;
  }
  const r = resumoAnimacao(quadros, anim.ms);
  const aviso = r.maxMudancas > 20 || r.mediaMudancas > 12 ? "  ⚠ muitos LEDs mudando" : "";
  console.log(
    `${k + 1}. ${anim.id} — ${quadros.length} quadros, muda até ${r.maxMudancas} (média ${r.mediaMudancas.toFixed(1)}) LEDs/quadro, ` +
      `${r.quadrosPorSegundo.toFixed(1)} quadros/s na cortina, 1º quadro ${r.ledsPrimeiroQuadro} LEDs${aviso}`,
  );
  const passoQ = Math.max(1, Math.ceil(quadros.length / maxQuadros));
  const mostrar = quadros.filter((_, i) => i % passoQ === 0).slice(0, maxQuadros);
  mostrar.forEach((g, j) => {
    const ox = margem + j * (lado + 4);
    const oy = margem + k * (lado + margem);
    for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) px(ox + x, oy + y, [5, 6, 8]);
    for (let lin = 0; lin < 20; lin++) {
      for (let col = 0; col < 20; col++) {
        const c = g[lin][col] || [26, 28, 34];
        const rr = g[lin][col] ? raio : raio * 0.55;
        const cx = ox + (col + 0.5) * passo;
        const cy = oy + (lin + 0.5) * passo;
        for (let y = Math.floor(cy - rr); y <= cy + rr; y++) {
          for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rr * rr) px(x, y, c);
        }
      }
    }
  });
});
writeFileSync(saida, png(W, H, img));
console.log(saida);
