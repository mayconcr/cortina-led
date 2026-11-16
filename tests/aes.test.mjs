// node --test tests/
import assert from "node:assert/strict";
import { test } from "node:test";

import { CHAVE, cifrar, decifrar } from "../web/js/aes.js";

const hex = (s) => Uint8Array.from(s.replace(/\s+/g, "").match(/../g).map((h) => parseInt(h, 16)));
const paraHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

// docs/PROTOCOLO.md §2, "Vetores de teste (conferidos)"
const VETORES = [
  ["05 54 55 52 4E 01 00 00 00 00 00 00 00 00 00 00", "84dd5042374150897ac82f39110968a8"],
  ["05 54 55 52 4E 00 00 00 00 00 00 00 00 00 00 00", "79d1dba40919c246a8580ae7d11b7884"],
  ["06 4C 45 44 4F 4E 00 00 00 00 00 00 00 00 00 00", "8ebc70eb0de699d5eb16383e026d2ac6"],
  ["06 4C 45 44 4F 46 46 00 00 00 00 00 00 00 00 00", "cbb1fdbfc560d5e453c2cbd928b53fab"],
  ["0F 53 47 4C 53 00 00 64 50 1F 00 00 1F 00 00 32", "2dec317e7181ccb079fc665ae43fa9dd"],
];

test("cifra os vetores do PROTOCOLO.md §2 com a chave do iDeal LED", () => {
  for (const [puro, cifrado] of VETORES) assert.equal(paraHex(cifrar(hex(puro))), cifrado);
});

test("decifra os mesmos vetores de volta", () => {
  for (const [puro, cifrado] of VETORES) assert.deepEqual(decifrar(hex(cifrado)), hex(puro));
});

test("FIPS-197 apêndice C.1 (AES-128 padrão)", () => {
  const chave = hex("000102030405060708090a0b0c0d0e0f");
  const c = cifrar(hex("00112233445566778899aabbccddeeff"), chave);
  assert.equal(paraHex(c), "69c4e0d86a7b0430d8cdb78070b4c55a");
  assert.equal(paraHex(decifrar(c, chave)), "00112233445566778899aabbccddeeff");
});

test("chave é a do §2", () => {
  assert.equal(paraHex(CHAVE), "34522a5b7a6e492c08090a9d8d2a23f8");
});

test("rejeita blocos que não têm 16 bytes", () => {
  assert.throws(() => cifrar(new Uint8Array(15)));
  assert.throws(() => decifrar(new Uint8Array(17)));
});

test("não altera o bloco de entrada", () => {
  const entrada = hex(VETORES[0][0]);
  const copia = Uint8Array.from(entrada);
  cifrar(entrada);
  assert.deepEqual(entrada, copia);
});
