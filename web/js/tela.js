// Desenha grades 20×20 em <canvas> como LEDs, e anima as prévias das cenas que rolam.
import { acesa } from "./grade.js";
import { COLUNAS, LINHAS } from "./protocol.js";

const FUNDO = "#060608";
const APAGADO = "#18181d";

/**
 * Desenha a grade como bolinhas de LED. `deslocamento` anda com o desenho em loop na `direcao`
 * do movimento da cortina (P.MOVIMENTOS): "esquerda" (MODE 03, padrão), "direita", "cima", "baixo",
 * "parado" ou "piscar" (acende e apaga).
 */
export function desenharGrade(canvas, grade, { apagadas = true, deslocamento = 0, direcao = "esquerda" } = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const lado = Math.max(1, Math.round((canvas.clientWidth || 200) * dpr));
  if (canvas.width !== lado || canvas.height !== lado) {
    canvas.width = lado;
    canvas.height = lado;
  }
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = FUNDO;
  ctx.fillRect(0, 0, lado, lado);
  const passo = lado / COLUNAS;
  const raio = passo * 0.36;
  const d = Math.floor(deslocamento);
  const dc = direcao === "esquerda" ? d : direcao === "direita" ? -d : 0;
  const dl = direcao === "cima" ? d : direcao === "baixo" ? -d : 0;
  const apagado = direcao === "piscar" && Math.floor(d / 3) % 2 === 1;
  const volta = (v, n) => ((v % n) + n) % n;
  for (let lin = 0; lin < LINHAS; lin++) {
    for (let col = 0; col < COLUNAS; col++) {
      const c = apagado ? null : grade?.[volta(lin + dl, LINHAS)]?.[volta(col + dc, COLUNAS)];
      const x = (col + 0.5) * passo;
      const y = (lin + 0.5) * passo;
      if (acesa(c)) {
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.22)`;
        ctx.beginPath();
        ctx.arc(x, y, raio * 1.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        ctx.beginPath();
        ctx.arc(x, y, raio, 0, Math.PI * 2);
        ctx.fill();
      } else if (apagadas) {
        ctx.fillStyle = APAGADO;
        ctx.beginPath();
        ctx.arc(x, y, raio * 0.62, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * Anima várias prévias de rolagem com um único relógio. Só redesenha as que estão na tela.
 * `colunasPorSegundo` imita a rolagem da cortina (ajustável quando soubermos a velocidade real).
 */
export class Animador {
  constructor(colunasPorSegundo = 6) {
    this.colunasPorSegundo = colunasPorSegundo;
    this.itens = new Map();
    this.visiveis = new Set();
    this.ultimo = -1;
    this.parado = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.observador =
      "IntersectionObserver" in window
        ? new IntersectionObserver((entradas) => {
            for (const e of entradas) {
              if (e.isIntersecting) this.visiveis.add(e.target);
              else this.visiveis.delete(e.target);
            }
          })
        : null;
    this._quadro = this._quadro.bind(this);
    requestAnimationFrame(this._quadro);
  }

  adicionar(canvas, grade, direcao = "esquerda") {
    this.itens.set(canvas, { grade, direcao });
    if (this.observador) this.observador.observe(canvas);
    else this.visiveis.add(canvas);
    requestAnimationFrame(() => desenharGrade(canvas, grade, { deslocamento: this._deslocamento(), direcao }));
  }

  /** Troca a direção do movimento de uma prévia que já está animando. */
  mudarDirecao(canvas, direcao) {
    const item = this.itens.get(canvas);
    if (!item) return;
    item.direcao = direcao;
    desenharGrade(canvas, item.grade, { deslocamento: this._deslocamento(), direcao });
  }

  remover(canvas) {
    this.itens.delete(canvas);
    this.visiveis.delete(canvas);
    this.observador?.unobserve(canvas);
  }

  _deslocamento() {
    return this.parado ? 0 : Math.floor((performance.now() / 1000) * this.colunasPorSegundo) % COLUNAS;
  }

  _quadro() {
    const d = this._deslocamento();
    if (d !== this.ultimo) {
      this.ultimo = d;
      for (const canvas of this.visiveis) {
        if (!canvas.isConnected) {
          this.remover(canvas);
          continue;
        }
        const { grade, direcao } = this.itens.get(canvas);
        desenharGrade(canvas, grade, { deslocamento: d, direcao });
      }
    }
    requestAnimationFrame(this._quadro);
  }
}

/**
 * Toca várias animações quadro a quadro em <canvas> com um único relógio, no mesmo ritmo que a cortina
 * vai ter (`duracoes` em ms por quadro, de animacao.duracoes). Só redesenha o que está na tela.
 */
export class Reprodutor {
  constructor() {
    this.itens = new Map();
    this.visiveis = new Set();
    this.parado = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.observador =
      "IntersectionObserver" in window
        ? new IntersectionObserver((entradas) => {
            for (const e of entradas) {
              if (e.isIntersecting) this.visiveis.add(e.target);
              else this.visiveis.delete(e.target);
            }
          })
        : null;
    this._quadro = this._quadro.bind(this);
    requestAnimationFrame(this._quadro);
  }

  adicionar(canvas, quadros, duracoes) {
    const ciclo = duracoes.reduce((s, d) => s + d, 0);
    this.itens.set(canvas, { quadros, duracoes, ciclo, inicio: performance.now(), mostrado: -1 });
    if (this.observador) this.observador.observe(canvas);
    else this.visiveis.add(canvas);
    requestAnimationFrame(() => desenharGrade(canvas, quadros[0]));
  }

  remover(canvas) {
    this.itens.delete(canvas);
    this.visiveis.delete(canvas);
    this.observador?.unobserve(canvas);
  }

  _quadro(agora) {
    for (const canvas of this.visiveis) {
      const item = this.itens.get(canvas);
      if (!item || !canvas.isConnected) {
        this.remover(canvas);
        continue;
      }
      let i = 0;
      if (!this.parado) {
        let t = (agora - item.inicio) % item.ciclo;
        while (i < item.duracoes.length - 1 && t >= item.duracoes[i]) t -= item.duracoes[i++];
      }
      if (i !== item.mostrado) {
        item.mostrado = i;
        desenharGrade(canvas, item.quadros[i]);
      }
    }
    requestAnimationFrame(this._quadro);
  }
}
