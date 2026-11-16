// Interface do app (abas Início, Efeitos, Desenhar, Galeria, Texto e Imagem).
// Toda a lógica de bytes e de segurança está em protocol.js / grade.js / ble.js; aqui é só tela.

import { Cortina, suporteBluetooth } from "./ble.js";
import { EXEMPLOS } from "./exemplos.js";
import { capacidade, textoParaGrade } from "./fonte.js";
import * as G from "./grade.js";
import { gravar, ler } from "./memoria.js";
import { BRILHO_EFEITO_MAX, BRILHO_EFEITO_MIN, BRILHO_MAX, EFEITO_MAX, EFEITO_MIN, VELOCIDADE_PADRAO } from "./protocol.js";
import { desenharGrade } from "./tela.js";

const $ = (seletor) => document.querySelector(seletor);
const $$ = (seletor) => Array.from(document.querySelectorAll(seletor));
const entre = (v, min, max, padrao) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : padrao);
const virgula = (n, casas = 1) => n.toFixed(casas).replace(".", ",");

const CORES = [
  ["Vermelho", [255, 0, 0]],
  ["Laranja", [255, 90, 0]],
  ["Amarelo", [255, 200, 0]],
  ["Verde", [0, 255, 0]],
  ["Ciano", [0, 255, 200]],
  ["Azul", [0, 0, 255]],
  ["Roxo", [150, 0, 255]],
  ["Rosa", [255, 0, 120]],
  ["Branco quente", [255, 170, 80]],
  ["Branco", [255, 255, 255]],
];

const cortina = new Cortina();
cortina.pixComResposta = ler("pixComResposta", false) === true;

const estado = {
  cor: ler("cor", [255, 0, 0]),
  brilhoCor: entre(ler("brilhoCor", 30), 5, BRILHO_MAX, 30),
  favoritas: ler("favoritas", []),
  editandoFavoritas: false,
  nomesEfeitos: ler("nomesEfeitos", {}),
  efeitoAtivo: null,
  brilhoEfeito: entre(ler("brilhoEfeito", BRILHO_MAX), BRILHO_EFEITO_MIN, BRILHO_EFEITO_MAX, BRILHO_MAX),
  // SPEED 1–16 não mudou nada na cortina (2026-11-16): fica fixo no valor que o app oficial manda.
  velocidade: VELOCIDADE_PADRAO,
  desenho: carregarDesenho(),
  desfazer: [],
  ferramenta: "pincel",
  corPincel: ler("corPincel", [255, 0, 0]),
  brilhoDesenho: entre(ler("brilhoDesenho", BRILHO_MAX), 5, BRILHO_MAX, BRILHO_MAX),
  rolar: ler("rolar", false) === true,
  galeria: ler("galeria", []),
  texto: { texto: "OLÁ", fonte: "grande", alinhamento: "centro", cor: [0, 160, 255], ...ler("texto", {}) },
  imagem: { fonte: null, zoom: 1, x: 0, y: 0, limiar: 30, vivas: true, grade: null },
  envio: null, // AbortController do desenho que está sendo enviado
};

function carregarDesenho() {
  try {
    return G.deTexto(ler("desenho", ""));
  } catch {
    return G.novaGrade();
  }
}

// ---------- avisos e diálogo ----------

let relogioAviso;
function avisar(mensagem, tipo = "info") {
  const t = $("#toast");
  t.textContent = mensagem;
  t.dataset.tipo = tipo;
  t.classList.add("visivel");
  clearTimeout(relogioAviso);
  relogioAviso = setTimeout(() => t.classList.remove("visivel"), tipo === "erro" ? 5500 : 2800);
}

function abrirModal({ titulo, campo = false, valor = "", ok = "OK" }) {
  return new Promise((resolver) => {
    const modal = $("#modal");
    const form = $("#modal-form");
    const input = $("#modal-campo");
    $("#modal-titulo").textContent = titulo;
    $("#modal-ok").textContent = ok;
    input.hidden = !campo;
    input.value = valor;
    modal.hidden = false;
    if (campo) setTimeout(() => input.focus(), 50);
    const fechar = (resposta) => {
      modal.hidden = true;
      form.onsubmit = null;
      $("#modal-cancelar").onclick = null;
      resolver(resposta);
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      fechar(campo ? input.value : "");
    };
    $("#modal-cancelar").onclick = () => fechar(null);
  });
}

