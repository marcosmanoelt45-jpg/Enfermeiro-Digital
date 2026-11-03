# Fila do Antigravity (trabalho braçal)

Cole **uma ordem por vez** no agente do Antigravity (pasta do projeto aberta, branch `feat/auditoria-profissional`).
Quando ele terminar, volte ao Claude e diga **"revise <área>"**. O Claude confere, testa e faz o commit.

Os itens marcados como `[high / clinical-math]` e `[high / security]` são do Claude: o Antigravity **pula** esses.

---

**Ordem modelo** (troque `<area>` pelo nome da área):

```
Leia CLAUDE.md e docs/auditoria/COMO_EXECUTAR.md. Execute a área docs/auditoria/<area>.md seguindo essas regras.
NÃO mexa nos achados marcados [high / clinical-math] nem [high / security]: esses são do Claude.
Faça todo o resto: correções medium/low e o Plano de redesign inteiro. Edite só os arquivos da área.
No fim, rode npx eslint nos arquivos alterados e me dê um resumo curto: arquivos alterados, achados corrigidos, achados pulados com o motivo e o que mudou no visual.
```

**Ordem das áreas:** profile → case-studio → sbar-audio → voice-sim → hub-goti → procedures → case-sim → dosage → foundation → perf

(`case-sim` e `dosage` ficam para o fim porque o Claude mexe primeiro na matemática delas.)
