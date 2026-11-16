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
| String de firmware (0x2901) | `TR2110R002-15` (descritor 0x2901 da CMD, handle 7, igual ao que a integração HA lê) | 2026-11-15 (sonda) |
| Tipo de protocolo (TYPE1/TYPE2) | **TYPE1** pela regra da §4 (modelo `R002-15`). ⚠️ O plano assumia TYPE2; ver diário. Ainda **não testado** com comando. | 2026-11-15 (sonda) |
| MTU negociado | 515 (macOS/bleak); escrita sem resposta até 512 B | 2026-11-15 (sonda) |
| Características e propriedades | Serviço `fff0` (handle 4): CMD `…9600` h5 [write, write-without-response] + desc 0x2901 h7 · DATA `…960a` h8 [write, wwr] · **`…960b` h10 [write, wwr] (não documentada)** · NOTIFY `…9601` h12 [notify] + CCCD h14 · **`…9602` h15 [read] (não documentada, não lida)**. Serviço `ae00` (h128, OTA, não mexido): `ae01` h129 [wwr], `ae02` h131 [notify]. | 2026-11-15 (sonda) |
| Notificações chegam? Conteúdo | Assinatura de NOTIFY aceita; **0 notificações em 15 s sem enviar nada** (esperado: o app só recebe resposta depois de mandar `VE`). | 2026-11-15 (sonda) |

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
- 2026-11-15: **Fase 1 concluída (só leitura).** `sonda.py` conectou em ~2 s, MTU 515. UUIDs de CMD/DATA/NOTIFY batem com a §1. Firmware `TR2110R002-15` → **TYPE1** pela §4 (o override TYPE2 só vale para `TR2503R004-01`). Isso contraria a hipótese do PROTOCOLO (que documenta DOOD/DOOT num aparelho TYPE2). Decisão pendente com o usuário: na Fase 2 começar pelo liga/desliga **TYPE1** (`LEDON`/`LEDOFF`, §6) ou pelo `TURN` (TYPE2). Duas características extras não documentadas no serviço `fff0`: `…960b` (write) e `…9602` (read) — não tocadas. Nenhum pacote enviado.
- 2026-11-15: **Fase 2, primeiros envios (com autorização do usuário).** Cada comando numa conexão nova, escrita sem resposta na CMD, NOTIFY assinado antes. `VE 00` + `VE 01`: aceitos, **0 notificações em 4 s** (controlador antigo não responde, como a integração HA comenta). `LEDOFF` (TYPE1, `06 4C 45 44 4F 46 46 …`): aceito, 0 notificações, **usuário não viu mudança nenhuma na cortina**. Hipóteses: (a) a cortina fala TYPE2 apesar do modelo `R002-15`, como o lote `TR2503R004-01`; (b) a cortina já estava apagada. Próximo passo seguro: `TURN 00`/`TURN 01` (vetores conferidos da §2), com autorização.
- 2026-11-15: `TURN 00` (TYPE2, `05 54 55 52 4E 00 …`, cifrado `79 D1 DB A4 …`) enviado com a cortina **acesa** (confirmado pelo usuário): aceito, 0 notificações, **nenhuma mudança visível**. Ou seja, nem LEDOFF nem TURN 00 funcionam "a seco". Hipótese: o app faz um preâmbulo na conexão (a captura do `att_protocol.md` mostra, antes do primeiro TURN, escritas como `0270617373` = `02 'pass'` em texto puro e outras) que o controlador exige antes de obedecer. Investigando nas referências antes de mandar qualquer coisa nova.
- 2026-11-15: **Pista principal:** todos os meus envios foram **sem resposta** (ATT Write Command). A captura do app Android no `att_protocol.md` filtra por opcode `0x12` = **Write Request (com resposta)**, e o `idealled_controller.py` usa `peripheral.write_request` (também com resposta). O preâmbulo do app (TIME, VE, CT, `02 'pass'`, `fedcba…`) não é usado pelo script de referência, que funciona só com TURN; então o preâmbulo não deve ser obrigatório. `cortina.py` agora escreve **com resposta** por padrão (`--sem-resposta` para o modo antigo). Os bytes não mudam. Prova de conexão até aqui: descritor 0x2901 lido da própria cortina, MTU 515, e o scan só vê um `IDL-6A9E5C`.
