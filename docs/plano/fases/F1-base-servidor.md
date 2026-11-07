# F1 — Base do servidor (Edge Functions, cota, transcrição segura)

**Branch:** `feat/cenas-f1-servidor` · **Depende de:** F0 · **Risco:** médio (mexe na função de IA em produção) · **Tamanho:** médio
**Objetivo:**
- criar o código comum das Edge Functions;
- trocar o limite em memória por uma cota no banco;
- corrigir os defeitos da chamada ao OpenRouter;
- tirar a chave da AssemblyAI do navegador.

## Ler
- `00-contexto.md`, `ESTADO.md`, este arquivo · `01-contratos.md` §C5 (tabela de erros) e §C9 (migration 010) · `02-inventario.md` §1 e §6
- `supabase/functions/clinical-ai-sanitize/index.ts` (inteiro: 331 linhas)
- `src/lib/assemblyai.js` (88 linhas) · `src/services/audioTranscriptionService.js` linhas 1–80
- `src/pages/CaseStudio.jsx`: **só** `Grep` por `getAssemblyAiKey|transcribeAudio|audioTranscriptionService` e ±15 linhas
- `src/services/aiCoreService.js` linhas 200–290
- `supabase/migrations/008_security_hardening.sql`: só o padrão de `security definer` e `search_path`

## Pré-requisitos do dono (o Claude Code pede e espera)
1. Criar um **branch do Supabase** para testes (ou usar `supabase start` local, se o Docker estiver disponível).
2. Definir o secret `ASSEMBLYAI_API_KEY` no branch: `supabase secrets set ASSEMBLYAI_API_KEY=... --project-ref <branch>`.
3. Ter um usuário de teste (não demo) no branch.

## Etapas

### 1.1 `supabase/functions/_shared/`
| Arquivo | Conteúdo |
|---|---|
| `cors.ts` | `corsHeaders` atuais + `responderOptions()` |
| `erros.ts` | `erro(codigo, mensagem, status)` e `ok(dados)` no formato de §C5; `class ErroApp` |
| `auth.ts` | `exigirUsuario(req)` → `{ userId, supabaseUsuario /*client com JWT do usuário*/, supabaseAdmin /*service role*/ }`. Sem `Bearer`, ou com sessão inválida, lança `NAO_AUTENTICADO`. |
| `cota.ts` | `consumirCota(supabaseUsuario, tipo, limite, qtd = 1)` → chama o RPC `consumir_cota`; se for `false`, lança `COTA_EXCEDIDA`. Constantes `LIMITES` com os valores de D6, ajustáveis pelo env `COTA_<TIPO>` |
| `llm.ts` | `chamarLLM({ mensagens:[{role,content}], maxTokens, temperatura, json, timeoutMs = 12000 })` → `{ texto, modelo, truncado, uso }`. **Correções:** aceita várias mensagens; `AbortSignal.timeout(timeoutMs)` por modelo; **não** anexa texto quando truncado (só marca `truncado: true`); a ordem dos modelos vem de `LLM_MODELOS` (env, CSV) com o padrão atual. Mais `extrairJson(texto)`: tira a cerca de código e pega do primeiro `{` ao último `}`; se o `JSON.parse` falhar, lança `IA_INDISPONIVEL`. |
| `schemas.ts` | `import { z } from "npm:zod@3"` + schemas que as fases forem precisando (vazio por enquanto, só o export) |
| `log.ts` | `logEvento(nome, dados)` em JSON numa linha. **Nunca registre o texto do aluno nem o prompt**, só ids, tamanhos, modelo e duração (LGPD) |

### 1.2 Migration `supabase/migrations/010_ai_cota.sql`
Exatamente o §C9:
- upsert atômico com `insert ... on conflict (user_id, dia, tipo) do update set contagem = ai_uso_diario.contagem + p_qtd where ai_uso_diario.contagem + p_qtd <= p_limite returning contagem`;
- retorna `found`;
- `p_qtd` entre 1 e 100 (senão `raise exception`);
- `p_tipo` em `('llm','consulta','turno','stt','voz','avaliacao')`.

Rode no branch e teste no SQL editor com o usuário de teste (`select consumir_cota('llm', 2)` três vezes → `true`, `true`, `false`).

