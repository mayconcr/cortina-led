// Coleções de animações (cenas que rolam com MODE 03), separadas por tema.
import { ANIMACOES_ANO_NOVO_A } from "./ano-novo-a.js";
import { ANIMACOES_ANO_NOVO_B } from "./ano-novo-b.js";
import { ANIMACOES_NATAL } from "./natal.js";
import { ANIMACOES_NATAL_MAIS } from "./natal-mais.js";

export const COLECOES_ANIMACOES = {
  natal: { nome: "Natal", itens: [...ANIMACOES_NATAL, ...ANIMACOES_NATAL_MAIS] },
  "ano-novo": { nome: "Ano Novo", itens: [...ANIMACOES_ANO_NOVO_B.slice(0, 1), ...ANIMACOES_ANO_NOVO_A, ...ANIMACOES_ANO_NOVO_B.slice(1)] },
};
