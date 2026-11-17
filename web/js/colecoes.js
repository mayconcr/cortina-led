// Coleções de animações (cenas que rolam com MODE 03), separadas por tema.
import { ANIMACOES_NATAL } from "./natal.js";

export const COLECOES_ANIMACOES = {
  natal: { nome: "Natal", itens: [...ANIMACOES_NATAL] },
  "ano-novo": { nome: "Ano Novo", itens: [] },
};
