# Protocolo Bluetooth do iDeal LED

Consolidado a partir da engenharia reversa pública (ver **Fontes**). Os vetores de criptografia da §2 foram conferidos.
Os itens marcados **[A CONFIRMAR]** ainda não foram testados nesta cortina (20×20). Valide e registre em `DESCOBERTAS.md`.

> Regra de ouro: só envie o que está aqui. Na dúvida, pergunte ao usuário (ver `CLAUDE.md`).

---

## 1. GATT

| Item | Valor |
|---|---|
| Nome anunciado | prefixo `IDL-` ou `ISP-` (esta cortina: `IDL-6A9E5C`) |
| Serviço | `0000fff0-0000-1000-8000-00805f9b34fb` (Web Bluetooth: `0xfff0`) |
| **CMD**, escrita, **criptografado** | `d44bc439-abfd-45a2-b575-925416129600` |
| **DATA**, escrita, **texto puro** | `d44bc439-abfd-45a2-b575-92541612960a` |
| **NOTIFY**, notificações criptografadas | `d44bc439-abfd-45a2-b575-925416129601` |
| Descritor de firmware | `0x2901` (User Description), lido pela integração do Home Assistant no handle 7 |
| Não mexer | `0xae00` (provavelmente OTA, atualização de firmware) |

- Assine as notificações em **NOTIFY** logo após conectar. Alguns controladores só aceitam comandos depois disso.
- Use escrita *sem resposta* quando a característica permitir. Senão, use escrita com resposta.
- Pacotes **DATA** podem ter até 100 bytes. A escrita sem resposta precisa de MTU ≥ 103; abaixo disso, use escrita com resposta (long write). O iOS costuma negociar MTU ~185.

## 2. Criptografia

- **AES-128 ECB**, sem IV e sem padding. Todo pacote de comando tem exatamente 16 bytes.
- Chave (pública, extraída do app Android):
  `34 52 2A 5B 7A 6E 49 2C 08 09 0A 9D 8D 2A 23 F8`
- Só o que vai para **CMD** é criptografado. O que vai para **DATA** segue em texto puro. Notificações chegam criptografadas e são decifradas com a mesma chave.
- No navegador, o WebCrypto não tem ECB. Para 1 bloco, AES-CBC com IV zero dá o mesmo resultado (use os primeiros 16 bytes), mas isso não serve para decifrar. Prefira um AES-128 em JS puro em `web/js/aes.js`, com cifrar e decifrar, testado com os vetores abaixo.

### Segunda chave encontrada no APK oficial (2026-11-16) **[A CONFIRMAR]**
O APK oficial `iDeal202511031958.apk` (site idealled.com.cn, pacote `com.winkison.ledlight`, protegido com 360 Jiagu — o Java não é legível estaticamente) traz **duas** bibliotecas AES nativas:
- `libAES.so` (`csh.tiro.cc.aes`): chave padrão em `.data` = a chave acima (`34 52 2A …`), e uma função `keyExpansion` que aceita chave arbitrária vinda do Java.
- `libtiro-aes-lib.so` (`com.winkison.ledlight.rgb.RGBMutuallyContract.cipher/invCipher`): apesar do nome, **não é AES**. O assembly (330 instruções, lido por completo) é um encadeamento byte a byte com uma tabela `T` de 16 bytes:
  `T = 38 2C 5D AA BC 71 C6 A4 FD 54 67 32 E6 53 82 5E`
  `out[0] = (in[0] ^ 0x15) − 0x6D` · `K = out[0] + (T[0] ^ 0xC7)` · `out[i] = (K + in[i] − in[i−1]) ^ T[i]` para i = 1..15 (tudo mod 256). Inverso em `ferramentas/cripto.py` (`tiro_cipher`/`tiro_inv_cipher`, com testes de ida e volta).
  Hipótese: alguma família de produtos usa esta "cifra tiro" no lugar do AES. Vetores (gerados pelo código, a conferir na cortina): `TURN 00` → `A3 DD FE 35 22 25 64 06 5F F6 C5 90 44 F1 20 FC` · `VE 00` → `A9 D7 CA C9 14 D9 6E 0C 55 FC CF 9A 4E FB 2A F6` (ver `cortina.py --cifra tiro --so-mostrar`).
- `libjl_ota_auth.so`: autenticação OTA da **JieLi** (杰理). Explica o diálogo no serviço `0xAE00` (`00`+16 B, `01`+16 B, `02 'pass'`) das capturas: é o handshake padrão JieLi, não parte do protocolo de luz.

