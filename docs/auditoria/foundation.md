# Área: Design-system foundation & app shell (foundation)

**Status:** NÃO VERIFICADO (25 achados)

**Arquivos desta área (edite só estes):** src/index.css, tailwind.config.js, src/components/ui/** , src/lib/motion.js, src/lib/celebrate.js, src/lib/utils.js, src/App.jsx, src/main.jsx, src/components/StudentHeader.jsx, src/components/StudentFooter.jsx, src/components/mobile/MobileHeader.jsx, src/components/ErrorBoundary.jsx, src/components/ScrollToTop.jsx, src/lib/PageNotFound.jsx, src/components/EnfereSplash.tsx, DESIGN.md

**Foco:** Rewrite DESIGN.md to describe the real system (Nunito, dark Enfere Vivo palette, 3D buttons, motion tokens). Audit index.css for dead/duplicated rules and fragile global overrides; keep any override that other files still rely on (grep before removing). Polish headers, 404, error boundary and splash with the system. Accessibility: focus states, reduced motion, 44px targets.

## Achados

### foundation-1 [high / bug] src/lib/PageNotFound.jsx:6
- Problema: O título '404' e o subtítulo da página 404 ficam quase invisíveis no tema escuro permanente. O texto do botão também está errado ('Voltar para os Pacientes'), e o botão não usa o sistema 3D.
- Evidência: `<div className="min-h-screen ... bg-slate-50">` é forçado para #0E1720 por index.css:178 (`html.dark .min-h-screen.bg-slate-50`), mas `<h1 className="text-6xl font-extrabold text-slate-800">` usa slate-800 = #27394B (tailwind.config.js:34). O contraste é de cerca de 1,5:1. O override de index.css:187-193 só corrige `button.text-slate-800`, então h1 e p continuam ilegíveis. O link é `bg-teal-600 ... rounded-lg` com o texto 'Voltar para os Pacientes', mas a rota '/' é o Hub do Estudante.
- Correção: Reescrever a página no tema escuro com tokens: `<main className="min-h-dvh grid place-items-center bg-[#0E1720] px-4">`, o rosto do Goti (goti-icone-oficial.png, 96px), o h1 'Página não encontrada' em text-[#EAF2F8] font-black, o p em text-[#9FB3C6] e `<Button asChild size="lg"><Link to="/">Voltar ao início</Link></Button>`. Adicionar a entrada fadeUp/popIn de motion.js. Depois remover index.css:178-184.

### foundation-2 [high / accessibility] src/index.css:134
- Problema: A raiz fica em 14px com !important. Isso encolhe toda a escala rem para 87,5%: alvos de toque ficam abaixo de 44px, o iOS dá zoom ao focar inputs e a preferência de tamanho de fonte do navegador do usuário é ignorada.
- Evidência: `html.font-size-normal, html.font-size-normal body { font-size: 14px !important; }`, e normal é o padrão (ThemeContext `|| 'normal'`). Consequências: Button default `h-10` = 35px, sm `h-8` = 28px, icon `h-10` = 35px (button.jsx:44-48); os botões Conta e Sair do StudentHeader `h-9` = 31,5px; Input `text-base md:text-sm` (input.jsx:10) vira 14px, abaixo dos 16px que evitam o zoom do iOS (regra 4 do skill mobile-native).
- Correção: Trocar px por porcentagem para respeitar a preferência do usuário: normal `font-size: 87.5%`, large `103%`, xlarge `119%`, sem !important e só no `html` (não no body). Garantir alvos em px independentes do rem: em button.jsx, default `h-10 min-h-[44px]`, icon `size-10 min-h-[44px] min-w-[44px]` e sm só para uso desktop (`@media (pointer:coarse){min-h-[44px]}`). Em input.jsx e textarea.jsx usar `text-[max(16px,1rem)]` e remover `md:text-sm`.

### foundation-3 [high / design] DESIGN.md:1
- Problema: O DESIGN.md descreve outro produto: tema claro, fonte Inter e primária #0d9488. Nada disso existe. Qualquer agente ou pessoa que o siga vai produzir telas fora do sistema.
- Evidência: `font-family-sans: Inter`, `primary: '#0d9488'`, `background: '#f8fafc'`, 'Glassmorphism & Superfícies Limpas: Fundo neutro suave (#F8FAFC)'. O real: Nunito (tailwind.config.js:21), tema escuro fixo (ThemeContext `useState('dark')`), aqua #20D5B5, botões 3D (index.css:360-448, button.jsx) e tokens de motion.js.
- Correção: Reescrever o DESIGN.md com estas seções. (1) Princípios: escuro 'Enfere Vivo', tátil e calmo para plantão. (2) Cores: bg #0E1720, header/dock #0B131D, surface #16222E, line #27394B, line-strong #1F3045, base/lábio #0A1118, text #EAF2F8, text-sec #9FB3C6, aqua #20D5B5 com lábio #149F86 e tinta #06302E, green #3DD68C, amber #FFC247, coral #FF6B6B/#F0645F, sky #5AC8FA, indigo #B4B7FF, com uso semântico e contraste mínimo. (3) Tipografia: Nunito 400-900 com escala definida (display 900 32/36, título 800 20/26, corpo 600 15/22, legenda 700 11 uppercase tracking) e números tabulares. (4) Raios: chip 14, botão 16, cartão 18, cápsula 999. (5) Botões: variantes do Button (primary, success, warning, danger, info, outline, secondary, ghost, locked), lábio box-shadow 4px que afunda em --dur-press, alvos mínimos de 44px, prop loading. (6) Movimento: ease.out/drawer/overshoot, duration press/fast/base/slow, springs snappy/sheet/glide/pop/fill, padrões fadeUp/listStagger/popIn/sheetVariants/shake, AnimatedNumber/AnimatedProgress, celebrate() só em marcos, vibrate(), NENHUM som de acerto/erro, MotionConfig reducedMotion=user. (7) Foco: outline 2px #20D5B5 offset 2. (8) Componentes de referência: EnfereVivoTrail, MobileBottomDock, PlurallQuestionCard, ResetPassword. (9) O que não fazer: classes claras (bg-white, text-slate-800), hex soltos fora dos tokens, alert().

### foundation-4 [medium / bug] src/App.jsx:103
- Problema: O splash inicial é montado antes de a autenticação resolver, e o EnfereSplash só lê isAuthenticated e userName uma vez. Um usuário logado vê 'Começar / Já tenho uma conta', e um toque em 'Começar' antes do fim do carregamento o leva para /register.
- Evidência: App.jsx:103 renderiza `<EnfereSplash isAuthenticated={isAuthenticated} .../>` antes do teste `if (isLoadingPublicSettings || isLoadingAuth)` (linha 126). EnfereSplash.tsx:400-410: `useEffect(() => mountEnfereSplash(ref.current, { isAuthenticated: cb.current.isAuthenticated, ... }), [])`. Os textos são fixados em mountEnfereSplash:186-196 e nunca atualizados. onGetStarted (App.jsx:111) decide `isAuthenticated ? navigate('/') : navigate('/register')` com o valor do momento, que pode ser false enquanto a autenticação carrega.
- Correção: Em EnfereSplash.tsx, devolver do mount um `setAuth(isAuth, name)` que reescreve tag, b1 e b2, e chamá-lo num segundo useEffect com deps [isAuthenticated, userName]. Adicionar a prop `isLoadingAuth` e manter `.es-btns` em pointer-events:none com um spinner até a autenticação resolver. Em App.jsx, passar isLoadingAuth e, no onGetStarted, não navegar enquanto isLoadingAuth for true.

### foundation-5 [medium / bug] src/App.jsx:99
- Problema: Num link direto para uma rota protegida (ex.: /calculo-doses vindo do WhatsApp), o splash aparece e depois 'Acessar Plataforma' manda para '/', perdendo o destino.
- Evidência: `// Ao iniciar o site na raiz ou outras rotas, exibe a abertura\n    return true;` e depois, no onGetStarted: `if (isAuthenticated) { navigate("/"); }`. Para quem não está logado, `navigate("/register")` também descarta o caminho original, apesar de existir src/lib/authReturnTo.js.
- Correção: Mostrar o splash só quando `path === '/'`, ou guardar `const returnTo = location.pathname + location.search` no estado inicial e usar `navigate(isAuthenticated ? returnTo : '/register', { state: { returnTo } })`. O mesmo vale para o onHaveAccount, via authReturnTo.

### foundation-6 [medium / design] src/components/StudentHeader.jsx:110
- Problema: Entre 768px e 1023px (tablets e celulares em paisagem) não existe navegação principal: a nav do header só aparece a partir de lg e o dock some a partir de md.
- Evidência: StudentHeader: `<nav className="hidden lg:flex items-center gap-1.5">`. MobileBottomDock.jsx:179: `<nav className="fixed bottom-0 ... md:hidden">`. No StudentDashboard o header é `desktopOnly` (`hidden md:block`), então em md há header sem nav e sem dock.
- Correção: Trocar a nav para `hidden md:flex`, com rótulos compactos em md (`<span className="hidden xl:inline">`) e só ícone com aria-label entre md e xl, ou trocar o dock para `lg:hidden` e o header para `hidden lg:block`. Usar o mesmo breakpoint nos dois (constante única).

### foundation-7 [medium / accessibility] src/index.css:195
- Problema: O override global de contraste é frágil: ele não cobre botões nem qualquer elemento que tenha 'bg-' em alguma classe, inclusive hover:bg-*. Esses textos text-slate-500 ficam em #52667A sobre #0E1720 (cerca de 3,0:1, reprovado no AA).
- Evidência: `html.dark .text-slate-500:not([class*="bg-"]):not(button):not(svg) { color: #9FB3C6; }`. Um `<span className="text-slate-500 hover:bg-slate-800">` casa com [class*="bg-"] e fica de fora. O mesmo vale para os `<button className="text-slate-500 ...">`. tailwind.config.js:31 mapeia `500: "#52667A"`.
- Correção: Como o tema é escuro permanente, corrigir na fonte: em tailwind.config.js, slate-500 → `#8A9DB1` (cerca de 6,5:1 sobre #0E1720) e slate-600 → `#6F849A` (só para texto grande e ícones). Depois apagar index.css:195-202. Manter 187-193 (botões text-slate-700/800) até migrar esses botões para o Button.

### foundation-8 [medium / design] tailwind.config.js:33
- Problema: As escalas de cor remapeadas não são monotônicas e colidem entre si. Faltam tokens semânticos, então os headers usam hex soltos (#0B131D, #16222E, #27394B…) espalhados pelo código.
- Evidência: `700: "#27394B"` e `800: "#27394B"` são idênticos, então hover:bg-slate-700 → slate-800 não muda nada. Emerald: `300: "#3DD68C"` (verde), `400: "#2AD3C1"` (aqua), `500: "#1FC7B6"` (aqua), `600: "#1F9D63"` (verde), `700: "#12A596"` (aqua): o tom alterna entre verde e aqua a cada passo. StudentHeader usa `bg-[#0B131D]/95`, `border-[#1F3045]`, `text-[#9FB3C6]` e o foco do button.jsx usa `ring-offset-[#0B131D]`.
- Correção: Adicionar em theme.extend.colors um grupo `vivo: { bg:'#0E1720', chrome:'#0B131D', surface:'#16222E', raised:'#1B2938', line:'#27394B', 'line-strong':'#1F3045', lip:'#0A1118', text:'#EAF2F8', muted:'#9FB3C6', aqua:{DEFAULT:'#20D5B5', lip:'#149F86', ink:'#06302E'}, green:'#3DD68C', amber:'#FFC247', coral:'#FF6B6B', sky:'#5AC8FA', indigo:'#B4B7FF' }`. Separar slate-800 (`#1F3045`) de slate-700. Tornar emerald monotônico e todo verde (300 #6EE3AA, 400 #3DD68C, 500 #2BC07A, 600 #1F9D63, 700 #187A4D), deixando o aqua só em teal. Migrar os headers e o Button para `bg-vivo-chrome` etc. com busca e troca (hex → token).

### foundation-9 [medium / dead-code] src/components/ui/alert.jsx:1
- Problema: O arquivo commitado está corrompido: em vez de código, contém um trecho truncado de saída de ferramenta. Qualquer import dele quebra o build, e o eslint ignora src/components/ui, então nada acusa o problema.
- Evidência: Conteúdo inteiro: `import { cn } fro\n<truncated 440490 bytes>\n\nNOTE: The output was truncated because it was too long...`. Ele já está assim em HEAD (commit a9f3565). Hoje nenhum arquivo importa "@/components/ui/alert".
- Correção: Apagar src/components/ui/alert.jsx, ou recriá-lo como Alert Enfere Vivo (`rounded-2xl border-2 bg-[#16222E] border-[#27394B] p-4` com as variantes info/warning (#FFC247)/danger (#FF6B6B)/success, ícone e role="alert" só para danger). Tirar `src/components/ui/**/*` do ignore do eslint (eslint.config.js:20), ou ao menos rodar parse nele.

### foundation-10 [medium / design] src/components/ErrorBoundary.jsx:24
- Problema: A tela de erro é clara por padrão, sobrescreve o Button outline com classes avulsas, não anuncia o erro a leitores de tela, existe só no topo (qualquer widget que quebra derruba o app inteiro, sem reset ao trocar de rota) e não trata o erro de chunk lazy após um deploy na Vercel.
- Evidência: `bg-slate-50 dark:bg-slate-950 ... bg-white dark:bg-slate-900 border border-slate-200`, `<Button variant="outline" className="... border-slate-200 dark:border-slate-800 text-slate-700 ... hover:bg-slate-100">`. `h-11` = 38,5px com a raiz de 14px. Não há role="alert". App.jsx:207 tem um único `<ErrorBoundary>` fora do Router, e as 20 páginas são `lazy()`: um 'Failed to fetch dynamically imported module' vindo de uma aba aberta antes do deploy cai nesta tela.
- Correção: Visual: `<div role="alert" className="min-h-dvh grid place-items-center bg-[#0E1720] p-4">`, cartão `rounded-[18px] border-2 border-[#27394B] bg-[#16222E]`, Goti em pose de preocupação, `<Button size="lg">Recarregar</Button>` e `<Button variant="outline" size="lg">Ir para o início</Button>` sem classes de cor extras. Lógica: em getDerivedStateFromError, se `/dynamically imported module|ChunkLoadError|Loading chunk/i.test(error.message)` e `!sessionStorage.getItem('enfere_chunk_reload')`, gravar a flag e chamar `location.reload()`. Envolver `<Routes>` num segundo `<ErrorBoundary key={location.pathname}>` dentro do Router, para cada rota se recuperar ao navegar.

### foundation-11 [medium / accessibility] src/components/EnfereSplash.tsx:95
- Problema: O 'Pular' do splash não funciona por teclado e tem alvo minúsculo. Os botões invisíveis recebem foco durante a intro, e com movimento reduzido o vídeo do Goti continua em loop.
- Evidência: `<div class="es-skip-hint" role="button" aria-label="Pular introdução">Pular ✕</div>` não tem tabindex nem keydown, e tem `padding:4px 12px;font-size:0.75rem` (cerca de 24px de altura). `.es-btns{opacity:0;pointer-events:none}` não tira os botões da ordem de Tab: Tab+Enter dispara 'Começar' invisível. Em run(), quando matchMedia(reduced) → `toEnd()` → `playWaveVideo()` sempre (o vídeo tem `loop`). FONT lista "Baloo 2", que nunca é carregada.
- Correção: Trocar o skip por `<button type="button" class="es-skip-hint">Pular</button>` com `min-height:44px;padding:0 16px`. Pôr `inert` em .es-btns até ready() (`btns.inert = true` / `false`). Em toEnd(), quando há movimento reduzido, não chamar playWaveVideo: mostrar só o fallback estático `gotiPoseWave` (png). Remover "Baloo 2" do FONT. Alinhar os botões ao sistema: lábio por `box-shadow: 0 5px 0 #149F86` em vez de border-bottom, `:active{transform:translateY(5px);box-shadow:0 0 0 #149F86}` com `110ms cubic-bezier(.23,1,.32,1)`.

### foundation-12 [medium / accessibility] src/components/StudentHeader.jsx:166
- Problema: O botão Sair só tem ícone e nenhum nome acessível. Os itens da nav não marcam a página atual. O botão de PE, escondido, continua montado e ouvindo eventos. E o triggerHaptic toca um bipe de áudio a cada toque na nav, em vez de vibrar.
- Evidência: `<Button variant="ghost" size="sm" ... title="Sair da Plataforma"><LogOut className="h-4 w-4" /></Button>` só tem title, sem aria-label. Os botões da nav não têm `aria-current`. O botão de PE é `className="hidden items-center ..."`, mas `window.addEventListener("storage", handleStorage)` continua ativo. `triggerHaptic(12)` em ThemeContext cria um AudioContext e toca um oscilador de 45ms (`osc.type = 'triangle'`), apesar do comentário 'Vibração física ... desativada'. A cor também é avulsa (`bg-amber-50 dark:bg-amber-950/60`).
- Correção: Adicionar `aria-label="Sair da conta"` ao Sair e `aria-current={isActive ? 'page' : undefined}` à nav. Remover o botão de PE, o estado studyPoints, o listener de storage e o GotiStudyPointsModal enquanto a 'diretriz' mantiver isso oculto. Trocar `triggerHaptic(n)` por `vibrate(n)` de '@/lib/motion' (respeita enfermeiro_haptic e não emite som). Conta e Sair passam a `size="icon"` (já com min 44px, ver foundation-2) e sem classes de cor sobrescritas: Conta `variant="outline"`, Sair `variant="ghost" className="text-[#F0645F]"`.

### foundation-21 [medium / design] index.html:12
- Problema: O Nunito é carregado só nos pesos 600-900, então todo texto font-normal/medium é renderizado a 600 (sem hierarquia de peso). Também falta viewport-fit=cover, o que zera os env(safe-area-inset-*) usados pelo splash e pelo dock no iPhone.
- Evidência: `family=Nunito:wght@600;700;800;900`. Há texto `font-medium` em ErrorBoundary:43, StudentFooter:26 e em dezenas de páginas. `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` sem `viewport-fit=cover`, enquanto MobileBottomDock:179 usa `pb-[calc(10px+env(safe-area-inset-bottom,0px))]` e o splash usa `env(safe-area-inset-bottom)`. Não há `<meta name="theme-color">`.
- Correção: Usar `family=Nunito:wght@400;500;600;700;800;900&display=swap` (ou 500-900 se o 400 ficar fino demais no escuro). Viewport: `width=device-width, initial-scale=1, viewport-fit=cover`. Adicionar `<meta name="theme-color" content="#0B131D">` e `<meta name="color-scheme" content="dark">`. Documentar os pesos no DESIGN.md.

### foundation-13 [low / design] tailwind.config.js:19
- Problema: Utilitários com nomes do Tailwind v4 (shadow-xs, shadow-2xs, backdrop-blur-xs, drop-shadow-xs/2xs) não existem no Tailwind 3.4 e não geram CSS nenhum. Vários desfoques e sombras do app, inclusive o do PageLoader, simplesmente não aparecem.
- Evidência: package.json: `"tailwindcss": "^3.4.17"`. App.jsx:40: `backdrop-blur-xs`; ErrorBoundary.jsx:34: `shadow-xs`; StudentHeader.jsx:195: `drop-shadow-xs`; MobileHeader.jsx:110: `shadow-2xs`. Ocorrências: cerca de 44 shadow-xs, 8 blur-xs e 47 *-2xs/drop-shadow-xs em src.
- Correção: Em theme.extend adicionar `boxShadow: { xs: '0 1px 2px 0 rgb(0 0 0 / 0.25)', '2xs': '0 1px 0 0 rgb(0 0 0 / 0.2)' }`, `backdropBlur: { xs: '2px' }`, `dropShadow: { xs: '0 1px 1px rgb(0 0 0 / 0.25)', '2xs': '0 1px 0 rgb(0 0 0 / 0.2)' }`. Isso restaura a intenção sem mexer em ~100 arquivos.

### foundation-14 [low / dead-code] src/index.css:159
- Problema: Cerca de 170 linhas de CSS global não são usadas em nenhum arquivo, e há várias regras exclusivas do tema claro, que foi abandonado.
- Evidência: Classes sem nenhum uso fora do index.css (grep em src): `.haptic-active-shake` (159), `.hover-lift` (217-223), `.glass-panel` (234-243), `@keyframes gotiFloat/gotiBreathe/gotiBounceJoy/gotiWave` + `.animate-goti-*` (246-313), `.hide-on-short-landscape` (315-319), `.btn-clinical` (seletores 362/404/412/418), `.card-3d`/`.card-3d-interactive` (453-485), `.progress-capsule`/`-fill` (490-518, substituído por AnimatedProgress), `.badge-streak-3d` (521-539). Só para tema claro: `html:not(.dark) ...` (166-170, 182-184, 401) e a paleta clara de :root (7-48), já que ThemeContext fixa `useState('dark')`. EM USO, manter: .no-scrollbar, .tap-press, .press-lip, .card-press, .progress-shine, .animate-flame-subtle, .btn-3d-*, as escalas font-size-*, .night-shift-mode e o ocultamento de controles de vídeo (EnfereClinicalPlayer/GotiAnimated usam controles próprios).
- Correção: Apagar os blocos listados. Mover os valores escuros para :root, mantendo a classe .dark no html para as variantes `dark:` (o bloco .dark pode virar `:root, .dark { ... }`). Remover `.btn-clinical` das listas de seletores. Apagar 178-184 só depois de corrigir PageNotFound (foundation-1): AssignmentAnswer e TurmaDetail, que também usam `min-h-screen bg-slate-50`, não estão roteados.

### foundation-15 [low / design] src/index.css:112
- Problema: Regras de base duplicadas e contraditórias para html/body: o fundo é definido três vezes e o tap-highlight duas.
- Evidência: 112-119: `background-color: var(--vivo-bg); color: var(--vivo-text); @apply bg-background text-foreground ...` (o @apply sobrescreve a linha anterior). 172-176: `html.dark, html.dark body { background-color: #0E1720; color: #EAF2F8; }` de novo. 544-548: `html, body { -webkit-tap-highlight-color: transparent; ... }` repete a linha 118.
- Correção: Deixar um único bloco em @layer base: `html,body{font-family:'Nunito',...;background-color:var(--vivo-bg);color:var(--vivo-text);-webkit-tap-highlight-color:transparent;touch-action:manipulation;-webkit-font-smoothing:antialiased} ::selection{background:rgb(32 213 181/.35);color:#EAF2F8}`. Apagar 166-176 e 544-548.

### foundation-16 [low / dead-code] src/components/StudentFooter.jsx:51
- Problema: A gaveta 'de bolso' do rodapé nunca abre, porque o MobileBottomDock não aceita props, então onOpenOptions também é código morto. O rodapé usa classes claras e aparece com dock e gaveta de logout na página pública de LGPD.
- Evidência: `<MobileBottomDock onOpenPocketMenu={() => setIsPocketDrawerOpen(true)} />`, mas MobileBottomDock.jsx:22 é `export default function MobileBottomDock() {` e ignora a prop, então isPocketDrawerOpen nunca vira true. `bg-white dark:bg-slate-950 border-slate-100`. PrivacyPolicyLGPD (rota pública /faq, /ajuda) renderiza `<StudentFooter />`, que inclui o dock autenticado.
- Correção: Remover o estado isPocketDrawerOpen, o import e o uso de MobilePocketDrawer, e a prop onOpenOptions (ou ligar ao dock se o produto quiser a gaveta). Rodapé: `border-t-2 border-[#1F3045] bg-[#0B131D] text-[#9FB3C6]`, links como `<Link>` com min-h-[44px], e `flex-col sm:flex-row flex-wrap`. Adicionar a prop `showDock` (default true) e passar `showDock={isAuthenticated}` em PrivacyPolicyLGPD.

### foundation-17 [low / dead-code] src/components/mobile/MobileHeader.jsx:1
- Problema: Componente inteiro sem nenhum uso, todo em estilo claro e com bugs latentes: touch-action pan-x bloqueia a rolagem vertical, e o arraste com o mouse aciona o clique no chip.
- Evidência: `grep -rn MobileHeader src` só encontra o próprio arquivo. Usa `bg-white/95 ... bg-emerald-700 ... text-slate-800`, `style={{ touchAction: 'pan-x' }}` e onMouseDown/onMouseMove sem suprimir o click.
- Correção: Apagar src/components/mobile/MobileHeader.jsx. Se o padrão de chips voltar a ser preciso, partir de EnfereVivoTrail/MobileBottomDock com `touch-action: pan-x pan-y`, `overscroll-behavior-x: contain` e sem converter o wheel em scroll horizontal.

### foundation-18 [low / design] src/components/ui/dialog.jsx:39
- Problema: Dialog e AlertDialog seguem o padrão shadcn claro: rótulo em inglês, botão de fechar de 16px e, no celular, o modal encosta nas bordas da tela sem raio.
- Evidência: `<span className="sr-only">Close</span>`. O botão de fechar é `absolute right-4 top-4 rounded-sm opacity-70` com `<X className="h-4 w-4" />`, sem padding (alvo de cerca de 14px). O conteúdo é `w-full max-w-lg ... border bg-background p-6 shadow-lg ... sm:rounded-lg` (sem raio abaixo de sm) e o título `font-semibold`.
- Correção: DialogContent/AlertDialogContent: `w-[calc(100%-2rem)] max-w-lg rounded-[18px] border-2 border-[#27394B] bg-[#16222E] p-5 shadow-[0_4px_0_#0A1118]`. Overlay `bg-[#0A1118]/80 backdrop-blur-sm`. Fechar: `absolute right-3 top-3 grid size-11 place-items-center rounded-[14px] text-[#9FB3C6] hover:bg-white/5` com `<span className="sr-only">Fechar</span>`. Título `text-lg font-black text-[#EAF2F8]`, descrição `text-[#9FB3C6]`. No celular, avaliar uma variante de folha inferior com sheetVariants.

### foundation-19 [low / accessibility] src/components/ui/toast.jsx:65
- Problema: No toque, o botão de fechar do toast é invisível (só aparece no hover). O viewport no celular fica no topo, sem safe-area, por cima do header sticky. O visual é shadcn claro.
- Evidência: `ToastClose`: `opacity-0 ... group-hover:opacity-100` com alvo `p-1` + ícone h-4. Viewport `fixed top-0 z-[100] ... p-4`. Toast `rounded-md border p-4 ... bg-background`. O título usa `font-semibold`.
- Correção: Fechar: `opacity-100 size-9 grid place-items-center rounded-xl text-[#9FB3C6]` (remover o group-hover). Viewport: `top-[calc(env(safe-area-inset-top)+8px)]` no celular, ou ancorar no bottom acima do dock (`bottom-[calc(76px+env(safe-area-inset-bottom))]`). Toast: `rounded-2xl border-2 border-[#27394B] bg-[#16222E] text-[#EAF2F8] shadow-[0_4px_0_#0A1118]`. Variante destructive: `border-[#FF6B6B]/50 bg-[#2B1619]`. Adicionar success: `border-[#3DD68C]/50`. Sem som.

### foundation-20 [low / design] src/components/ui/input.jsx:10
- Problema: O Input e o Textarea base são o padrão shadcn (36px, raio md, anel de 1px) e não seguem o sistema. Todo consumidor precisa sobrescrever, e a referência ResetPassword já passa `h-12` à mão.
- Evidência: `flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm ... focus-visible:ring-1 focus-visible:ring-ring ... md:text-sm`. ResetPassword.jsx:99/116 usa `className="pl-10 h-12"`.
- Correção: Input: `flex h-12 w-full rounded-[14px] border-2 border-[#27394B] bg-[#0E1720] px-4 text-[max(16px,1rem)] font-bold text-[#EAF2F8] placeholder:text-[#52667A] transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#20D5B5] focus-visible:ring-4 focus-visible:ring-[#20D5B5]/20 aria-[invalid=true]:border-[#FF6B6B] disabled:opacity-50`. Textarea com o mesmo estilo e `min-h-[96px] py-3`.

### foundation-22 [low / performance] src/main.jsx:8
- Problema: Toda volta pelo histórico vinda de outra página recarrega o app inteiro, porque o bfcache é desligado. A limpeza de Service Worker/cache está triplicada.
- Evidência: `window.addEventListener('pageshow', (event) => { if (event.persisted) { window.location.reload(); } });`. A mesma limpeza de SW/caches aparece em index.html:41-57 (apaga TODOS os caches a cada carregamento), em public/registerSW.js e em main.jsx:14-42. main.jsx ainda manda SKIP_WAITING e escuta controllerchange → reload.
- Correção: Remover o handler de pageshow (o motivo era SW antigo, que já é removido). Deixar a limpeza só em public/registerSW.js, que já está no index.html, e apagar o bloco inline do index.html e o de main.jsx. Depois de alguns meses (todos os clientes limpos), remover a limpeza de vez.

### foundation-23 [low / bug] src/App.jsx:130
- Problema: Há efeito colateral durante o render (redirecionamento com window.location dentro do corpo do componente), e um modo demo controlado por query string vai para produção.
- Evidência: `} else if (authError.type === 'auth_required') { navigateToLogin(); return null; }`, em que navigateToLogin faz `window.location.href = '/login'` durante o render. SplashPage:48-50: `query.get("demo") === "auth" ... query.get("user") || "Marcos"` permite /splash?demo=auth&user=X exibir 'Olá, X! Seu plantão está pronto.' com o botão 'Acessar Plataforma'.
- Correção: Trocar por `return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />`. Restringir o modo demo a `import.meta.env.DEV` (`const isDemoAuth = import.meta.env.DEV && ...`) ou removê-lo.

### foundation-24 [low / accessibility] src/components/ScrollToTop.jsx:24
- Problema: A rolagem suave até a âncora ignora prefers-reduced-motion, porque o CSS global não afeta scrollIntoView chamado por JS.
- Evidência: `document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });`
- Correção: `import { prefersReducedMotion } from '@/lib/motion';` e `scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })`. Mover o foco para o alvo (`el.focus({ preventScroll: true })` com tabIndex=-1) para leitores de tela.

### foundation-25 [low / design] src/App.jsx:39
- Problema: O PageLoader é um spinner genérico claro por padrão. O desfoque dele não existe no Tailwind 3, e ele cobre a tela inteira a cada chunk lazy, causando um flash.
- Evidência: `<div className="fixed inset-0 ... bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xs z-50"><div className="w-8 h-8 border-4 border-teal-200 ... animate-spin">`. Não tem role="status" nem texto para leitor de tela.
- Correção: `<div role="status" aria-live="polite" className="fixed inset-0 z-50 grid place-items-center bg-[#0E1720]">` com o rosto do Goti em `animate-goti-breathe` (reaproveitar o keyframe gotiBreathe em vez de apagá-lo) e `<span className="sr-only">Carregando…</span>`. Mostrar só após 150ms (atraso por state/timeout) para evitar flash em chunks rápidos.

## Plano de redesign

PLANO DE REDESIGN — Base do design system e casca do app (alinhado a EnfereVivoTrail, MobileBottomDock, PlurallQuestionCard e ResetPassword)

0. TOKENS PRIMEIRO (a base para todo o resto)
- tailwind.config.js: criar o grupo `vivo.*` (bg #0E1720, chrome #0B131D, surface #16222E, raised #1B2938, line #27394B, line-strong #1F3045, lip #0A1118, text #EAF2F8, muted #9FB3C6, aqua #20D5B5/lip #149F86/ink #06302E, green #3DD68C, amber #FFC247, coral #FF6B6B, sky #5AC8FA, indigo #B4B7FF). Corrigir slate-500 para #8A9DB1, separar slate-700 de slate-800 e deixar a escala emerald monotônica (só verdes). Adicionar shadow/blur/drop-shadow xs e 2xs. Adicionar `transitionTimingFunction: { out: 'cubic-bezier(.23,1,.32,1)', drawer: 'cubic-bezier(.32,.72,0,1)' }` e `transitionDuration: { press: '110ms', fast: '160ms', base: '220ms' }`, espelhando motion.js.
- index.css: um único bloco de base escuro em :root (com .dark mantido para as variantes); remover o código morto listado em foundation-14 e as duplicatas de foundation-15; escala de fonte em %; manter os overrides ainda usados (button.text-slate-700/800 até migrar, controles de vídeo, .btn-3d-*, .press-lip, .tap-press, .card-press, .progress-shine, .animate-flame-subtle, .no-scrollbar, night-shift). Foco global: `:where(button,a,input,select,textarea,[role=button],[role=radio],[role=tab],[tabindex]):focus-visible{outline:2px solid #20D5B5;outline-offset:2px}`; o Button deixa de usar ring e passa a usar esse mesmo outline, para um único estilo de foco. Bloco reduced-motion mantido.
- index.html: Nunito 400-900, viewport-fit=cover, theme-color #0B131D, color-scheme dark, limpeza de SW apenas em registerSW.js.

1. PRIMITIVAS DE UI (src/components/ui)
- Button: alvo mínimo de 44px em todos os tamanhos por toque (`min-h-[44px]`, icon `min-w-[44px]`), lábio em px; `secondary` e `ghost` com feedback de pressão (`active:scale-[.97]` em 110ms ease-out); asChild repassa `aria-disabled` quando disabled ou loading; loading troca o conteúdo por Loader2 mantendo a largura.
- Input e Textarea: h-12, borda de 2px, raio 14, fonte de pelo menos 16px, foco aqua com halo de 4px, estado de erro coral (aria-invalid).
- Dialog e AlertDialog: cartão Vivo (raio 18, borda 2, sombra-lábio), margem de 16px no celular, fechar de 44px com 'Fechar', entrada popIn (scale .96 → 1 + opacidade, 220ms ease-out) em vez de zoom/slide shadcn; no celular, considerar a variante folha inferior com sheetVariants + scrimVariants e o arraste pelo puxador, igual ao MobileBottomDock.
- Toast: cartão Vivo com variantes success/warning/danger/info, ícone à esquerda, fechar sempre visível com 36-44px, viewport acima do dock no celular, entrada em mola (spring.sheet) e saída por swipe. Sem som.
- Recriar alert.jsx como Alert Vivo, ou apagá-lo.
- AnimatedProgress e AnimatedNumber: já estão no padrão; documentar no DESIGN.md.

2. CASCA DO APP
- StudentHeader (desktop e tablet): barra `bg-vivo-chrome/95 backdrop-blur-xl border-b-2 border-vivo-line-strong h-16`; logo do Goti em 40px + 'Enfere' font-black aqua (sem subtítulo em md); nav visível a partir de md, só com ícones e aria-label até xl e rótulos a partir de xl; item ativo com fundo `bg-vivo-aqua/12`, texto aqua e um indicador deslizante `layoutId=\"header-active\"` com spring.glide (o mesmo padrão do dock); aria-current="page"; Conta e Sair com `size=icon`; vibrate() no lugar do triggerHaptic; o botão flutuante do Goti vira um Button outline em pílula (h-12) com ponto de presença sem animate-ping (ou ping uma única vez ao montar).
- MobileBottomDock: continua sendo a referência; trocar `md:hidden` pelo breakpoint compartilhado com o header (constante NAV_BP).
- StudentFooter: rodapé compacto escuro (`bg-vivo-chrome border-t-2 border-vivo-line-strong`), links `<Link>` com 44px, quebra de linha no celular, `pb-[calc(88px+env(safe-area-inset-bottom))]` só quando o dock aparece; sem a gaveta morta; prop showDock.
- MobileHeader: apagar.
- PageLoader: tela escura com o rosto do Goti 'respirando' (gotiBreathe, que vira estático com movimento reduzido), role=status, aparecendo só após 150ms.

3. TELAS DE EXCEÇÃO
- 404 (PageNotFound): fundo vivo-bg, Goti 96px com popIn, título 'Página não encontrada' (font-black 24px), texto 'O endereço pode ter mudado. Vamos voltar ao seu plantão?' em muted, CTA `<Button size=lg asChild><Link to='/'>Voltar ao início</Link></Button>` e secundário outline 'Voltar' (navigate(-1)); entrada fadeUp com listStagger.
- ErrorBoundary: mesmo layout da 404 com Goti preocupado, role=alert, 'Algo deu errado aqui', Recarregar (primary) e Ir para o início (outline), detalhe do erro só em DEV num bloco `font-mono text-[11px] bg-vivo-lip`; boundary por rota com key=pathname; recarga automática única em ChunkLoadError. Nada de shake (erro do sistema, não do aluno).

4. SPLASH (EnfereSplash.tsx)
- Corrigir a sincronia com a autenticação (setAuth reativo + bloqueio enquanto carrega) e preservar o deep link (returnTo).
- Botões no padrão 3D por box-shadow com tokens de duração e curva; 'Pular' como <button> de 44px; `inert` nos botões até ready(); com movimento reduzido, pose estática sem vídeo e sem anéis; remover Baloo 2; títulos com clamp() para telas baixas em paisagem (`@media (max-height:520px)` reposicionando título e botões lado a lado), evitando a sobreposição com os botões.
- Mostrar o splash só em '/' na primeira visita da sessão; deep links vão direto ao destino.

5. DESIGN.md
Reescrever completo conforme foundation-3 (tokens, tipografia, raios, botões, inputs, cartões, motion, feedback sem som, acessibilidade com 44px, foco e reduced-motion, componentes de referência, e a lista do que não fazer). Usar o DESIGN.md como contrato e checá-lo no review de PR.

6. VERIFICAÇÃO (quem implementar)
grep por `bg-white|text-slate-800|bg-slate-50` nos arquivos da área = 0; grep por `shadow-xs` ainda presente, mas agora definido no config; Lighthouse a11y ≥ 95 em /, /404 e no splash; teste em 375×667 e 768×1024 (nav presente) e no iPhone (sem zoom em input, safe-area no dock); `npm run lint`, `npm run typecheck` e `npm run build` (o build, conforme o CLAUDE.md, cabe ao orquestrador).
