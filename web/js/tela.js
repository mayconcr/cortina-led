// Desenha uma grade 20×20 num <canvas> como se fossem LEDs (bolinhas com um leve brilho em volta).
import { acesa } from "./grade.js";
import { COLUNAS, LINHAS } from "./protocol.js";

export function desenharGrade(canvas, grade, { apagadas = true } = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const lado = Math.round((canvas.clientWidth || 200) * dpr);
  if (canvas.width !== lado || canvas.height !== lado) {
    canvas.width = lado;
    canvas.height = lado;
  }
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#050608";
  ctx.fillRect(0, 0, lado, lado);
  const passo = lado / COLUNAS;
  const raio = passo * 0.36;
  for (let lin = 0; lin < LINHAS; lin++) {
    for (let col = 0; col < COLUNAS; col++) {
      const c = grade?.[lin]?.[col];
      const x = (col + 0.5) * passo;
      const y = (lin + 0.5) * passo;
      if (acesa(c)) {
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.28)`;
        ctx.beginPath();
        ctx.arc(x, y, raio * 1.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        ctx.beginPath();
        ctx.arc(x, y, raio, 0, Math.PI * 2);
        ctx.fill();
      } else if (apagadas) {
        ctx.fillStyle = "#1b1e25";
        ctx.beginPath();
        ctx.arc(x, y, raio * 0.72, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