const pedirTexto = (titulo, valor) => abrirModal({ titulo, campo: true, valor });
const confirmar = async (titulo, ok = "Sim") => (await abrirModal({ titulo, ok })) !== null;

// ---------- conexão ----------

const ROTULOS = {
  desconectado: "Conectar",
  conectando: "Conectando…",
  preparando: "Preparando…",
  conectado: "Conectada",
  reconectando: "Reconectando…",
};

function chamarConexao() {
  const b = $("#conexao");
  b.classList.remove("chamar");
  void b.offsetWidth;
  b.classList.add("chamar");
}

function exigirConexao() {
  if (cortina.conectada) return true;
  avisar(
    cortina.estado === "desconectado" ? "Conecte a cortina primeiro (botão lá em cima)." : "Espere a cortina terminar de conectar.",
    "aviso",
  );
  chamarConexao();
  return false;
}

/** Roda um comando da cortina mostrando o erro de forma amigável. */
async function executar(acao, sucesso) {
  if (!exigirConexao()) return false;
  if (estado.envio) avisar("Na fila: espere o desenho terminar de enviar.");
  try {
    await acao();
    if (sucesso) avisar(sucesso, "ok");
    return true;
  } catch (erro) {
    avisar(erro.message || String(erro), "erro");
    cortina.log(erro.message || String(erro), "erro");
    return false;
  }
}

$("#conexao").addEventListener("click", async () => {
  if (cortina.estado === "conectado") {
    avisar(`Conectada em ${cortina.nome}.`, "ok");
    return;
  }
  if (cortina.estado !== "desconectado") return;
  const suporte = suporteBluetooth();
  if (!suporte.ok) {
    avisar(suporte.motivo, "erro");
    return;
  }
  try {
    await cortina.conectar(); // abre o seletor do navegador: precisa vir direto do toque
    avisar("Cortina conectada!", "ok");
  } catch (erro) {
    if (erro.name === "NotFoundError") avisar("Nenhuma cortina escolhida. Ela está ligada? O app iDeal LED está fechado?", "aviso");
    else avisar(erro.message || String(erro), "erro");
  }
});

$("#desconectar").addEventListener("click", () => cortina.desconectar());

cortina.addEventListener("estado", (e) => {
  const { estado: s, mensagem } = e.detail;
  $("#conexao").dataset.estado = s;
  $("#conexao-texto").textContent = ROTULOS[s] || s;
  $("#info-dispositivo").textContent = s === "conectado" ? `Conectada em ${cortina.nome}.` : s === "desconectado" ? "Nenhuma cortina conectada." : `${ROTULOS[s]} ${cortina.nome}`;
  if (mensagem) avisar(mensagem, s === "desconectado" ? "erro" : "info");
  if (s === "reconectando") avisar("A conexão caiu. Reconectando…", "aviso");
});

cortina.addEventListener("log", (e) => {
  const { texto, tipo, hora } = e.detail;
  const li = document.createElement("li");
  li.dataset.tipo = tipo;
  li.textContent = `${hora.toLocaleTimeString("pt-BR")}  ${texto}`;
  const registro = $("#registro");
  registro.prepend(li);
  while (registro.children.length > 150) registro.lastChild.remove();
});

const pixCheck = $("#pix-com-resposta");
pixCheck.checked = cortina.pixComResposta;
pixCheck.addEventListener("change", () => {
  cortina.pixComResposta = pixCheck.checked;
  gravar("pixComResposta", pixCheck.checked);
  atualizarResumos();
});

for (const botao of $$("[data-acao]")) {
  const acao = botao.dataset.acao;
  const mensagens = { ligar: "Ligada.", desligar: "Desligada.", apagar: "Desenho apagado." };
  botao.addEventListener("click", () => executar(() => cortina[acao](), mensagens[acao]));
}

// ---------- abas ----------

function trocarAba(nome) {
  if (!$(`#aba-${nome}`)) nome = "inicio";
  gravar("aba", nome);
  for (const s of $$(".aba")) s.hidden = s.id !== `aba-${nome}`;
  for (const b of $$(".abas button")) b.setAttribute("aria-current", b.dataset.aba === nome ? "page" : "false");
  if (nome === "desenhar") desenharEditor();
  if (nome === "galeria") renderGaleria();
  if (nome === "texto") atualizarTexto();
  if (nome === "imagem") atualizarImagem();
  window.scrollTo(0, 0);
}

