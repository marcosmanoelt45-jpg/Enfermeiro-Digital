# IA da ficha (`criar_consulta`)

Implementação: `supabase/functions/_shared/prompts/ficha.ts`.
**Parâmetros:** `json: true`, `temperature: 0.7`, `maxTokens: 1800`, `timeoutMs: 25000`.

## O que o servidor faz antes (sem IA)
- Escolhe o arquétipo (`_shared/dados/arquetipos.js`) e **copia os sinais vitais** dele, com variação de ±5% arredondada. **A IA não define sinais vitais.**
- Define o setor a partir da `specialty` (mapa fixo).
- Monta `nandaCandidatos` (até 12 códigos com nome) a partir do campo pré-calculado no export (`getNandaContextualSuggestions(disease)` rodado no script).
- Monta `examesCandidatos`: ids dos minijogos existentes que fazem sentido para a especialidade (mapa fixo; ex.: cardiovascular/respiratório → `ausculta-pulmonar`, `contar-fr`).
- Calcula as **exigências de distribuição**:

| Dificuldade | livre | pergunta_direta | confianca | esquecido |
|---|---|---|---|---|
| facil | ≥ 50% | resto | 0–1 | 0 |
| normal | 20–35% | ≥ 35% | 1–2 | 0–1 |
| dificil | ≤ 20% | resto | 2–3 | 1–2 |

Personalidades `colaborativo` e `ansioso`: `confianca` no máximo 1. `desconfiado`, `envergonhado` e `minimizador`: no mínimo 1. `esquecido`: `esquecido` no mínimo 1.

## Mensagens
**system:**
```
Você é roteirista clínico de simulações de enfermagem. Sua tarefa é transformar um caso clínico-base em uma "ficha de paciente" para um paciente simulado conversar com um aluno.

REGRAS CLÍNICAS (obrigatórias)
- Use SOMENTE as informações clínicas do caso-base: doença, história, medicações, alergias e notas. Não acrescente doenças, exames, medicações ou alergias que não estejam no caso-base.
- Você pode acrescentar detalhes de vida coerentes e simples: profissão, com quem mora, rotina, hábitos compatíveis com a história, sentimentos.
- Escreva cada fato como algo que o PACIENTE diria ou sabe, em linguagem leiga e curta (até 20 palavras). Ex.: "parou de tomar o remédio de urina há duas semanas porque fazia levantar de noite".
- Inclua obrigatoriamente: a queixa principal e como começou; alergias (ou a ausência delas); as medicações que usa e como usa (adesão); pelo menos 1 hábito; pelo menos 1 sintoma associado.
- Os fatos de peso 3 são os críticos para segurança e diagnóstico (alergia, medicação crítica, não adesão, sintoma de alarme). Peso 2 é importante e peso 1 é contexto.

REGRAS DE REVELAÇÃO
- "livre": o paciente conta sem ser perguntado, se o assunto surgir.
- "pergunta_direta": só conta se perguntarem sobre o tema.
- "confianca": até a confiança chegar a "confiancaMin", o paciente conta a "versaoFalsa", que deve ser plausível e combinar com a personalidade (quem minimiza diminui; quem tem vergonha nega ou desvia). Use esta regra em fatos sensíveis: não adesão, álcool, fumo, automedicação, situação social.
- "esquecido": o paciente não lembra até o aluno insistir. Use em datas, nomes de remédio e alergias antigas.
- Para TODOS os fatos, escreva "perguntaQueRevela": uma pergunta aberta e em linguagem simples que um bom enfermeiro faria para obter aquela informação.

SAÍDA
Responda APENAS com JSON válido, sem markdown, exatamente neste formato:
{
  "identificacao": { "nome": "nome e sobrenome brasileiros comuns, fictícios, não famosos", "ocupacao": "...", "escolaridade": "fundamental|medio|superior", "mora_com": "..." },
  "queixaPrincipal": "em palavras do paciente, até 15 palavras",
  "fatos": [ { "id": "f1", "tema": "hda|antecedentes|medicacoes|alergias|habitos|familia|social|sintomas_associados|adesao|sono|eliminacoes|alimentacao", "texto": "...", "peso": 1|2|3, "revelacao": "livre|pergunta_direta|confianca|esquecido", "confiancaMin": 40-85 (só em confianca), "versaoFalsa": "..." (só em confianca), "perguntaQueRevela": "..." } ],
  "examesDisponiveis": ["ids escolhidos dentre os candidatos"],
  "diagnosticosEsperados": ["2 a 4 códigos escolhidos dentre os candidatos"],
  "intervencoesEsperadas": ["3 a 6 intervenções de enfermagem curtas e específicas"]
}
Entre 8 e 14 fatos, com ids sequenciais f1, f2, …
```
**user:**
```
CASO-BASE (não altere a clínica):
{{arquetipo: disease, anamnesis, medicalHistory, medications, allergies, notes}}

PACIENTE: {{idade}} anos, sexo {{sexo}}.
PERSONALIDADE: {{personalidade.nome}}: {{personalidade.descricao}} Tendências: {{tendencias_em_texto}}
DIFICULDADE: {{dificuldade}}
EXIGÊNCIAS DE DISTRIBUIÇÃO: {{texto calculado, ex.: "8 a 14 fatos; livre: 2 a 4; confianca: exatamente 2; esquecido: 1; o restante pergunta_direta"}}
DIAGNÓSTICOS CANDIDATOS (escolha 2 a 4 códigos): {{codigo — nome}}
EXAMES CANDIDATOS (escolha 0 a 2 ids): {{id — rótulo}}
```

## Nova tentativa (uma só)
Se `validarFicha` falhar, envie de novo **as mesmas mensagens** + o `assistant` com a resposta anterior + o `user`: `"A ficha tem estes problemas: {{erros}}. Corrija e responda só o JSON completo."` Se falhar de novo, use `fichaDeTemplate`.

## Depois da IA (servidor)
Acrescente os campos que o servidor controla: `arquetipoId`, `setor`, `sinaisVitais`, `personalidadeId`, `dificuldade`, `identificacao.idade` e `identificacao.sexo`. Os nomes gerados passam por uma lista de bloqueio simples (nomes de pessoas famosas e palavrões; `_shared/dados/bloqueioNomes.js`). Se o nome cair na lista, troque por um nome de `sampleNames` (export enxuto).