### Vetores de teste (conferidos)

| Comando (texto puro) | Criptografado |
|---|---|
| `05 54 55 52 4E 01 00 00 00 00 00 00 00 00 00 00` (TURN liga) | `84dd5042374150897ac82f39110968a8` |
| `05 54 55 52 4E 00 00 00 00 00 00 00 00 00 00 00` (TURN desliga) | `79d1dba40919c246a8580ae7d11b7884` |
| `06 4C 45 44 4F 4E 00 00 00 00 00 00 00 00 00 00` (LEDON) | `8ebc70eb0de699d5eb16383e026d2ac6` |
| `06 4C 45 44 4F 46 46 00 00 00 00 00 00 00 00 00` (LEDOFF) | `cbb1fdbfc560d5e453c2cbd928b53fab` |
| `0F 53 47 4C 53 00 00 64 50 1F 00 00 1F 00 00 32` (SGLS vermelho) | `2dec317e7181ccb079fc665ae43fa9dd` |

## 3. Formato geral dos comandos

`[N] [TAG ASCII] [parâmetros] [zeros até 16 bytes]`. Aqui `N` é a quantidade de bytes úteis depois dele (tag + parâmetros).
Exemplo: `05 "TURN" 01` → N = 4 letras + 1 parâmetro = 5.

**Marcadores:** nos formatos abaixo, os campos variáveis usam letras que **não** são hexadecimal válido (`NN`, `Rx`, `SP`, `FL`…). Tudo o que for hex de verdade (`00`–`FF`) é fixo. Nunca interprete um marcador como byte.

## 4. Tipo de controlador: TYPE1 × TYPE2

Existem dois conjuntos de comandos. Para descobrir o tipo:
1. Leia o descritor `0x2901`. Ele traz uma string de firmware, por exemplo `TR2503R004-01`.
2. **Override:** se a string começar com `TR2503R004-01`, o tipo é **TYPE2**.
3. Senão, o modelo é o trecho a partir do **segundo** `R` (ex.: `R004-01`).
   - **TYPE1:** `R002-15`, `R003-01`, `R004-01`, `R005-03`
   - **TYPE2:** `R011-04`, `R012-01`
4. Modelo desconhecido ou leitura falhou: use **TYPE2** (o padrão da integração do Home Assistant).

Os comandos de pixel (DOOD/DOOT) foram documentados num aparelho TYPE2. **[A CONFIRMAR]** se a cortina é TYPE2.

## 5. Comandos TYPE2

Todos vão para **CMD**, criptografados, salvo indicação contrária.

### 5.1 Liga/desliga: `TURN`
`05 54 55 52 4E SS 00 00 00 00 00 00 00 00 00 00`, onde `SS` = `01` liga, `00` desliga.

### 5.2 Cor sólida: `SGLS`
`0F 53 47 4C 53 MI DR 64 SP Rx Gx Bx Ry Gy By SA`

| Byte | Campo | Valor recomendado |
|---|---|---|
| 5 | modo (`modelIndex`) | `00` = cor sólida |
| 6 | direção (`1 ^ z` no app) | `00` |
| 7 | fixo | `64` |
| 8 | velocidade | `50` (80) |
| 9–11 | `Rx Gx Bx`: R, G, B em **5 bits** (0–31) = valor8bits >> 3 | |
| 12–14 | `Ry Gy By`: segunda cor; o app manda, use igual a `Rx Gx Bx` | |
| 15 | "saturação" | `32` (50) |

Não existe comando de brilho. O brilho é aplicado escalando o RGB **antes** do `>> 3`.
Exemplo de vermelho: `0F 53 47 4C 53 00 00 64 50 1F 00 00 1F 00 00 32`.

### 5.3 Efeitos: `MULT` + paleta
1. CMD: `0A 4D 55 4C 54 NN RV 64 SP NC BR 00 00 00 00 00`
   - `NN` = efeito **1–10, nunca acima** · `RV` = reverso 0/1 · `SP` = velocidade 1–100 · `NC` = `07` · `BR` = brilho em % (0–100)
2. **DATA (texto puro):** paleta `[3×n] 00 R G B R G B …`, com n ≤ 7 cores em 8 bits.
   Exemplo, arco-íris de 7 cores: `15 00 FF 00 00 FF D8 00 …` (21 bytes de cor depois de `15 00`).

