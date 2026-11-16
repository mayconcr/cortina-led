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
| Notificações chegam? Conteúdo | **Sim.** `03 'VER'` → NOTIFY `05 'VER' 08 01` (versão 8.1), cifrada com a chave AES conhecida, em ~60 ms. `VE 00/01` (TYPE2) não recebem resposta. | 2026-11-16 (roteiro) |

## Comandos
| Comando | Funciona? | O que o usuário viu | Data |
|---|---|---|---|
| Ligar / desligar | **Desligar: sim** (`06 'LEDOFF'`, após VER + TIME + LEDS 00 ×2 + handshake JieLi). **Ligar: sim** (`05 'LEDON'`, mesmo preâmbulo) | Cortina acesa (árvore de Natal) **apagou** com LEDOFF; apagada, **acendeu** com LEDON | 2026-11-16 |
| Cor sólida (`07 'COLO' G R B`, 8 bits; SGLS não existe aqui) | **Sim** | Vermelho, verde e azul a 30% (`00 4C 00`, `4C 00 00`, `00 00 4C`): cortina inteira na cor certa; ordem dos canais G R B confirmada. Duas cores na mesma conexão com 5 s de pausa funcionam | 2026-11-16 |
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
- 2026-11-16: `TURN 00` reenviado 2× **com resposta**: a cortina devolve **ACK** (90 ms e 59 ms), 0 notificações, e **continua sem mudança visível** (acesa). Conclusão: os bytes chegam e são aceitos no GATT, mas o controlador não os interpreta. A integração `koying/ha_ideal_led_ble` manda exatamente os mesmos TURN cifrados, com resposta, para `…9600` em aparelhos `ISP-` — nada de novo lá. Hipóteses abertas: (1) este firmware exige um preâmbulo (a captura do app mostra TIME, VE, CT e um `02 'pass'` antes do primeiro TURN); (2) chave AES diferente neste lote; (3) comandos de cortina diferentes. Próximo passo: analisar as capturas btsnoop das referências para ver handle e direção de cada pacote do preâmbulo.
- 2026-11-16: **Capturas btsnoop analisadas** (parser próprio, só leitura). O aparelho de referência é `TR2211R005-01`, layout GATT idêntico ao nosso. O app escreve na CMD **sem resposta**, e o controlador responde por NOTIFY a **cada** comando: `VE 00`→`V02211.5.1`, `VE 01`→`V122.3.137.8`, `CT`→`CONNECTOK`, `TURN`→`TURNOK` (ver PROTOCOLO §7). A nossa cortina **nunca respondeu nada**, nem ao `VE`, que no aparelho de referência responde na hora. Conclusão: a cortina recebe os bytes mas **não os interpreta** — provável chave AES diferente ou dialeto de firmware diferente neste lote (`TR2110R002-15`, cortina `IDL-`). Mandar mais comandos documentados não vai ajudar. Caminho: (a) ler a característica `…9602` (read, segura, nunca lida) em busca de pistas; (b) capturar o tráfego do app iDeal LED do iPhone com esta cortina (PacketLogger no Mac + perfil de log Bluetooth da Apple), que é a fonte definitiva (PROTOCOLO §7, PLANO 5.3).
- 2026-11-16: Característica `…9602` lida (`sonda.py --ler-extra`): 14 bytes em **texto puro**, `TR2110R002-15\0` — a mesma string do descritor 0x2901, nada de chave ou estado. Não ajuda a decidir. Decisão: partir para a captura do tráfego do app iDeal LED no iPhone (PacketLogger).
- 2026-11-16: Com o app do iPhone conectado, o scan do Mac **não acha** a cortina (ela para de anunciar): confirma **uma conexão por vez**, e que os envios anteriores foram com ela livre. `TURN 00` reenviado 3× sem resposta com o usuário olhando: a cortina **pisca** a cada tentativa. Teste de controle: a sonda conectou ~8 s **sem escrever nada** e a cortina **piscou igual**. Conclusão: o piscar é reação à conexão/desconexão, não ao comando. `TURN 00` e `LEDOFF` continuam sem efeito. Estado da cortina durante esses testes (usuário): rodando um **efeito nativo de "árvore de Natal" que se move para o lado**, escolhido no app — ou seja, um modo de animação/imagem exclusivo de cortina, que não está no PROTOCOLO. Esgotados os comandos documentados e seguros; o que resta é captura do app (iPhone), análise do APK Android, ou o preâmbulo `TIME`/`CT` (proibido sem pedido explícito).
- 2026-11-16: **APK oficial analisado** (baixado com autorização do site do fabricante, `iDeal202511031958.apk`, 159 MB, SHA-256 `9763be46…14c11`, descompilado com jadx 1.5.6 numa pasta isolada, nada executado). O app é `com.winkison.ledlight`, **empacotado com 360 Jiagu**: o `classes.dex` só tem o stub; o código Java real fica cifrado e só abre em tempo de execução num Android — não dá para ler os comandos de cortina estaticamente. Mas as bibliotecas nativas são legíveis: `libAES.so` tem a chave conhecida como padrão e aceita chave variável; **`libtiro-aes-lib.so` tem uma segunda chave (chave B, ver PROTOCOLO §2)**; `libjl_ota_auth.so` identifica o handshake do serviço `0xAE00` como autenticação OTA da JieLi. Correção: a segunda biblioteca não é AES com outra chave, é a **cifra "tiro"** (ver PROTOCOLO §2).
- 2026-11-16: **Cifra tiro testada** (com autorização): `VE 00`, `VE 01` e `TURN 00` cifrados com tiro, escrita sem resposta, 4 s de escuta cada. **0 notificações; a cortina só piscou (reação à conexão)**. A cifra tiro também não é a desta cortina, ou os comandos TURN/VE não existem neste firmware. Estado: AES conhecido ✗, tiro ✗, TYPE1 ✗, TYPE2 ✗, com e sem resposta ✗.
- 2026-11-16: O APK traz em `assets/ota/` **14 firmwares** (`.ufw`, formato JieLi), entre eles `TR2110R002-10` a `-13` — a mesma família da nossa cortina (`TR2110R002-15`). Confirma que o chip é **JieLi**, não ST17H66 como suposto no HARDWARE.md. Os `.ufw` são cifrados (só o cabeçalho `TR2110R002`, `2_3_0_0`, `PB01_08_0`, `UPDATE_JUMP` é legível): nem a chave AES nem a tabela tiro aparecem dentro, e não dá para ler o parser de comandos sem as ferramentas da JieLi. **Nunca** usar esses arquivos para atualizar a cortina.
- 2026-11-16: **CAPTURA DO APP NO IPHONE LIDA** (`capturas/iphone-2026-11-16.pklg`, fora do git). A cortina tem MAC `50:A8:06:6A:9E:5C`. **A chave AES conhecida está correta** (todos os comandos decifram). O app manda `VER`, `TIME`, `LEDS 00`, faz o handshake JieLi e só então `LEDOFF`/`LEDON 05`/`COLO` 8 bits/`EFF`+`LIGHT`+`SPEED`/`IMAG`+`MODE`/`SMVEW`+pixels na `…960B`. Protocolo real documentado na §5bis do PROTOCOLO.md. O que explica nossos fracassos: faltava o preâmbulo (e talvez o handshake JieLi), e o `LEDON` da §6 tem N errado para esta cortina. Próximo: testar `VER` + `LEDS 00` + `LEDOFF`, depois `TIME`, depois (se precisar) reconstruir o handshake JieLi de `libjl_ota_auth.so` (`function_E21`, classe `RcspAuth`).
- 2026-11-16 (madrugada): **`VER` funciona**: NOTIFY `05 'VER' 08 01` em 59 ms — primeira resposta da cortina, prova de chave e canal. Sequência `VER` + `LEDS 00` + `LEDOFF` com a cortina **apagada**: ela **ligou** e voltou à animação da árvore (algo aí liga: conexão, VER ou LEDS; não o LEDOFF). Depois, com ela acesa: `LEDOFF` sozinho → nada; `LEDS 00` + `LEDOFF` → nada. Restam `TIME` e o handshake JieLi como candidatos a "destravar" os comandos de luz.
- 2026-11-16: `VER` + `TIME` (autorizado) + `LEDS 00` ×2 + `LEDOFF`, tudo com ACK: **piscou e continua acesa**. Logo, o que destrava os comandos de luz é o **handshake JieLi (RCSP auth)** no serviço `0xAE00`. Vetores da captura para validar uma reimplementação: desafio do app `67c6697351ff4aec29cdbaabf2fbe346` → resposta da cortina `023a02126fa284879236e9da27ba0b8d`; desafio da cortina `3054108cae6bc3395cd78673b8ae0de7` → resposta do app `0bb49938575b4301cccd05340f09d073`.
- 2026-11-16: **Handshake JieLi reconstruído** do assembly de `libjl_ota_auth.so`: é a função **E1 do Bluetooth clássico (SAFER+)** com chave e endereço fixos (PROTOCOLO §5ter). `ferramentas/jl_auth.py` reproduz **os dois** pares desafio/resposta da captura (testes passando). `cortina.py --auth` faz o handshake (3 escritas no `0xAE01`) antes da fila. Ainda **não enviado** à cortina: aguarda autorização do usuário, porque o `0xAE00` estava marcado como "não mexer".
- 2026-11-16: **Handshake JieLi confirmado na cortina real** (autorizado): ela respondeu corretamente ao meu desafio, aceitou minha resposta E1 e devolveu `02 'pass'`. Mas `LEDOFF` logo depois (só auth + LEDOFF, sem VER/TIME/LEDS na mesma conexão): **continua acesa**. Diferenças que restam em relação ao app: (a) ordem — o app faz VER, TIME, LEDS e só depois o auth; (b) o `TIME` do app tem cauda fixa `A5 5A A5 00 03 02 06` depois da hora (a mesma marca `A5 5A A5` aparece nas capturas Android), que eu mandei zerada; (c) eu desligava a notificação do `0xAE02` logo após o auth, o app deixa ligada; (d) o app manda 3 comandos RCSP (`FE DC BA C0 06/03/07 …`); (e) o app só manda o LEDOFF vários segundos depois de conectar.
- 2026-11-16 01:17: 🎉 **PRIMEIRO COMANDO OBEDECIDO.** Sequência na ordem do app, numa conexão: `VER` → `TIME` com cauda `A5 5A A5 00 03 02 06` → `LEDS 00` ×2 → handshake JieLi (AE02 notificando até o fim) → pausa 2 s → `LEDOFF`: **a cortina apagou** (confirmado pelo usuário). Comando: `cortina.py --com-resposta --espera 6 roteiro ver hora leds leds auth pausa:2 ledoff`. Os comandos RCSP `FE DC BA C0 …` **não** são necessários. Pendente: descobrir o conjunto mínimo (qual de ordem / cauda do TIME / AE02 ligado / pausa fez a diferença em relação à tentativa anterior "auth + LEDOFF").
