// Interface do app: abas Início, Efeitos, Animações, Galeria e Criar (Desenhar, Texto, Foto).
// Toda a lógica de bytes e de segurança está em protocol.js / grade.js / ble.js; aqui é só tela.

import { Cortina, suporteBluetooth } from "./ble.js";
import { EXEMPLOS } from "./exemplos.js";
import { capacidade, textoParaGrade } from "./fonte.js";
import * as G from "./grade.js";
import { gravar, ler } from "./memoria.js";
import { COLECOES_ANIMACOES } from "./colecoes.js";
import { DESENHOS_NATAL } from "./natal.js";
import {
  ANIMACOES_CORTINA,
  BRILHO_EFEITO_MAX,
  BRILHO_EFEITO_MIN,
  BRILHO_MAX,
  EFEITO_MAX,
  EFEITO_MIN,
  VELOCIDADE_MAX,
  VELOCIDADE_MIN,
  VELOCIDADE_PADRAO,
} from "./protocol.js";
import { Animador, Reprodutor, desenharGrade } from "./tela.js";
import { brilhoSeguroAnimacao, duracoes, resumoAnimacao } from "./animacao.js";
import { ANIMACOES_MOVIMENTO } from "./natal-movimento.js";
import { $, $$, abrirFolha, avisar, confirmar, el, fecharFolha, iniciarFolha, interruptor, pedirTexto, slider } from "./ui.js";

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

const ICONE_LAPIS = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>';

const cortina = new Cortina();
cortina.pixComResposta = ler("pixComResposta", false) === true;
const animador = new Animador(6);
const reprodutor = new Reprodutor();

// Envio AO VIVO das nossas animações (só os LEDs que mudam, preto apaga). Fica desligado até o teste
// na cortina confirmar que ela mostra os pixels na hora (ver docs/DESCOBERTAS.md).
const AO_VIVO_LIBERADO = false;
const registro = [];

