# Cortina de LED: kit para o Claude Code

Este kit tem tudo o que o Claude Code precisa para criar o seu app de controle da cortina `IDL-6A9E5C`: o contexto, o protocolo Bluetooth já pesquisado, o plano por fases e as regras de segurança.

## Como usar
1. Descompacte esta pasta onde quiser, por exemplo em `Documentos/cortina-led`.
2. Instale o Claude Code, se ainda não tiver (guia: https://code.claude.com/docs/en/quickstart):
   - macOS: `curl -fsSL https://claude.ai/install.sh | bash`
   - Windows (PowerShell): `irm https://claude.ai/install.ps1 | iex`

   Use o Claude Code **no computador que fica perto da cortina**, pelo terminal ou pelo app desktop. A versão web (claude.ai/code) roda na nuvem e não alcança o Bluetooth da sua casa.
3. No terminal, entre na pasta e abra o Claude Code:
   ```
   cd ~/Documentos/cortina-led
   claude
   ```
4. Cole o prompt da seção 1 de `PROMPT_INICIAL.md`.
5. Nas próximas sessões, digite `/proxima-fase`.

## Antes de cada sessão de testes
- Deixe a cortina ligada e o computador perto dela (até uns 5 m).
- **Feche o app iDeal LED** no iPhone, deslizando para cima. A cortina aceita só uma conexão por vez.
- Fique de olho na cortina: o Claude Code vai perguntar o que você viu.

## O que tem aqui
| Arquivo | Para quê |
|---|---|
| `CLAUDE.md` | Contexto e regras que o Claude Code lê automaticamente em toda sessão |
| `PROMPT_INICIAL.md` | Prompts prontos para colar |
| `docs/PLANO.md` | Fases 0–6 com tarefas, critérios de aceite e checkpoints |
| `docs/PROTOCOLO.md` | Protocolo Bluetooth do iDeal LED (UUIDs, criptografia, bytes de cada comando) |
| `docs/HARDWARE.md` | O que se sabe da cortina e o caminho futuro com ESP32 + WLED |
| `docs/DESCOBERTAS.md` | Diário do que foi confirmado na sua cortina, preenchido ao longo do projeto |
| `.claude/commands/` | Comandos `/proxima-fase` e `/revisar-seguranca` |

## Fases
0. Preparação · 1. Leitura do controlador · 2. Liga/desliga, cor e efeitos · 3. Pixels e mapa da grade 20×20 · 4. App no iPhone (Bluefy) · 5. Extras (animação, texto rolando) · 6. Opcional: ESP32 + WLED
