// Conexão com a cortina pelo Web Bluetooth (Chrome no computador, Bluefy no iPhone).
//
// A cada conexão faz o que o app oficial faz (PROTOCOLO.md §5bis/§5ter, confirmado em 2026-11-16):
//   notificações ligadas → VER → TIME → LEDS 00 → LEDS 00 → handshake JieLi no 0xAE01 → pausa de 2 s.
// Depois disso aceita comandos. Toda escrita passa por UMA fila, uma por vez, com pausa de 30 ms
// (CLAUDE.md regra 6). Os pacotes vêm prontos e validados de protocol.js; aqui só se cifra e envia.

import { cifrar, decifrar } from "./aes.js";
import * as JL from "./jlauth.js";
import * as P from "./protocol.js";

const curto = (n) => `0000${n.toString(16)}-0000-1000-8000-00805f9b34fb`;
export const UUID = Object.freeze({
  SERVICO: curto(0xfff0),
  CMD: "d44bc439-abfd-45a2-b575-925416129600",
  NOTIFY: "d44bc439-abfd-45a2-b575-925416129601",
  PIX: "d44bc439-abfd-45a2-b575-92541612960b",
  SERVICO_JL: curto(0xae00), // usado SOMENTE para o handshake de autenticação
  AE01: curto(0xae01),
  AE02: curto(0xae02),
});
export const PAUSA_MS = 30; // CLAUDE.md regra 6: pelo menos 30 ms entre escritas
const ESPERA_AUTH_MS = 4000;
const TENTATIVAS_RECONEXAO = 3;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const bytesDe = (dv) => new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength).slice();
const legivel = (b) => Array.from(b, (x) => (x >= 32 && x < 127 ? String.fromCharCode(x) : ".")).join("");

/** Diz se este navegador consegue falar Bluetooth com a cortina, e por quê não. */
export function suporteBluetooth() {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return { ok: false, motivo: "Abra o app pelo endereço https:// (o Bluetooth não funciona sem isso)." };
  }
  if (typeof navigator === "undefined" || !navigator.bluetooth) {
    const iphone = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
    return {
      ok: false,
      motivo: iphone
        ? "O Safari não tem Bluetooth para sites. Abra este endereço no app Bluefy."
        : "Este navegador não tem Web Bluetooth. Use o Chrome (computador) ou o Bluefy (iPhone).",
    };
  }
  return { ok: true, motivo: "" };
}

export class Cortina extends EventTarget {
  constructor() {
    super();
    this.dispositivo = null;
    this.c = {};
    this.estado = "desconectado"; // desconectado · conectando · preparando · conectado · reconectando
    this.pixComResposta = false; // true = desenho mais lento (91 ms/pixel), com confirmação de cada pixel
    this._fila = Promise.resolve();
    this._pendentes = 0;
    this._caixaJL = [];
    this._esperaJL = null;
    this._saindo = false;
    this.pausaAposAuthMs = 2000; // o app espera ~2 s depois da autenticação antes do primeiro comando
    this._aoNotificar = this._aoNotificar.bind(this);
    this._aoNotificarJL = this._aoNotificarJL.bind(this);
    this._aoDesconectar = this._aoDesconectar.bind(this);
  }

  get conectada() {
    return this.estado === "conectado";
  }

  get ocupada() {
    return this._pendentes > 0;
  }

  get nome() {
    return this.dispositivo?.name || "";
  }

  _emitir(tipo, detalhe) {
    this.dispatchEvent(new CustomEvent(tipo, { detail: detalhe }));
  }

  log(texto, tipo = "info") {
    this._emitir("log", { texto, tipo, hora: new Date() });
  }

  _mudarEstado(estado, mensagem = "") {
    this.estado = estado;
    this._emitir("estado", { estado, mensagem });
  }

  // ---------- conexão ----------

