# Como executar as ordens de serviço

Para quem executa (Antigravity ou outro agente), uma área por vez:

1. Leia `CLAUDE.md` (regras do projeto) e o arquivo da área, por exemplo `docs/auditoria/dosage.md`.
2. Edite **somente** os arquivos listados em "Arquivos desta área".
3. Corrija os achados `high`, depois os `medium`. Nas áreas **NÃO VERIFICADAS**, confirme cada achado lendo o código antes de mudar. Se não for real, pule e anote o motivo.
4. Aplique o "Plano de redesign" usando o sistema existente:
   - `<Button>` e as classes `btn-3d-*`;
   - `src/lib/motion.js`;
   - `AnimatedProgress` e `AnimatedNumber`;
   - tema escuro Enfere Vivo e textos em PT-BR.
5. Sem sons de acerto ou erro. Não faça commit, push, deploy nem migration.
6. Termine rodando `npx eslint <arquivos alterados> --quiet` e corrija os erros.
7. Responda num resumo curto com: arquivos alterados, achados corrigidos, achados pulados (com o motivo) e o que mudou no visual.

Ordem sugerida (do maior risco para o menor): dosage → case-sim → case-studio → sbar-audio → profile → voice-sim → hub-goti → procedures → foundation → perf.
A área `auth-data` ainda precisa de auditoria.
