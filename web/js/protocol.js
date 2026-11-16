// Pacotes da cortina IDL-6A9E5C — espelho de ferramentas/protocolo.py (docs/PROTOCOLO.md §5bis).
//
// Funções puras: recebem parâmetros e devolvem os 16 bytes EM TEXTO PURO (Uint8Array).
// Quem cifra (AES) e envia é web/js/ble.js. Nenhum byte aqui foge do que está documentado
// e confirmado na cortina real (docs/DESCOBERTAS.md).
//
// Regras de segurança do CLAUDE.md aplicadas AQUI, no nível mais baixo, para nenhum botão
// da interface conseguir passar por cima delas:
//   - efeito só de 1 a 10 (regra 3);
//   - brilho de desenho e de cor sólida até 40 % (regra 5);
//   - brilho dos efeitos (LIGHT) até 100 %: liberado pelo usuário em 2026-11-16, testado aos poucos;
//   - cor sólida: nenhum canal acima de 40 % e nunca branco acima de 30 % (o que já foi testado);
//   - não existem LAMPN nem CT (regra 4); TIME só no formato do app (autorizado pelo usuário).
// Testes: tests/protocol.test.mjs (compara com os bytes gerados pelo Python).

export const EFEITO_MIN = 1;
export const EFEITO_MAX = 10;
export const COLUNAS = 20;
export const LINHAS = 20;
export const BRILHO_MAX = 40; // % — desenho, efeitos e cor sólida
export const LIMITE_CANAL = Math.floor((255 * BRILHO_MAX) / 100); // 102
export const LIMITE_SOMA_COR = Math.floor((3 * 255 * 30) / 100); // 229 = branco a 30 % (testado em 2026-11-16)

// Velocidade dos efeitos (SPEED). O app oficial manda 08. Ver docs/DESCOBERTAS.md sobre os valores liberados.
export const VELOCIDADE_PADRAO = 8;
export const VELOCIDADE_MIN = 1;
export const VELOCIDADE_MAX = 16;
export const BRILHO_EFEITO_MIN = 5;
export const BRILHO_EFEITO_MAX = 100; // LIGHT: o app oficial vai até 100 % (usuário liberou em 2026-11-16)

// Cauda fixa que o app iOS manda depois da hora no TIME (captura de 2026-11-16).
export const CAUDA_TIME_APP = Object.freeze([0xa5, 0x5a, 0xa5, 0x00, 0x03, 0x02, 0x06]);
export const MODO_ROLAR = 3; // MODE 03: o desenho rola da direita para a esquerda (confirmado)

const ascii = (texto) => Array.from(texto, (c) => c.charCodeAt(0));

function inteiro(valor, nome, min, max) {
  if (!Number.isInteger(valor) || valor < min || valor > max) {
    throw new RangeError(`${nome} precisa ser inteiro de ${min} a ${max}, veio ${valor}`);
  }
  return valor;
}

const canal = (v, nome) => inteiro(v, nome, 0, 255);
const porcento = (v, nome) => inteiro(v, nome, 0, 100);

/** Completa com zeros até 16 bytes (formato de todo comando cifrado). */
export function completar(bytes) {
  if (bytes.length > 16) throw new RangeError(`pacote com ${bytes.length} bytes; o máximo é 16`);
  const pacote = new Uint8Array(16);
  pacote.set(bytes);
  return pacote;
}

/** Regra 3 do CLAUDE.md: só efeitos de 1 a 10. Erro, nunca ajuste silencioso. */
export function validarEfeito(n) {
  return inteiro(n, "efeito", EFEITO_MIN, EFEITO_MAX);
}

/** Aplica o brilho (%) em um canal de 8 bits, como o Python: (v * brilho) // 100. */
export const escalar = (v, brilho) => Math.floor((v * brilho) / 100) & 0xff;

// ---------- preâmbulo (o app manda isto logo após conectar) ----------