### 5.4 Pixel único ou todos: `DOOD` (modo grafite/DIY)
`0D 44 4F 4F 44 FL PH PL MO SP Rx Gx Bx BR 00 00`

| Byte | Campo |
|---|---|
| 5 | `FL`: `01` = um pixel · `00` = todos (com posição = total de LEDs) |
| 6–7 | posição em 16 bits **big-endian**, base 0. No app: `hex2byte(integerToHexString(pos))` |
| 8 | modo: `02` fixo · `01` fade · `00` pisca. Use `02`. |
| 9 | velocidade 0–100 (`64`) |
| 10–12 | R, G, B em 8 bits (o app multiplica pelo alfa). Aplique o limite de brilho do app. |
| 13 | brilho DIY 0–100 (`64`) |

Exemplos capturados numa fita de **100** LEDs:
- primeiro pixel vermelho: `0D 44 4F 4F 44 01 00 00 02 64 FC 00 00 63 00 00`
- último pixel azul: `0D 44 4F 4F 44 01 00 63 02 64 00 43 FC 63 00 00`
- todos verdes: `0D 44 4F 4F 44 00 00 64 02 64 25 FF 00 64 00 00`, onde a posição `0x64` = 100 = "todos"
- apagar tudo: `0D 44 4F 4F 44 00 00 64 02 64 00 00 00 64 00 00`

**[A CONFIRMAR]**
- Nesta cortina, "todos" deve ser a posição `01 90` (400). Pergunte ao usuário antes do primeiro envio.
- Ao entrar no modo grafite, o app manda `04 44 45 4E 00 …` ("DEN"). Pode ser obrigatório. Só envie se o DOOD sozinho não funcionar, e com confirmação do usuário.
- Mapeamento índice → (coluna, linha) da grade 20×20.

### 5.5 Pintura em massa: `DOOT` (a forma rápida de mandar um quadro inteiro)
Sequência:
1. CMD: `04 44 4F 4F 54 NP 00 00 00 00 00 00 00 00 00 00`, onde `NP` = quantidade de pacotes de dados
2. **DATA (texto puro)**, NP vezes: `[LEN] [SEQ] {00 CNT Rx Gx Bx MO SP} × até 14`
   - `LEN` = bytes depois dele = 1 + 7×k (máximo `63`, ou seja, 100 bytes no total) · `SEQ` começa em 0
   - Cada instrução pinta `CNT` pixels **seguidos** (1–255) com a mesma cor: é run-length. Os pixels são cobertos em sequência a partir do índice 0. Nenhuma instrução continua no pacote seguinte.
3. CMD: `06 44 4F 4F 54 43 50 00 00 00 00 00 00 00 00 00` ("DOOTCP", fixo)
4. CMD: `08 44 54 41 52 54 43 59 01 00 00 00 00 00 00 00` ("DTARTCY", fixo)

Exemplo de dados: `16 00 00 0A FF 00 00 02 64 00 0A FF FF FF 02 64 00 50 00 00 00 02 64` = 10 vermelhos, 10 brancos, 80 apagados.
Cores: as capturas do app usam 8 bits; o script de referência usa `>> 3` para poupar o regulador. Aplique o limite de brilho.
Pior caso, 400 pixels todos diferentes: 29 pacotes. Com run-length, bem menos.
**[A CONFIRMAR]** se funciona nesta cortina e quanto tempo leva para mandar um quadro.

### 5.6 Versão: `VE` (seguro, o app manda em toda conexão)
`03 56 45 00 …` (placa) e `03 56 45 01 …` (firmware). A resposta chega por notificação.

### 5.7 Não enviar sem pedido explícito do usuário
- `LAMPN` (quantidade de LEDs): `09 4C 41 4D 50 4E AH AL BH BL 00 …`. O app manda **dois** números; numa cortina, podem ser colunas e linhas. Mexer nisso pode bagunçar o controlador.
- `CT`: `0E 43 54 01 01 00 00 64 00 64 …`. Aparece no início da conexão, mas a função é desconhecida.
- `TIME`: `15 54 49 4D 45 …` (acerta o relógio). Não é necessário.

## 5bis. O que o app iDeal LED (iOS 2026) manda PARA ESTA CORTINA — captura real de 2026-11-16