  /** Abre o seletor do navegador (precisa vir de um toque do usuário) e conecta. */
  async conectar() {
    const suporte = suporteBluetooth();
    if (!suporte.ok) throw new Error(suporte.motivo);
    const disp = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "IDL-" }, { namePrefix: "ISP-" }],
      optionalServices: [UUID.SERVICO, UUID.SERVICO_JL],
    });
    if (this.dispositivo && this.dispositivo !== disp) {
      this.dispositivo.removeEventListener("gattserverdisconnected", this._aoDesconectar);
    }
    this.dispositivo = disp;
    disp.removeEventListener("gattserverdisconnected", this._aoDesconectar);
    disp.addEventListener("gattserverdisconnected", this._aoDesconectar);
    this._saindo = false;
    try {
      await this._abrir();
    } catch (erro) {
      this._saindo = true;
      try {
        disp.gatt.disconnect();
      } catch {
        /* já estava desconectada */
      }
      this._mudarEstado("desconectado", erro.message);
      throw erro;
    }
  }

  desconectar() {
    this._saindo = true;
    if (this.dispositivo?.gatt.connected) this.dispositivo.gatt.disconnect();
    else this._mudarEstado("desconectado");
  }

  async _abrir() {
    this._mudarEstado("conectando");
    this.log(`Conectando em ${this.nome}…`);
    const servidor = await this.dispositivo.gatt.connect();
    const luz = await servidor.getPrimaryService(UUID.SERVICO);
    const jl = await servidor.getPrimaryService(UUID.SERVICO_JL);
    this.c = {
      cmd: await luz.getCharacteristic(UUID.CMD),
      notify: await luz.getCharacteristic(UUID.NOTIFY),
      pix: await luz.getCharacteristic(UUID.PIX),
      ae01: await jl.getCharacteristic(UUID.AE01),
      ae02: await jl.getCharacteristic(UUID.AE02),
    };
    // Notificações ligadas antes de qualquer escrita, e mantidas até o fim (como o app).
    this.c.notify.removeEventListener("characteristicvaluechanged", this._aoNotificar);
    this.c.notify.addEventListener("characteristicvaluechanged", this._aoNotificar);
    await this.c.notify.startNotifications();
    this.c.ae02.removeEventListener("characteristicvaluechanged", this._aoNotificarJL);
    this.c.ae02.addEventListener("characteristicvaluechanged", this._aoNotificarJL);
    await this.c.ae02.startNotifications();
    this._mudarEstado("preparando");
    await this._enfileirar(() => this._preambulo());
    this._mudarEstado("conectado");
    this.log("Pronta para receber comandos.", "ok");
  }

  async _preambulo() {
    await this._cmd(P.ver(), "VER");
    await this._cmd(P.horaDe(new Date()), "TIME");
    await this._cmd(P.leds(), "LEDS 00");
    await this._cmd(P.leds(), "LEDS 00");
    await this._autenticar();
    await dormir(this.pausaAposAuthMs);
  }

  _aoDesconectar() {
    const eraEstado = this.estado;
    this.c = {};
    if (this._esperaJL) this._esperaJL(null);
    if (this._saindo || eraEstado === "desconectado") {
      this._mudarEstado("desconectado");
      this.log("Desconectada.");
      return;
    }
    if (eraEstado === "conectando" || eraEstado === "preparando") return; // o erro sobe por conectar()
    this.log("A conexão caiu. Tentando reconectar…", "aviso");
    this._reconectar();
  }

  async _reconectar() {
    this._mudarEstado("reconectando");
    for (let tentativa = 1; tentativa <= TENTATIVAS_RECONEXAO; tentativa++) {
      await dormir(1000 * tentativa);
      if (this._saindo) return;
      try {
        await this._abrir();
        return;
      } catch (erro) {
        this.log(`Tentativa ${tentativa} falhou: ${erro.message}`, "aviso");
      }
    }
    this._mudarEstado("desconectado", "Não consegui reconectar. Toque em Conectar.");
  }

  // ---------- autenticação JieLi (0xAE01/0xAE02, só os 3 pacotes do handshake) ----------

  _aoNotificarJL(evento) {
    const dados = bytesDe(evento.target.value);
    if (this._esperaJL) this._esperaJL(dados);
    else this._caixaJL.push(dados);
  }

  _esperarJL() {
    if (this._caixaJL.length) return Promise.resolve(this._caixaJL.shift());
    return new Promise((resolver, rejeitar) => {
      const relogio = setTimeout(() => {
        this._esperaJL = null;
        rejeitar(new Error("a cortina não respondeu à autenticação"));
      }, ESPERA_AUTH_MS);
      this._esperaJL = (dados) => {
        clearTimeout(relogio);
        this._esperaJL = null;
        if (dados) resolver(dados);
        else rejeitar(new Error("a conexão caiu durante a autenticação"));
      };
    });
  }

  async _autenticar() {
    this._caixaJL = [];
    const desafio = crypto.getRandomValues(new Uint8Array(16));
    await this._escrever(this.c.ae01, JL.pacoteDesafio(desafio), false);
    let r = await this._esperarJL();
    if (r.length !== 17 || r[0] !== 0x01 || !JL.iguais(r.slice(1), JL.resposta(desafio))) {
      throw new Error("a cortina respondeu algo inesperado na autenticação; parei por segurança");
    }
    await this._escrever(this.c.ae01, JL.PASS, false);
    r = await this._esperarJL();
    if (r.length !== 17 || r[0] !== 0x00) throw new Error("a cortina não mandou o desafio dela");
    await this._escrever(this.c.ae01, JL.pacoteResposta(r.slice(1)), false);
    r = await this._esperarJL();
    if (!JL.iguais(r, JL.PASS)) throw new Error("a cortina recusou a autenticação");
    this.log("Autenticação JieLi OK.", "ok");
  }

  // ---------- notificações da cortina ----------

  _aoNotificar(evento) {
    const bruto = bytesDe(evento.target.value);
    const puro = bruto.length === 16 ? decifrar(bruto) : bruto;
    this._emitir("mensagem", { bruto, puro });
    this.log(`← ${legivel(puro.slice(1, 1 + Math.min(puro[0], 15)))}  (${P.hexs(puro.slice(0, 8))})`);
  }

  // ---------- fila de escrita ----------

  _enfileirar(tarefa) {
    this._pendentes++;
    const resultado = this._fila.then(tarefa).finally(() => {
      this._pendentes--;
      this._emitir("fila", { pendentes: this._pendentes });
    });
    this._fila = resultado.catch(() => {});
    this._emitir("fila", { pendentes: this._pendentes });
    return resultado;
  }

  async _escrever(caracteristica, dados, comResposta) {
    if (!caracteristica || !this.dispositivo?.gatt.connected) throw new Error("a cortina está desconectada");
    if (comResposta && caracteristica.writeValueWithResponse) await caracteristica.writeValueWithResponse(dados);
    else if (!comResposta && caracteristica.writeValueWithoutResponse) await caracteristica.writeValueWithoutResponse(dados);
    else await caracteristica.writeValue(dados);
    await dormir(PAUSA_MS);
  }

  /** Comando na CMD: cifrado com AES, escrita com resposta (o que foi confirmado na cortina). */
  async _cmd(puro, rotulo) {
    await this._escrever(this.c.cmd, cifrar(puro), true);
    if (rotulo) this.log(`→ ${rotulo}`);
  }

  _exigirConexao() {
    if (!this.conectada) throw new Error("Conecte a cortina primeiro.");
  }

  /** Enfileira uma lista de pacotes já validados para a CMD (e para a animação que estiver tocando). */
  _comandos(rotulo, pacotes) {
    this._exigirConexao();
    this.pararAnimacao();
    return this._enfileirar(async () => {
      for (const pk of pacotes) await this._cmd(pk);
      this.log(`→ ${rotulo}`);
    });
  }

  // ---------- comandos (todos validados em protocol.js ANTES de entrar na fila) ----------

  ligar() {
    return this._comandos("Ligar", [P.ledon()]);
  }

  desligar() {
    return this._comandos("Desligar", [P.ledoff()]);
  }

  cor(r, g, b, brilho) {
    return this._comandos(`Cor ${r},${g},${b} a ${brilho}%`, [P.colo8(r, g, b, brilho)]);
  }

  efeito(n, brilho, velocidade) {
    return this._comandos(`Efeito ${n} (brilho ${brilho}%, velocidade ${velocidade})`, P.efeito(n, brilho, velocidade));
  }

  /**
   * Desenha um quadro 20×20: SMVEW 01 (apaga o anterior) → um pacote por pixel aceso na …960B → SMVEW 02,
   * e MODE 03 se `rolar` (+ SPEED se `velocidade`, como o app oficial faz depois de MODE 03 na animação
   * nativa). `aoProgresso(feitos, total)`; `sinal` (AbortSignal) interrompe os pixels,
   * mas o SMVEW 02 é sempre enviado para fechar o desenho.
   */
  desenhar(grade, { brilho = P.BRILHO_MAX, rolar = false, velocidade = null, aoProgresso, sinal } = {}) {
    this._exigirConexao();
    const pixels = P.quadro(grade, brilho);
    this.pararAnimacao();
    const fechar = [P.smvew(2)];
    if (rolar) fechar.push(P.mode(P.MODO_ROLAR));
    if (rolar && velocidade !== null) fechar.push(P.speed(velocidade));
    return this._enfileirar(async () => {
      const inicio = performance.now();
      await this._cmd(P.smvew(1));
      let feitos = 0;
      try {
        for (const pk of pixels) {
          if (sinal?.aborted) break;
          await this._escrever(this.c.pix, cifrar(pk), this.pixComResposta);
          feitos++;
          aoProgresso?.(feitos, pixels.length);
        }
      } finally {
        if (this.dispositivo?.gatt.connected) for (const pk of fechar) await this._cmd(pk);
      }
      const segundos = (performance.now() - inicio) / 1000;
      this.log(`→ Desenho: ${feitos} de ${pixels.length} pixels em ${segundos.toFixed(1)} s${rolar ? ", rolando" : ""}`);
      return { feitos, total: pixels.length, segundos, cancelado: feitos < pixels.length };
    });
  }

  /** Só a velocidade (SPEED), para ajustar a rolagem que já está na cortina. */
  velocidade(v) {
    return this._comandos(`Velocidade ${v}`, [P.speed(v)]);
  }

  /** Apaga o desenho: SMVEW 01 + SMVEW 02, sem pixels (confirmado na Fase 3). */
  apagar() {
    return this._comandos("Apagar desenho", [P.smvew(1), P.smvew(2)]);
  }

  // ---------- animações ----------

  /** Toca uma animação guardada na cortina: ANIM NN + LIGHT, como o app oficial (testado em 2026-11-17). */
  animacaoNativa(numero, brilho) {
    return this._comandos(`Animação da cortina ${P.ANIMACOES_CORTINA[numero] || numero}`, [P.anim(numero), P.lightBrilho(brilho)]);
  }

  get tocandoAnimacao() {
    return !!this._animacao;
  }

  /** Para a animação que estiver tocando (o quadro em andamento é fechado com SMVEW 02). */
  pararAnimacao() {
    if (this._animacao) this._animacao.abort();
  }

  /**
   * Toca uma animação nossa na cortina, em loop, REDESENHANDO CADA QUADRO INTEIRO: SMVEW 01 → todos os
   * LEDs acesos do quadro → SMVEW 02. A cortina só mostra o desenho no SMVEW 02 e cada SMVEW 01 começa
   * vazio (confirmado em 2026-11-17), então não dá para mandar só o que muda; cada quadro leva
   * ~32 ms × LEDs acesos e aparece de uma vez. Para com pararAnimacao() ou qualquer outro comando.
   * `aoQuadro(i)` avisa quando o quadro i aparece na cortina.
   */
  tocarQuadros(quadros, { brilho = P.BRILHO_MAX, aoQuadro, rotulo = "animação" } = {}) {
    this._exigirConexao();
    const pacotes = quadros.map((q) => P.quadro(q, brilho)); // valida tudo antes de começar
    this.pararAnimacao();
    const controle = new AbortController();
    this._animacao = controle;
    this._emitir("animacao", { tocando: true, rotulo });
    return this._enfileirar(async () => {
      let mostrados = 0;
      try {
        while (!controle.signal.aborted) {
          for (let i = 0; i < pacotes.length && !controle.signal.aborted; i++) {
            await this._cmd(P.smvew(1));
            try {
              for (const pk of pacotes[i]) {
                if (controle.signal.aborted) break;
                await this._escrever(this.c.pix, cifrar(pk), this.pixComResposta);
              }
            } finally {
              if (this.dispositivo?.gatt.connected) await this._cmd(P.smvew(2));
            }
            if (!controle.signal.aborted) {
              mostrados++;
              aoQuadro?.(i);
            }
          }
        }
      } finally {
        if (this._animacao === controle) this._animacao = null;
        this._emitir("animacao", { tocando: false, rotulo });
        this.log(`→ Animação ${rotulo} parada (${mostrados} quadros mostrados)`);
      }
    });
  }
}
