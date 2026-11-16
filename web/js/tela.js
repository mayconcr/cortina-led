// Desenha grades 20×20 em <canvas> como LEDs, e anima as prévias das cenas que rolam.
import { acesa } from "./grade.js";
import { COLUNAS, LINHAS } from "./protocol.js";

const FUNDO = "#060608";
const APAGADO = "#18181d";

/**
 * Desenha a grade como bolinhas de LED. `deslocamento` gira as colunas para a esquerda
 * (é assim que a cortina mostra o MODE 03: o desenho anda da direita para a esquerda, em loop).
 */
export function desenharGrade(canvas, grade, { apagadas = true, deslocamento = 0 } = {}) {
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
  const desloc = ((Math.floor(deslocamento) % COLUNAS) + COLUNAS) % COLUNAS;
  for (let lin = 0; lin < LINHAS; lin++) {
    for (let col = 0; col < COLUNAS; col++) {
      const c = grade?.[lin]?.[(col + desloc) % COLUNAS];
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

  adicionar(canvas, grade) {
    this.itens.set(canvas, grade);
    if (this.observador) this.observador.observe(canvas);
    else this.visiveis.add(canvas);
    requestAnimationFrame(() => desenharGrade(canvas, grade, { deslocamento: this._deslocamento() }));
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
        desenharGrade(canvas, this.itens.get(canvas), { deslocamento: d });
      }
    }
    requestAnimationFrame(this._quadro);
  }
}
