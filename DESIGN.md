---
name: Enfere Vivo
colors:
  background: '#0B131D'
  surface: '#131F2E'
  surface-border: '#1F3045'
  inset: '#0E1722'
  tile: '#16222E'
  tile-border: '#27394B'
  tile-base: '#0A1118'
  text: '#EAF2F8'
  text-secondary: '#9FB3C6'
  brand: '#20D5B5'
  success: '#3DD68C'
  error: '#FF6B6B'
  warning: '#FFC247'
  info: '#38BDF8'
typography:
  family: Nunito Variable
---

# Design do Enfere ("Enfere Vivo")

Inspirado no jeito do Duolingo, sem copiar. Tema **escuro permanente**. As fontes da verdade no código são `src/components/ui/button.jsx`, `src/components/ui/surface.jsx`, `src/lib/motion.js` e as variáveis `--ease-*`/`--dur-*` de `src/index.css`.

## Cores
| Papel | Valor |
|---|---|
| Fundo da página | `#0B131D` |
| Panel (superfície) | `#131F2E`, borda `#1F3045` |
| Inset (superfície interna) | `#0E1722`, borda `#1F3045` |
| Tile / palco | `#16222E`, borda `#27394B`, base 3D `#0A1118` |
| Texto / secundário | `#EAF2F8` / `#9FB3C6` |
| Marca (foco, link, ativo) | `#20D5B5` |
| Acerto / Erro / Alerta e ofensiva | `#3DD68C` / `#FF6B6B` / `#FFC247` |
| Info | `#38BDF8` |

Raios: página 24 px (`rounded-3xl`), cartões 16 a 20 px. Fonte Nunito Variable (`font-sans`).

**Não use:** classes claras (`bg-white`, `text-slate-900`), `bg-teal-600 text-white` sobre o `Button`, gradientes novos, sombras difusas grandes, emoji como ícone (ícones vêm do `lucide-react`).

## Componentes
- **Botões:** sempre `<Button>` (variantes `primary`, `success`, `danger`, `warning`, `info`, `outline`, `locked`, `ghost`, `link`; tamanhos `sm`, `default`, `lg`, `xl`, `icon`; prop `loading`). Em `<button>` cru, `btn-3d-teal|emerald|amber|rose|sky|outline`. O lábio 3D é `box-shadow`: pressionar não desloca o layout.
- **Estrutura:** `PageShell` (com `semDock` nas cenas em tela cheia), `Panel`, `Inset`, `Tile`, `Chip`.
- **Progresso:** `AnimatedProgress` e `AnimatedNumber`.
- **Folhas inferiores:** `sheetVariants` + `scrimVariants`, como no `MobileBottomDock`.
- **Cenas ao vivo:** `CenaAoVivo` (`src/features/cena/`) com `PersonagemStage` (vídeo), `LegendaFala` (karaokê), `HistoricoFalas` (com "ouvir de novo") e `ControleFala` (clique no microfone para começar e de novo para enviar; Espaço no teclado).

## Navegação
Registro único em `src/features/navegacao/modulos.js`. Dock do celular: **Início · Prática · Cálculo · Técnicas · Perfil**; "Prática" abre a gaveta com Consulta ao Vivo, Plantão, Casos Clínicos e Continuar. Header do computador: Início · Consulta ao Vivo · Plantão · Cálculo · Técnicas · Casos Clínicos.

## Motion
- Só `transform` e `opacity`. Interações abaixo de 300 ms. Entradas e saídas com ease-out. Nunca `scale(0)`.
- Transição de página só por opacidade: um `transform` num ancestral quebra o `position: fixed` do dock e das folhas.
- Não anime ações repetidas o dia todo. O app já usa `MotionConfig reducedMotion="user"`.
- Vídeo do personagem: crossfade de opacidade entre `<video>` empilhados; fora da fala, congela no primeiro quadro.

## Feedback
- Acerto: `vibrate(15)` + pop. Erro: `vibrate([30,40,30])` + `shake`.
- **Sem sons** de acerto ou erro.
- Confete (`src/lib/celebrate.js`) só em momentos raros: acerto de primeira, sessão com 70% ou mais, meta do dia.

## Texto da interface
PT-BR, frases curtas, voz ativa, "você". Botões com verbo ("Começar consulta", "Encerrar e registrar"). Feedback explica o porquê em uma frase e nunca culpa o aluno ("Ainda não", "Quase: confere a unidade"). Gênero neutro quando falar com o aluno.

## Acessibilidade
Toda fala tem texto (legenda `aria-live="polite"`; vídeo decorativo). Alvos de toque de 44 px ou mais. Arrastar sempre tem o modo tocar item → tocar alvo. Foco visível `ring-[#20D5B5]`. Texto secundário só `#9FB3C6` ou mais claro sobre `#131F2E`.
