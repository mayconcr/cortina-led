// Coleções de cenas que andam na cortina (aba Cenas), separadas por tema.
// Cada cena pode sugerir o seu movimento (`movimento`: "esquerda" é o padrão; "direita", "cima", "baixo").
// As 50 novas de cada tema (partes C e D, com muitas que sobem e descem) aparecem primeiro.
import { ANIMACOES_ANO_NOVO_A } from "./ano-novo-a.js";
import { ANIMACOES_ANO_NOVO_B } from "./ano-novo-b.js";
import { ANIMACOES_ANO_NOVO_C } from "./ano-novo-c.js";
import { ANIMACOES_ANO_NOVO_D } from "./ano-novo-d.js";
import { ANIMACOES_NATAL } from "./natal.js";
import { ANIMACOES_NATAL_C } from "./natal-cenas-c.js";
import { ANIMACOES_NATAL_D } from "./natal-cenas-d.js";
import { ANIMACOES_NATAL_MAIS } from "./natal-mais.js";

export const COLECOES_ANIMACOES = {
  natal: { nome: "Natal", itens: [...ANIMACOES_NATAL_C, ...ANIMACOES_NATAL_D, ...ANIMACOES_NATAL, ...ANIMACOES_NATAL_MAIS] },
  "ano-novo": {
    nome: "Ano Novo",
    itens: [
      ...ANIMACOES_ANO_NOVO_C,
      ...ANIMACOES_ANO_NOVO_D,
      ...ANIMACOES_ANO_NOVO_B.slice(0, 1),
      ...ANIMACOES_ANO_NOVO_A,
      ...ANIMACOES_ANO_NOVO_B.slice(1),
    ],
  },
};
