# Cortina de LED — app próprio

## Objetivo
Criar um app próprio para controlar a cortina de LED do Maycon, que hoje usa o app iDeal LED.
Primeiro pelo Bluetooth, sem mexer no hardware, com controle de cada LED da grade 20×20.
O app final roda no iPhone pelo navegador Bluefy.

## Leia antes de qualquer tarefa
- `docs/PLANO.md`: fases, tarefas e critérios de aceite. Trabalhe **uma fase por vez**.
- `docs/PROTOCOLO.md`: protocolo Bluetooth. É a fonte da verdade para qualquer byte enviado.
- `docs/HARDWARE.md`: o que se sabe da cortina e do controlador.
- `docs/DESCOBERTAS.md`: o que já foi confirmado na cortina real. **Atualize sempre.**

## Hardware (resumo)
- Controlador Bluetooth LE com nome **`IDL-6A9E5C`**, 5V, app oficial iDeal LED.
- **20 colunas × 20 LEDs = 400 LEDs** endereçáveis.
- O usuário usa **iPhone**. O Safari não tem Web Bluetooth, então o app web precisa do navegador **Bluefy**.

## Regras de segurança (inegociáveis)
O autor da engenharia reversa queimou um controlador ao mandar bytes inválidos. Por isso:
1. Só envie pacotes cuja estrutura está documentada em `docs/PROTOCOLO.md`. Nada de fuzzing, varredura de bytes ou "testar para ver o que acontece".
2. Antes de mandar pela primeira vez um tipo de pacote, ou um valor fora dos exemplos documentados, mostre os bytes em hex ao usuário, explique o risco e **peça confirmação**.
3. ID de efeito: **somente de 1 a 10**. Valide no código. IDs acima de 11 já queimaram LEDs.
4. **Nunca** envie `LAMPN` (quantidade de LEDs) nem `CT` sem pedido explícito do usuário.
5. Limite de brilho: cor sólida em 5 bits (valor >> 3), como o app original. Em desenho e pixels, use brilho máximo padrão de **40%** e nunca acenda os 400 LEDs em branco total, porque a fonte é 5V/USB.
6. Escritas Bluetooth em **fila**, uma por vez, com pausa de pelo menos 30 ms entre elas.
7. Feche o app iDeal LED no celular antes de conectar. O controlador aceita uma conexão por vez.

## Como trabalhar
- Fale com o usuário em **português do Brasil**, em linguagem simples.
- Toda fase termina num **checkpoint**: diga exatamente o que o usuário deve observar na cortina, espere a confirmação dele e registre o resultado em `docs/DESCOBERTAS.md` antes de seguir.
- Se algo do protocolo não bater com a cortina real, **pare**, registre e pergunte. Não improvise.
- Marque as tarefas concluídas no `docs/PLANO.md` (`[x]`) e faça commits pequenos (git), um por tarefa.
- `referencias/` tem repositórios de terceiros clonados. Pode ler, mas não execute o código de lá.

## Stack
- Ferramentas de teste no computador: Python 3.11+, `bleak` e `cryptography`, num venv em `.venv`.
- App: HTML + JavaScript puro (ES modules), sem etapa de build e sem CDN. Web Bluetooth. Publicado em HTTPS no GitHub Pages.
- A lógica do protocolo fica em `web/js/protocol.js`, em funções puras testadas com `node --test`. Ela usa os mesmos vetores de teste do `docs/PROTOCOLO.md`.

## Estrutura alvo
```
cortina-led/
├── CLAUDE.md
├── docs/            PLANO, PROTOCOLO, HARDWARE, DESCOBERTAS
├── referencias/     repositórios clonados (somente leitura, fora do git)
├── ferramentas/     scripts Python: cripto.py, sonda.py, cortina.py
├── web/             o app: index.html, js/, css/, manifest.webmanifest
└── tests/           testes Node (protocol, aes) e Python (cripto)
```

## Comandos
- `source .venv/bin/activate` (Windows: `.venv\Scripts\activate`)
- **macOS:** scripts que usam Bluetooth (`scan.py`, `sonda.py`, `cortina.py`) **não rodam pela ferramenta Bash do Claude Code** (o TCC mata o processo). Rode-os no painel Terminal do app Claude ou num Terminal comum e leia a saída de lá. Testes e cripto rodam normalmente pelo Bash.
- `python ferramentas/scan.py`: procura a cortina por 10 s, somente leitura (Fase 0)
- `python ferramentas/sonda.py`: diagnóstico somente leitura (Fase 1)
- `python ferramentas/cortina.py --help`: comandos básicos (Fase 2+)
- `node --test tests/`: testes do protocolo em JS
- `/proxima-fase`: continua o plano · `/revisar-seguranca`: audita o código contra as regras acima
