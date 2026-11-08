# Enfere (Enfermeiro Digital)

Simulação clínica de enfermagem, mobile-first. Produção: https://enfere.vercel.app

## Módulos
- **Consulta ao Vivo** (`/consulta`): conversa com um paciente por voz ou texto, anotações, registro e relatório.
- **Plantão ao Vivo** (`/passagem-plantao`): passagem SBAR com a enfermeira Ana. O modo gravação antigo fica em `/plantao/gravacao`.
- **Cálculo com o Dr. Rui** (`/laboratorio-calculos`): gotejamento, diluição e BIC, com prescrições que às vezes vêm com erro.
- **Técnicas** (`/tecnicas`): minijogos, POPs e videoteca.
- **Casos Clínicos** (`/simulador-casos`): Processo de Enfermagem com NANDA-I, NIC e NOC.
- **Goti**: preceptor socrático no chat.

## Rodar no seu computador
1. `npm install`
2. Configure as variáveis **públicas** do Supabase no arquivo de ambiente local do Vite (o cofre do projeto grava esse arquivo): `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
   Nunca coloque segredo com prefixo `VITE_`: tudo que começa com `VITE_` vai para o JavaScript público.
3. `npm run dev` e abra http://localhost:5173

## Scripts
| Comando | O que faz |
|---|---|
| `npm run dev` | servidor local (Vite) |
| `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` | validação obrigatória antes de concluir uma tarefa |
| `node scripts/vozes/exportar-falas-fixas.mjs` | atualiza a lista de falas fixas do lote diário de voz (rodar depois de mudar `src/data/falas/*.json` e reimplantar a função `voz`) |
| `node scripts/voicebox/gerar-falas.mjs` | gera os mp3 de reserva das falas fixas com o VoiceBox no PC |
| `node scripts/voicebox/verificar-falas.mjs` | confere se toda fala fixa tem mp3 e se sobrou arquivo órfão |

## Servidor (Supabase)
- Banco, autenticação e storage no Supabase. Migrations em `supabase/migrations/NNN_*.sql`.
- Edge Functions em `supabase/functions/`: `cena-ia` (IA da Consulta, Plantão e avaliações), `voz` (voz Gemini com cache e lote diário), `stt-token` e `transcrever` (AssemblyAI), `clinical-ai-sanitize`.
- Segredos só nos secrets das funções: `GEMINI_API_KEY`, `OPENROUTER_API_KEY` (reserva), `ASSEMBLYAI_API_KEY`.
- Implantar uma função: `npx -y supabase@latest functions deploy <nome> --project-ref <projeto> --use-api --yes`
- Bot diário de vozes: pg_cron (migration 012) chama a função `voz` às 08:15 UTC.
- O perfil do usuário é criado pelo banco no cadastro (migration 014).

## Deploy
Push na `main` publica na Vercel automaticamente. Trabalhe num branch e só mescle quando estiver pronto.

## Base44
Algumas telas antigas de prontuário (`DiagnosesTab`, `DischargeTab`, `MedicationsTab`, `NandaSearchBar`) ainda usam o SDK do Base44 (`src/api/base44Client.js`). O resto do app não depende dele.

## Mais
- Regras do projeto e do design: `CLAUDE.md` e `DESIGN.md`.
- Histórico do plano Cenas ao Vivo: `docs/plano/`.
