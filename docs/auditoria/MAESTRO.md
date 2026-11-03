# Instruções para o Claude Code (maestro) no Maestri

Você coordena. O agente "Antigravity" do canvas (que roda o Gemini CLI) faz o trabalho braçal. Mantenha o seu consumo baixo: não leia arquivos grandes, confira só os diffs.

1. Rode `maestri list` para pegar os nomes exatos (o seu nome aparece em `You:`).
2. Confirme a branch com `git branch --show-current`. Ela deve ser `feat/auditoria-profissional`; se não for, rode `git checkout feat/auditoria-profissional`.
3. Para cada área, na ordem de `docs/auditoria/COMO_EXECUTAR.md`, envie ao trabalhador uma área por vez:
   `maestri ask "Antigravity" "Leia docs/auditoria/COMO_EXECUTAR.md e execute a área docs/auditoria/<area>.md. Quando terminar, responda com: maestri ask \"<seu nome>\" \"<resumo curto>\""`
   - Use um timeout longo (10 min). Se o tempo acabar, rode `maestri check "Antigravity"` e não reenvie o pedido.
4. Quando o resumo chegar, revise com `git diff --stat` e `git diff <arquivos da área>`:
   - confira se só os arquivos daquela área mudaram;
   - procure sons de acerto/erro, cores do tema claro e botões fora do sistema 3D;
   - em Doses e Simulador de Casos, refaça você mesmo pelo menos duas contas clínicas alteradas.
5. Rode `npx eslint <arquivos alterados> --quiet`. Se algo falhar, devolva ao Antigravity com o erro exato.
6. Se estiver aprovado, faça um commit por área: `git add <arquivos> && git commit -m "fix(<area>): ..."`. Não faça push.
7. No fim, rode `npm run lint`, `npm run typecheck` e `npm run build`, abra o app (`npm run dev`) para conferir as telas, faça o push da branch e abra o PR com `gh pr create`. **Nunca faça merge sem o dono pedir.**