for (const b of $$(".abas button")) b.addEventListener("click", () => trocarAba(b.dataset.aba));

// ---------- paletas de cor ----------

/** Monta uma fileira de cores + "outra cor". Devolve a função que redesenha a fileira. */
function montarPaleta(raiz, obter, escolher) {
  function render() {
    raiz.replaceChildren();
    const atual = obter();
    for (const [nome, cor] of CORES) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "amostra";
      b.style.background = G.rgbParaHex(cor);
      b.title = nome;
      b.setAttribute("aria-label", nome);
      if (G.mesmaCor(cor, atual)) b.classList.add("ativa");
      b.addEventListener("click", () => {
        escolher([...cor]);
        render();
      });
      raiz.append(b);
    }
    const livre = document.createElement("label");
    livre.className = "amostra livre";
    livre.title = "Outra cor";
    if (!CORES.some(([, c]) => G.mesmaCor(c, atual))) {
      livre.classList.add("ativa");
      livre.style.background = G.rgbParaHex(atual);
    }
    const input = document.createElement("input");
    input.type = "color";
    input.value = G.rgbParaHex(atual);
    input.setAttribute("aria-label", "Escolher outra cor");
    input.addEventListener("change", () => {
      escolher(G.hexParaRGB(input.value));
      render();
    });
    livre.append(input);
    raiz.append(livre);
  }
  render();
  return render;
}

// ---------- Início: cor sólida e favoritas ----------

function aplicarCor() {
  const [r, g, b] = estado.cor;
  const brilho = G.brilhoSeguroCor(r, g, b, estado.brilhoCor);
  $("#dica-cor").textContent =
    brilho < estado.brilhoCor ? `Esta cor vai a no máximo ${brilho}% para proteger a fonte de 5 V.` : "";
  if (brilho <= 0) return;
  executar(() => cortina.cor(r, g, b, brilho));
}

const renderPaletaCor = montarPaleta(
  $("#paleta-cor"),
  () => estado.cor,
  (cor) => {
    estado.cor = cor;
    gravar("cor", cor);
    aplicarCor();
  },
);

const brilhoCor = $("#brilho-cor");
brilhoCor.value = estado.brilhoCor;
$("#brilho-cor-valor").textContent = `${estado.brilhoCor}%`;
brilhoCor.addEventListener("input", () => ($("#brilho-cor-valor").textContent = `${brilhoCor.value}%`));
brilhoCor.addEventListener("change", () => {
  estado.brilhoCor = Number(brilhoCor.value);
  gravar("brilhoCor", estado.brilhoCor);
  aplicarCor();
});

function renderFavoritas() {
  const raiz = $("#favoritas");
  raiz.replaceChildren();
  if (!estado.favoritas.length) {
    const p = document.createElement("p");
    p.className = "dica";
    p.textContent = "Nenhuma ainda.";
    raiz.append(p);
    estado.editandoFavoritas = false;
  }
  estado.favoritas.forEach((cor, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "amostra" + (estado.editandoFavoritas ? " removivel" : "");
    b.style.background = G.rgbParaHex(cor);
    b.setAttribute("aria-label", estado.editandoFavoritas ? `Remover ${G.rgbParaHex(cor)}` : `Cor ${G.rgbParaHex(cor)}`);
    b.addEventListener("click", () => {
      if (estado.editandoFavoritas) {
        estado.favoritas.splice(i, 1);
        gravar("favoritas", estado.favoritas);
        renderFavoritas();
        return;
      }
      estado.cor = [...cor];
      gravar("cor", estado.cor);
      renderPaletaCor();
      aplicarCor();
    });
    raiz.append(b);
  });
  $("#editar-favoritas").hidden = !estado.favoritas.length;
  $("#editar-favoritas").textContent = estado.editandoFavoritas ? "Pronto" : "Editar";
}

$("#editar-favoritas").addEventListener("click", () => {
  estado.editandoFavoritas = !estado.editandoFavoritas;
  renderFavoritas();
});

