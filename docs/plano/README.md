# Plano "Cenas ao Vivo" (Enfere)

Consulta ao Vivo · Cálculo com o Médico · Plantão com a Enfermeira · Técnicas (minijogos)

**Versão do plano:** 2.0 (03/11/2026)
**Base:** `main` @ `027f623` ("Merge PR #5 redesign estrutural"). Não havia commits novos no momento da análise.
**Local no repositório:** copie esta pasta para `docs/plano/`.

---

## Como usar (leia uma vez)

O plano está dividido em arquivos pequenos de propósito. Cada sessão do Claude Code lê **só o que a fase precisa**, o que gasta menos tokens e deixa menos espaço para improviso.

| Arquivo | Quem lê | Tamanho |
|---|---|---|
| `00-contexto.md` | **Todas as fases** | curto |
| `01-contratos.md` | Fases que criam ou consomem dados (indicado em cada fase) | médio |
| `02-inventario.md` | Consulta pontual (cada fase cita a seção) | médio |
| `03-design.md` | Fases com interface | médio |
| `fases/F*.md` | Só a fase em execução | médio |
| `ia/*.md` | F3, F4 e F7 (prompts das IAs) | médio |
| `producao/*.md` | Produção de voz e arte (no seu PC) | curto |
| `ESTADO.md` | **Todas as fases**: o Claude Code atualiza ao terminar cada uma | curto |

### Ordem e dependências

```
F0 Base do repositório ──► F1 Base do servidor ──► F2 Motor "Cena ao Vivo" ──┬─► F3 Consulta (conversa) ─► F4 Consulta (fechamento)
                                                                              ├─► F5 Minijogos + aba Técnicas ─► F7 Plantão
                                                                              └─► F6 Cálculo com o Médico
                                                         (F3–F7 concluídas) ──► F8 Navegação final e remoção da Videochamada

Em paralelo, no seu PC, depois de F2:
  P1 Arte e vídeo (Flow pelo MCP)  ·  P2 Vozes fixas (VoiceBox)
```

F5 e F6 podem ser feitas antes de F3/F4, se você preferir entregar algo mais simples primeiro. F7 depende de F5 (minijogos).

### O prompt padrão (cole no Claude Code, trocando o N)

```
/clear
Leia, nesta ordem e só estes arquivos: docs/plano/00-contexto.md, docs/plano/ESTADO.md e docs/plano/fases/F<N>-*.md.
Leia outros arquivos do plano ou do código apenas quando a fase mandar, e só os trechos indicados.
Entre em plan mode e me mostre: arquivos que vai criar ou alterar, ordem dos commits e qualquer divergência entre o plano e o código.
Espere meu OK antes de editar.
```

Depois do seu OK:

```
Pode executar. Um commit por etapa da fase, no branch indicado. Ao final: rode a validação da fase, atualize docs/plano/ESTADO.md e abra o PR (sem push na main).
```

### Regras para economizar tokens e evitar bugs (o Claude Code também segue)

1. **Uma fase por sessão, começando com `/clear`.** Nada de "aproveitar o contexto" da fase anterior: quem carrega a memória entre fases é o `ESTADO.md`.
2. **Plan mode antes de editar.** Errar no plano custa pouco; errar no código custa caro.
3. **Leitura dirigida.** Cada fase lista os arquivos e trechos a ler. Arquivos grandes (`CaseStudio.jsx` 2.429 linhas, `simuladorCasosData.js` 2.291, `SbarHandoffLab.jsx` 1.905, `Videochamada.jsx` 898) **nunca são lidos inteiros**: use `Grep` e intervalos de linhas.
4. **Se o código não bater com o plano, pare e relate.** Não improvise arquitetura nova.
5. **Subagentes com `model: "sonnet"`** para trabalho mecânico (dados, conversões, falas em lote), conforme o `CLAUDE.md`.
6. **Validação uma vez, no fim de cada etapa:** `npm run lint && npm run typecheck && npm test`. O `npm run build` roda só no fim da fase.
7. **Commits pequenos**, um por etapa, para dar para reverter só o que quebrou.
8. **Feature flag:** cada módulo novo entra desligado (`src/features/flags.js`) e só aparece na navegação quando for aprovado. Rotas antigas ficam vivas até a F8.

### Quando algo der errado
- **Bug numa fase já mergeada:** abra uma sessão nova com *"Leia `00-contexto.md`, `ESTADO.md` e a seção X da fase N. Bug: …"*. Não releia o plano inteiro.
- **IA do paciente se comportando mal:** ajuste o prompt em `ia/paciente.md` e rode a bateria de `ia/testes-comportamento.md` (F3, etapa 6).
