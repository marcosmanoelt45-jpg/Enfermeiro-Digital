/**
 * simuladorFormulaService.js
 *
 * Avaliador aritmético puro e determinístico para cálculos de enfermagem
 * (doses, gotejamento macrogotas/microgotas, diluições e infusões).
 *
 * NÃO UTILIZA eval() NEM new Function() - parser AST seguro.
 */

// Tokenizer simples para expressões aritméticas
function tokenize(expression) {
  const tokens = [];
  let i = 0;
  const expr = expression.trim();

  while (i < expr.length) {
    const char = expr[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let numStr = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: parseFloat(numStr) });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let varName = "";
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        varName += expr[i];
        i++;
      }
      tokens.push({ type: "VARIABLE", value: varName });
      continue;
    }

    if ("+-*/()".includes(char)) {
      tokens.push({ type: "OPERATOR", value: char });
      i++;
      continue;
    }

    throw new Error(`Caractere inválido na fórmula: ${char}`);
  }

  return tokens;
}

// Parser Recursivo Descendente:
// Expression := Term (( '+' | '-' ) Term)*
// Term       := Factor (( '*' | '/' ) Factor)*
// Factor     := Primary
// Primary    := NUMBER | VARIABLE | '(' Expression ')' | '-' Primary
function parseExpression(tokens, variables = {}) {
  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume(expectedValue = null) {
    const token = tokens[pos];
    if (!token) {
      throw new Error("Fim inesperado da fórmula");
    }
    if (expectedValue && token.value !== expectedValue) {
      throw new Error(`Esperado '${expectedValue}', recebido '${token.value}'`);
    }
    pos++;
    return token;
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new Error("Expressão incompleta");

    if (token.type === "OPERATOR" && token.value === "-") {
      consume("-");
      return -parsePrimary();
    }

    if (token.type === "OPERATOR" && token.value === "+") {
      consume("+");
      return parsePrimary();
    }

    if (token.type === "NUMBER") {
      consume();
      return token.value;
    }

    if (token.type === "VARIABLE") {
      consume();
      const val = variables[token.value];
      if (val === undefined || val === null || isNaN(Number(val))) {
        throw new Error(`Variável não definida na fórmula: '${token.value}'`);
      }
      return Number(val);
    }

    if (token.type === "OPERATOR" && token.value === "(") {
      consume("(");
      const result = parseAddSub();
      consume(")");
      return result;
    }

    throw new Error(`Token inesperado: ${token.value}`);
  }

  function parseMulDiv() {
    let result = parsePrimary();
    while (pos < tokens.length && (peek()?.value === "*" || peek()?.value === "/")) {
      const op = consume().value;
      const right = parsePrimary();
      if (op === "*") {
        result *= right;
      } else {
        if (right === 0) {
          throw new Error("Divisão por zero");
        }
        result /= right;
      }
    }
    return result;
  }

  function parseAddSub() {
    let result = parseMulDiv();
    while (pos < tokens.length && (peek()?.value === "+" || peek()?.value === "-")) {
      const op = consume().value;
      const right = parseMulDiv();
      if (op === "+") {
        result += right;
      } else {
        result -= right;
      }
    }
    return result;
  }

  const result = parseAddSub();
  if (pos < tokens.length) {
    throw new Error(`Sintaxe extra não consumida na fórmula: '${tokens[pos].value}'`);
  }
  return result;
}

/**
 * Avalia uma fórmula matemática com variáveis clínicas.
 * @param {string} formula Ex: "dose_mg / concentracao_mg_ml"
 * @param {Record<string, number>} variables Ex: { dose_mg: 1000, concentracao_mg_ml: 500 }
 * @returns {number}
 */
export function evaluateFormula(formula, variables = {}) {
  if (!formula || typeof formula !== "string") {
    throw new Error("Fórmula deve ser uma string não vazia");
  }
  const tokens = tokenize(formula);
  return parseExpression(tokens, variables);
}

/**
 * Valida a resposta do estudante contra o valor esperado ou fórmula matemática.
 * @param {Object} params
 * @param {string|number} params.alunoResposta Resposta digitada pelo aluno
 * @param {string} [params.formula] Fórmula opcional
 * @param {Record<string, number>} [params.variaveis] Variáveis clínicas da fórmula
 * @param {number} [params.valorEsperado] Valor numérico direto se não houver fórmula
 * @param {number} [params.tolerancia] Tolerância relativa (ex: 0.01 para 1%)
 * @param {string} [params.unidade] Unidade esperada (ex: "mL", "gotas/min")
 * @returns {{ correta: boolean, alunoVal: number, valorEsperado: number, erroRelativo: number, diff: number }}
 */
export function validateCalculoAnswer({
  alunoResposta,
  formula,
  variaveis = {},
  valorEsperado = null,
  tolerancia = 0.01,
  unidade = "mL"
}) {
  if (alunoResposta === undefined || alunoResposta === null || String(alunoResposta).trim() === "") {
    return {
      correta: false,
      alunoVal: NaN,
      valorEsperado: valorEsperado ?? 0,
      erroRelativo: 1,
      diff: Infinity,
      unidade
    };
  }

  // Sanitiza formato com vírgula ou ponto (ex: "2,5" -> 2.5)
  const sanitized = String(alunoResposta).trim().replace(",", ".");
  const alunoVal = parseFloat(sanitized);

  if (isNaN(alunoVal)) {
    return {
      correta: false,
      alunoVal: NaN,
      valorEsperado: valorEsperado ?? 0,
      erroRelativo: 1,
      diff: Infinity,
      unidade
    };
  }

  let expected = valorEsperado;
  if (formula) {
    expected = evaluateFormula(formula, variaveis);
  }

  if (expected === null || isNaN(expected)) {
    throw new Error("Nem fórmula válida nem valor esperado foram fornecidos para conferência.");
  }

  const diff = Math.abs(alunoVal - expected);
  const maxAllowedDiff = Math.max(Math.abs(expected) * tolerancia, 0.0001);
  const correta = diff <= maxAllowedDiff;
  const erroRelativo = expected !== 0 ? diff / Math.abs(expected) : diff;

  return {
    correta,
    alunoVal,
    valorEsperado: expected,
    erroRelativo,
    diff,
    unidade
  };
}