$("#salvar-favorita").addEventListener("click", () => {
  if (estado.favoritas.some((c) => G.mesmaCor(c, estado.cor))) {
    avisar("Essa cor já está nas favoritas.");
    return;
  }
  estado.favoritas.push([...estado.cor]);
  if (estado.favoritas.length > 12) estado.favoritas.shift();
  gravar("favoritas", estado.favoritas);
  renderFavoritas();
  avisar("Cor salva nas favoritas.", "ok");
});

// ---------- Efeitos ----------

const LAPIS = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>';
const nomeEfeito = (n) => estado.nomesEfeitos[n] || `Efeito ${n}`;

function renderEfeitos() {
  const raiz = $("#lista-efeitos");
  raiz.replaceChildren();
  for (let n = EFEITO_MIN; n <= EFEITO_MAX; n++) {
    const item = document.createElement("div");
    item.className = "efeito" + (estado.efeitoAtivo === n ? " ativo" : "");
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "efeito-botao";
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = n;
    const nome = document.createElement("span");
    nome.className = "nome";
    nome.textContent = nomeEfeito(n);
    botao.append(num, nome);
    botao.addEventListener("click", () => mostrarEfeito(n));
    const lapis = document.createElement("button");
    lapis.type = "button";
    lapis.className = "icone";
    lapis.innerHTML = LAPIS;
    lapis.setAttribute("aria-label", `Dar nome ao efeito ${n}`);
    lapis.addEventListener("click", async () => {
      const novo = await pedirTexto(`Nome do efeito ${n}`, nomeEfeito(n));
      if (novo === null) return;
      if (novo.trim() && novo.trim() !== `Efeito ${n}`) estado.nomesEfeitos[n] = novo.trim().slice(0, 24);
      else delete estado.nomesEfeitos[n];
      gravar("nomesEfeitos", estado.nomesEfeitos);
      renderEfeitos();
    });
    item.append(botao, lapis);
    raiz.append(item);
  }
}

function mostrarEfeito(n) {
  estado.efeitoAtivo = n;
  renderEfeitos();
  executar(() => cortina.efeito(n, estado.brilhoEfeito, estado.velocidade));
}

function controleNumero(input, rotulo, chave, formato) {
  input.value = estado[chave];
  rotulo.textContent = formato(estado[chave]);
  input.addEventListener("input", () => (rotulo.textContent = formato(Number(input.value))));
  input.addEventListener("change", () => {
    estado[chave] = Number(input.value);
    gravar(chave, estado[chave]);
    if (estado.efeitoAtivo) mostrarEfeito(estado.efeitoAtivo);
  });
}

controleNumero($("#brilho-efeito"), $("#brilho-efeito-valor"), "brilhoEfeito", (v) => `${v}%`);

// ---------- controles comuns de desenho (brilho, rolar, resumo, envio) ----------

function sincronizarControles() {
  for (const el of $$(".js-brilho-desenho")) el.value = estado.brilhoDesenho;
  for (const el of $$(".js-brilho-desenho-valor")) el.textContent = `${estado.brilhoDesenho}%`;
  for (const el of $$(".js-rolar")) el.checked = estado.rolar;
  atualizarResumos();
}

for (const el of $$(".js-brilho-desenho")) {
  el.addEventListener("input", () => {
    estado.brilhoDesenho = Number(el.value);
    sincronizarControles();
  });
  el.addEventListener("change", () => gravar("brilhoDesenho", estado.brilhoDesenho));
}
for (const el of $$(".js-rolar")) {
  el.addEventListener("change", () => {
    estado.rolar = el.checked;
    gravar("rolar", estado.rolar);
    sincronizarControles();
  });
}

function resumo(grade) {
  if (!grade) return "";
  const acesos = G.contarAcesos(grade);
  if (!acesos) return "Nenhum LED aceso.";
  const ms = cortina.pixComResposta ? G.MS_POR_PIXEL_COM_RESPOSTA : G.MS_POR_PIXEL;
  let t = `${acesos} LEDs acesos · cerca de ${virgula(G.tempoEstimado(grade, ms))} s para enviar`;
  const seguro = G.brilhoSeguro(grade, estado.brilhoDesenho);
  if (seguro < estado.brilhoDesenho) t += ` · brilho vai a ${seguro}% (proteção da fonte)`;
  return t;
}

