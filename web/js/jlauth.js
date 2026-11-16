// Autenticação JieLi (RCSP auth) do serviço 0xAE00 — espelho de ferramentas/jl_auth.py (PROTOCOLO.md §5ter).
//
// É a função E1 do Bluetooth clássico (cifra SAFER+), com chave e "endereço" fixos tirados de
// libjl_ota_auth.so. No 0xAE00 o app só manda os 3 pacotes do handshake: nada mais (é o canal de firmware).
// Testes: tests/jlauth.test.mjs (pares da captura do iPhone + vetores gerados pelo Python).

export const CHAVE_JL = Uint8Array.from([
  0x06, 0x77, 0x5f, 0x87, 0x91, 0x8d, 0xd4, 0x23, 0x00, 0x5d, 0xf1, 0xd8, 0xcf, 0x0c, 0x14, 0x2b,
]);
export const ENDERECO_JL = Uint8Array.from([0x11, 0x22, 0x33, 0x33, 0x22, 0x11]);
export const PASS = Uint8Array.from([0x02, 0x70, 0x61, 0x73, 0x73]); // 02 'pass'

const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);
{
  let e = 1;
  for (let i = 0; i < 256; i++) {
    EXP[i] = e % 256; // 45^i mod 257 (o 256 vira 0)
    e = (e * 45) % 257;
  }
  for (let i = 0; i < 256; i++) LOG[EXP[i]] = i;
}
const MARCADAS = new Set([0, 3, 4, 7, 8, 11, 12, 15]);
const PERM = [8, 11, 12, 15, 2, 1, 6, 5, 10, 9, 14, 13, 0, 7, 4, 3];
const DESLOC = [
  [233, "+"], [229, "^"], [223, "+"], [193, "^"], [179, "+"], [167, "^"], [149, "+"], [131, "^"],
  [233, "^"], [229, "+"], [223, "^"], [193, "+"], [179, "^"], [167, "+"], [149, "^"], [131, "+"],
];

function bias(i) {
  return Array.from({ length: 16 }, (_, j) => EXP[EXP[(17 * i + j + 1) % 256]]);
}

function subchaves(chave) {
  let k = [...chave, chave.reduce((a, b) => a ^ b, 0)];
  const sub = [Array.from(chave)];
  for (let i = 2; i < 18; i++) {
    k = k.map((b) => ((b << 3) | (b >> 5)) & 0xff);
    const bi = bias(i);
    sub.push(Array.from({ length: 16 }, (_, j) => (k[(i - 1 + j) % 17] + bi[j]) & 0xff));
  }
  return sub;
}

function mistura(x, k, xorNasMarcadas) {
  return x.map((v, i) => (MARCADAS.has(i) === xorNasMarcadas ? v ^ k[i] : (v + k[i]) & 0xff));
}

/** SAFER+ Ar (linha = false) ou Ar' (linha = true), 8 rodadas, chave de 128 bits. */
export function ar(chave, bloco, linha = false) {
  const ks = subchaves(chave);
  let x = Array.from(bloco);
  const entrada = Array.from(bloco);
  for (let r = 0; r < 8; r++) {
    if (linha && r === 2) x = mistura(x, entrada, true);
    x = mistura(x, ks[2 * r], true);
    x = x.map((v, i) => (MARCADAS.has(i) ? EXP[v] : LOG[v]));
    x = mistura(x, ks[2 * r + 1], false);
    for (let camada = 0; camada < 4; camada++) {
      const y = new Array(16);
      for (let p = 0; p < 16; p += 2) {
        const a = x[p];
        const b = x[p + 1];
        y[p] = (2 * a + b) & 0xff;
        y[p + 1] = (a + b) & 0xff;
      }
      x = camada === 3 ? y : PERM.map((i) => y[i]);
    }
  }
  return Uint8Array.from(mistura(x, ks[16], true));
}

/** Função E1 do Bluetooth clássico, devolvendo os 16 bytes (não só o SRES). */
export function e1(chave, desafio, endereco) {
  if (chave.length !== 16 || desafio.length !== 16 || endereco.length !== 6) {
    throw new RangeError("E1 precisa de chave de 16 bytes, desafio de 16 bytes e endereço de 6 bytes");
  }
  const t = ar(chave, desafio);
  const t2 = Uint8Array.from({ length: 16 }, (_, i) => ((t[i] ^ desafio[i]) + endereco[i % 6]) & 0xff);
  const k2 = Uint8Array.from(DESLOC, ([c, op], i) => (op === "+" ? (chave[i] + c) & 0xff : chave[i] ^ c));
  return ar(k2, t2, true);
}

/** Resposta de 16 bytes a um desafio de 16 bytes, com a chave e o endereço fixos da JieLi. */
export const resposta = (desafio) => e1(CHAVE_JL, desafio, ENDERECO_JL);

/** Passo 1 (app → cortina): 00 + 16 bytes aleatórios. */
export function pacoteDesafio(aleatorio16) {
  if (aleatorio16.length !== 16) throw new RangeError("o desafio precisa ter 16 bytes");
  return Uint8Array.from([0x00, ...aleatorio16]);
}

/** Passo 4 (app → cortina): 01 + E1(desafio da cortina). */
export const pacoteResposta = (desafio16) => Uint8Array.from([0x01, ...resposta(desafio16)]);

/** Compara dois arrays de bytes. */
export const iguais = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
