---
description: Audita o código contra as regras de segurança da cortina antes de testar
---
Revise `ferramentas/` e `web/js/` contra as regras de segurança do `CLAUDE.md` e o `docs/PROTOCOLO.md`. Verifique:

- Todo pacote enviado é gerado por uma função que corresponde a um comando documentado. Não pode haver bytes "mágicos" soltos.
- ID de efeito validado entre 1 e 10, com erro (não ajuste silencioso) se vier fora disso.
- `LAMPN`, `CT` e `TIME` não aparecem em nenhum caminho de código acionável pelo usuário.
- Cor sólida em 5 bits. O limite de brilho (padrão 40%) é aplicado em DOOD e DOOT, e branco total em todos os LEDs é bloqueado.
- Escritas Bluetooth passam por uma fila única, com pausa de pelo menos 30 ms.
- Só a característica CMD recebe dados criptografados. DATA recebe texto puro.
- Os testes cobrem os vetores do `PROTOCOLO.md` §2 e os exemplos de bytes do §5.

Liste os problemas por gravidade, com arquivo e linha, e proponha as correções. Não corrija nada sem eu aprovar.

$ARGUMENTS
