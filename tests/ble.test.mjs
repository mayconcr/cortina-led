// Testa web/js/ble.js contra uma cortina SIMULADA (nada de Bluetooth de verdade):
// ordem das escritas, cifra, autenticação JieLi, pausas de 30 ms e regras de segurança.
import assert from "node:assert/strict";
import { test } from "node:test";

import { decifrar } from "../web/js/aes.js";
import { Cortina, PAUSA_MS, UUID } from "../web/js/ble.js";
import * as JL from "../web/js/jlauth.js";
import * as P from "../web/js/protocol.js";

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const texto = (b) => String.fromCharCode(...b.slice(1, 1 + b[0])).replace(/[^\x20-\x7e]/g, ".");

/** Uma cortina falsa que responde ao handshake JieLi como a real. */
function cortinaFalsa({ autenticacaoCorreta = true } = {}) {
  const escritas = [];
  const caracs = {};
  const dispositivo = new EventTarget();
  dispositivo.name = "IDL-TESTE";
  let desafioDaCortina = null;

  function carac(uuid) {
    const c = new EventTarget();
    c.uuid = uuid;
    c.notificando = false;
    c.startNotifications = async () => {
      c.notificando = true;
      return c;
    };
    c.notificar = (bytes) => {
      if (!c.notificando) return;
      c.value = new DataView(Uint8Array.from(bytes).buffer);
      c.dispatchEvent(new Event("characteristicvaluechanged"));
    };
    const registrar = (modo) => async (dados) => {
      if (!dispositivo.gatt.connected) throw new Error("desconectada");
      escritas.push({ uuid, dados: Uint8Array.from(dados), modo, t: performance.now() });
      if (uuid === UUID.AE01) setTimeout(() => responderJL(Uint8Array.from(dados)), 5);
    };
    c.writeValueWithResponse = registrar("com");
    c.writeValueWithoutResponse = registrar("sem");
    caracs[uuid] = c;
    return c;
  }

  function responderJL(d) {
    const ae02 = caracs[UUID.AE02];
    if (d[0] === 0x00 && d.length === 17) {
      const r = JL.resposta(d.slice(1));
      if (!autenticacaoCorreta) r[0] ^= 0xff;
      ae02.notificar([0x01, ...r]);
    } else if (JL.iguais(d, JL.PASS)) {
      desafioDaCortina = crypto.getRandomValues(new Uint8Array(16));
      ae02.notificar([0x00, ...desafioDaCortina]);
    } else if (d[0] === 0x01 && JL.iguais(d.slice(1), JL.resposta(desafioDaCortina))) {
      ae02.notificar(JL.PASS);
    }
  }

  const servicos = {
    [UUID.SERVICO]: [UUID.CMD, UUID.NOTIFY, UUID.PIX],
    [UUID.SERVICO_JL]: [UUID.AE01, UUID.AE02],
  };
  for (const lista of Object.values(servicos)) lista.forEach(carac);
  dispositivo.gatt = {
    connected: false,
    async connect() {
      this.connected = true;
      return {
        getPrimaryService: async (s) => ({
          getCharacteristic: async (u) => {
            if (!servicos[s]?.includes(u)) throw new Error(`característica ${u} fora do serviço ${s}`);
            return caracs[u];
          },
        }),
      };
    },
    disconnect() {
      this.connected = false;
      dispositivo.dispatchEvent(new Event("gattserverdisconnected"));
    },
  };
  return { dispositivo, escritas, caracs };
}

function instalar(falsa) {
  let pedido = null;
  Object.defineProperty(globalThis.navigator, "bluetooth", {
    configurable: true,
    value: {
      requestDevice: async (opcoes) => {
        pedido = opcoes;
        return falsa.dispositivo;
      },
    },
  });
  return () => pedido;
}

async function conectada(opcoes) {
  const falsa = cortinaFalsa(opcoes);
  const pedido = instalar(falsa);
  const cortina = new Cortina();
  cortina.pausaAposAuthMs = 50;
  await cortina.conectar();
  return { cortina, falsa, pedido: pedido() };
}

const cmds = (escritas) => escritas.filter((e) => e.uuid === UUID.CMD).map((e) => texto(decifrar(e.dados)));

test("pede os serviços certos e filtra pelo nome", async () => {
  const { pedido, cortina } = await conectada();
  assert.deepEqual(pedido.filters, [{ namePrefix: "IDL-" }, { namePrefix: "ISP-" }]);
  assert.deepEqual(pedido.optionalServices, [UUID.SERVICO, UUID.SERVICO_JL]);
  cortina.desconectar();
});

