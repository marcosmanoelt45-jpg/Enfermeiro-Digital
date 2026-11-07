# F8 — Navegação final, remoção da Videochamada e limpeza

**Branch:** `feat/cenas-f8-final` · **Depende de:** F3–F7 aprovadas pelo dono em preview · **Risco:** médio (remoção) · **Tamanho:** médio
**Objetivo:** ligar os módulos novos, remover o que ficou obsoleto sem perder o histórico do aluno e atualizar a documentação.

## Ler
- `00-contexto.md`, `ESTADO.md`, este arquivo · `02-inventario.md` §2 e §4 (acoplamentos) · `03-design.md` (para reescrever o `DESIGN.md`)
- `src/features/navegacao/modulos.js` · `src/features/flags.js`
- Os trechos listados em 02 §4 (só as linhas citadas, ±15)

## Antes de começar: confirmar com o dono
1. **D2** (dock) continua valendo?
2. **SBAR antigo:** a página `SbarHandoffLab` tem a "Simulação Rápida (Voz & Timer)" e a gravação longa com avaliação. Ela **continua** acessível como "Plantão › Modo gravação" (padrão) ou é removida?
3. **Montar Caso** (`CaseStudio`): o padrão é remover só a rota do menu e redirecionar `/montar-caso` para `/consulta`, mantendo os componentes de prontuário (usados por `PatientDetail`).

## Etapas

### 8.1 Ligar os módulos
`FLAGS` com `consulta`, `calculoMedico`, `plantaoVivo` e `tecnicas` em `true`. Registro conforme D2:
- **dock:** Início · Prática · Cálculo · Técnicas · Perfil;
- **gaveta "Prática":** Consulta ao Vivo (NOVO) · Plantão · Casos Clínicos · Continuar de onde parou;
- **header desktop:** Início · Consulta ao Vivo · Plantão · Cálculo · Técnicas · Casos Clínicos;
- **trilha do Início:** destaques novos, com a Consulta no lugar da Videochamada.

Atualize o `ModuleBriefingModal` com os briefings `consulta`, `plantao`, `calculo` e `tecnicas` (texto curto: o que é, quanto tempo leva, o que você treina).

### 8.2 Redirecionamentos (`App.jsx`)
`/videochamada` e `/atendimento-voz` → `/consulta` · `/montar-caso` e `/case-studio` → `/consulta` · `/passagem-plantao`, `/sbar`, `/sbar-lab` e `/passagem-plantao-sbar` → página nova (a antiga em `/plantao/gravacao`, se mantida) · `/procedimentos`, `/procedimentos-lab`, `/skills-lab` e `/videoteca` → `/tecnicas?aba=videos` · `/laboratorio-calculos`, `/calculo-doses` e `/dosage-lab` → página nova. Todos com `<Navigate replace>`, **preservando** os query params relevantes (ex.: `?procedimento=` para abrir um vídeo direto).

### 8.3 Remoções (cada uma num commit, com `grep` antes provando que não há mais uso)
- `src/pages/Videochamada.jsx` · os `src/components/simulador/*` sem uso (o `PlurallQuestionCard` fica se o quiz da F4 o usa) · a página antiga do Cálculo (`MedicationDosageLab.jsx`, se 100% substituída) · `src/lib/sbarSpeechMatcher.js` (se o SBAR antigo for removido)
- `public/pacientes/*/passo_*.mp3` e `fala.mp3` (se não houver mais referência)
- **Mover** `public/pacientes/{marcus,teresinha}` → `public/personagens/` com nomes de emoção (`fala`→`falando`, `acerto`, `erro`), atualizando `personagens.js`. Apague o `manifest.json` antigo.

### 8.4 Histórico e Goti sem perda
- `clinicalHistoryService`: mantenha `MODULE_TYPES.VIDEOCHAMADA` e o rótulo como **"Atendimento por voz (antigo)"**, para que o histórico antigo continue aparecendo. Mantenha `getQuestoesRevisao`.
- `HistoricoAtividadesTab`: "Revisar" de itens antigos de videochamada abre `/revisao` (página nova e simples que usa `getQuestoesRevisao` + `PlurallQuestionCard`). Itens novos abrem o relatório do próprio módulo.
- `gotiPreceptorService`: troque `getRecentVideochamadaSummary` por `getResumoAtividadesRecentes()`, que lê as últimas 3 atividades de qualquer módulo novo (`consulta`, `plantao_vivo`, `calculo_medico`, `tecnica`) a partir do `clinicalHistoryService`. Atualize o texto do prompt na linha ~49 e as respostas offline (~415–429) para os nomes novos.
- `GotiChatDrawer`: troque a sugestão "Como funciona a videochamada por voz?" por "Como funciona a Consulta ao Vivo?".
- `clinicalGamificationService:451`: inclua `consulta` onde hoje conta `videochamada`, mantendo os dois.

### 8.5 Documentação
- `CLAUDE.md`: atualize "Pilares Essenciais Ativos" com os módulos e caminhos novos (`src/features/*`), a nota sobre falas fixas e voz ao vivo, as Edge Functions novas e as cotas. Remova a seção "Plano Cenas ao Vivo (em andamento)" e deixe um ponteiro para `docs/plano/` como histórico.
- `DESIGN.md`: reescreva a partir de `docs/plano/03-design.md` + os tokens reais.
- `README.md`: reescreva (setup com Supabase, `.env.local`, scripts `test`, `gerar-falas` e de assets, deploy). Remova as instruções Base44 que não se aplicam; mantenha uma nota sobre as partes que ainda usam Base44 (02 §1).

### 8.6 Verificação final
- [ ] `npm run lint && npm run typecheck && npm test && npm run build`
- [ ] Compare o tamanho de `dist/assets` com o da `main` (antes e depois) e registre. Nenhum chunk novo acima de 250 kB gzip sem justificativa
- [ ] `node scripts/voicebox/verificar-falas.mjs` sem órfãos e com a lista de falas sem mp3 vazia (ou aceita pelo dono)
- [ ] Todos os links do dock, header, trilha, histórico e briefings abrem a página certa (checklist manual no PR, em 390 px e 1280 px)
- [ ] Usuário com histórico antigo de videochamada ainda o vê no Perfil
- [ ] `grep -rn "videochamada" src` mostra só usos intencionais (histórico antigo, redirecionamentos)
- [ ] CSP: abra o console do preview em cada área e, sem violações, proponha ao dono trocar `Content-Security-Policy-Report-Only` por `Content-Security-Policy` **num PR separado**
- [ ] Política de privacidade (`PrivacyPolicyLGPD`) e `docs/DPA_LGPD.md` mencionam a AssemblyAI (transcrição) e o OpenRouter (IA) como operadores, e que o áudio não é guardado
