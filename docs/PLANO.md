# Plano: app próprio da cortina de LED

**Resultado final:** um app web que abre no iPhone (Bluefy) e controla a cortina `IDL-6A9E5C`. Ele liga e desliga, muda cor e brilho, roda efeitos e permite desenhar na grade 20×20, escrever texto e mandar imagens. Desenhos ficam salvos.

**Estratégia:** primeiro provar cada comando na cortina real com scripts Python no computador. O Claude Code roda esses scripts sozinho e lê as respostas. Só depois disso o app é montado. Cada fase termina num checkpoint com o usuário.

Legenda: `[ ]` pendente · `[x]` concluída · 🛑 checkpoint (pare e espere o usuário)

---

## Fase 0: Preparação (não toca na cortina)
- [x] 0.1 `git init`, criar a estrutura de pastas do `CLAUDE.md` e um `.gitignore` (`.venv/`, `__pycache__/`, `referencias/`).
- [x] 0.2 Clonar as referências em `referencias/`: `8none1/idealLED` e `koying/ha_ideal_led_ble`. Só para leitura.
- [x] 0.3 Criar o `.venv` e instalar `ferramentas/requirements.txt` (`bleak`, `cryptography`).
- [x] 0.4 `ferramentas/cripto.py` com `encrypt(bytes16)`/`decrypt(bytes16)` e o teste `tests/test_cripto.py` com **todos** os vetores do `PROTOCOLO.md` §2.
- [x] 0.5 `ferramentas/scan.py`: procura dispositivos `IDL-`/`ISP-` por 10 s e mostra nome, endereço e RSSI.
  - No macOS, o terminal pede permissão de Bluetooth na primeira vez, e o `bleak` mostra um UUID no lugar do MAC.
  - Se o computador não tiver Bluetooth LE, avise o usuário. A alternativa é pular para a Fase 4 e testar no Chrome desktop ou no Bluefy.

**Aceite:** os testes de cripto passam e o scan encontra `IDL-6A9E5C`.
🛑 Mostre o resultado do scan ao usuário.

## Fase 1: Sonda somente leitura (nenhuma escrita)
- [x] 1.1 `ferramentas/sonda.py`: conecta e lista serviços e características, com propriedades (write, write-without-response, notify) e MTU.
- [x] 1.2 Ler os descritores `0x2901` de todas as características e mostrar a string de firmware.
- [x] 1.3 Assinar NOTIFY, decifrar e logar o que chegar por 15 s (em hex e ASCII).
- [x] 1.4 Determinar TYPE1/TYPE2 pela regra do `PROTOCOLO.md` §4.
- [x] 1.5 Registrar tudo em `DESCOBERTAS.md`.

**Aceite:** UUIDs conferem com o `PROTOCOLO.md` §1, firmware lido (ou falha registrada), tipo definido.
🛑 Explique ao usuário o que foi encontrado, ainda sem enviar comando.

## Fase 2: Comandos básicos (CLI)
- [x] 2.1 `ferramentas/cortina.py`, com subcomandos `ligar`, `desligar`, `cor R G B [--brilho %]`, `efeito N [--velocidade V]` e `versao`. Usa fila de escrita e assina notificações antes de escrever.
- [x] 2.2 Validações no código: efeito só de 1 a 10, cor em 5 bits, brilho limitado. Testes unitários dos pacotes gerados contra os exemplos do `PROTOCOLO.md`.
- [x] 2.3 Roteiro com o usuário, **um comando por vez**, perguntando o que ele viu: desligar → ligar → vermelho → verde → azul → branco a 30% → efeitos 1 a 10, anotando o nome que o usuário der a cada um.
- [x] 2.4 Se TYPE2 não funcionar: mostrar os bytes TYPE1 (§6), pedir permissão e testar só liga/desliga.

**Aceite:** liga, desliga, cor e efeitos funcionando e anotados em `DESCOBERTAS.md`, com a lista de efeitos e nomes.
🛑

## Fase 3: Pixels e mapeamento da grade 20×20
> ⚠️ **Revisar antes de começar (2026-11-16):** esta cortina não tem DOOD/DOOT. O desenho usa `SMVEW 01` → um pacote AES por pixel `05 X Y R G B` na característica `…960B` → `SMVEW 02` → `MODE 03` (ver `PROTOCOLO.md` §5bis). As tarefas abaixo valem com essa troca: 3.1/3.2 viram "acender (X,Y) = (1,1), (20,1), (1,20), (20,20)" para achar a origem e o sentido dos eixos; 3.4 vira "descobrir como apagar o desenho"; 3.5/3.6 viram "quadro completo = até 400 pacotes; medir o tempo".
- [x] 3.1 `cortina.py pixel IDX R G B` (DOOD, um pixel). Primeiro teste com o exemplo documentado (índice 0). Pergunte onde o LED acendeu.
- [x] 3.2 Acender os índices 1, 19, 20, 21, 39, 399, um por vez, perguntando a posição a cada um. Os índices acima de 255 usam posição de 16 bits: confirme os bytes com o usuário antes.
- [x] 3.3 Deduzir o mapeamento índice → (coluna, linha): sentido, zigue-zague e canto de origem. Implementar `mapear(col, lin) → índice` e um teste visual (acender a borda da grade).
- [x] 3.4 "Apagar tudo": primeiro via DOOT em preto, que é seguro. Depois, com confirmação, testar DOOD "todos" com a posição `01 90`. Se nada funcionar, considerar o `DEN` (§5.4), também com confirmação.
- [x] 3.5 `cortina.py quadro arquivo.json` (DOOT com run-length): desenhar xadrez, smile e um degradê.
- [x] 3.6 Medir o tempo de um quadro completo (pior caso e caso típico) e calcular quantos quadros por segundo dá para atualizar. Isso decide se animação é viável.