function atualizarResumos() {
  $("#resumo-desenho").textContent = resumo(estado.desenho);
  $("#resumo-texto").textContent = resumo(gradeDoTexto().grade);
  $("#resumo-imagem").textContent = resumo(estado.imagem.grade);
}

function mostrarEnvio(titulo, feitos, total, ms) {
  $("#envio").hidden = false;
  $("#envio-titulo").textContent = titulo;
  $("#envio-barra").style.width = `${total ? (100 * feitos) / total : 0}%`;
  const falta = Math.max(0, Math.ceil(((total - feitos) * ms) / 1000));
  $("#envio-texto").textContent = `${feitos} de ${total} LEDs · faltam cerca de ${falta} s`;
}

$("#envio-cancelar").addEventListener("click", () => estado.envio?.abort());

async function enviarGrade(grade, rotulo = "desenho") {
  if (estado.envio) {
    avisar("Já tem um desenho sendo enviado.");
    return;
  }
  if (!exigirConexao()) return;
  const acesos = G.contarAcesos(grade);
  if (!acesos) {
    if (await confirmar("O desenho está vazio. Quer apagar a cortina?", "Apagar")) executar(() => cortina.apagar(), "Desenho apagado.");
    return;
  }
  const brilho = G.brilhoSeguro(grade, estado.brilhoDesenho);
  if (brilho < estado.brilhoDesenho) avisar(`Brilho reduzido para ${brilho}% para proteger a fonte.`, "aviso");
  const ms = cortina.pixComResposta ? G.MS_POR_PIXEL_COM_RESPOSTA : G.MS_POR_PIXEL;
  const controle = new AbortController();
  estado.envio = controle;
  const titulo = `Enviando ${rotulo}`;
  mostrarEnvio(titulo, 0, acesos, ms);
  try {
    const r = await cortina.desenhar(grade, {
      brilho,
      rolar: estado.rolar,
      sinal: controle.signal,
      aoProgresso: (feitos, total) => mostrarEnvio(titulo, feitos, total, ms),
    });
    if (r.cancelado) avisar(`Envio cancelado (${r.feitos} de ${r.total} LEDs).`, "aviso");
    else avisar(`Pronto! ${r.total} LEDs em ${virgula(r.segundos)} s.`, "ok");
  } catch (erro) {
    avisar(erro.message || String(erro), "erro");
    cortina.log(erro.message || String(erro), "erro");
  } finally {
    estado.envio = null;
    $("#envio").hidden = true;
  }
}

// ---------- Galeria ----------

async function salvarNaGaleria(grade, sugestao) {
  if (!G.contarAcesos(grade)) {
    avisar("O desenho está vazio.");
    return;
  }
  const nome = await pedirTexto("Nome do desenho", sugestao);
  if (nome === null) return;
  const item = { id: Date.now().toString(36), nome: nome.trim().slice(0, 30) || "Sem nome", dados: G.paraTexto(grade), criado: Date.now() };
  estado.galeria.unshift(item);
  if (estado.galeria.length > 60) estado.galeria.length = 60;
  if (!gravar("galeria", estado.galeria)) {
    estado.galeria.shift();
    avisar("Não consegui salvar: a memória do navegador está cheia ou bloqueada.", "erro");
    return;
  }
  avisar(`"${item.nome}" salvo na galeria.`, "ok");
}

function abrirNoEditor(grade, nome) {
  guardarDesfazer();
  estado.desenho = G.copiar(grade);
  salvarDesenho();
  trocarAba("desenhar");
  avisar(`${nome ? `"${nome}"` : "Desenho"} aberto no Desenhar.`);
}

function cartaoGaleria(nome, obterGrade, excluir) {
  const fig = document.createElement("figure");
  fig.className = "miniatura";
  const canvas = document.createElement("canvas");
  canvas.className = "grade-led";
  canvas.setAttribute("aria-hidden", "true");
  const legenda = document.createElement("figcaption");
  legenda.textContent = nome;
  const acoes = document.createElement("div");
  acoes.className = "acoes";
  const botao = (texto, classe, aoTocar, rotulo) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `botao ${classe}`;
    b.textContent = texto;
    if (rotulo) b.setAttribute("aria-label", rotulo);
    b.addEventListener("click", aoTocar);
    acoes.append(b);
  };
  let grade = null;
  try {
    grade = obterGrade();
  } catch {
    legenda.textContent = `${nome} (danificado)`;
  }
  if (grade) {
    botao("Enviar", "", () => enviarGrade(grade, `"${nome}"`));
    botao("Editar", "secundario", () => abrirNoEditor(grade, nome));
  }
  if (excluir) botao("×", "secundario excluir", excluir, `Excluir ${nome}`);
  fig.append(canvas, legenda, acoes);
  requestAnimationFrame(() => desenharGrade(canvas, grade, { apagadas: false }));
  return fig;
}

