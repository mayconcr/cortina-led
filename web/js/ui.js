// Peças de interface reaproveitadas: aviso rápido (toast), folha que sobe de baixo, diálogos e sliders.

export const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
export const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));

/** Cria um elemento: el("button", { class: "botao", onclick }, "texto", filho...). */
export function el(tag, atributos = {}, ...filhos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(atributos)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k in e && typeof v !== "string") e[k] = v;
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) e.append(f);
  return e;
}

// ---------- aviso rápido ----------

let relogioAviso;
export function avisar(mensagem, tipo = "info") {
  const t = $("#toast");
  t.textContent = mensagem;
  t.dataset.tipo = tipo;
  t.classList.add("visivel");
  clearTimeout(relogioAviso);
  relogioAviso = setTimeout(() => t.classList.remove("visivel"), tipo === "erro" ? 5500 : 2800);
}

// ---------- folha (bottom sheet) ----------

let aoFecharFolha = null;

export function abrirFolha(conteudo, { aoFechar } = {}) {
  const folha = $("#folha");
  const fundo = $("#folha-fundo");
  if (aoFecharFolha) {
    const f = aoFecharFolha;
    aoFecharFolha = null;
    f();
  }
  $("#folha-conteudo").replaceChildren(conteudo);
  aoFecharFolha = aoFechar || null;
  fundo.hidden = false;
  folha.hidden = false;
  document.body.classList.add("com-folha");
  requestAnimationFrame(() => {
    fundo.classList.add("aberta");
    folha.classList.add("aberta");
  });
}

export function fecharFolha() {
  const folha = $("#folha");
  const fundo = $("#folha-fundo");
  if (folha.hidden) return;
  folha.classList.remove("aberta");
  fundo.classList.remove("aberta");
  document.body.classList.remove("com-folha");
  const f = aoFecharFolha;
  aoFecharFolha = null;
  setTimeout(() => {
    if (!folha.classList.contains("aberta")) {
      folha.hidden = true;
      fundo.hidden = true;
    }
  }, 260);
  f?.();
}

export function iniciarFolha() {
  $("#folha-fundo").addEventListener("click", fecharFolha);
  document.addEventListener("keydown", (e) => e.key === "Escape" && fecharFolha());
}

/** Pergunta curta numa folha. Devolve o texto digitado (campo) ou "" (confirmação), ou null se cancelar. */
export function dialogo({ titulo, texto = "", campo = false, valor = "", ok = "OK", perigo = false }) {
  return new Promise((resolver) => {
    let respondeu = false;
    const responder = (r) => {
      respondeu = true;
      fecharFolha();
      resolver(r);
    };
    const input = campo ? el("input", { class: "campo-texto", value: valor, maxlength: "30", autocomplete: "off" }) : null;
    const form = el(
      "form",
      { class: "dialogo", onsubmit: (e) => (e.preventDefault(), responder(campo ? input.value : "")) },
      el("h3", {}, titulo),
      texto ? el("p", { class: "nota" }, texto) : null,
      input,
      el(
        "div",
        { class: "par-botoes" },
        el("button", { type: "button", class: "botao tonal", onclick: () => responder(null) }, "Cancelar"),
        el("button", { type: "submit", class: `botao ${perigo ? "perigo" : "primario"}` }, ok),
      ),
    );
    abrirFolha(form, { aoFechar: () => !respondeu && resolver(null) });
    if (input) setTimeout(() => input.focus(), 280);
  });
}

export const pedirTexto = (titulo, valor) => dialogo({ titulo, campo: true, valor, ok: "Salvar" });
export const confirmar = async (titulo, { texto, ok = "Sim", perigo = false } = {}) => (await dialogo({ titulo, texto, ok, perigo })) !== null;

// ---------- sliders ----------

/** Pinta a parte "cheia" do slider (o WebKit não tem isso nativo). */
export function pintarSlider(input) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  input.style.setProperty("--pct", `${((Number(input.value) - min) / (max - min)) * 100}%`);
}

/** Slider com rótulo: chama `aoMudar(valor)` ao soltar e `aoMover(valor)` enquanto arrasta. */
export function slider({ rotulo, min, max, passo = 1, valor, formato = (v) => String(v), aoMover, aoMudar, classe }) {
  const saida = el("output", {}, formato(valor));
  const input = el("input", { type: "range", min: String(min), max: String(max), step: String(passo), class: classe });
  input.value = String(valor);
  pintarSlider(input);
  input.addEventListener("input", () => {
    pintarSlider(input);
    saida.textContent = formato(Number(input.value));
    aoMover?.(Number(input.value));
  });
  input.addEventListener("change", () => aoMudar?.(Number(input.value)));
  const bloco = el("label", { class: "controle" }, el("span", { class: "controle-topo" }, el("span", {}, rotulo), saida), input);
  bloco.definir = (v) => {
    input.value = String(v);
    pintarSlider(input);
    saida.textContent = formato(v);
  };
  return bloco;
}

/** Interruptor (checkbox com cara de iOS). */
export function interruptor({ rotulo, marcado = false, aoMudar, classe }) {
  const input = el("input", { type: "checkbox", class: classe });
  input.checked = marcado;
  input.addEventListener("change", () => aoMudar?.(input.checked));
  return el("label", { class: "interruptor" }, el("span", {}, rotulo), input, el("i", { "aria-hidden": "true" }));
}
