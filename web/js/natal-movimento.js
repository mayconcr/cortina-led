// As 40 animações de Natal COM MOVIMENTO (quadro a quadro), no estilo do trenó guardado na cortina
// (`ANIM 0E`): as coisas atravessam a tela, pulam, caem, balançam e giram; personagens com poses.
//
// Na cortina, só os LEDs que mudam de um quadro para o outro vão pelo Bluetooth (~19 ms cada, ver
// animacao.js), então cada animação foi desenhada para trocar poucos LEDs por quadro
// (média até ~12, nunca mais de 20) e ter um 1º quadro enxuto. As ferramentas estão em movimento.js.
// Testes: tests/animacao.test.mjs

import { ANIMACOES_1 } from "./natal-mov-1.js";
import { ANIMACOES_2 } from "./natal-mov-2.js";
import { ANIMACOES_3 } from "./natal-mov-3.js";
import { ANIMACOES_4 } from "./natal-mov-4.js";

export const ANIMACOES_MOVIMENTO = [...ANIMACOES_1, ...ANIMACOES_2, ...ANIMACOES_3, ...ANIMACOES_4];