/** 03 'VER'. A cortina responde por NOTIFY com 05 'VER' 08 01. */
export const ver = () => completar([0x03, ...ascii("VER")]);

/** 05 'LEDS' NN — o app manda LEDS 00 duas vezes. Função desconhecida, só o valor 00 é usado. */
export function leds(n = 0) {
  inteiro(n, "LEDS", 0, 0);
  return completar([0x05, ...ascii("LEDS"), n]);
}

/** 08 'TIME' DW HH MM SS + cauda do app. DW: 1 = segunda ... 7 = domingo. */
export function hora(diaSemana, h, m, s, cauda = CAUDA_TIME_APP) {
  inteiro(diaSemana, "dia da semana", 0, 7);
  inteiro(h, "hora", 0, 23);
  inteiro(m, "minuto", 0, 59);
  inteiro(s, "segundo", 0, 59);
  const ok = cauda.length === 0 || (cauda.length === CAUDA_TIME_APP.length && cauda.every((b, i) => b === CAUDA_TIME_APP[i]));
  if (!ok) throw new RangeError("a cauda do TIME só pode ser a do app ou vazia");
  return completar([0x08, ...ascii("TIME"), diaSemana, h, m, s, ...cauda]);
}

/** TIME com a hora de um objeto Date (padrão: agora). */
export function horaDe(data = new Date()) {
  return hora(data.getDay() || 7, data.getHours(), data.getMinutes(), data.getSeconds());
}

// ---------- liga, desliga, cor ----------

/** Liga como o app faz nesta cortina: 05 'LEDON'. */
export const ledon = () => completar([0x05, ...ascii("LEDON")]);

/** Desliga: 06 'LEDOFF'. */
export const ledoff = () => completar([0x06, ...ascii("LEDOFF")]);

/** Os três canais de uma cor sólida depois do brilho, já com os limites de segurança. */
export function canaisCor(r, g, b, brilho) {
  porcento(brilho, "brilho");
  const c = [canal(r, "R"), canal(g, "G"), canal(b, "B")].map((v) => escalar(v, brilho));
  if (Math.max(...c) > LIMITE_CANAL) {
    throw new RangeError(`cor forte demais: nenhum canal pode passar de ${BRILHO_MAX} %`);
  }
  if (c[0] + c[1] + c[2] > LIMITE_SOMA_COR) {
    throw new RangeError("cor clara demais para os 400 LEDs: branco só até 30 %");
  }
  return c;
}

/** Cor sólida: 07 'COLO' G R B em 8 bits (ordem G R B, confirmada). */
export function colo8(r, g, b, brilho = 100) {
  const [rr, gg, bb] = canaisCor(r, g, b, brilho);
  return completar([0x07, ...ascii("COLO"), gg, rr, bb]);
}

// ---------- efeitos ----------

const MODELOS_EFF = [
  [0x0f, 0x45, 0x46, 0x46, -1, 0x07, 0x03, 0xff, 0x00, 0x00, 0xff, 0x80, 0x00, 0xff, 0xff, 0x00],
  [0x0f, 0x45, 0x46, 0x46, -1, 0x07, 0x13, 0x00, 0xff, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00, 0xff],
  [0x07, 0x45, 0x46, 0x46, -1, 0x07, 0x21, 0x80, 0x00, 0xff],
];

/** Os 3 pacotes EFF exatamente como o app (paleta fixa). ACK esperado: 06 'EFF' 0x 'OK'. */
export function effApp(n) {
  validarEfeito(n);
  return MODELOS_EFF.map((modelo) => completar(modelo.map((b) => (b === -1 ? n : b))));
}

/** 06 'LIGHT' BR — brilho dos efeitos em %, de 5 a 100 (o app oficial manda 32 = 50 %). */
export function lightBrilho(brilho = BRILHO_MAX) {
  return completar([0x06, ...ascii("LIGHT"), inteiro(brilho, "brilho do efeito", BRILHO_EFEITO_MIN, BRILHO_EFEITO_MAX)]);
}