### 1.3 `clinical-ai-sanitize` usando `_shared`
- Troque as partes equivalentes pelos módulos de `_shared`. **A resposta da função continua idêntica** (`{success, text|plan, provider, truncated}`): os clientes atuais (Goti, plano de cuidados, tutores) não podem quebrar.
- Remova `checkRateLimit` e consuma a cota `llm` (limite D6) logo após a autenticação. O `COTA_EXCEDIDA` responde 429 com `{ error: "..." }` (formato antigo, que o `aiCoreService` já trata como falha e cai no motor local).
- O "Cenário B" (prompt livre) continua por compatibilidade. Registre no `ESTADO.md`, em "Depois", o item: *"trocar o Cenário B por uma lista de tarefas permitidas"*.

### 1.4 Edge Function `transcrever` (por arquivo, em duas etapas)
O limite de tempo das Edge Functions não comporta esperar uma transcrição longa, por isso o trabalho fica dividido:
- `POST` em `multipart/form-data` com os campos `acao=iniciar`, `duracaoSeg` e `audio` (até 25 MB):
  - consome a cota `stt` em `ceil(duracaoSeg/60)` (máximo 10);
  - faz o upload para `https://api.assemblyai.com/v2/upload` e cria o transcript com `language_code: "pt"`;
  - devolve `{ id }`.
- `POST { acao: "status", id }` → `{ status: "processando"|"pronto"|"erro", texto? }`.
- O cliente consulta a cada 3 s, por até 4 min (igual ao `assemblyai.js`).
- **O áudio não é guardado.**

### 1.5 Cliente sem chave
- Crie `src/features/cena/servidor.js` só com `transcrever(audioBlob, { duracaoSeg, onEtapa })` (o resto vem na F2). Use `supabase.functions.invoke` e erros de §C5.
- `audioTranscriptionService.transcribeWithAssemblyAI` passa a chamar `transcrever()`. `getActiveEngine()` retorna `'AssemblyAI'` quando há sessão Supabase não demo.
- `CaseStudio.jsx`: troque **só** as chamadas encontradas no Grep por `audioTranscriptionService`. Não mexa em mais nada do arquivo.
- `src/lib/assemblyai.js`: remova `getAssemblyAiKey`/`saveAssemblyAiKey` e o uso de chave. Se mais ninguém usar o arquivo, apague-o. Remova também qualquer campo de interface que peça a chave (`Grep` por `assemblyai` em `src/`).
- Limpeza única: no boot (`src/main.jsx` ou `AuthContext`), `localStorage.removeItem('enfermeiro_assemblyai_api_key')`.
- `vercel.json` (CSP Report-Only): remova `https://api.assemblyai.com` de `connect-src` (o navegador não fala mais com ela).

## Testes
- `src/features/cena/servidor.test.mjs`: o mapeamento de resposta para `ErroServidor` (mock de `invoke`) cobre todos os códigos de §C5.
- Teste manual no branch, colado no PR:
  - 1 chamada do Goti funcionando;
  - chamada nº 61 de `llm` no dia (limite D6) → 429. Para testar rápido, use `COTA_LLM=3` no branch e o Goti responde pelo modo offline;
  - transcrição de um áudio de 20 s pelo SBAR;
  - grep `assemblyai_api_key` em `src/` sem resultados.

## Aceite
- [ ] O Goti, o plano de cuidados e o SBAR com áudio funcionam como antes
- [ ] A cota bloqueia corretamente e zera no dia seguinte (confira o `dia` no fuso America/Sao_Paulo)
- [ ] Nenhuma chave no bundle (`npm run build` e depois grep por `assemblyai` e `openrouter` em `dist/assets`; só podem aparecer nomes, não chaves)
- [ ] Logs da função sem texto de aluno
- [ ] `ESTADO.md` atualizado e o deploy em **produção** da função e da migration registrado como "aguardando autorização do dono"

## Armadilhas
- `supabase.functions.invoke` com `FormData`: **não** defina `Content-Type` à mão.
- No Deno, `npm:zod@3` exige a versão fixa. Não use `esm.sh` para o zod.
- A data do dia da cota precisa ser calculada **no banco** (fuso America/Sao_Paulo), não no cliente.
