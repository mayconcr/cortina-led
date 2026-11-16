# Descobertas na cortina real

Registro vivo. O Claude Code atualiza ao fim de cada tarefa que envolve a cortina.
Só entra aqui o que foi **observado** na cortina real, com data. Hipóteses ficam no `PROTOCOLO.md`, marcadas [A CONFIRMAR].

## Ficha da cortina
| Item | Valor | Confirmado em |
|---|---|---|
| Nome Bluetooth | `IDL-6A9E5C` | 2026-11-15 (usuário) |
| Grade | 20 colunas × 20 LEDs (400) | 2026-11-15 (usuário) |
| Alimentação | 5V | 2026-11-15 (etiqueta) |
| Computador de testes / SO | MacBook Pro Apple Silicon, macOS 26.6.2, Bluetooth BCM_4388 (BLE ok), Python 3.12.15 via `uv`, bleak 3.1.0 | 2026-11-15 |
| Endereço / UUID no `bleak` | `77FEA9B0-F771-2C3C-7BD3-EE6297DBF61A` (UUID do macOS, não é o MAC) | 2026-11-15 (scan) |
| String de firmware (0x2901) | | |
| Tipo de protocolo (TYPE1/TYPE2) | | |
| MTU negociado | | |
| Características e propriedades | | |
| Notificações chegam? Conteúdo | | |

## Comandos
| Comando | Funciona? | O que o usuário viu | Data |
|---|---|---|---|
| Ligar / desligar | | | |
| Cor sólida (SGLS) | | | |
| Efeitos (MULT) | | | |
| Pixel único (DOOD) | | | |
| Todos (DOOD posição 400) | | | |
| Quadro em massa (DOOT) | | | |

## Efeitos (nomes dados pelo usuário)
| ID | Nome | Observação |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |
| 6 | | |
| 7 | | |
| 8 | | |
| 9 | | |
| 10 | | |

## Mapeamento da grade
- Índice 0 fica em:
- Sentido (colunas/linhas, zigue-zague?):
- Fórmula `mapear(col, lin)`:

## Desempenho
- Tempo de um quadro completo (pior caso):
- Tempo de um quadro típico:
- Quadros por segundo possíveis:

## Diário
<!-- AAAA-MM-DD: o que foi testado, o que aconteceu, decisões -->
- 2026-11-15: **Fase 0 concluída.** Testes de cripto (7) passam com todos os vetores da §2. `scan.py` achou `IDL-6A9E5C` em ~1 s, RSSI entre −74 e −78 dBm (computador a alguns metros). Nenhum pacote enviado.
- 2026-11-15: Os scripts BLE **não rodam pela ferramenta Bash do Claude Code** no macOS: o processo responsável (`com.anthropic.claude-code`) não declara `NSBluetoothAlwaysUsageDescription` e o TCC mata o Python com SIGABRT. Funciona rodando no **painel Terminal do app Claude** (ou num Terminal comum). Ver "Comandos" no `CLAUDE.md`.