**Aceite:** mapeamento confirmado visualmente, quadro completo desenhado, tempo medido e registrado.
🛑

## Fase 4: App web para iPhone (Bluefy)
> ⚠️ **Ajustes pelo protocolo real (2026-11-16):** `protocol.js` deve espelhar `ferramentas/protocolo.py` §5bis (VER, TIME, LEDS, LEDON/LEDOFF, COLO, EFF+LIGHT+SPEED, IMAG, MODE, SMVEW, pixel) e ganhar um `jlauth.js` (E1/SAFER+, espelho de `ferramentas/jl_auth.py`, com os vetores da captura). `ble.js` precisa de `optionalServices: [0xfff0, 0xae00]` e fazer preâmbulo + handshake a cada conexão. Paleta de efeitos e DOOT/DOOD não existem; "enviar desenho" leva até ~13 s (mostrar progresso). Animação quadro a quadro está fora; texto/imagem viram desenho parado ou rolagem nativa (`MODE 03`).
- [ ] 4.1 `web/js/aes.js`: AES-128 em JS puro (cifrar e decifrar), com teste `node --test` usando os vetores do §2.
- [ ] 4.2 `web/js/protocol.js`: funções puras equivalentes às do Python (turn, sgls, mult + paleta, dood, doot com run-length), com testes que comparam os bytes com os gerados pelo Python.
- [ ] 4.3 `web/js/ble.js`: `requestDevice({filters:[{namePrefix:'IDL-'},{namePrefix:'ISP-'}], optionalServices:[0xfff0]})`, fila de escrita, notificações, reconexão e aviso amigável se o navegador não tiver Web Bluetooth ("abra no Bluefy").
- [ ] 4.4 `web/js/grade.js`: usa o mapeamento da Fase 3 e o limite de brilho do `CLAUDE.md`.
- [ ] 4.5 Interface mobile-first em PT-BR, com abas:
  - **Início:** conectar, liga/desliga, cor + brilho, cores favoritas.
  - **Efeitos:** lista 1–10 com os nomes anotados na Fase 2, velocidade, paleta de até 7 cores.
  - **Desenhar:** grade 20×20 com toque e arraste, pincel, borracha, balde, conta-gotas, limpar e enviar.
  - **Galeria:** salvar e carregar desenhos (localStorage, com try/catch).
  - **Texto:** fonte bitmap 5×7 → grade, com cor e alinhamento.
  - **Imagem:** foto → recorte quadrado → 20×20, com ajuste de brilho.
- [ ] 4.6 PWA (`manifest.webmanifest` + ícone) para "Adicionar à Tela de Início".
- [ ] 4.7 Testar localmente no Chrome desktop, que tem Web Bluetooth, se o computador tiver BLE.
- [ ] 4.8 Publicar no **GitHub Pages**: o Web Bluetooth exige HTTPS. Use `gh` se estiver disponível; senão, guie o usuário passo a passo.
- [ ] 4.9 Checklist no iPhone com o usuário: abrir no Bluefy → conectar → cada aba.

**Aceite:** o usuário controla tudo pelo iPhone sem o app iDeal LED.
🛑

## Fase 5: Extras (escolher com o usuário)
- [ ] 5.1 Animações (sequência de quadros), se a taxa medida na 3.6 permitir. Incluir playlist e loop.
- [ ] 5.2 Texto rolando, se a taxa permitir.
- [ ] 5.3 Descobrir comandos nativos de cortina do app oficial por captura de tráfego (ver `PROTOCOLO.md` §7). Documentar antes de usar.
- [ ] 5.4 Atalhos: link direto para um desenho ou efeito, para usar com o app Atalhos do iPhone.

## Fase 6 (futuro, opcional): ESP32 + WLED
Ver `HARDWARE.md`. Precisa abrir a caixinha de controle. Vale a pena se o usuário quiser animações fluidas, música ou automação 24h.
Nesse caso, a interface das Fases 4–5 passa a falar com o WLED (API JSON ou DDP).

---

## Riscos e como lidamos
| Risco | Mitigação |
|---|---|
| Queimar o controlador com bytes errados | Só pacotes documentados, confirmação do usuário, validações no código |
| Sobrecarga elétrica | Limite de brilho e bloqueio de branco total |
| Esta cortina usar outra variante do protocolo | Fase 1 só lê, Fase 2 começa com liga/desliga, registro em `DESCOBERTAS.md` |
| Bluetooth lento para animação | Medir na Fase 3. Se não der, partir para a Fase 6 |
| Safari sem Web Bluetooth | Bluefy (iOS). O app avisa quando o navegador não suporta |