/** 06 'SPEED' SP — velocidade dos efeitos (o app manda 08). */
export function speed(v = VELOCIDADE_PADRAO) {
  return completar([0x06, ...ascii("SPEED"), inteiro(v, "velocidade", VELOCIDADE_MIN, VELOCIDADE_MAX)]);
}

/** Sequência completa de um efeito: 3×EFF + LIGHT + SPEED. */
export function efeito(n, brilho = BRILHO_MAX, velocidade = VELOCIDADE_PADRAO) {
  return [...effApp(n), lightBrilho(brilho), speed(velocidade)];
}

// ---------- desenho (SMVEW + pixels na …960B) ----------

/** 05 'MODE' 03 — só o valor 03 (rolar para a esquerda) foi testado; outros são recusados. */
export function mode(m = MODO_ROLAR) {
  inteiro(m, "modo", MODO_ROLAR, MODO_ROLAR);
  return completar([0x05, ...ascii("MODE"), m]);
}

/** 06 'SMVEW' 01 abre o envio de pixels (e apaga o desenho anterior); 06 'SMVEW' 02 fecha. */
export function smvew(fase) {
  inteiro(fase, "fase do SMVEW", 1, 2);
  return completar([0x06, ...ascii("SMVEW"), fase]);
}

/** Pixel para a …960B: 05 LINHA COLUNA G R B (x = linha, y = coluna), brilho até 40 %. */
export function pixelXY(x, y, r, g, b, brilho = BRILHO_MAX) {
  inteiro(brilho, "brilho de desenho", 0, BRILHO_MAX);
  inteiro(x, "x", 0, LINHAS - 1);
  inteiro(y, "y", 0, COLUNAS - 1);
  const [rr, gg, bb] = [canal(r, "R"), canal(g, "G"), canal(b, "B")].map((v) => escalar(v, brilho));
  return completar([0x05, x, y, gg, rr, bb]);
}

/**
 * (coluna, linha) da grade → [1º byte, 2º byte] do pacote de pixel.
 * Origem no canto superior esquerdo, olhando a cortina de frente; o pacote leva a LINHA primeiro.
 */
export function mapear(col, lin) {
  inteiro(col, "coluna", 0, COLUNAS - 1);
  inteiro(lin, "linha", 0, LINHAS - 1);
  return [lin, col];
}

/** Pacote de um pixel da grade. */
export function pixel(col, lin, r, g, b, brilho = BRILHO_MAX) {
  const [x, y] = mapear(col, lin);
  return pixelXY(x, y, r, g, b, brilho);
}

/** Pacotes dos pixels acesos de um quadro. grade[lin][col] = [r, g, b] ou null (apagado). */
export function quadro(grade, brilho = BRILHO_MAX) {
  if (grade.length !== LINHAS || grade.some((linha) => linha.length !== COLUNAS)) {
    throw new RangeError(`o quadro precisa ter ${LINHAS} linhas de ${COLUNAS} colunas`);
  }
  const pacotes = [];
  grade.forEach((linha, lin) =>
    linha.forEach((cor, col) => {
      if (!cor || !cor.some((v) => v)) return;
      pacotes.push(pixel(col, lin, cor[0], cor[1], cor[2], brilho));
    }),
  );
  return pacotes;
}

/** As 76 posições [col, lin] do contorno, em sentido horário a partir de (0, 0). */
export function borda() {
  const pos = [];
  for (let c = 0; c < COLUNAS; c++) pos.push([c, 0]);
  for (let l = 1; l < LINHAS; l++) pos.push([COLUNAS - 1, l]);
  for (let c = COLUNAS - 2; c >= 0; c--) pos.push([c, LINHAS - 1]);
  for (let l = LINHAS - 2; l > 0; l--) pos.push([0, l]);
  return pos;
}

/** Bytes em hexadecimal, separados por espaço (para o registro de diagnóstico). */
export const hexs = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
