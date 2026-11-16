# Prompts para o Claude Code

## 1. Primeira sessão (cole isto no Claude Code)

```
Quero criar um app próprio para controlar a minha cortina de LED, que hoje eu controlo pelo app iDeal LED (https://idealled.net). A cortina é a "IDL-6A9E5C": 20 colunas × 20 LEDs, 5V. Eu uso iPhone.

Antes de qualquer coisa, leia o CLAUDE.md e todos os arquivos em docs/ (PLANO, PROTOCOLO, HARDWARE e DESCOBERTAS). Eles têm o objetivo, o protocolo Bluetooth já levantado e as regras de segurança.

Depois:
1. Me explique em até 10 linhas como você entendeu o plano e o que vai precisar de mim (cortina ligada, app iDeal LED fechado no celular, Bluetooth do computador ligado etc.).
2. Confira se este computador tem Bluetooth LE e Python 3.11+ e me diga o resultado.
3. Execute a Fase 0 do docs/PLANO.md e pare no checkpoint.

Regras: siga à risca as regras de segurança do CLAUDE.md (só pacotes documentados, efeitos de 1 a 10, nunca LAMPN, brilho limitado). Antes de enviar qualquer tipo de pacote pela primeira vez, me mostre os bytes e peça confirmação. Trabalhe uma fase por vez, registre em docs/DESCOBERTAS.md tudo o que for confirmado na cortina real e fale comigo em português.
```

## 2. Sessões seguintes

```
/proxima-fase
```

Ou, para pedir algo específico dentro do plano:

```
/proxima-fase Quero focar na aba Desenhar hoje.
```

## 3. Antes de testar código novo na cortina

```
/revisar-seguranca
```

## 4. Se algo der errado
```
A cortina não reagiu ao último comando. Não envie mais nada. Me mostre os últimos pacotes enviados (hex, texto puro e criptografado), as notificações recebidas e compare com o docs/PROTOCOLO.md. Registre em docs/DESCOBERTAS.md e me proponha o próximo passo seguro.
```