function renderGaleria() {
  const minha = $("#galeria-minha");
  minha.replaceChildren();
  $("#galeria-vazia").hidden = estado.galeria.length > 0;
  for (const item of estado.galeria) {
    minha.append(
      cartaoGaleria(item.nome, () => G.deTexto(item.dados), async () => {
        if (!(await confirmar(`Excluir "${item.nome}"?`, "Excluir"))) return;
        estado.galeria = estado.galeria.filter((x) => x.id !== item.id);
        gravar("galeria", estado.galeria);
        renderGaleria();
      }),
    );
  }
  const prontos = $("#galeria-prontos");
  prontos.replaceChildren(...EXEMPLOS.map((e) => cartaoGaleria(e.nome, e.criar)));
}

// ---------- Desenhar ----------

const editor = $("#editor");
let tracando = false;
let ultimaCelula = null;

function desenharEditor() {
  desenharGrade(editor, estado.desenho);
  $("#resumo-desenho").textContent = resumo(estado.desenho);
}

function salvarDesenho() {
  gravar("desenho", G.paraTexto(estado.desenho));
  $("#resumo-desenho").textContent = resumo(estado.desenho);
}

function guardarDesfazer() {
  estado.desfazer.push(G.paraTexto(estado.desenho));
  if (estado.desfazer.length > 40) estado.desfazer.shift();
}

function celulaDoEvento(e) {
  const r = editor.getBoundingClientRect();
  const col = Math.floor(((e.clientX - r.left) / r.width) * 20);
  const lin = Math.floor(((e.clientY - r.top) / r.height) * 20);
  return col < 0 || lin < 0 || col > 19 || lin > 19 ? null : [col, lin];
}

function pintar(col, lin) {
  const nova = estado.ferramenta === "borracha" ? null : [...estado.corPincel];
  const pontos = [];
  if (ultimaCelula) {
    // liga a célula anterior à atual, para o traço não falhar quando o dedo anda rápido
    const [c0, l0] = ultimaCelula;
    const passos = Math.max(Math.abs(col - c0), Math.abs(lin - l0));
    for (let i = 1; i <= passos; i++) pontos.push([Math.round(c0 + ((col - c0) * i) / passos), Math.round(l0 + ((lin - l0) * i) / passos)]);
  } else pontos.push([col, lin]);
  ultimaCelula = [col, lin];
  let mudou = false;
  for (const [c, l] of pontos) {
    if (G.mesmaCor(estado.desenho[l][c], nova)) continue;
    estado.desenho[l][c] = nova ? [...nova] : null;
    mudou = true;
  }
  if (mudou) desenharGrade(editor, estado.desenho);
}

editor.addEventListener("pointerdown", (e) => {
  const cel = celulaDoEvento(e);
  if (!cel) return;
  e.preventDefault();
  const [col, lin] = cel;
  if (estado.ferramenta === "conta-gotas") {
    const c = estado.desenho[lin][col];
    if (G.acesa(c)) {
      estado.corPincel = [...c];
      gravar("corPincel", estado.corPincel);
      renderPaletaDesenho();
      escolherFerramenta("pincel");
      avisar("Cor copiada para o pincel.");
    } else avisar("Esse LED está apagado.");
    return;
  }
  guardarDesfazer();
  if (estado.ferramenta === "balde") {
    estado.desenho = G.encher(estado.desenho, col, lin, estado.corPincel);
    desenharEditor();
    salvarDesenho();
    return;
  }
  editor.setPointerCapture?.(e.pointerId);
  tracando = true;
  ultimaCelula = null;
  pintar(col, lin);
});

editor.addEventListener("pointermove", (e) => {
  if (!tracando) return;
  const cel = celulaDoEvento(e);
  if (cel) pintar(...cel);
});