test("preâmbulo do app e handshake antes de ficar pronta", async () => {
  const { cortina, falsa } = await conectada();
  assert.equal(cortina.estado, "conectado");
  const ordem = falsa.escritas.map((e) => (e.uuid === UUID.CMD ? texto(decifrar(e.dados)).slice(0, 4) : e.uuid === UUID.AE01 ? `AE01:${e.dados[0]}` : "?"));
  assert.deepEqual(ordem, ["VER", "TIME", "LEDS", "LEDS", "AE01:0", "AE01:2", "AE01:1"]);
  // CMD com resposta e cifrada; AE01 sem resposta e em texto puro
  for (const e of falsa.escritas) assert.equal(e.modo, e.uuid === UUID.CMD ? "com" : "sem");
  assert.ok(JL.iguais(falsa.escritas[5].dados, JL.PASS));
  // TIME no formato do app, com a cauda
  const time = decifrar(falsa.escritas[1].dados);
  assert.deepEqual(Array.from(time.slice(9, 16)), Array.from(P.CAUDA_TIME_APP));
  // notificações ligadas antes da primeira escrita
  assert.ok(falsa.caracs[UUID.NOTIFY].notificando && falsa.caracs[UUID.AE02].notificando);
  cortina.desconectar();
});

test("no 0xAE00 só os 3 pacotes do handshake, mesmo depois de vários comandos", async () => {
  const { cortina, falsa } = await conectada();
  await cortina.ligar();
  await cortina.cor(255, 0, 0, 30);
  await cortina.efeito(3, 40, 8);
  await cortina.apagar();
  assert.equal(falsa.escritas.filter((e) => e.uuid === UUID.AE01).length, 3);
  cortina.desconectar();
});

test("comandos saem na ordem, cifrados, com pelo menos 30 ms entre escritas", async () => {
  const { cortina, falsa } = await conectada();
  const antes = falsa.escritas.length;
  await Promise.all([cortina.desligar(), cortina.ligar(), cortina.cor(0, 0, 255, 40), cortina.efeito(10, 20, 8)]);
  const novas = falsa.escritas.slice(antes);
  assert.deepEqual(cmds(novas).map((t) => t.slice(0, 4)), ["LEDO", "LEDO", "COLO", "EFF.", "EFF.", "EFF.", "LIGH", "SPEE"]);
  for (let i = 1; i < falsa.escritas.length; i++) {
    assert.ok(falsa.escritas[i].t - falsa.escritas[i - 1].t >= PAUSA_MS - 1, `pausa entre escritas ${i - 1} e ${i}`);
  }
  cortina.desconectar();
});

test("desenho: SMVEW 01, pixels cifrados na …960B sem resposta, SMVEW 02 e MODE 03 se rolar", async () => {
  const { cortina, falsa } = await conectada();
  const grade = Array.from({ length: 20 }, () => Array(20).fill(null));
  grade[0][0] = [255, 0, 0];
  grade[19][19] = [0, 0, 255];
  const antes = falsa.escritas.length;
  const progresso = [];
  const r = await cortina.desenhar(grade, { brilho: 40, rolar: true, aoProgresso: (f, t) => progresso.push(`${f}/${t}`) });
  const novas = falsa.escritas.slice(antes);
  assert.deepEqual(
    novas.map((e) => (e.uuid === UUID.PIX ? `PIX ${e.modo}` : texto(decifrar(e.dados)).slice(0, 5))),
    ["SMVEW", "PIX sem", "PIX sem", "SMVEW", "MODE."],
  );
  assert.deepEqual(Array.from(decifrar(novas[1].dados).slice(0, 6)), [5, 0, 0, 0, 102, 0]);
  assert.deepEqual(Array.from(decifrar(novas[2].dados).slice(0, 6)), [5, 19, 19, 0, 0, 102]);
  assert.equal(decifrar(novas[3].dados)[6], 2);
  assert.deepEqual(progresso, ["1/2", "2/2"]);
  assert.equal(r.cancelado, false);
  cortina.desconectar();
});

test("cancelar o desenho ainda fecha com SMVEW 02", async () => {
  const { cortina, falsa } = await conectada();
  const grade = Array.from({ length: 20 }, () => Array(20).fill([255, 0, 0]));
  const controle = new AbortController();
  const antes = falsa.escritas.length;
  const r = await cortina.desenhar(grade, { brilho: 10, sinal: controle.signal, aoProgresso: (f) => f === 3 && controle.abort() });
  const novas = falsa.escritas.slice(antes);
  assert.equal(r.feitos, 3);
  assert.equal(r.cancelado, true);
  assert.equal(texto(decifrar(novas.at(-1).dados)), "SMVEW.");
  assert.equal(decifrar(novas.at(-1).dados)[6], 2);
  cortina.desconectar();
});

test("autenticação errada: para e não manda comandos", async () => {
  const falsa = cortinaFalsa({ autenticacaoCorreta: false });
  instalar(falsa);
  const cortina = new Cortina();
  cortina.pausaAposAuthMs = 10;
  await assert.rejects(cortina.conectar(), /inesperado/);
  assert.equal(cortina.estado, "desconectado");
  assert.equal(falsa.escritas.filter((e) => e.uuid === UUID.AE01).length, 1);
  assert.throws(() => cortina.ligar(), /Conecte/);
});