const estado = {
  cor: ler("cor", [255, 0, 0]),
  brilhoCor: entre(ler("brilhoCor", 30), 5, BRILHO_MAX, 30),
  favoritas: ler("favoritas", []),
  editandoFavoritas: false,
  nomesEfeitos: ler("nomesEfeitos", {}),
  efeitoAtivo: null,
  brilhoEfeito: entre(ler("brilhoEfeito", BRILHO_MAX), BRILHO_EFEITO_MIN, BRILHO_EFEITO_MAX, BRILHO_MAX),
  desenho: carregarDesenho(),
  desfazer: [],
  ferramenta: "pincel",
  corPincel: ler("corPincel", [255, 0, 0]),
  brilhoDesenho: entre(ler("brilhoDesenho", BRILHO_MAX), 5, BRILHO_MAX, BRILHO_MAX),
  rolar: ler("rolar", false) === true,
  velocidadeRolagem: entre(ler("velocidadeRolagem", VELOCIDADE_PADRAO), VELOCIDADE_MIN, VELOCIDADE_MAX, VELOCIDADE_PADRAO),
  rolagemNaCortina: false,
  galeria: ler("galeria", []),
  filtroGaleria: ler("filtroGaleria", "natal"),
  filtroAnimacoes: ler("filtroAnimacoes", "natal"),
  brilhoNativo: entre(ler("brilhoNativo", BRILHO_MAX), BRILHO_EFEITO_MIN, BRILHO_EFEITO_MAX, BRILHO_MAX),
  modoCriar: ler("modoCriar", "desenhar"),
  texto: { texto: "NOEL", fonte: "grande", alinhamento: "centro", cor: [255, 0, 0], ...ler("texto", {}) },
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

// ============================================================
//                         conexão
// ============================================================

const ROTULOS = {
  desconectado: "Conectar",
  conectando: "Conectando…",
  preparando: "Preparando…",
  conectado: "Conectada",
  reconectando: "Reconectando…",
};
const ESTADO_LONGO = {
  desconectado: "Desconectada",
  conectando: "Conectando…",
  preparando: "Preparando…",
  conectado: "Pronta",
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
  avisar(cortina.estado === "desconectado" ? "Conecte a cortina primeiro." : "Espere a cortina terminar de conectar.", "aviso");
  chamarConexao();
  return false;
}

/** Roda um comando da cortina mostrando o erro de forma amigável. */
async function executar(acao, sucesso) {
  if (!exigirConexao()) return false;
  if (estado.envio) avisar("Na fila: espere o envio terminar.");
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

async function conectar() {
  if (cortina.estado === "conectado") return;
  if (cortina.estado !== "desconectado") return;
  const suporte = suporteBluetooth();
  if (!suporte.ok) {
    avisar(suporte.motivo, "erro");
    return;
  }
  try {
    await cortina.conectar(); // abre o seletor do navegador: precisa vir direto do toque
    avisar("Cortina conectada", "ok");
  } catch (erro) {
    if (erro.name === "NotFoundError") avisar("Nenhuma cortina escolhida. Ela está ligada e o app iDeal LED fechado?", "aviso");
    else avisar(erro.message || String(erro), "erro");
  }
}

$("#conexao").addEventListener("click", () => (cortina.estado === "conectado" ? abrirAjustes() : conectar()));

cortina.addEventListener("estado", (e) => {
  const { estado: s, mensagem } = e.detail;
  $("#conexao").dataset.estado = s;
  $("#conexao-texto").textContent = ROTULOS[s] || s;
  $("#energia-estado").textContent = ESTADO_LONGO[s] || s;
  if (s !== "conectado") estado.rolagemNaCortina = false;
  if (mensagem) avisar(mensagem, s === "desconectado" ? "erro" : "info");
  if (s === "reconectando") avisar("A conexão caiu. Reconectando…", "aviso");
  atualizarAjustes();
});

let listaRegistro = null;
cortina.addEventListener("log", (e) => {
  registro.unshift(e.detail);
  if (registro.length > 150) registro.length = 150;
  if (listaRegistro?.isConnected) listaRegistro.prepend(itemRegistro(e.detail));
});

const itemRegistro = ({ texto, tipo, hora }) => el("li", { "data-tipo": tipo }, `${hora.toLocaleTimeString("pt-BR")}  ${texto}`);

// ---------- folha de ajustes ----------

let atualizarAjustes = () => {};

function abrirAjustes() {
  const linhas = el("ul", { class: "info-linhas" });
  const botaoConexao = el("button", { type: "button", class: "botao tonal largo" });
  const preencher = () => {
    linhas.replaceChildren(
      el("li", {}, "Cortina", el("b", {}, cortina.nome || "—")),
      el("li", {}, "Estado", el("b", {}, ESTADO_LONGO[cortina.estado] || cortina.estado)),
    );
    botaoConexao.textContent = cortina.estado === "desconectado" ? "Conectar" : "Desconectar";
  };
  botaoConexao.addEventListener("click", () => (cortina.estado === "desconectado" ? conectar() : cortina.desconectar()));
  listaRegistro = el("ol", { class: "registro", "aria-label": "Registro" }, registro.slice(0, 80).map(itemRegistro));
  preencher();
  atualizarAjustes = preencher;
  abrirFolha(
    el(
      "div",
      {},
      el("h3", {}, "Conexão e ajustes"),
      el("p", { class: "subtitulo" }, "Feche o app iDeal LED no celular antes de conectar."),
      linhas,
      interruptor({
        rotulo: "Desenho mais confiável (cerca de 3× mais lento)",
        marcado: cortina.pixComResposta,
        aoMudar: (v) => {
          cortina.pixComResposta = v;
          gravar("pixComResposta", v);
          atualizarResumoCriar();
        },
      }),
      el("div", { class: "par-botoes" }, botaoConexao),
      el("h2", { class: "rotulo-secao" }, "Registro"),
      listaRegistro,
    ),
    {
      aoFechar: () => {
        atualizarAjustes = () => {};
        listaRegistro = null;
      },
    },
  );
}

$("#abrir-ajustes").addEventListener("click", abrirAjustes);

for (const botao of $$("[data-acao]")) {
  const acao = botao.dataset.acao;
  const mensagens = { ligar: "Ligada", desligar: "Desligada" };
  botao.addEventListener("click", () => executar(() => cortina[acao](), mensagens[acao]));
}

// ============================================================
//                           abas
// ============================================================

function trocarAba(nome) {
  if (!$(`#aba-${nome}`)) nome = "inicio";
  gravar("aba", nome);
  for (const s of $$(".aba")) s.hidden = s.id !== `aba-${nome}`;
  for (const b of $$(".abas button")) b.setAttribute("aria-current", b.dataset.aba === nome ? "page" : "false");
  $("#titulo").textContent = $(`#aba-${nome}`).dataset.titulo;
  if (nome === "cenas") renderAnimacoes();
  if (nome === "animacoes") renderMovimento();
  if (nome === "galeria") renderGaleria();
  if (nome === "criar") trocarModoCriar(estado.modoCriar);
  window.scrollTo(0, 0);
}

for (const b of $$(".abas button")) b.addEventListener("click", () => trocarAba(b.dataset.aba));

/** Liga os botões de um controle segmentado a uma função. */
function segmentado(raiz, obter, definir) {
  const render = () => {
    for (const b of raiz.querySelectorAll("button")) {
      const ativo = b.dataset.valor === obter();
      b.classList.toggle("ativo", ativo);
      b.setAttribute("aria-selected", String(ativo));
    }
  };
  for (const b of raiz.querySelectorAll("button")) {
    b.addEventListener("click", () => {
      definir(b.dataset.valor);
      render();
    });
  }
  render();
  return render;
}

// ============================================================
//                     cores (paletas)
// ============================================================

/** Fileira de cores + "outra cor". Devolve a função que redesenha a fileira. */
function montarPaleta(raiz, obter, escolher) {
  function render() {
    const atual = obter();
    const botoes = CORES.map(([nome, cor]) =>
      el("button", {
        type: "button",
        class: `amostra${G.mesmaCor(cor, atual) ? " ativa" : ""}`,
        style: `background:${G.rgbParaHex(cor)}`,
        title: nome,
        "aria-label": nome,
        onclick: () => {
          escolher([...cor]);
          render();
        },
      }),
    );
    const livreAtiva = !CORES.some(([, c]) => G.mesmaCor(c, atual));
    const input = el("input", {
      type: "color",
      value: G.rgbParaHex(atual),
      "aria-label": "Escolher outra cor",
      onchange: () => {
        escolher(G.hexParaRGB(input.value));
        render();
      },
    });
    const livre = el(
      "label",
      { class: `amostra livre${livreAtiva ? " ativa" : ""}`, title: "Outra cor", style: livreAtiva ? `background:${G.rgbParaHex(atual)}` : null },
      input,
    );
    raiz.replaceChildren(...botoes, livre);
  }
  render();
  return render;
}

// ============================================================
//                   Início: cor sólida
// ============================================================

function aplicarCor() {
  const [r, g, b] = estado.cor;
  const brilho = G.brilhoSeguroCor(r, g, b, estado.brilhoCor);
  $("#dica-cor").textContent = brilho < estado.brilhoCor ? `Esta cor vai a no máximo ${brilho}% para proteger a fonte de 5 V.` : "";
  if (brilho <= 0) return;
  estado.rolagemNaCortina = false;
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

$("#controle-brilho-cor").replaceWith(
  slider({
    rotulo: "Brilho",
    min: 5,
    max: BRILHO_MAX,
    valor: estado.brilhoCor,
    formato: (v) => `${v}%`,
    aoMudar: (v) => {
      estado.brilhoCor = v;
      gravar("brilhoCor", v);
      aplicarCor();
    },
  }),
);

function renderFavoritas() {
  const raiz = $("#favoritas");
  if (!estado.favoritas.length) estado.editandoFavoritas = false;
  const itens = estado.favoritas.map((cor, i) =>
    el("button", {
      type: "button",
      class: `amostra${estado.editandoFavoritas ? " removivel" : ""}`,
      style: `background:${G.rgbParaHex(cor)}`,
      "aria-label": estado.editandoFavoritas ? `Remover ${G.rgbParaHex(cor)}` : `Cor ${G.rgbParaHex(cor)}`,
      onclick: () => {
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
      },
    }),
  );
  raiz.replaceChildren(...(itens.length ? itens : [el("p", { class: "nota" }, "Nenhuma ainda. Escolha uma cor e salve aqui.")]));
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
  if (estado.favoritas.length > 15) estado.favoritas.shift();
  gravar("favoritas", estado.favoritas);
  renderFavoritas();
  avisar("Cor salva nas favoritas", "ok");
});

// ============================================================
//                         Efeitos
// ============================================================

const nomeEfeito = (n) => estado.nomesEfeitos[n] || `Efeito ${n}`;

function renderEfeitos() {
  const linhas = [];
  for (let n = EFEITO_MIN; n <= EFEITO_MAX; n++) {
    linhas.push(
      el(
        "div",
        { class: `item-lista${estado.efeitoAtivo === n ? " ativo" : ""}` },
        el(
          "button",
          { type: "button", class: "principal", onclick: () => mostrarEfeito(n) },
          el("span", { class: "num" }, String(n)),
          el("span", { class: "nome" }, nomeEfeito(n)),
        ),
        el("button", {
          type: "button",
          class: "icone",
          html: ICONE_LAPIS,
          "aria-label": `Dar nome ao efeito ${n}`,
          onclick: async () => {
            const novo = await pedirTexto(`Nome do efeito ${n}`, nomeEfeito(n));
            if (novo === null) return;
            if (novo.trim() && novo.trim() !== `Efeito ${n}`) estado.nomesEfeitos[n] = novo.trim().slice(0, 28);
            else delete estado.nomesEfeitos[n];
            gravar("nomesEfeitos", estado.nomesEfeitos);
            renderEfeitos();
          },
        }),
      ),
    );
  }
  $("#lista-efeitos").replaceChildren(...linhas);
}

function mostrarEfeito(n) {
  estado.efeitoAtivo = n;
  estado.rolagemNaCortina = false;
  renderEfeitos();
  executar(() => cortina.efeito(n, estado.brilhoEfeito, VELOCIDADE_PADRAO));
}

$("#controle-brilho-efeito").append(
  slider({
    rotulo: "Brilho dos efeitos",
    min: BRILHO_EFEITO_MIN,
    max: BRILHO_EFEITO_MAX,
    passo: 5,
    valor: estado.brilhoEfeito,
    formato: (v) => `${v}%`,
    aoMudar: (v) => {
      estado.brilhoEfeito = v;
      gravar("brilhoEfeito", v);
      if (estado.efeitoAtivo) mostrarEfeito(estado.efeitoAtivo);
    },
  }),
);
$("#controle-brilho-efeito .controle").style.marginTop = "0";

// ============================================================
//             envio de desenhos (comum a várias abas)
// ============================================================

const controlesBrilho = new Set();

/** Slider do brilho dos desenhos; todos os que estão na tela ficam sincronizados. */
function controleBrilhoDesenho() {
  const bloco = slider({
    rotulo: "Brilho",
    min: 5,
    max: BRILHO_MAX,
    valor: estado.brilhoDesenho,
    formato: (v) => `${v}%`,
    aoMover: (v) => {
      estado.brilhoDesenho = v;
      for (const outro of controlesBrilho) {
        if (!outro.isConnected) controlesBrilho.delete(outro);
        else if (outro !== bloco) outro.definir(v);
      }
      atualizarResumoCriar();
    },
    aoMudar: (v) => gravar("brilhoDesenho", v),
  });
  controlesBrilho.add(bloco);
  return bloco;
}

const msPorPixel = () => (cortina.pixComResposta ? G.MS_POR_PIXEL_COM_RESPOSTA : G.MS_POR_PIXEL);

function resumo(grade) {
  if (!grade) return "";
  const acesos = G.contarAcesos(grade);
  if (!acesos) return "Nenhum LED aceso.";
  let t = `${acesos} LEDs · cerca de ${virgula(G.tempoEstimado(grade, msPorPixel()))} s para enviar`;
  const seguro = G.brilhoSeguro(grade, estado.brilhoDesenho);
  if (seguro < estado.brilhoDesenho) t += ` · brilho limitado a ${seguro}%`;
  return t;
}

function mostrarEnvio(titulo, feitos, total) {
  $("#envio").hidden = false;
  $("#envio-titulo").textContent = titulo;
  $("#envio-barra").style.width = `${total ? (100 * feitos) / total : 0}%`;
  const falta = Math.max(0, Math.ceil(((total - feitos) * msPorPixel()) / 1000));
  $("#envio-texto").textContent = `${feitos} de ${total} LEDs · faltam ${falta} s`;
}

$("#envio-cancelar").addEventListener("click", () => estado.envio?.abort());

async function enviarGrade(grade, { rotulo = "desenho", rolar = false, velocidade = null } = {}) {
  if (estado.envio) {
    avisar("Já tem um desenho sendo enviado.");
    return;
  }
  if (!exigirConexao()) return;
  const acesos = G.contarAcesos(grade);
  if (!acesos) {
    if (await confirmar("O desenho está vazio", { texto: "Quer apagar o que está na cortina?", ok: "Apagar" })) {
      executar(() => cortina.apagar(), "Cortina apagada");
    }
    return;
  }
  const brilho = G.brilhoSeguro(grade, estado.brilhoDesenho);
  if (brilho < estado.brilhoDesenho) avisar(`Brilho reduzido para ${brilho}% para proteger a fonte`, "aviso");
  const controle = new AbortController();
  estado.envio = controle;
  const titulo = `Enviando ${rotulo}`;
  mostrarEnvio(titulo, 0, acesos);
  try {
    const r = await cortina.desenhar(grade, {
      brilho,
      rolar,
      velocidade: rolar ? velocidade : null,
      sinal: controle.signal,
      aoProgresso: (feitos, total) => mostrarEnvio(titulo, feitos, total),
    });
    estado.rolagemNaCortina = rolar && !r.cancelado;
    estado.efeitoAtivo = null;
    if (r.cancelado) avisar(`Envio cancelado (${r.feitos} de ${r.total} LEDs)`, "aviso");
    else avisar(`Pronto! ${r.total} LEDs em ${virgula(r.segundos)} s`, "ok");
  } catch (erro) {
    avisar(erro.message || String(erro), "erro");
    cortina.log(erro.message || String(erro), "erro");
  } finally {
    estado.envio = null;
    $("#envio").hidden = true;
  }
}

// ============================================================
//                        Animações
// ============================================================

const animacoesProntas = new Set();

function cardLed(nome, meta, grade, { animado = false, aoTocar }) {
  const canvas = el("canvas", { class: "painel-led", "aria-hidden": "true" });
  const card = el(
    "button",
    { type: "button", class: "card-led", onclick: aoTocar, "aria-label": nome },
    canvas,
    el("span", { class: "nome" }, nome, meta ? el("span", { class: "meta" }, meta) : null),
  );
  if (animado) animador.adicionar(canvas, grade);
  else requestAnimationFrame(() => desenharGrade(canvas, grade));
  return card;
}

/** Cada coleção vira uma lista própria; só a escolhida fica visível (e só ela anima). */
function renderAnimacoes() {
  const filtro = COLECOES_ANIMACOES[estado.filtroAnimacoes] ? estado.filtroAnimacoes : "natal";
  for (const lista of $$("#lista-animacoes > .grade-cards")) lista.hidden = lista.dataset.colecao !== filtro;
  if (animacoesProntas.has(filtro)) return;
  animacoesProntas.add(filtro);
  const lista = el("div", { class: "grade-cards", "data-colecao": filtro });
  lista.append(
    ...COLECOES_ANIMACOES[filtro].itens.map((item) => {
      const grade = item.criar();
      const meta = `Envio de ${Math.max(1, Math.round(G.tempoEstimado(grade)))} s`;
      return cardLed(item.nome, meta, grade, { animado: true, aoTocar: () => abrirAnimacao(item, grade) });
    }),
  );
  $("#lista-animacoes").append(lista);
}

const renderFiltroAnimacoes = segmentado(
  $("#animacoes-filtro"),
  () => estado.filtroAnimacoes,
  (v) => {
    estado.filtroAnimacoes = v;
    gravar("filtroAnimacoes", v);
    renderAnimacoes();
    window.scrollTo(0, 0);
  },
);
for (const b of $$("#animacoes-filtro button")) {
  const colecao = COLECOES_ANIMACOES[b.dataset.valor];
  if (colecao) b.textContent = `${colecao.nome} · ${colecao.itens.length}`;
}
renderFiltroAnimacoes();

function abrirAnimacao(item, grade) {
  const canvas = el("canvas", { class: "painel-led", "aria-label": `Prévia: ${item.nome}` });
  animador.adicionar(canvas, grade);
  const textoResumo = el("p", { class: "nota" }, resumo(grade));
  const brilho = controleBrilhoDesenho();
  brilho.querySelector("input").addEventListener("input", () => (textoResumo.textContent = resumo(grade)));
  const velocidade = slider({
    rotulo: "Velocidade (vale no próximo envio · em teste)",
    min: VELOCIDADE_MIN,
    max: VELOCIDADE_MAX,
    valor: estado.velocidadeRolagem,
    aoMudar: (v) => {
      // Mandar SPEED sozinho com a rolagem andando não mudou nada na cortina (2026-11-16):
      // a velocidade vai junto com o próximo envio (SMVEW 02 → MODE 03 → SPEED), como o app oficial.
      estado.velocidadeRolagem = v;
      gravar("velocidadeRolagem", v);
    },
  });
  abrirFolha(
    el(
      "div",
      {},
      el("h3", {}, item.nome),
      el("p", { class: "subtitulo" }, "Anda da direita para a esquerda, sem parar."),
      canvas,
      textoResumo,
      brilho,
      velocidade,
      el(
        "div",
        { class: "par-botoes" },
        el(
          "button",
          {
            type: "button",
            class: "botao primario",
            onclick: () => {
              fecharFolha();
              enviarGrade(grade, { rotulo: item.nome, rolar: true, velocidade: estado.velocidadeRolagem });
            },
          },
          "Mostrar na cortina",
        ),
      ),
      el("button", { type: "button", class: "botao tonal largo", style: "margin-top:10px", onclick: () => abrirNoCriar(grade, item.nome) }, "Editar no Criar"),
    ),
    { aoFechar: () => animador.remover(canvas) },
  );
}

// ============================================================
//             Animações (quadro a quadro) e as da cortina
// ============================================================

const ICONE_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg>';
let movimentoPronto = false;

function renderMovimento() {
  if (movimentoPronto) return;
  movimentoPronto = true;
  // guardadas na cortina: o app só manda o número (ANIM NN) e a cortina toca sozinha, a 10 quadros/s
  $("#lista-nativas").replaceChildren(
    ...Object.entries(ANIMACOES_CORTINA).map(([numero, nome]) =>
      el(
        "div",
        { class: "item-lista" },
        el(
          "button",
          { type: "button", class: "principal", onclick: () => executar(() => cortina.animacaoNativa(Number(numero), estado.brilhoNativo), `${nome} na cortina`) },
          el("span", { class: "num", html: ICONE_PLAY }),
          el("span", { class: "nome" }, nome),
        ),
      ),
    ),
  );
  $("#controle-brilho-nativas").replaceChildren(
    slider({
      rotulo: "Brilho das animações da cortina",
      min: BRILHO_EFEITO_MIN,
      max: BRILHO_EFEITO_MAX,
      passo: 5,
      valor: estado.brilhoNativo,
      formato: (v) => `${v}%`,
      aoMudar: (v) => {
        estado.brilhoNativo = v;
        gravar("brilhoNativo", v);
      },
    }),
  );
  $("#controle-brilho-nativas .controle").style.marginTop = "0";
  $("#nota-ao-vivo").textContent = AO_VIVO_LIBERADO
    ? "Na cortina, cada LED que muda leva ~32 ms; a prévia já mostra o ritmo real."
    : "Prévia no ritmo real da cortina. O envio para a cortina será liberado depois do teste ao vivo.";
  $("#lista-movimento").replaceChildren(
    ...ANIMACOES_MOVIMENTO.map((item) => {
      const qs = item.criar();
      const dur = duracoes(qs, item.ms);
      const r = resumoAnimacao(qs, item.ms);
      const canvas = el("canvas", { class: "painel-led", "aria-hidden": "true" });
      reprodutor.adicionar(canvas, qs, dur);
      return el(
        "button",
        { type: "button", class: "card-led", "aria-label": item.nome, onclick: () => abrirMovimento(item, qs, dur, r) },
        canvas,
        el("span", { class: "nome" }, item.nome, el("span", { class: "meta" }, `${virgula(r.quadrosPorSegundo)} quadros/s`)),
      );
    }),
  );
}

function abrirMovimento(item, qs, dur, r) {
  const canvas = el("canvas", { class: "painel-led", "aria-label": `Prévia: ${item.nome}` });
  reprodutor.adicionar(canvas, qs, dur);
  const desenho = Math.max(1, Math.round((r.ledsPrimeiroQuadro * G.MS_POR_PIXEL) / 1000));
  const info = el(
    "p",
    { class: "nota" },
    `${r.quadros} quadros · ${virgula(r.quadrosPorSegundo)} quadros/s na cortina · muda até ${r.maxMudancas} LEDs por quadro · o 1º quadro leva ~${desenho} s para aparecer`,
  );
  const tocar = el(
    "button",
    {
      type: "button",
      class: "botao primario",
      disabled: !AO_VIVO_LIBERADO,
      onclick: () => {
        fecharFolha();
        if (!exigirConexao()) return;
        const brilho = brilhoSeguroAnimacao(qs, estado.brilhoDesenho);
        if (brilho < estado.brilhoDesenho) avisar(`Brilho reduzido para ${brilho}% para proteger a fonte`, "aviso");
        $("#tocando-titulo").textContent = `Tocando “${item.nome}”`;
        $("#tocando-texto").textContent = `${virgula(r.quadrosPorSegundo)} quadros/s · toque em Parar ou mande outro comando`;
        cortina.tocarQuadros(qs, { ms: item.ms, brilho, rotulo: item.nome }).catch((erro) => avisar(erro.message || String(erro), "erro"));
      },
    },
    "Mostrar na cortina",
  );
  abrirFolha(
    el(
      "div",
      {},
      el("h3", {}, item.nome),
      el("p", { class: "subtitulo" }, "Animação quadro a quadro, no ritmo que a cortina consegue."),
      canvas,
      info,
      controleBrilhoDesenho(),
      el("div", { class: "par-botoes" }, tocar),
      AO_VIVO_LIBERADO ? null : el("p", { class: "nota alerta" }, "Ainda falta o teste do envio ao vivo na cortina."),
    ),
    { aoFechar: () => reprodutor.remover(canvas) },
  );
}

cortina.addEventListener("animacao", (e) => {
  $("#tocando").hidden = !e.detail.tocando;
});
$("#tocando-parar").addEventListener("click", () => cortina.pararAnimacao());

// ============================================================
//                         Galeria
// ============================================================

function itensGaleria() {
  if (estado.filtroGaleria === "natal") return DESENHOS_NATAL.map((d) => ({ nome: d.nome, criar: d.criar }));
  if (estado.filtroGaleria === "classicos") return EXEMPLOS.map((d) => ({ nome: d.nome, criar: d.criar }));
  return estado.galeria.map((d) => ({ nome: d.nome, criar: () => G.deTexto(d.dados), meu: d }));
}

function renderGaleria() {
  const itens = itensGaleria();
  $("#galeria-vazia").hidden = itens.length > 0;
  $("#galeria-lista").replaceChildren(
    ...itens.map((item) => {
      let grade;
      try {
        grade = item.criar();
      } catch {
        grade = G.novaGrade();
      }
      return cardLed(item.nome, null, grade, { aoTocar: () => abrirDesenho(item, grade) });
    }),
  );
}

segmentado(
  $("#galeria-filtro"),
  () => estado.filtroGaleria,
  (v) => {
    estado.filtroGaleria = v;
    gravar("filtroGaleria", v);
    renderGaleria();
  },
);

function abrirDesenho(item, grade) {
  const canvas = el("canvas", { class: "painel-led", "aria-label": `Prévia: ${item.nome}` });
  const textoResumo = el("p", { class: "nota" }, resumo(grade));
  const brilho = controleBrilhoDesenho();
  brilho.querySelector("input").addEventListener("input", () => (textoResumo.textContent = resumo(grade)));
  let rolar = false;
  const acoes = [el("button", { type: "button", class: "botao tonal", onclick: () => abrirNoCriar(grade, item.nome) }, "Editar")];
  if (item.meu) {
    acoes.push(
      el(
        "button",
        {
          type: "button",
          class: "botao perigo",
          onclick: async () => {
            if (!(await confirmar(`Excluir “${item.meu.nome}”?`, { ok: "Excluir", perigo: true }))) return;
            estado.galeria = estado.galeria.filter((x) => x.id !== item.meu.id);
            gravar("galeria", estado.galeria);
            renderGaleria();
          },
        },
        "Excluir",
      ),
    );
  } else {
    acoes.push(el("button", { type: "button", class: "botao tonal", onclick: () => salvarNaGaleria(grade, item.nome) }, "Salvar nos meus"));
  }
  abrirFolha(
    el(
      "div",
      {},
      el("h3", {}, item.nome),
      canvas,
      textoResumo,
      brilho,
      interruptor({ rotulo: "Rolar da direita para a esquerda", marcado: false, aoMudar: (v) => (rolar = v) }),
      el(
        "div",
        { class: "par-botoes" },
        el(
          "button",
          {
            type: "button",
            class: "botao primario",
            onclick: () => {
              fecharFolha();
              enviarGrade(grade, { rotulo: item.nome, rolar, velocidade: estado.velocidadeRolagem });
            },
          },
          "Mostrar na cortina",
        ),
      ),
      el("div", { class: "par-botoes" }, ...acoes),
    ),
  );
  requestAnimationFrame(() => desenharGrade(canvas, grade));
}

async function salvarNaGaleria(grade, sugestao) {
  if (!G.contarAcesos(grade)) {
    avisar("O desenho está vazio.");
    return;
  }
  const nome = await pedirTexto("Nome do desenho", sugestao);
  if (nome === null) return;
  const item = { id: Date.now().toString(36), nome: nome.trim().slice(0, 30) || "Sem nome", dados: G.paraTexto(grade), criado: Date.now() };
  estado.galeria.unshift(item);
  if (estado.galeria.length > 80) estado.galeria.length = 80;
  if (!gravar("galeria", estado.galeria)) {
    estado.galeria.shift();
    avisar("Não consegui salvar: a memória do navegador está cheia ou bloqueada.", "erro");
    return;
  }
  avisar(`“${item.nome}” salvo em Meus`, "ok");
  if (!$("#aba-galeria").hidden) renderGaleria();
}

function abrirNoCriar(grade, nome) {
  fecharFolha();
  guardarDesfazer();
  estado.desenho = G.copiar(grade);
  salvarDesenho();
  estado.modoCriar = "desenhar";
  gravar("modoCriar", "desenhar");
  renderModoCriar();
  trocarAba("criar");
  avisar(`${nome ? `“${nome}”` : "Desenho"} aberto para editar`);
}

// ============================================================
//                 Criar: Desenhar · Texto · Foto
// ============================================================

const renderModoCriar = segmentado(
  $("#criar-modo"),
  () => estado.modoCriar,
  (v) => trocarModoCriar(v),
);

function trocarModoCriar(modo) {
  estado.modoCriar = modo;
  gravar("modoCriar", modo);
  $("#modo-desenhar").hidden = modo !== "desenhar";
  $("#modo-texto").hidden = modo !== "texto";
  $("#modo-foto").hidden = modo !== "foto";
  renderModoCriar();
  if (modo === "desenhar") desenharEditor();
  if (modo === "texto") atualizarTexto();
  if (modo === "foto") atualizarImagem();
  atualizarResumoCriar();
}

function gradeDoCriar() {
  if (estado.modoCriar === "texto") return gradeDoTexto().grade;
  if (estado.modoCriar === "foto") return estado.imagem.grade;
  return estado.desenho;
}

const resumoCriar = el("p", { class: "resumo" });
function atualizarResumoCriar() {
  const grade = gradeDoCriar();
  resumoCriar.textContent = grade ? resumo(grade) : "Escolha uma foto para começar.";
}

$("#criar-envio").append(
  controleBrilhoDesenho(),
  interruptor({
    rotulo: "Rolar da direita para a esquerda",
    marcado: estado.rolar,
    aoMudar: (v) => {
      estado.rolar = v;
      gravar("rolar", v);
    },
  }),
  resumoCriar,
  el(
    "div",
    { class: "par-botoes" },
    el(
      "button",
      {
        type: "button",
        class: "botao primario",
        onclick: () => {
          const grade = gradeDoCriar();
          if (!grade) {
            avisar("Escolha uma foto primeiro.");
            return;
          }
          const rotulos = { desenhar: "desenho", texto: "texto", foto: "foto" };
          enviarGrade(grade, { rotulo: rotulos[estado.modoCriar], rolar: estado.rolar, velocidade: estado.velocidadeRolagem });
        },
      },
      "Mostrar na cortina",
    ),
  ),
  el(
    "div",
    { class: "par-botoes" },
    el(
      "button",
      {
        type: "button",
        class: "botao tonal",
        onclick: () => {
          const grade = gradeDoCriar();
          if (!grade) return;
          const sugestoes = { desenhar: "Meu desenho", texto: estado.texto.texto.trim().slice(0, 30), foto: "Foto" };
          salvarNaGaleria(grade, sugestoes[estado.modoCriar]);
        },
      },
      "Salvar",
    ),
    el("button", { type: "button", class: "botao tonal", onclick: () => executar(() => cortina.apagar(), "Cortina apagada") }, "Apagar cortina"),
  ),
);
$("#criar-envio .controle").style.marginTop = "0";

// ---------- Desenhar ----------

const editor = $("#editor");
let tracando = false;
let ultimaCelula = null;

function desenharEditor() {
  if (editor.clientWidth) desenharGrade(editor, estado.desenho);
  atualizarResumoCriar();
}

function salvarDesenho() {
  gravar("desenho", G.paraTexto(estado.desenho));
  atualizarResumoCriar();
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
      avisar("Cor copiada para o pincel");
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
  if (!(await confirmar("Limpar o desenho?", { texto: "Dá para desfazer depois.", ok: "Limpar", perigo: true }))) return;
  guardarDesfazer();
  estado.desenho = G.novaGrade();
  desenharEditor();
  salvarDesenho();
});

// ---------- Texto ----------

function gradeDoTexto() {
  const t = estado.texto;
  return textoParaGrade(t.texto, { cor: t.cor, fonte: t.fonte, alinhamento: t.alinhamento });
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
  atualizarResumoCriar();
}

const campoTexto = $("#texto");
campoTexto.value = estado.texto.texto;
campoTexto.addEventListener("input", () => {
  estado.texto.texto = campoTexto.value;
  atualizarTexto();
});
segmentado(
  $("#texto-fonte"),
  () => estado.texto.fonte,
  (v) => {
    estado.texto.fonte = v;
    atualizarTexto();
  },
);
segmentado(
  $("#texto-alinhamento"),
  () => estado.texto.alinhamento,
  (v) => {
    estado.texto.alinhamento = v;
    atualizarTexto();
  },
);
montarPaleta(
  $("#paleta-texto"),
  () => estado.texto.cor,
  (cor) => {
    estado.texto.cor = cor;
    atualizarTexto();
  },
);

// ---------- Foto ----------

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

const controlesImagem = {
  zoom: slider({ rotulo: "Zoom", min: 1, max: 4, passo: 0.05, valor: 1, formato: (v) => `${virgula(v)}×`, aoMover: (v) => ajustarImagem("zoom", v) }),
  x: slider({ rotulo: "Para os lados", min: -100, max: 100, valor: 0, formato: () => "", aoMover: (v) => ajustarImagem("x", v) }),
  y: slider({ rotulo: "Para cima e para baixo", min: -100, max: 100, valor: 0, formato: () => "", aoMover: (v) => ajustarImagem("y", v) }),
  limiar: slider({ rotulo: "Apagar partes escuras", min: 0, max: 150, passo: 5, valor: 30, aoMover: (v) => ajustarImagem("limiar", v) }),
};
$("#controles-imagem").append(
  ...Object.values(controlesImagem),
  interruptor({ rotulo: "Cores mais vivas", marcado: true, aoMudar: (v) => ajustarImagem("vivas", v) }),
);

function ajustarImagem(chave, valor) {
  estado.imagem[chave] = valor;
  atualizarImagem();
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
  controlesImagem.zoom.definir(1);
  controlesImagem.x.definir(0);
  controlesImagem.y.definir(0);
  $("#imagem-controles").hidden = false;
  $("#imagem-dica").hidden = true;
  $("#escolher-imagem").textContent = "Escolher outra foto";
  $("#escolher-imagem").className = "botao tonal largo";
  atualizarImagem();
});