for (const tipo of ["pointerup", "pointercancel", "lostpointercapture"]) {
  editor.addEventListener(tipo, () => {
    if (!tracando) return;
    tracando = false;
    ultimaCelula = null;
    salvarDesenho();
  });
}

function escolherFerramenta(nome) {
  estado.ferramenta = nome;
  for (const b of $$("[data-ferramenta]")) b.classList.toggle("ativa", b.dataset.ferramenta === nome);
}

for (const b of $$("[data-ferramenta]")) b.addEventListener("click", () => escolherFerramenta(b.dataset.ferramenta));

const renderPaletaDesenho = montarPaleta(
  $("#paleta-desenho"),
  () => estado.corPincel,
  (cor) => {
    estado.corPincel = cor;
    gravar("corPincel", cor);
    if (estado.ferramenta === "borracha" || estado.ferramenta === "conta-gotas") escolherFerramenta("pincel");
  },
);

$("#desfazer").addEventListener("click", () => {
  const anterior = estado.desfazer.pop();
  if (!anterior) {
    avisar("Nada para desfazer.");
    return;
  }
  estado.desenho = G.deTexto(anterior);
  desenharEditor();
  salvarDesenho();
});

$("#limpar").addEventListener("click", async () => {
  if (!G.contarAcesos(estado.desenho)) return;
  if (!(await confirmar("Limpar o desenho? (dá para desfazer)", "Limpar"))) return;
  guardarDesfazer();
  estado.desenho = G.novaGrade();
  desenharEditor();
  salvarDesenho();
});

$("#enviar-desenho").addEventListener("click", () => enviarGrade(estado.desenho, "desenho"));
$("#salvar-desenho").addEventListener("click", () => salvarNaGaleria(estado.desenho, "Meu desenho"));

// ---------- Texto ----------

function gradeDoTexto() {
  const t = estado.texto;
  return textoParaGrade(t.texto, { cor: t.cor, fonte: t.fonte, alinhamento: t.alinhamento });
}

function segmentado(raiz, chave) {
  const render = () => {
    for (const b of raiz.querySelectorAll("button")) b.classList.toggle("ativo", b.dataset.valor === estado.texto[chave]);
  };
  for (const b of raiz.querySelectorAll("button")) {
    b.addEventListener("click", () => {
      estado.texto[chave] = b.dataset.valor;
      render();
      atualizarTexto();
    });
  }
  render();
}

function atualizarTexto() {
  const r = gradeDoTexto();
  if ($("#previa-texto").clientWidth) desenharGrade($("#previa-texto"), r.grade);
  const cap = capacidade(estado.texto.fonte);
  const dica = $("#texto-capacidade");
  dica.textContent = r.cabe
    ? `Cabem ${cap.letras} letras por linha e ${cap.linhas} linhas.`
    : `Não coube tudo: cabem ${cap.letras} letras por linha e ${cap.linhas} linhas.`;
  dica.classList.toggle("alerta", !r.cabe);
  gravar("texto", estado.texto);
  $("#resumo-texto").textContent = resumo(r.grade);
}

const campoTexto = $("#texto");
campoTexto.value = estado.texto.texto;
campoTexto.addEventListener("input", () => {
  estado.texto.texto = campoTexto.value;
  atualizarTexto();
});
segmentado($("#texto-fonte"), "fonte");
segmentado($("#texto-alinhamento"), "alinhamento");
montarPaleta(
  $("#paleta-texto"),
  () => estado.texto.cor,
  (cor) => {
    estado.texto.cor = cor;
    atualizarTexto();
  },
);

$("#enviar-texto").addEventListener("click", () => enviarGrade(gradeDoTexto().grade, "texto"));
$("#editar-texto").addEventListener("click", () => abrirNoEditor(gradeDoTexto().grade, estado.texto.texto.trim()));
$("#salvar-texto").addEventListener("click", () => salvarNaGaleria(gradeDoTexto().grade, estado.texto.texto.trim().slice(0, 30)));

// ---------- Imagem ----------

const reducao = document.createElement("canvas");
reducao.width = reducao.height = 200;

function imagemDeArquivo(arquivo) {
  return new Promise((resolver, rejeitar) => {
    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolver(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rejeitar(new Error("imagem inválida"));
    };
    img.src = url;
  });
}