Fonte: `capturas/iphone-2026-11-16.pklg` (PacketLogger do iPhone, sessão com `50:A8:06:6A:9E:5C` = `IDL-6A9E5C`), lido com `ferramentas/captura_att.py`. **A chave AES da §2 está correta**: tudo que vai na CMD decifra em ASCII. Diferenças em relação ao resto deste documento:

- **Só os N bytes após o tamanho importam.** O app manda o resto do bloco com lixo (restos do buffer) e a cortina responde ecoando esse lixo. Zeros servem.
- **Ordem na conexão (preâmbulo):** CCCD NOTIFY on → `03 'VER'` (resposta por NOTIFY: `05 'VER' 08 01` = versão 8.1) → `08 'TIME' DW HH MM SS` (WriteCmd) → `05 'LEDS' 00` (2×, WriteReq) → handshake JieLi no serviço `0xAE00` (`fe dc ba c0 06 00 02 00 01 ef`, `00`+16 B aleatórios, `02 'pass'`, `01`+16 B, `fe dc ba c0 03 00 06 01 ff ff ff ff 01 ef` → resposta de 61 B com o MAC, `fe dc ba c0 07 00 06 02 …`) → só então os comandos de luz. **[A CONFIRMAR]** qual parte do preâmbulo é obrigatória (nossos `LEDOFF`/`TURN` "a seco" não funcionaram).
- **Liga/desliga:** `06 'LEDOFF'` e **`05 'LEDON'`** (N = 5, não 6 como na §6). WriteReq.
- **Cor sólida:** `07 'COLO' G R B` em **8 bits** (`00 FF 00` = vermelho, `FF 00 00` = verde, `00 00 FF` = azul). WriteCmd.
- **Efeito:** 3 pacotes `EFF` com ACK por NOTIFY a cada um, depois `LIGHT` e `SPEED`:
  `0F 'EFF' NN 07 03 FF 00 00 FF 80 00 FF FF 00` → `06 'EFF' 00 'OK'`
  `0F 'EFF' NN 07 13 00 FF 00 00 FF FF 00 00 FF` → `06 'EFF' 01 'OK'`
  `07 'EFF' NN 07 21 80 00 FF` → `06 'EFF' 02 'OK'`
  `06 'LIGHT' BR` (BR = `32` = 50 %) · `06 'SPEED' SP` (SP = `08`). Os IDs vistos: `03` (1º efeito escolhido) e **`0B` = 11** (2º) — o app usa 11 nesta cortina; nossa regra 1–10 continua até o usuário liberar.
- **Animação nativa (árvore de Natal):** `05 'IMAG' 1A` + `05 'MODE' 03` + `LIGHT 32` + `SPEED 08`. `1A` = 26 = índice da animação.
- **Desenho (um pixel por pacote!):** `06 'SMVEW' 01` na CMD → N pacotes de 16 B **AES** na característica **`…960B`** (handle 0x000B), cada um `05 X Y G R B` (cor 8 bits na ordem **G R B**, confirmada na cortina) → `06 'SMVEW' 02` → `05 'MODE' 03`. **`MODE 03` faz o desenho rolar da direita para a esquerda** (é o mesmo modo da árvore de Natal "indo para o lado"). Na captura: 75 pacotes, X de 1 a 18 e Y de 3 a 19, cor `FD 54 01`. **[A CONFIRMAR]** origem e sentido dos eixos.
- Nenhum `TURN`, `SGLS`, `MULT`, `DOOD`, `DOOT` ou `CT` aparece: os comandos TYPE2 e os de pixel da §5 **não valem** para esta cortina.

## 5ter. Autenticação JieLi no serviço `0xAE00` (necessária antes dos comandos de luz) **[A CONFIRMAR na cortina]**

Sem ela, a cortina responde ao `VER` mas ignora `LEDOFF` (testado em 2026-11-16, mesmo com `TIME` e `LEDS 00`). É o "RCSP auth" da JieLi. Escritas em `0xAE01` (write-without-response), respostas por notificação em `0xAE02`, **texto puro**:

| # | Direção | Pacote |
|---|---|---|
| 1 | app → cortina | `00` + 16 bytes aleatórios (desafio do app) |
| 2 | cortina → app | `01` + `E1(desafio do app)` |
| 3 | app → cortina | `02 70 61 73 73` (`02 'pass'`) |
| 4 | cortina → app | `00` + 16 bytes aleatórios (desafio da cortina) |
| 5 | app → cortina | `01` + `E1(desafio da cortina)` |
| 6 | cortina → app | `02 70 61 73 73` |

