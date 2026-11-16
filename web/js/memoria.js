// Guarda preferências e desenhos no navegador (localStorage). Tudo com try/catch: no modo privado,
// com memória cheia ou bloqueada, o app continua funcionando, só não lembra das coisas.
const PREFIXO = "cortina.";

export function ler(chave, padrao) {
  try {
    const texto = localStorage.getItem(PREFIXO + chave);
    return texto === null ? padrao : JSON.parse(texto);
  } catch {
    return padrao;
  }
}

export function gravar(chave, valor) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}
