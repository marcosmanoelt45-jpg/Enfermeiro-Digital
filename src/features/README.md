# src/features

Convenções do plano Cenas ao Vivo (detalhes em `docs/plano/00-contexto.md`):

- Uma pasta por área: `src/features/<area>/` com `componentes/`, `logica/` (JS puro, sem React), `dados/` e hooks `use*.js`. A página é `<Area>Page.jsx`, com rota `lazy()` no `App.jsx`.
- `logica/` é pura e testável: imports **relativos** (sem `@/`), sem `window` e sem `localStorage`. Os testes são `*.test.mjs` com `node:test` e rodam com `npm test`.
- Estado de tela complexo usa `useReducer`, com o reducer em `logica/`.
- Todo `<audio>`, `MediaStream`, `WebSocket`, `setTimeout` e `AbortController` fecha no cleanup do efeito. Use o padrão `falaGen` de `src/services/simuladorVozService.js`.
- `localStorage` sempre com o id do usuário na chave e dentro de `try/catch`.
- IA só pelas Edge Functions próprias (`src/features/cena/servidor.js`), nunca por `callResilientAI`. Prompts e fichas de caso ficam no servidor.
- Conteúdo é dado (`dados/`), não JSX. Módulo novo entra atrás de flag (`src/features/flags.js`).
- Animação: `import { m as motion } from "framer-motion"` (o app usa `LazyMotion`) e só classes do Tailwind 3.