$("#escolher-imagem").addEventListener("click", () => $("#arquivo-imagem").click());
$("#arquivo-imagem").addEventListener("change", async (e) => {
  const arquivo = e.target.files?.[0];
  e.target.value = "";
  if (!arquivo) return;
  try {
    estado.imagem.fonte = await imagemDeArquivo(arquivo);
  } catch {
    avisar("Não consegui abrir esta imagem.", "erro");
    return;
  }
  Object.assign(estado.imagem, { zoom: 1, x: 0, y: 0 });
  $("#imagem-zoom").value = 1;
  $("#imagem-x").value = 0;
  $("#imagem-y").value = 0;
  $("#imagem-controles").hidden = false;
  $("#imagem-envio").hidden = false;
  $("#escolher-imagem").textContent = "Escolher outra foto";
  atualizarImagem();
});

function atualizarImagem() {
  const { fonte, zoom, x, y, limiar, vivas } = estado.imagem;
  if (!fonte) return;
  const w = fonte.naturalWidth || fonte.width;
  const h = fonte.naturalHeight || fonte.height;
  const lado = Math.min(w, h) / zoom;
  const sx = ((w - lado) / 2) * (1 + x / 100);
  const sy = ((h - lado) / 2) * (1 + y / 100);

  const recorte = $("#recorte");
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const px = Math.round((recorte.clientWidth || 200) * dpr);
  recorte.width = recorte.height = px;
  const ctx = recorte.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fonte, sx, sy, lado, lado, 0, 0, px, px);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 20; i++) {
    const p = Math.round((i * px) / 20) + 0.5;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, px);
    ctx.moveTo(0, p);
    ctx.lineTo(px, p);
    ctx.stroke();
  }

  const rctx = reducao.getContext("2d", { willReadFrequently: true });
  rctx.imageSmoothingQuality = "high";
  rctx.clearRect(0, 0, 200, 200);
  rctx.drawImage(fonte, sx, sy, lado, lado, 0, 0, 200, 200);
  let grade = G.deRGBA(rctx.getImageData(0, 0, 200, 200).data, 200, { limiar });
  if (vivas) grade = G.realcar(grade, 1.5);
  estado.imagem.grade = grade;
  desenharGrade($("#previa-imagem"), grade);
  $("#resumo-imagem").textContent = resumo(grade);
}

for (const [id, chave, rotulo, formato] of [
  ["#imagem-zoom", "zoom", "#zoom-valor", (v) => `${virgula(v, 1)}×`],
  ["#imagem-x", "x"],
  ["#imagem-y", "y"],
  ["#imagem-limiar", "limiar", "#limiar-valor", (v) => String(v)],
]) {
  const el = $(id);
  el.addEventListener("input", () => {
    estado.imagem[chave] = Number(el.value);
    if (rotulo) $(rotulo).textContent = formato(Number(el.value));
    atualizarImagem();
  });
}
$("#imagem-vivas").addEventListener("change", (e) => {
  estado.imagem.vivas = e.target.checked;
  atualizarImagem();
});

$("#enviar-imagem").addEventListener("click", () => estado.imagem.grade && enviarGrade(estado.imagem.grade, "imagem"));
$("#editar-imagem").addEventListener("click", () => estado.imagem.grade && abrirNoEditor(estado.imagem.grade, "Imagem"));
$("#salvar-imagem").addEventListener("click", () => estado.imagem.grade && salvarNaGaleria(estado.imagem.grade, "Foto"));

// ---------- início ----------

const suporte = suporteBluetooth();
if (!suporte.ok) {
  $("#aviso").textContent = suporte.motivo;
  $("#aviso").hidden = false;
}

renderFavoritas();
renderEfeitos();
sincronizarControles();
trocarAba(ler("aba", "inicio"));

let relogioTela;
window.addEventListener("resize", () => {
  clearTimeout(relogioTela);
  relogioTela = setTimeout(() => {
    if (!$("#aba-desenhar").hidden) desenharEditor();
    if (!$("#aba-texto").hidden) atualizarTexto();
    if (!$("#aba-imagem").hidden) atualizarImagem();
  }, 150);
});

// Para depurar no console do navegador: window.cortina
window.cortina = cortina;
