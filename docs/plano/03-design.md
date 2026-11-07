# 03 — Design (padrão "Enfere Vivo" aplicado às cenas)

Fonte da verdade: `CLAUDE.md` (seção Design & Motion) + `src/components/ui/surface.jsx` + `src/components/ui/button.jsx` + `src/lib/motion.js`. O `DESIGN.md` está **desatualizado**: não use.
**Skills:** `impeccable` e `emil-design-eng` para decisões visuais; `motion-framer` para animação; `mobile-native` para toque; `review-animations` antes de fechar cada fase com interface; `stop-slop` + `humanizer` (adaptados ao PT-BR) para todo texto de interface e fala.

---

## 1. Tokens (use estes valores; não invente novos)
| Papel | Valor | Onde já está |
|---|---|---|
| Fundo da página | `#0B131D` | `bg-[#0B131D]` nas páginas |
| Superfície (Panel) | `#131F2E` com borda `#1F3045` | `Panel` |
| Superfície interna (Inset) | `#0E1722` com borda `#1F3045` | `Inset` |
| Tile / palco | `#16222E` com borda `#27394B` e base 3D `#0A1118` | `Tile`, `PacienteVideoStage` |
| Texto | `#EAF2F8`; secundário `#9FB3C6` | — |
| Marca | `#20D5B5` | foco, links, item ativo |
| Acerto / Erro / Alerta | `#3DD68C` / `#FF6B6B` / `#FFC247` | `Chip tone` |
| Info | `#38BDF8` | `Chip tone="info"` |
| Fonte | Nunito Variable (já é o `font-sans`) | — |
| Raios | página 24 px (`rounded-3xl`), cartões 16–20 px, botões pelo `Button` | — |

**Proibido:**
- classes claras (`bg-white`, `text-slate-900`, `border-slate-200`);
- `bg-teal-600 text-white` em cima do `Button`;
- gradientes novos;
- sombras difusas grandes (use a base 3D);
- emojis na interface (os ícones vêm do `lucide-react`).

## 2. Componentes base (criados na F0/F2; use sempre)
- `PageShell` (`src/components/layout/PageShell.jsx`, F0): esqueleto padrão (02 §3.1) com props `activeTab`, `semDock`, `larguraMax: 'xl'|'4xl'`. **A cena em tela cheia usa `semDock`** (o dock some durante a conversa e volta no relatório).
- `CenaAoVivo` (F2): layout de toda conversa (seção 3).
- `Button`, `Panel`, `Inset`, `Tile`, `Chip`, `AnimatedProgress`, `AnimatedNumber`, `toast` e os modais Radix existentes (`dialog`, `alert-dialog`). **Folhas inferiores** usam `sheetVariants` + `scrimVariants` como o `MobileBottomDock` (arraste só pelo puxador).

## 3. Layout da cena (mobile primeiro, 360–430 px)
```
┌──────────────────────────────────────┐
│ ←  Sr. Marcus · Leito 7      ⏱ 06:12 │  barra: voltar (confirma saída), nome, cronômetro, menu (⋯)
│ ▓▓▓▓▓▓▓▓▓░░░░  rapport ● ● ○          │  AnimatedProgress (turnos) + 3 pontos de rapport (só Consulta)
├──────────────────────────────────────┤
│                                      │
│        [ PersonagemStage 4:3 ]       │  Tile com base 3D; ~42% da altura útil
│                                      │
│  ┌──────────────────────────────┐    │
│  │ "Ah, eu tomo tudo certinho…" │    │  LegendaFala: balão, karaokê por palavra
│  └──────────────────────────────┘    │
├──────────────────────────────────────┤
│  Histórico (rolável, últimas falas)  │  Inset; balões aluno (direita, marca 15%) e personagem (esquerda, #16222E)
│  ...                                 │
├──────────────────────────────────────┤
│ [📋 Prontuário] [🩺 Examinar] [⋯]     │  ações da área (Plantão/Consulta), Button variant="secondary" size="sm"
│ ┌──────────────────────────┐ ┌─────┐ │
│ │ Escreva ou segure o mic… │ │ 🎤  │ │  Textarea autoexpansível + botão de microfone (size="xl", circular, btn-3d-teal)
│ └──────────────────────────┘ └─────┘ │
└──────────────────────────────────────┘  safe-area-inset-bottom respeitado
```
- **Desktop (≥ md):** duas colunas. À esquerda, palco e legenda (sticky); à direita, histórico e controles. Na Consulta e no Plantão, o prontuário entra como 3ª coluna em ≥ lg ou como folha lateral.
- **Microfone, botão "segurar para falar":**
  - em repouso: `btn-3d-teal`;
  - gravando: anel pulsante com `scale` 1→1.08 (opacidade, sem mudar o layout), ícone `Mic` → `AudioLines` e onda de nível (barras com `scaleY` a partir do RMS do microfone);
  - soltar envia para "revisar";
  - **toque curto** (< 300 ms) mostra a dica "Segure para falar".