`E1` é a função E1 do **Bluetooth clássico** (cifra SAFER+: `Ar` + `Ar'`), devolvendo os 16 bytes, com constantes fixas tiradas de `libjl_ota_auth.so`: chave `06 77 5F 87 91 8D D4 23 00 5D F1 D8 CF 0C 14 2B` e endereço `11 22 33 33 22 11`. Implementação: `ferramentas/jl_auth.py`.

Vetores reais (captura do iPhone): desafio `67c6697351ff4aec29cdbaabf2fbe346` → resposta `023a02126fa284879236e9da27ba0b8d`; desafio `3054108cae6bc3395cd78673b8ae0de7` → resposta `0bb49938575b4301cccd05340f09d073`. Ambos reproduzidos em `tests/test_jl_auth.py`.

O app ainda manda no `0xAE01` os comandos RCSP `FE DC BA C0 06 00 02 00 01 EF` (antes) e `FE DC BA C0 03 …` / `FE DC BA C0 07 …` (depois, consulta de informações). **Não** implementados: só o handshake acima. Nada mais deve ser escrito no `0xAE00` (é também o canal de atualização de firmware).

## 6. Comandos TYPE1 (só se a cortina não for TYPE2)
- Liga: `06 4C 45 44 4F 4E 00 …` ("LEDON") · Desliga: `06 4C 45 44 4F 46 46 00 …` ("LEDOFF")
- Cor: `07 43 4F 4C 4F Gx Rx Bx 00 …`, com verde no byte 5, vermelho no 6 e azul no 7, em 5 bits (offsets 5/6/7 conferidos no `const.py` da integração HA; N = 07 = 4 letras + 3 parâmetros). Exemplo vermelho: `07 43 4F 4C 4F 00 1F 00 00 …`
- Efeito: `06 4C 49 47 48 54 0C 00 …` ("LIGHT") seguido de 3 pacotes CMD, com `NN` (1–10) no byte 4:
  - `0E 45 46 46 NN 07 03 FF 00 00 FF 80 00 FF FF 00`
  - `0E 45 46 46 NN 07 13 00 FF 00 00 FF FF 00 00 FF`
  - `0E 45 46 46 NN 07 21 80 00 FF 00 00 00 00 00 00`

## 7. Ainda desconhecido (descobrir com cuidado)
- Comandos exclusivos de cortina no app iDeal LED (texto nativo, animações, imagens). Para descobrir, capture o tráfego Bluetooth do app oficial: no iPhone, com o perfil de log Bluetooth da Apple + PacketLogger num Mac; no Android, com o HCI snoop log. Documente aqui **antes** de usar.
- O que as notificações dizem (lido das capturas btsnoop de `8none1/idealLED`, aparelho `TR2211R005-01`, cifradas com a mesma chave, 16 bytes, último byte `01`):
  - `VE 00` → `0A 'V02211.5.1'` (versão da placa) · `VE 01` → `0C 'V122.3.137.8'` (firmware)
  - `CT` → `09 'CONNECTOK'` · `TURN` → `06 'TURNOK'`. Ou seja, **o controlador responde com um ACK por notificação a cada comando que entende**.
  - Nas capturas o app escreve na CMD **sem resposta** (ATT Write Command, opcode 0x52), e o handle da NOTIFY é 0x000D com CCCD em 0x000E (mesmo layout da cortina `IDL-6A9E5C`).
  - O app também conversa com o serviço `0xAE00` (escreve em `0xAE01`, recebe em `0xAE02`): pacotes `00`+16 B, `01`+16 B, `02 'pass'` e `FE DC BA C0 03 00 06 xx FF FF FF FF 00 EF`, com respostas de até 61 bytes. Parece um canal de identificação/OTA (estilo Telink). Os comandos de luz funcionam **antes** disso nas capturas, então não parece obrigatório. **Não mexer.**

## Fontes
- 8none1/idealLED: integração para Home Assistant e notas do protocolo (`att_protocol.md`, `idealled_controller.py`, `custom_components/ideal_led/`) — https://github.com/8none1/idealLED
- koying/ha_ideal_led_ble — https://github.com/koying/ha_ideal_led_ble
- Fórum do Home Assistant, "Christmas tree bluetooth light" — https://community.home-assistant.io/t/christmas-tree-bluetooth-light/644993
