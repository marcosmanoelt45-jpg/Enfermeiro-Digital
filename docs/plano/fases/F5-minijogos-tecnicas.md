# F5 — Motor de minijogos e aba Técnicas

**Branch:** `feat/cenas-f5-minijogos` · **Depende de:** F0 (a F2 é opcional, só para a fala de instrução) · **Risco:** baixo/médio · **Tamanho:** grande. Faça em duas sessões: 5.1–5.3 e 5.4–5.6.
**Objetivo:** um motor movido a dados com 5 tipos de minijogo, conteúdo inicial com custo baixo (os passos dos POPs viram minijogos automaticamente) e a página Técnicas.

## Ler
- `00-contexto.md`, `ESTADO.md`, este arquivo · `01-contratos.md` §C11 · `03-design.md` §4 (Minijogos), §6 e §7
- `src/services/procedureService.js` linhas 1–80 (formato de um procedimento) + `Grep` por `^  {` / `id:` para listar os ids
- `src/data/semiologyFindings.js` linhas 1–50 e 395–424
- `src/pages/ProcedimentosLab.jsx` (377 linhas: será embutido na aba)
- `docs/auditoria/procedures.md`: só o achado `procedures-1` · `src/components/procedures/EnfereClinicalPlayer.jsx` linhas 200–300

## Estrutura
```
src/features/minijogos/
  logica/avaliar.js           avaliarArrastar, avaliarOrdenar, avaliarTocar, avaliarMedir, avaliarEscolher  + testes
  logica/doProcedimento.js    gerarOrdenarDeProcedimento(proc) → C11 'ordenar'                          + teste
  logica/daSemiologia.js      gerarEscolherDeAchado(gapKey) → C11 'escolher'                            + teste
  dados/bandeja-curativo-simples.js · dados/ausculta-pulmonar.js · dados/contar-fr.js · dados/index.js (registro)
  componentes/MinijogoRunner.jsx   (cabeçalho, instrução, área do jogo, tentativas e resultado)
  componentes/tipos/Arrastar.jsx · TocarRegiao.jsx · Ordenar.jsx · Medir.jsx · Escolher.jsx
  componentes/ResultadoMinijogo.jsx
src/features/tecnicas/TecnicasPage.jsx · TecnicasLista.jsx
public/minijogos/ (imagens .webp, sons/, LICENCAS.md)
```

## Etapas

### 5.1 Lógica e testes
- **`avaliar*`:** recebe a definição + as ações do aluno e devolve `{ acertos, erros, concluido, detalhes[] }`.
  - **Arrastar:** acerto = item no alvo correto; colocar um item `alvoCorreto: null` em um alvo conta erro; concluído = todos os corretos dentro.
  - **Ordenar:** erro = cada par fora de ordem, por inversões. **Na prática,** mostre só quais passos estão fora de lugar.
  - **Medir:** `|valor − correto| ≤ tolerancia`.
  - **Tocar:** `objetivo:'explorar'` conclui quando todas as regiões foram tocadas; `'encontrar'` acerta a região `correta`.
- `gerarOrdenarDeProcedimento`: usa os `steps` (ordem por `stepNumber`), corta títulos longos em 70 caracteres e pula procedimentos com menos de 4 passos. **Teste com todos os procedimentos reais.**
- `gerarEscolherDeAchado`: mapeia `SEMIOLOGY_KNOWLEDGE_BASE[gapKey]` para `escolher`.

### 5.2 `MinijogoRunner` e os tipos
- **Props:** `definicao`, `onConcluir(resultado C11)`, `modo: 'livre'|'plantao'|'consulta'`, `onFechar`. Em tela cheia, use o `PageShell semDock`; dentro do Plantão ou da Consulta, abre numa folha inferior.
- **Arrastar:**
  - Framer `drag` com `dragSnapToOrigin` e alvos detectados por `getBoundingClientRect` do ponto de soltura;
  - **modo toque obrigatório:** tocar no item seleciona (anel `#20D5B5`) e tocar no alvo coloca;
  - itens em grade embaralhada (a semente vem do `Math.random`, mas fica fixa na sessão).
- **TocarRegiao:**
  - imagem com `aspect-ratio` fixo e regiões em % (círculos invisíveis com foco de teclado e rótulo para leitor de tela);
  - ao tocar, toca o `audio` (um `HTMLAudioElement` reaproveitado) e mostra o `achado`;
  - **sem áudio disponível, mostra o texto** ("Som: crepitações finas em base direita");
  - alterna entre vista anterior e posterior.