- **Texto parcial** do STT aparece na própria Textarea, em `#9FB3C6`, enquanto o aluno fala, e vira `#EAF2F8` quando fecha.
- **Rapport:** 3 pontos (`●○○` baixo, `●●○` médio, `●●●` alto) com tooltip "Como o paciente está se sentindo com você". **Nunca mostre número.**
- **Estados obrigatórios** (cada um com o próprio visual, testados no aceite):
  - `carregando` (skeleton do palco com poster);
  - `personagem_falando` (legenda ativa; microfone continua disponível para interromper);
  - `aguardando_aluno` (dica sutil "Sua vez");
  - `aluno_falando`;
  - `revisando_texto` (botões Enviar e Descartar);
  - `processando` (o personagem vai para o clipe `pensando` + 3 pontinhos na legenda);
  - `erro_recuperavel` (Panel com borda `#FF6B6B`/30, texto do aluno preservado, "Tentar de novo");
  - `bloqueada` (cota ou demo: Panel com Goti `thinking` e CTA);
  - `sem_microfone` (o botão vira teclado e o toast explica uma vez);
  - `offline` (banner no topo).

## 4. Motion (regras do `CLAUDE.md` + específicas das cenas)
- Animar **só** `transform` e `opacity`. Interações abaixo de 300 ms. Entradas com `fadeUp`/`popIn` e saídas com `ease.out`. **Transição de página só por opacidade** (um transform num ancestral quebra o `position: fixed` do dock e das folhas).
- **Troca de clipe:** crossfade de opacidade de 150 ms entre os `<video>` empilhados (como o `PacienteVideoStage`). Nunca troque `src` do mesmo elemento, porque isso pisca no iOS.
- **Balões do histórico:** `fadeUp` em cada um novo, sem stagger na lista inteira.
- **Feedback:**
  - acerto: `vibrate(15)` + `popIn` no Chip "Correto" + clipe `acerto`/`feliz`;
  - erro: `vibrate([30,40,30])` + `shake` no campo + clipe `erro`/`pensando`.
  - **Sem sons** de acerto ou erro (pedido do dono).
- **Confete** (`celebrate.js`) só quando: Consulta com nota geral ≥ 70, Cálculo acertado de primeira em sequência de 5, Plantão completo ≥ 70%, ou meta do dia.
- **Minijogos:**
  - arrastar usa `drag` do Framer com `dragSnapToOrigin` quando cai fora do alvo, e o item sobe com `scale 1.05` + sombra 3D ao pegar;
  - soltar no alvo certo: `spring.snappy` até a posição;
  - errado: volta com `spring.sheet` + `shake` curto.
- `prefers-reduced-motion`: o `MotionConfig reducedMotion="user"` já cobre o Framer. Nos vídeos, mostre só o poster do `parado` e troque por fade simples.

## 5. Voz e texto (tom)
- **Interface:** PT-BR, frases curtas, voz ativa, segunda pessoa ("você"). Sem "Clique aqui", "Por favor" ou exclamação em excesso. Botões com verbo: "Começar consulta", "Enviar", "Encerrar consulta", "Ver relatório".
- **Personagens:**
  - paciente fala como leigo, conforme a escolaridade (`ia/paciente.md`);
  - médico é direto e apressado, mas respeitoso;
  - enfermeira é colega de plantão, objetiva, com leve informalidade ("Me passa o 7?").
- **Feedback educativo** sempre explica **por quê**, em uma frase, com a fonte quando houver ("POP de curativo: a lâmina não entra em curativo simples").
- **Nunca** culpe o aluno ("Você errou"). Prefira "Ainda não" ou "Quase: confere a unidade".

## 6. Acessibilidade
- Toda fala tem texto. Os vídeos são decorativos (`aria-hidden`), e a legenda é uma região `aria-live="polite"`.
- Alvos de toque ≥ 44 px. O microfone tem alternativa por teclado (Espaço segura, para o desktop).
- Minijogo de arrastar tem modo **tocar item → tocar alvo** (obrigatório; também é melhor no celular pequeno).
- Contraste: texto secundário só `#9FB3C6` ou mais claro sobre `#131F2E`.
- Foco visível: `ring-[#20D5B5]` (já está no `Button`).

## 7. Telas por área (resumo; detalhe nas fases)
| Área | Telas |
|---|---|
| Consulta | 1. Escolha (tema/aleatório + idade/sexo → personagem) · 2. Personalidade e dificuldade (cards com ícone; "Surpresa" em destaque) · 3. Briefing (Panel "O que a equipe já sabe" + "Começar consulta" `size="xl"`) · 4. Cena · 5. Registro (achados, NANDA, intervenções, "Examinar") · 6. Relatório |
| Cálculo | 1. Modo (Rotina, Plantão corrido, Prescrição com erro) · 2. Cena com o médico + **folha da prescrição** (Inset com aparência de receita) + teclado 3D · 3. Resultado da rodada |
| Plantão | 1. Escolha do cenário (cards com setor/leito) · 2. Cena com a enfermeira + **Prontuário** (folha inferior no celular, coluna no desktop) · 3. Relatório SBAR (4 cartões S/B/A/R) |
| Técnicas | 1. Lista (abas: Minijogos · POPs · Vídeos) com filtros por categoria (chips como os do `ProcedimentosLab`) · 2. Minijogo em tela cheia (`semDock`) · 3. Resultado |

## 8. Prontuário desenhado (Plantão)
Componente, **não imagem**: um `Inset` com aparência de folha (cabeçalho com leito, nome em iniciais, idade e diagnóstico; seções Sinais vitais · Balanço hídrico · Dispositivos · Exame físico · Evolução · Prescrição).
- **Campo faltando:** chip `tone="warning"` com "?" e o rótulo do campo ("Ausculta pulmonar ?"). Ao tocar, abre o minijogo; ao concluir, o valor aparece com `popIn` e o chip vira `success`.
- Fonte tabular (`tabular-nums`) nos números.
