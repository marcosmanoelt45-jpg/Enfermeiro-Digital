import { ErroServidor, erroDeCorpo } from "./erroServidor.js";

const esperarPadrao = (ms) => new Promise((r) => setTimeout(r, ms));

// Falha de rede do supabase-js (FunctionsFetchError) ou do fetch (TypeError).
function ehErroDeRede(e) {
  return e?.name === "FunctionsFetchError" || e?.name === "TypeError";
}

async function corpoDoErro(e) {
  try {
    return await e.context.json();
  } catch {
    return null;
  }
}

// Chama uma Edge Function e devolve os dados, ou lança ErroServidor.
// `invoke(nome, corpo)` tem o formato do supabase.functions.invoke ({ data, error }).
// Só erro de rede é repetido; erro que o servidor respondeu nunca (repetir gastaria cota à toa).
export async function invocarFuncao(invoke, nome, corpo, { timeoutMs = 15000, tentativas = 2, esperar = esperarPadrao } = {}) {
  let ultimo = null;
  for (let i = 0; i < tentativas; i++) {
    let temporizador;
    try {
      const limite = new Promise((_, rejeitar) => {
        temporizador = setTimeout(() => rejeitar(new ErroServidor("TIMEOUT")), timeoutMs);
      });
      const { data, error } = await Promise.race([invoke(nome, corpo), limite]);
      if (!error) return data;
      if (error.name === "FunctionsHttpError") {
        throw erroDeCorpo(await corpoDoErro(error), error.context?.status ?? 0);
      }
      throw error;
    } catch (e) {
      if (e instanceof ErroServidor) throw e;
      if (!ehErroDeRede(e)) throw new ErroServidor("ERRO_INTERNO");
      ultimo = new ErroServidor("REDE");
      if (i < tentativas - 1) await esperar(500 * (i + 1));
    } finally {
      clearTimeout(temporizador);
    }
  }
  throw ultimo ?? new ErroServidor("REDE");
}