function atualizarImagem() {
  const { fonte, zoom, x, y, limiar, vivas } = estado.imagem;
  if (!fonte) {
    atualizarResumoCriar();
    return;
  }
  const w = fonte.naturalWidth || fonte.width;
  const h = fonte.naturalHeight || fonte.height;
  const lado = Math.min(w, h) / zoom;
  const sx = ((w - lado) / 2) * (1 + x / 100);
  const sy = ((h - lado) / 2) * (1 + y / 100);

  const recorte = $("#recorte");
  if (recorte.clientWidth) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const px = Math.round(recorte.clientWidth * dpr);
    recorte.width = recorte.height = px;
    const ctx = recorte.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(fonte, sx, sy, lado, lado, 0, 0, px, px);
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
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
  }

  const rctx = reducao.getContext("2d", { willReadFrequently: true });
  rctx.imageSmoothingQuality = "high";
  rctx.clearRect(0, 0, 200, 200);
  rctx.drawImage(fonte, sx, sy, lado, lado, 0, 0, 200, 200);
  let grade = G.deRGBA(rctx.getImageData(0, 0, 200, 200).data, 200, { limiar });
  if (vivas) grade = G.realcar(grade, 1.5);
  estado.imagem.grade = grade;
  if ($("#previa-imagem").clientWidth) desenharGrade($("#previa-imagem"), grade);
  atualizarResumoCriar();
}

// ============================================================
//                          início
// ============================================================

iniciarFolha();
const suporte = suporteBluetooth();
if (!suporte.ok) {
  $("#aviso").textContent = suporte.motivo;
  $("#aviso").hidden = false;
}

renderFavoritas();
renderEfeitos();
trocarAba(ler("aba", "inicio"));

let relogioTela;
window.addEventListener("resize", () => {
  clearTimeout(relogioTela);
  relogioTela = setTimeout(() => {
    if (!$("#aba-criar").hidden) trocarModoCriar(estado.modoCriar);
  }, 150);
});

// Para depurar no console do navegador: window.cortina
window.cortina = cortina;
