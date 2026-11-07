# F0 — Base do repositório (só frontend e configuração)

**Branch:** `feat/cenas-f0-base` · **Depende de:** nada · **Risco:** baixo · **Tamanho:** pequeno/médio
**Objetivo:** deixar o repositório pronto para as fases seguintes sem mudar nada visível para o aluno, exceto a unidade correta no Cálculo.

## Ler
- `docs/plano/00-contexto.md`, `docs/plano/ESTADO.md`, este arquivo
- `docs/plano/01-contratos.md` §C14 e §C15 · `docs/plano/02-inventario.md` §1, §2, §4 e §6
- `package.json`, `eslint.config.js`, `jsconfig.json`, `vercel.json`
- `src/components/mobile/MobileBottomDock.jsx` (inteiro: ~280 linhas)
- `src/components/StudentHeader.jsx` linhas 1–80 e o bloco que renderiza `navLinks`
- `src/components/mobile/EnfereVivoTrail.jsx` linhas 40–130
- `src/pages/ProcedimentosLab.jsx` linhas 135–150 (esqueleto de página)
- `docs/auditoria/dosage.md`, só o achado `dosage-1`
- `src/pages/MedicationDosageLab.jsx`: `Grep` por `gotas/min` e ±30 linhas ao redor
- `src/data/dosageProblems.js` e `src/services/proceduralDosageGenerator.js` (para `answerUnit`)

## Não ler
`CaseStudio.jsx`, `SbarHandoffLab.jsx`, `Videochamada.jsx`, `simuladorCasosData.js`.

## Etapas (um commit por etapa)

### 0.1 Documentação coerente
- `AGENTS.md`: substitua o conteúdo por um ponteiro curto, *"A fonte da verdade é o `CLAUDE.md`. Plano em andamento: `docs/plano/`."*, mais a seção **Supabase OAuth Pre-Flight Protection**, sem alteração. Remova as instruções Base44 que conflitam.
- `CLAUDE.md`: acrescente ao final a seção "Plano Cenas ao Vivo (em andamento)", com no máximo 5 linhas: "leia `docs/plano/README.md`; uma fase por sessão; `ESTADO.md` registra o progresso; código novo em `src/features/`; não editar `Videochamada.jsx`, `CaseStudio.jsx` nem `SbarHandoffLab.jsx` antes da F8, exceto onde a fase mandar".

### 0.2 Testes com `node:test`
- Crie `scripts/run-tests.mjs`. Ele procura recursivamente `*.test.mjs` em `src/features/`, `src/data/`, `src/lib/`, `src/services/` e `supabase/functions/_shared/` (ignorando `node_modules`) e executa `node --test <arquivos>` com `spawnSync`, propagando o código de saída. Sem arquivos encontrados, sai com 0 e mostra um aviso.
  - **Por que não `node --test` puro:** a descoberta automática pegaria `scripts/test-*.js`, que são scripts antigos (alguns com Puppeteer) e quebrariam.
- `package.json`: `"test": "node scripts/run-tests.mjs"`.
- Crie `src/features/README.md` com as convenções de 00-contexto ("Convenções de código"), em 10 linhas.

### 0.3 Lint e typecheck cobrindo o código novo
- `eslint.config.js`:
  - acrescente `src/features/**/*.{js,jsx}` ao bloco de arquivos existente;
  - crie um bloco para `**/*.test.mjs` e `scripts/run-tests.mjs` com `globals.node`.
- `jsconfig.json`: acrescente `src/features/**/*.js` e `src/features/**/*.jsx` ao `include`.
- Valide que `npm run lint` e `npm run typecheck` continuam passando **sem novos erros** no código existente.

### 0.4 Feature flags e registro único de módulos
- `src/features/flags.js` (§C15).
- `src/features/navegacao/modulos.js` (§C14) com os módulos **atuais**: Início, Videochamada, Procedimentos, Montar Caso, Casos Clínicos, Plantão SBAR e Cálculo de Doses, com rótulos, ícones, rotas e `briefingId` idênticos aos de hoje. Inclua também os itens da gaveta "Casos" do dock. Exporte:
  - `modulosDoHeader()`;
  - `itensDoDock()`;
  - `opcoesDaGavetaPratica()`;
  - `modulosDaTrilha()`.

  Os ícones são referenciados pelo nome; o mapa nome→componente `lucide-react` fica em `navegacao/icones.js`.
- `StudentHeader.jsx`, `MobileBottomDock.jsx` e `EnfereVivoTrail.jsx` passam a montar as listas a partir dessas funções. **Resultado visual idêntico:** confira com `node scripts/screenshot-desktop-mobile.js` antes e depois (se o script rodar no seu ambiente; senão, verifique manualmente em 390 px e 1280 px).
- Teste `src/features/navegacao/modulos.test.mjs`:
  - ids únicos;
  - toda rota existe numa lista de rotas conhecidas, exportada do próprio `modulos.js`;
  - módulo com flag desligada não aparece em nenhuma lista.

### 0.5 `PageShell`
- `src/components/layout/PageShell.jsx` com o esqueleto de 02 §3.1 (props: `activeTab`, `semDock = false`, `larguraMax = 'xl' | '4xl'`, `children`, `className`). **Não** migre páginas existentes; ele será usado só nas páginas novas.

### 0.6 Unidade correta no Cálculo (`dosage-1`)
- Acrescente `answerUnit` a cada problema de `dosageProblems.js` e ao retorno dos 6 geradores (`gts/min`, `mcgts/min`, `mL/h`, `mL`, `mcg/min`, `ampolas`, `UI`). Em `MedicationDosageLab.jsx`, troque o sufixo fixo por `problem.answerUnit`.
- Teste `src/data/dosageProblems.test.mjs`:
  - todo problema e todo gerador (rode cada gerador 200 vezes) tem `answerUnit` numa lista permitida;
  - o resultado é finito e positivo.

  Hoje os dois arquivos não importam nada com `@/`, então rodam direto no Node. Se isso mudar, troque o import por um caminho relativo.

### 0.7 Cache de mídia (`perf-1`)
- Em `vercel.json`:
  - `/vozes/(.*)`: `public, max-age=31536000, immutable` (os nomes terão hash, F2);
  - `/goti/(.*)`, `/pacientes/(.*)`, `/personagens/(.*)` e `/minijogos/(.*)`: `public, max-age=86400, stale-while-revalidate=604800`;
  - a regra `no-store` não pode casar esses caminhos: ajuste a regex negativa para `/((?!assets/|vozes/|goti/|pacientes/|personagens/|minijogos/).*)`.
- **Verificação:** no preview da Vercel do PR, rode `curl -sI <preview>/goti/goti-idle.webm | grep -i cache-control` e `curl -sI <preview>/ | grep -i cache-control`, e cole a saída no PR.

## Aceite
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` passam
- [ ] Header, dock e trilha **idênticos** aos de antes, no celular e no desktop
- [ ] Cálculo: o problema de heparina mostra "mL/h", o de ampolas mostra "ampolas" e os de gotejamento mostram "gts/min"
- [ ] Os headers de cache conferem no preview
- [ ] `ESTADO.md` atualizado

## Armadilhas
- O `MobileBottomDock` tem a gaveta com `useDragControls`. **Não mexa** na lógica de arraste, só na origem dos dados.
- `EnfereVivoTrail` mistura navegação com texto de destaque: só a lista de módulos vem do registro.
- Não renomeie rotas nesta fase.

## Reverter
Cada etapa é um commit independente. A 0.4 é a única com risco visual: `git revert` só dela.