test("regras de segurança valem antes de entrar na fila", async () => {
  const { cortina, falsa } = await conectada();
  const antes = falsa.escritas.length;
  assert.throws(() => cortina.efeito(11, 40, 8), RangeError);
  assert.throws(() => cortina.efeito(0, 40, 8), RangeError);
  assert.throws(() => cortina.cor(255, 255, 255, 40), RangeError);
  assert.throws(() => cortina.desenhar(Array.from({ length: 20 }, () => Array(20).fill([255, 255, 255])), { brilho: 41 }), RangeError);
  await dormir(40);
  assert.equal(falsa.escritas.length, antes, "nada foi escrito");
  cortina.desconectar();
});

test("reconecta sozinha e refaz preâmbulo e handshake", async () => {
  const { cortina, falsa } = await conectada();
  const estados = [];
  cortina.addEventListener("estado", (e) => estados.push(e.detail.estado));
  falsa.dispositivo.gatt.connected = false;
  falsa.dispositivo.dispatchEvent(new Event("gattserverdisconnected")); // queda, sem o usuário pedir
  for (let i = 0; i < 60 && cortina.estado !== "conectado"; i++) await dormir(50);
  assert.equal(cortina.estado, "conectado");
  assert.deepEqual(estados.slice(0, 3), ["reconectando", "conectando", "preparando"]);
  assert.equal(falsa.escritas.filter((e) => e.uuid === UUID.AE01).length, 6);
  cortina.desconectar();
});

test("rolagem com velocidade: SMVEW 02, MODE 03 e SPEED, nessa ordem (como o app oficial)", async () => {
  const { cortina, falsa } = await conectada();
  const grade = Array.from({ length: 20 }, () => Array(20).fill(null));
  grade[5][5] = [0, 255, 0];
  const antes = falsa.escritas.length;
  await cortina.desenhar(grade, { brilho: 40, rolar: true, velocidade: 4 });
  const fim = falsa.escritas.slice(antes).map((e) => decifrar(e.dados));
  assert.deepEqual(fim.slice(-3).map((pk) => texto(pk).slice(0, 5)), ["SMVEW", "MODE.", "SPEED"]);
  assert.equal(fim.at(-1)[6], 4);
  await cortina.velocidade(12);
  assert.equal(decifrar(falsa.escritas.at(-1).dados)[6], 12);
  assert.throws(() => cortina.velocidade(17), RangeError);
  await cortina.desenhar(grade, { brilho: 40, velocidade: 4 }); // sem rolar, não manda SPEED
  assert.equal(texto(decifrar(falsa.escritas.at(-1).dados)).slice(0, 5), "SMVEW");
  cortina.desconectar();
});

test("animação da cortina: ANIM + LIGHT, só números testados", async () => {
  const { cortina, falsa } = await conectada();
  const antes = falsa.escritas.length;
  await cortina.animacaoNativa(0x0e, 40);
  const cmdsNovos = falsa.escritas.slice(antes).map((e) => decifrar(e.dados));
  assert.deepEqual(cmdsNovos.map((pk) => texto(pk).slice(0, 4)), ["ANIM", "LIGH"]);
  assert.equal(cmdsNovos[0][5], 0x0e);
  assert.equal(cmdsNovos[1][6], 40);
  assert.throws(() => cortina.animacaoNativa(0x1a, 40), RangeError);
  cortina.desconectar();
});

test("animação na cortina: cada quadro redesenhado inteiro (SMVEW 01, LEDs acesos, SMVEW 02) até parar", async () => {
  const { cortina, falsa } = await conectada();
  const q0 = Array.from({ length: 20 }, () => Array(20).fill(null));
  const q1 = Array.from({ length: 20 }, () => Array(20).fill(null));
  q0[3][4] = [255, 0, 0];
  q0[5][5] = [0, 255, 0];
  q1[5][5] = [0, 255, 0];
  q1[6][7] = [0, 0, 255];
  const mostrados = [];
  const antes = falsa.escritas.length;
  const fim = cortina.tocarQuadros([q0, q1], { brilho: 40, aoQuadro: (i) => mostrados.push(i) });
  assert.ok(cortina.tocandoAnimacao);
  for (let i = 0; i < 100 && mostrados.length < 3; i++) await dormir(20);
  await cortina.ligar(); // qualquer outro comando para a animação
  await fim;
  assert.ok(!cortina.tocandoAnimacao);
  const seq = falsa.escritas.slice(antes).map((e) => {
    const pk = decifrar(e.dados);
    return e.uuid === UUID.PIX ? `P${pk[1]},${pk[2]}` : `${texto(pk).slice(0, 5)}${pk[0] === 6 && texto(pk).startsWith("SMVEW") ? pk[6] : ""}`;
  });
  assert.deepEqual(seq.slice(0, 12), ["SMVEW1", "P3,4", "P5,5", "SMVEW2", "SMVEW1", "P5,5", "P6,7", "SMVEW2", "SMVEW1", "P3,4", "P5,5", "SMVEW2"]);
  assert.equal(seq.at(-1), "LEDON");
  for (const e of falsa.escritas.slice(antes).filter((x) => x.uuid === UUID.PIX)) {
    const pk = decifrar(e.dados);
    assert.ok(pk[3] + pk[4] + pk[5] > 0, "nunca manda pixel preto");
  }
  assert.deepEqual(mostrados.slice(0, 3), [0, 1, 0]);
  cortina.desconectar();
});
