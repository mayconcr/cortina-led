// AES-128 em JavaScript puro, um bloco de 16 bytes por vez (modo ECB, sem IV e sem padding).
// Fonte: docs/PROTOCOLO.md §2. O WebCrypto não tem ECB, por isso esta implementação.
// Testes: tests/aes.test.mjs (vetores do §2 e da FIPS-197).

// Chave pública do iDeal LED (extraída do app Android, confirmada na cortina em 2026-11-16).
export const CHAVE = Uint8Array.from([
  0x34, 0x52, 0x2a, 0x5b, 0x7a, 0x6e, 0x49, 0x2c, 0x08, 0x09, 0x0a, 0x9d, 0x8d, 0x2a, 0x23, 0xf8,
]);

const SBOX = new Uint8Array(256);
const SBOX_INV = new Uint8Array(256);

// Gera a S-box pelo inverso em GF(2^8) + transformação afim (evita colar uma tabela de 256 números).
(function gerarSbox() {
  const rotl = (x, n) => ((x << n) | (x >> (8 - n))) & 0xff;
  let p = 1;
  let q = 1;
  do {
    p = (p ^ (p << 1) ^ (p & 0x80 ? 0x1b : 0)) & 0xff; // p * 3
    q ^= q << 1; // q / 3
    q ^= q << 2;
    q ^= q << 4;
    q &= 0xff;
    if (q & 0x80) q ^= 0x09;
    SBOX[p] = q ^ rotl(q, 1) ^ rotl(q, 2) ^ rotl(q, 3) ^ rotl(q, 4) ^ 0x63;
  } while (p !== 1);
  SBOX[0] = 0x63;
  for (let i = 0; i < 256; i++) SBOX_INV[SBOX[i]] = i;
})();

function vezes(a, b) {
  // multiplicação em GF(2^8) com o polinômio do AES
  let r = 0;
  while (b) {
    if (b & 1) r ^= a;
    a = (a << 1) ^ (a & 0x80 ? 0x11b : 0);
    b >>= 1;
  }
  return r & 0xff;
}

function expandirChave(chave) {
  if (!(chave instanceof Uint8Array) || chave.length !== 16) {
    throw new Error("a chave AES-128 precisa ter 16 bytes");
  }
  const w = new Uint8Array(176);
  w.set(chave);
  let rcon = 1;
  for (let i = 16; i < 176; i += 4) {
    let t = w.slice(i - 4, i);
    if (i % 16 === 0) {
      t = Uint8Array.from([SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]);
      rcon = vezes(rcon, 2);
    }
    for (let j = 0; j < 4; j++) w[i + j] = w[i + j - 16] ^ t[j];
  }
  return w;
}

const cacheChaves = new Map();
function chaveExpandida(chave) {
  const id = Array.from(chave).join(",");
  if (!cacheChaves.has(id)) cacheChaves.set(id, expandirChave(chave));
  return cacheChaves.get(id);
}

function somarChave(s, w, rodada) {
  for (let i = 0; i < 16; i++) s[i] ^= w[rodada * 16 + i];
}

function bloco16(dados) {
  const b = dados instanceof Uint8Array ? dados : Uint8Array.from(dados);
  if (b.length !== 16) throw new Error(`o AES trabalha com blocos de 16 bytes, veio ${b.length}`);
  return Uint8Array.from(b);
}

/** Cifra um bloco de 16 bytes. Devolve um Uint8Array novo. */
export function cifrar(dados, chave = CHAVE) {
  const w = chaveExpandida(chave);
  const s = bloco16(dados);
  somarChave(s, w, 0);
  for (let rodada = 1; rodada <= 10; rodada++) {
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];
    const t = Uint8Array.from(s); // ShiftRows: a linha r anda r casas para a esquerda
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[r + 4 * c] = t[r + 4 * ((c + r) % 4)];
    if (rodada !== 10) {
      for (let c = 0; c < 4; c++) {
        const [a0, a1, a2, a3] = s.subarray(4 * c, 4 * c + 4);
        s[4 * c] = vezes(a0, 2) ^ vezes(a1, 3) ^ a2 ^ a3;
        s[4 * c + 1] = a0 ^ vezes(a1, 2) ^ vezes(a2, 3) ^ a3;
        s[4 * c + 2] = a0 ^ a1 ^ vezes(a2, 2) ^ vezes(a3, 3);
        s[4 * c + 3] = vezes(a0, 3) ^ a1 ^ a2 ^ vezes(a3, 2);
      }
    }
    somarChave(s, w, rodada);
  }
  return s;
}

/** Decifra um bloco de 16 bytes (usado nas notificações da cortina). */
export function decifrar(dados, chave = CHAVE) {
  const w = chaveExpandida(chave);
  const s = bloco16(dados);
  somarChave(s, w, 10);
  for (let rodada = 9; rodada >= 0; rodada--) {
    const t = Uint8Array.from(s); // InvShiftRows
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[r + 4 * ((c + r) % 4)] = t[r + 4 * c];
    for (let i = 0; i < 16; i++) s[i] = SBOX_INV[s[i]];
    somarChave(s, w, rodada);
    if (rodada !== 0) {
      for (let c = 0; c < 4; c++) {
        const [a0, a1, a2, a3] = s.subarray(4 * c, 4 * c + 4);
        s[4 * c] = vezes(a0, 14) ^ vezes(a1, 11) ^ vezes(a2, 13) ^ vezes(a3, 9);
        s[4 * c + 1] = vezes(a0, 9) ^ vezes(a1, 14) ^ vezes(a2, 11) ^ vezes(a3, 13);
        s[4 * c + 2] = vezes(a0, 13) ^ vezes(a1, 9) ^ vezes(a2, 14) ^ vezes(a3, 11);
        s[4 * c + 3] = vezes(a0, 11) ^ vezes(a1, 13) ^ vezes(a2, 9) ^ vezes(a3, 14);
      }
    }
  }
  return s;
}
