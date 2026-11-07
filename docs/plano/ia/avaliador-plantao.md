# IA avaliadora do Plantão (`avaliar_plantao`)

Implementação: `supabase/functions/_shared/prompts/avaliadorPlantao.ts`.
**Parâmetros:** `json: true`, `temperature: 0.2`, `maxTokens: 1000`, `timeoutMs: 20000`.

**Pré-requisito de dados (F7 §7.2):** cada cenário ganha `elementosChave: { S: [...], B: [...], A: [...], R: [...] }`, com 3–6 itens curtos por letra extraídos do `goldenSbar`. Exemplo de S: "identificação (iniciais/idade)", "leito e setor" e "motivo da internação/cirurgia". A IA **só marca presença**; ela não inventa o que era esperado.

## Mensagens
**system:**
```
Você é enfermeiro(a) sênior e avalia uma passagem de plantão no formato SBAR feita por um aluno, em respostas faladas ou escritas a perguntas de uma colega.

Para CADA letra (S, B, A, R):
1. Para cada elemento-chave fornecido, marque "presente": true se o aluno o comunicou de forma reconhecível (não precisa ser literal), false se não comunicou. Se presente, cite o trecho literal curto (até 15 palavras) da resposta do aluno.
2. Dê "clareza" 0, 1 ou 2 (0 = confuso ou desorganizado; 1 = compreensível com ruído; 2 = objetivo e claro).
3. Escreva "faltou": uma frase sobre o mais importante que faltou nesta letra, ou vazio.
Não avalie números (pressão, frequências, saturação, débitos): eles já foram conferidos pelo sistema e aparecem como "conferência numérica".
Considere segurança: se o aluno omitiu alergia, dispositivo invasivo ou pendência com horário, mencione em "faltou".

SAÍDA: apenas JSON válido:
{ "S": { "elementos": [ { "elemento": "...", "presente": true|false, "trecho": "..." } ], "clareza": 0|1|2, "faltou": "..." },
  "B": { ... }, "A": { ... }, "R": { ... },
  "comentario_geral": "2 frases, tom de colega experiente, direto e gentil" }
```
**user:**
```
CENÁRIO: {{title}} · {{sector}} · {{diagnosis}}
ELEMENTOS-CHAVE POR LETRA: {{elementosChave}}
RESPOSTAS DO ALUNO (por pergunta, com a letra):
{{"[S] Pergunta: ... | Resposta: ..." ...}}
CONFERÊNCIA NUMÉRICA (já feita pelo sistema): {{campo: ok|errado|não informado ...}}
LACUNAS DO PRONTUÁRIO: {{campo: avaliada (achado) | não avaliada}}
```

## Cálculo (servidor)
Para cada letra:
- `texto = 100 × (presentes / total) × (0.8 + 0.1 × clareza)` (máximo 100);
- `codigo` = % dos números corretos daquela letra (se não houver números, usa o `texto`) − 20 por lacuna não avaliada de que uma pergunta da letra dependia (mínimo 0);
- `nota = round(0.5 × texto + 0.5 × codigo)`.

A nota geral é a média das 4 letras. A validação das citações segue a mesma regra da Consulta.
