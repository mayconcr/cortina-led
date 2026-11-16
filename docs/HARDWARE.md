# Hardware da cortina

## O que sabemos (confirmado pelo usuário)
| Item | Valor |
|---|---|
| Nome Bluetooth | `IDL-6A9E5C` |
| Grade | 20 colunas × 20 LEDs = **400 LEDs** |
| Alimentação | 5V (etiqueta "iDeal LED 5V") |
| App oficial | iDeal LED (iOS) / ideal LED+ (Android) — https://idealled.net |
| QR code da etiqueta | `http://api.e-toys.cn/page/app/138`: só a página de download do app |
| Celular do usuário | iPhone |

## O que provavelmente tem dentro (cortina igual documentada pela atomic14)
A atomic14 documentou uma cortina 2 m × 2 m de 400 LEDs do AliExpress, muito provavelmente da mesma família:
- Controlador com SoC Bluetooth LE **ST17H66B**.
- Buffer **SN74LVC1G125** eleva o sinal de dados de 3,3 V para 5 V.
- Cada fio vertical tem 3 condutores: 5V, GND e dados. Os LEDs ficam num **barramento de dados compartilhado**, e cada um já vem programado de fábrica com a sua posição. Mesmo assim, o sinal é no padrão WS2812, e o WLED controlou a cortina normalmente.

Fonte: https://atomic14.com/2023/12/12/interesting-led-curtain.html

## Consumo e segurança elétrica
- 400 LEDs em branco total podem passar de muitos ampères. O controlador e a fonte USB não aguentam.
- O app original limita a cor sólida a 5 bits por canal (`>> 3`), em parte para não sobrecarregar o regulador.
- No nosso app: brilho máximo padrão de 40% e bloqueio de branco total em todos os LEDs (ver `CLAUDE.md`).

## Caminho futuro (Fase 6, opcional): ESP32 + WLED
Se o Bluetooth ficar limitado, por exemplo em animações fluidas ou texto rolando, trocar o "cérebro" dá controle total pelo Wi-Fi:
- **Material:** placa ESP32 (DevKit, C3 ou S3), conversor de nível 74AHCT125 (opcional, mas recomendado), fios/jumpers.
- **Ligação:** 5V, GND e dados da cortina no ESP32, com o dado passando pelo conversor de nível. A placa original fica guardada, então dá para voltar atrás.
- **Firmware:** WLED, instalado pelo navegador em https://install.wled.me. Configurar a matriz 2D 20×20.
- **App:** a interface feita nas Fases 4–5 pode passar a falar com a API JSON do WLED, ou com DDP/UDP para tempo real.