- **Ordenar:** lista reordenável com `Reorder` do Framer e botões ↑ ↓ para acessibilidade; "Conferir" marca os passos fora de lugar (`shake`).
- **Medir:**
  - `contar-fr` e `contar-pulso` animam o tórax (SVG simples, `scaleY` em loop na frequência do caso) ou um ponto pulsando por `duracaoSeg`; o aluno conta e digita;
  - `termometro` e `glicosimetro` são SVG com o valor no visor; `esfigmo` fica para depois.
  - Nenhum asset é necessário.
- **Escolher:** cartões A–D com o `feedback` de cada opção.
- **Resultado:** acertos, tempo, "por quê" (das explicações) e a fonte. Os botões são "Tentar de novo" e "Continuar". `vibrate` e `shake` seguem o `CLAUDE.md`.

### 5.3 Conteúdo inicial
- **`bandeja-curativo-simples`:**
  - **certos:** pacote de curativo estéril, SF 0,9%, gazes estéreis, luvas de procedimento, cobertura/fita, saco de lixo;
  - **distratores:** lâmina de bisturi, seringa de insulina, garrote, sonda vesical, algodão com álcool para a ferida.

  Cada distrator tem uma explicação de uma frase e a fonte é o POP de curativo do `procedureService` (se houver; senão, registre "conferir fonte" no `ESTADO.md`). **Imagens:** até chegarem do Flow (P1), use cartões com ícone `lucide` + rótulo. O tipo funciona sem imagem.
- **`ausculta-pulmonar`:** 6 focos anteriores e 6 posteriores. Regiões e achados de um caso de ICC (crepitações em bases). Os **sons** só entram com licença registrada em `public/minijogos/LICENCAS.md` (fonte, licença, autor, link). **Pergunte ao dono** quais arquivos usar; sem som, o modo texto fica.
- **`contar-fr`:** tórax a 28 irpm por 15 s; resposta 28 com tolerância de 2.
- **Ordenar:** gere todos a partir do `procedureService` e registre na lista com a categoria do procedimento.
- **Escolher:** gere os 10 a partir da semiologia.

### 5.4 Página Técnicas (`/tecnicas`, flag `tecnicas`)
- `PageShell activeTab="tecnicas"`, com abas segmentadas: **Minijogos · POPs · Vídeos**.
  - **Minijogos:** grade de `Tile` com ícone, título, tipo, tempo estimado e um Chip "Concluído" (do histórico), com filtros por categoria (chips como os do `ProcedimentosLab`).
  - **POPs:** a lista de procedimentos com o checklist (reaproveite os componentes de `src/components/procedures/`).
  - **Vídeos:** embute o conteúdo atual do `ProcedimentosLab` (extraia o corpo para `components/procedures/VideotecaConteudo.jsx`, sem o shell, e use nos dois lugares; `/procedimentos` continua igual).
- Corrija o `procedures-1` no `EnfereClinicalPlayer`, conforme a correção descrita na auditoria (API de mensagens do YouTube com checagem de origem).

### 5.5 Histórico e pontos
`moduleType: 'tecnica'`, `submitActivity` com `score = round(100 × acertos / (acertos + erros))` e `recordActivity('tecnica')`.

### 5.6 Registro e flag
O item "Técnicas" entra no registro de módulos com `flag: 'tecnicas'`. Com a flag ligada, o dock troca "Vídeos" por "Técnicas" (mesma posição).

## Aceite
- [ ] Os 5 tipos funcionam com toque (celular), mouse e teclado
- [ ] O modo "tocar item → tocar alvo" funciona sem arrastar
- [ ] Todos os procedimentos com 4 ou mais passos aparecem como "Ordenar" e são concluíveis
- [ ] Adicionar um minijogo novo exige só um arquivo em `dados/` (prove com o `contar-fr`)
- [ ] Nenhum áudio sem licença registrada
- [ ] O `/procedimentos` antigo continua funcionando

## Armadilhas
- `drag` do Framer dentro de um contêiner com rolagem: use `dragConstraints` na área do jogo e `touch-action: none` **só** nos itens.
- `Reorder` precisa de `key` estável (ids dos passos), não do índice.
- Imagens: `loading="lazy"` e `width`/`height` declarados (evita pulo de layout).
