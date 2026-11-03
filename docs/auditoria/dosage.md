# Área: Cálculo de Doses (dosage)

**Status:** VERIFICADO (15 confirmados de 20)

**Arquivos desta área (edite só estes):** src/pages/MedicationDosageLab.jsx, src/lib/medicationCatalog.js, src/data/dosageProblems.js, src/services/proceduralDosageGenerator.js, src/services/simuladorFormulaService.js, src/components/simulador/TecladoCalculo.jsx

**Foco:** VERIFY THE MATH of every formula and every authored problem: macrogotas gtt/min = V(mL)/(T(h)x3); microgotas = V/T(h); 1 mL = 20 gtt = 60 mcgtt; BIC mL/h = V/T(h); regra de três; mg/mcg/g; % solutions (g/100 mL); dilution and redilution; units (insulina, heparina); KCl. Recompute the stated correctResult of EVERY problem in dosageProblems.js and the generator; any mismatch or wrong rounding is HIGH. The answer tolerance is currently absolute 0.05 — judge if it is right for each unit (e.g. gtt/min are whole numbers). Then polish the lab UI (keypad as 3D keys, result sheet).

## Achados

### dosage-1 [high / clinical-math] src/pages/MedicationDosageLab.jsx:472
- Problema: O sufixo de unidade do campo de resposta é fixo em 'gotas/min' para TODOS os problemas, inclusive os que pedem mL (aspiração), mL/h (BIC), mcg/min e número de ampolas. O aluno vê uma unidade clínica errada ao lado da resposta: é erro de unidade num módulo de segurança do paciente.
- Evidência: <span className="text-xs sm:text-sm font-bold text-[#9FB3C6] shrink-0">
                  gotas/min
                </span>  -> prob_5 (Heparina, resposta '8' mL/h), prob_7 (Noradrenalina '12.8' mcg/min), prob_19 ('4' ampolas), além dos geradores generateBicInfusion/generatePenicilinaCristalina/generatePediatricRedilution (mL/h, mL).
- Correção: Adicionar `answerUnit` em cada problema (dosageProblems.js e nos 6 geradores: 'gts/min', 'mcgts/min', 'mL', 'mL/h', 'mcg/min', 'ampolas') e renderizar `{problem.answerUnit}` aqui e em toda referência ao resultado. Sem unidade definida, não mostrar nenhuma unidade (nunca usar o padrão 'gotas/min').

### dosage-2 [high / bug] src/pages/MedicationDosageLab.jsx:620
- Problema: A folha de resultado mostra só explanationSteps[2] e [3], descartando os passos 0 e 1 (por exemplo a concentração). Nos problemas de 3 passos (prob_7, 12, 13, 14, 17), o step[3] é undefined e cai no fallback com unidade fixa 'gotas/min'. Resultado: a noradrenalina aparece como '12.8 gotas/min' e a insulina como '7 gotas/min', sendo que o prob_7 mostra a resposta final no item '1'.
- Evidência: {problem.explanationSteps[2] || problem.explanationSteps[0]} ... {problem.explanationSteps[3] || `Resultado exato: ${problem.correctResult} gotas/min`}; prob_7.explanationSteps tem 3 itens (linhas 208-212); prob_12 tem 3 itens (337-341).
- Correção: Renderizar todos os passos: `problem.explanationSteps.map((s,i)=> <li key={i}>…</li>)` com stagger de entrada, e uma linha final de destaque `Resposta: {formatPtBR(problem.correctResult)} {problem.answerUnit}` usando AnimatedNumber. Tirar os prefixos numéricos '1.', '2.' das strings dos steps (a lista já numera).

### dosage-3 [high / clinical-math] src/lib/medicationCatalog.js:281
- Problema: O catálogo guarda `concentration` sem unidade, mas os consumidores tratam o valor como mg/mL. KCl está como 19.1: KCl 19,1% = 191 mg/mL (2,56 mEq/mL). Com o autofill do MedicationsTab, volume = dose/c sai 10x MAIOR, superdosagem potencialmente fatal de potássio. Heparina (5000) e insulinas (100) aparecem como 'mg/mL' quando são UI/mL. Penicilina G Benzatina '600' não corresponde a nenhuma apresentação. Glicose 50% está com 0 quando deveria ser 500 mg/mL.
- Evidência: medicationCatalog.js:281 { name: "Cloreto de Potássio (KCl)", ..., concentration: 19.1 } e :618 (duplicado IV); DrugPicker.jsx:72 `${d.concentration} mg/mL`; MedicationsTab.jsx:194 `update("concentration", String(drug.concentration))` e :65 `const ml = dose / c`; :137 Heparina 5000, :154 Insulina Regular 100, :36 Benzatina 600, :287 Glicose 50% 0.
- Correção: Mudar o esquema para `{ concentration, unit: 'mg/mL'|'UI/mL'|'mEq/mL'|'mg/comprimido'|..., presentation }`. KCl 19,1% → { concentration: 191, unit: 'mg/mL', meqPerMl: 2.56 } e KCl 10% → 100 mg/mL (1,34 mEq/mL). Heparina → 5000 UI/mL; insulinas → 100 UI/mL; Benzatina → 300000 UI/mL (1.200.000 UI/4 mL); Glicose 50% → 500 mg/mL. DrugPicker exibe `d.unit`, e o MedicationsTab só faz autofill quando unit termina em '/mL', exibindo a unidade no campo. Remover os duplicados (KCl IV, Cloreto de Cálcio 10% :304/:621, Carvedilol :83/:109).

### dosage-4 [medium / clinical-math] src/pages/MedicationDosageLab.jsx:230
- Problema: A tolerância absoluta `< 0.05` ignora a unidade e é inconsistente por causa de ponto flutuante. Para gts/min, mcgts/min e ampolas (inteiros), aceita 41,96 quando a resposta clínica é 42. Em 0,5 mL (hidrocortisona 50 mg, gerador) a margem chega a 10%. No limite, '2,55' vs 2.5 é ACEITO (diff 0.04999999999999982) e '0,8' vs 0.75 é REJEITADO (diff 0.05000000000000004). O parseFloat ainda aceita '42abc', e '1.000' vira 1.
- Evidência: isCorrect = !isNaN(numericAnswer) && !isNaN(numericCorrect) && Math.abs(numericAnswer - numericCorrect) < 0.05;  // parseFloat(String(studentInput).replace(',', '.'))
- Correção: Definir `answer: { value, unit, kind: 'integer'|'decimal', decimals, relTol }` por problema. Validar a entrada com /^\d+([.,]\d+)?$/. kind 'integer' (gts/min, mcgts/min, ampolas): exigir Number.isInteger(x) && x === value; se |x − valorBruto| < 0,01, responder 'Quase! Arredonde para o inteiro mais próximo' sem penalizar. kind 'decimal' (mL, mL/h, mcg/min): reutilizar validateCalculoAnswer de simuladorFormulaService.js (hoje sem uso) com tolerancia relativa 0.01 e Number(x.toFixed(decimals)) para eliminar o ruído de float.

### dosage-5 [medium / bug] src/pages/MedicationDosageLab.jsx:609
- Problema: A folha de acerto promete '+25 PE Conquistados', mas nenhum PE é concedido: registrarAcertoQuestao só incrementa acertosSeguidos. Além disso, registrarErroVermelhoQuestao está documentado como 'exclusivamente no erro vermelho (2º erro/revisão)' e é chamado já no primeiro erro, zerando a sequência.
- Evidência: {feedback.isCorrect ? "+25 PE Conquistados" : "Estudo Recomendado"}; clinicalGamificationService.js:576-585 registrarAcertoQuestao só altera acertosSeguidos/melhorAcertosSeguidos; MedicationDosageLab.jsx:259 registrarErroVermelhoQuestao(user?.id) no 1º erro.
- Correção: Conceder de fato o XP pelo serviço de gamificação (o mesmo método usado em Casos/Procedimentos) e exibir o valor retornado com AnimatedNumber, ou remover o selo. Usar a chamada de erro 'leve' no 1º erro e reservar registrarErroVermelhoQuestao para a revisão, como o serviço documenta.

### dosage-6 [medium / bug] src/pages/MedicationDosageLab.jsx:639
- Problema: O racional específico de cada distrator (o principal valor didático do banco, ex.: 'Calculou sobre 8 mL ignorando o soluto') nunca aparece. Ele vai para res.feedback, que só é renderizado quando explanationSteps.length < 2, condição que nenhum problema do banco ou do gerador satisfaz.
- Evidência: rationale = selectedOptObj.rationale || ""; ... feedback: `Alternativa Incorreta. ${rationale || ...}`; render: problem.explanationSteps && problem.explanationSteps.length >= 2 ? (<>steps</>) : (<p>{feedback.feedback}</p>)
- Correção: Sempre renderizar um bloco 'Por que essa alternativa?' com `feedback.rationale` (guardar separado de feedback.feedback) acima da resolução passo a passo, com fundo rosa/âmbar no erro e verde no acerto.

### dosage-7 [medium / dead-code] src/pages/MedicationDosageLab.jsx:175
- Problema: Há muito código morto. handleRandomProblem, handleGenerateProcedural, handleSaveDraft, handleSelectProblem e showFullSolution não estão ligados a nada, então o gerador procedural (proceduralDosageGenerator.js) é inalcançável e o 'nunca repetir' não existe. A aba 'calculadora' (linhas 729-966) só abre retomando um rascunho com activeTab, e esse rascunho nunca é salvo porque handleSaveDraft não tem gatilho. TecladoCalculo.jsx e simuladorFormulaService.js não têm nenhum import no projeto.
- Evidência: Grep: handleRandomProblem/handleGenerateProcedural/handleSaveDraft/handleSelectProblem só aparecem nas definições; setActiveTab só em :151 (resume); `grep TecladoCalculo|simuladorFormulaService src` → só os próprios arquivos.
- Correção: Ligar: menu ⋮ → bottom sheet com 'Novo desafio inédito' (handleGenerateProcedural), 'Questão aleatória', 'Salvar rascunho', 'Histórico' e 'Calculadora livre' (setActiveTab). Usar TecladoCalculo como entrada da resposta e validateCalculoAnswer na correção. Se algo não for ligado, apagar (incluindo os imports Button/Input/CONVERSIONS do bloco morto).

### dosage-8 [medium / bug] src/pages/MedicationDosageLab.jsx:698
- Problema: A navegação usa o total fixo de 20, mas a barra de progresso usa problemsList.length. Os problemas procedurais entram no índice 0 (prepend), o que desloca todos os índices: depois de 1 gerado, o problema estático #20 fica inalcançável pelo 'Próxima'. selectedIdx gravado no histórico (formData) aponta para outro problema após recarregar, já que a lista procedural se perde. A última questão volta silenciosamente para a 1ª, sem tela de conclusão.
- Evidência: const totalAvailable = Math.min(20, problemsList.length); ... `Próxima Questão (${selectedIdx + 2} de 20)` ; setProblemsList((prev) => [newProblem, ...prev]); setSelectedIdx(0); formData: { selectedIdx, ... }
- Correção: Navegar por id: guardar `currentProblemId` e fazer append dos procedurais (`[...prev, p]`), com total = problemsList.length nos dois lugares. Persistir `problemId` (e o objeto procedural inteiro) no histórico e retomar por id. No fim do lote, abrir uma tela de resumo (acertos X/20, tempo, celebrate()) com Button 'Treinar com desafios inéditos'.

### dosage-9 [medium / performance] src/pages/MedicationDosageLab.jsx:121
- Problema: Um setInterval de 1 s chama setActivitySeconds e re-renderiza a página inteira (~1000 linhas, dialog framer-motion, grade de opções) a cada segundo, mesmo com a aba do navegador oculta ou a folha de resultado aberta. Isso consome bateria no mobile.
- Evidência: const timer = setInterval(() => { setActivitySeconds((s) => s + 1); }, 1000);
- Correção: Trocar por `const startedAt = useRef(Date.now())` mais um acumulador pausado em `visibilitychange`, calculando `durationSeconds = Math.round((Date.now()-startedAt.current)/1000) + resumedSeconds` só em submit/saveDraft. Nada de estado por tick.

### dosage-11 [medium / design] src/pages/MedicationDosageLab.jsx:705
- Problema: Os botões fora do sistema reimplementam o 3D à mão: 'Próxima' com shadow-[0_4px_0_0_#148A76] e active:translate-y-1, 'Voltar', ícones X/⋮ e chips de alternativa. A barra de progresso anima `width` com transition-all, contrariando src/lib/motion.js ('só animar transform e opacity'), em vez de usar AnimatedProgress.
- Evidência: className="w-full sm:flex-1 py-3.5 rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] font-black shadow-[0_4px_0_0_#148A76] active:translate-y-1 ..."; <div className="h-full bg-[#20D5B5] rounded-full transition-all duration-300" style={{ width: ... }} /> (361-365)
- Correção: 'Próxima' → `<Button size="xl" variant={isCorrect?'success':'danger'}>Continuar</Button>`; 'Voltar' → `<Button variant="ghost">`; X/⋮ → `<Button variant="secondary" size="icon" aria-label=…>`; alternativas → classe btn-3d-outline com press-lip e estados emerald/rose; barra → `<AnimatedProgress value={(pos/total)*100} label="Progresso do treino" />`. O 'Verificar' (566) também deve passar para `<Button size="xl" loading={evaluating}>`.

### dosage-12 [medium / accessibility] src/pages/MedicationDosageLab.jsx:460
- Problema: O campo de resposta não tem label nem aria-label e usa type=text sem inputMode, então o celular abre o teclado alfabético. A folha de resultado é um div fixo sem foco inicial, sem trap, sem fechar no Esc, sem aria-labelledby e com aria-live='assertive' no diálogo inteiro. As alternativas indicam seleção só por cor (sem aria-pressed), e os botões X/⋮ dependem só de title.
- Evidência: <input type="text" value={studentInput} ... placeholder="Sua resposta" />; <motion.div role="dialog" aria-modal="true" aria-live="assertive" ...> sem foco; <button ... title="Voltar ao início"><X/></button>
- Correção: Usar TecladoCalculo como entrada principal (display com role="status" e aria-label="Resposta em {unidade}"). Se manter o input: `inputMode="decimal" aria-label={`Resposta em ${unit}`} autoComplete="off"`. Implementar a folha com Radix Dialog/Drawer (foco em 'Continuar', Esc fecha), `aria-labelledby` no título e uma região aria-live='polite' só com 'Correto'/'Incorreto'. Alternativas com `aria-pressed={isSelected}` e ícone ✓/✕ após a correção. aria-label nos botões de ícone.

### dosage-13 [medium / clinical-math] src/services/proceduralDosageGenerator.js:140
- Problema: O gerador combina volume e tempo ao acaso e produz regimes clinicamente irreais ou contraditórios. Microgotas: 1000 mL em 4 h dá 250 mcgts/min sob o título 'Infusão Pediátrica/Cardiológica'. Macrogotas/minutos: 250 mL em 15 min dá 333 gts/min (≈5,5 gotas/s, impossível de contar). A droga fixa contradiz o volume, ex.: 'Ceftriaxona 1g em SF 100mL diluído em bolsa com volume total de 250 mL', e o Metronidazol 500 mg aparece em 50 mL.
- Evidência: volumes = [100, 250, 500, 750, 1000]; times = [4, 6, 8, 12, 24]; title: `Infusão Pediátrica/Cardiológica: ...` (140-141, 209); volumes = [50,100,150,200,250]; minutes = [15,...]; drugs = ["Metronidazol 500mg", ..., "Ceftriaxona 1g em SF 100mL"] (234-241, 305)
- Correção: Sortear casos pré-validados `{drug, vol, minutes}` (Metronidazol 100 mL/30-60 min, Ciprofloxacino 200 mL/60 min, Paracetamol 100 mL/15 min, Ceftriaxona 100 mL/30 min), e para os soros sortear pares vol/tempo e descartar enquanto o resultado sair do teto (macro > 100 gts/min, micro > 100 mcgts/min). Título neutro 'Infusão em microgotas'.

### dosage-14 [medium / clinical-math] src/services/proceduralDosageGenerator.js:343
- Problema: No caso BIC, a matemática está certa, mas a clínica ensina algo inseguro. KCl 20 mEq/h (250 mL/h) aparece sem nenhum alerta, sendo que o limite usual em acesso periférico é 10 mEq/h e 20 mEq/h só se faz em acesso central com monitorização. Nitroglicerina vem prescrita em mg/h até 20 mg/h (= 333 mcg/min), acima da faixa usual (5–200 mcg/min) e numa unidade que não é a da prática.
- Evidência: prescribedDoses: [5, 10, 15, 20], // mg/h  unitRate: "mg/h" (343-344); prescribedDoses: [10, 20], // mEq/h (351)
- Correção: Nitroglicerina: doses [5,10,20,40] mcg/min e concentração 200 mcg/mL (50 mg/250 mL), com o passo de conversão 'mcg/min × 60 ÷ concentração' nos explanationSteps (5 mcg/min → 1,5 mL/h). KCl: limitar a [10] mEq/h e acrescentar um step de segurança ('máx. 10 mEq/h em veia periférica; KCl nunca em bólus').

### dosage-15 [low / copy] src/data/dosageProblems.js:140
- Problema: O prob_5 descreve SF 250 mL + 5 mL de heparina com 'Volume total = 250 mL'. A soma dá 255 mL, então a concentração real seria 98 UI/mL e não 100. O aluno atento vê a inconsistência.
- Evidência: "Solução preparada: Frasco de SF 0,9% 250 mL + 25.000 UI de Heparina (5 mL da apresentação 5.000 UI/mL). Volume total = 250 mL."
- Correção: Trocar por 'SF 0,9% 245 mL + 25.000 UI de Heparina (5 mL de 5.000 UI/mL) = 250 mL (100 UI/mL)', no mesmo padrão do prob_7 (16 mL + 234 mL).

### dosage-16 [low / copy] src/data/dosageProblems.js:257
- Problema: Racionais de distrator com conta errada e um erro de nomenclatura. prob_9 '6 mL': 6 mL = 300 mg (dose diária ÷ 2), não 'multiplicar sem dividir pelas 3 tomadas' (seria 12 mL). prob_14 '16': em 4 h dá 200/12 = 16,67 → 17. prob_17 '62': 1500/24 = 62,5 → 63. prob_20 categoria 'Bipiramidinas': a milrinona é uma bipiridina. No gerador, o distrator 3 de macro/minutos é calculado como correct/3 mas o comentário diz 'vol/(min*3)', e o distrator 2 pediátrico diz 'Errou em 10x' mas é ×2.
- Evidência: :257 { value: "6", ..., rationale: "Erro ao multiplicar sem dividir pelas 3 tomadas diárias." }; :385 "Subinfusão demoraria 4 horas."; :461 "1500 ÷ 24 (cálculo como se fossem 8 horas)."; :524 category: "Bipiramidinas & Inotrópicos"; generator :256 Math.round((vol * 20) / (min * 3)); :572-573 // 2. Errou em 10x  correct * 2
- Correção: prob_9 '6': 'Dividiu a dose diária por 2 tomadas (300 mg) em vez de 3'. prob_14: valor '17' ou texto 'infusão em ~4 h'. prob_17: valor '63' com '1500 ÷ (8 × 3) = 62,5 → 63'. prob_20: 'Bipiridinas & Inotrópicos'. Gerador: alinhar comentários e racionais ao cálculo real.

## Plano de redesign

TELA 1: DESAFIO (aba padrão). Referências: PlurallQuestionCard e EnfereVivoTrail.
- Top bar: `<Button variant="secondary" size="icon" aria-label="Sair do treino">` com X; AnimatedProgress (tone brand, rótulo 'Questão N de total') no lugar do div com width; `<Button variant="secondary" size="icon" aria-label="Opções">` para ⋮. O ⋮ abre um bottom sheet (spring.sheet, alça arrastável) com: Novo desafio inédito (gerador), Questão aleatória, Revisar erros, Salvar rascunho, Histórico, Calculadora livre.
- Cabeçalho: chip de categoria (sem toUpperCase duplicado) + chip 'Alta vigilância' só em heparina, insulina, KCl, noradrenalina, fentanil e milrinona (flag `highAlert` no problema). Título em text-xl font-black.
- Card 'Registro de prescrição' (#131F2E, rounded-3xl): descrição e grade 2x2 iguais às atuais, entrando com fade+y 8px (duration.base, ease.out).
- Pergunta + entrada: TecladoCalculo vira a entrada principal no mobile (display com a unidade dinâmica de problem.answerUnit e teclas 3D com press-lip), teclado físico continua funcionando via onKeyDown no container. As 4 alternativas vão abaixo como 'atalhos' em chips btn-3d-outline 2x2, com aria-pressed e whileTap scale 0.97 (spring.snappy). Se o problema for 'integer', a vírgula fica desabilitada.
- Ajuda: dois chips secundários 'Fórmula' e 'Conversões', expandindo com AnimatePresence (altura via layout, opacidade). A tabela de conversões cresce: 1 mL = 20 gts = 60 mcgts, 1 gt = 3 mcgts, 1% = 1 g/100 mL = 10 mg/mL, 1 g = 1000 mg, 1 mg = 1000 mcg, KCl 10% = 1,34 mEq/mL, KCl 19,1% = 2,56 mEq/mL.
- CTA fixo acima do MobileBottomDock: `<Button size="xl" className="w-full" loading={evaluating}>Verificar</Button>`, desabilitado sem resposta.

TELA 2: FOLHA DE RESULTADO (Radix Dialog/Drawer como bottom sheet; centralizada ≥ sm).
- Entrada em spring.sheet, e shake só no erro, junto com vibrate e celebrate() no acerto. Sem sons.
- Cabeçalho: ícone com spring.pop, título 'Correto!'/'Quase lá' com aria-labelledby, selo de XP real com AnimatedNumber (só se o serviço conceder).
- Bloco 1 'Por que essa alternativa?': rationale da opção escolhida (verde ou rosa).
- Bloco 2 'Resolução passo a passo': lista <ol> com TODOS os explanationSteps, stagger de 40 ms, e uma linha final 'Resposta: 42 gts/min' em destaque com AnimatedNumber e a unidade correta.
- No erro: fórmula de referência em âmbar e mini-tabela de conversão.
- Ações: `<Button size="xl" variant={acerto?'success':'danger'}>Continuar</Button>` com foco inicial, mais `<Button variant="ghost">Voltar ao início</Button>`. Esc fecha e vai para a próxima.

TELA 3: RESUMO DO TREINO (nova, no fim do lote).
- Anel ou AnimatedProgress com acertos X/total, tempo total, sequência de acertos, e lista compacta das questões erradas com 'Revisar'. celebrate() se ≥ 80%.
- CTAs: 'Desafios inéditos' (gerador), 'Revisar erros', 'Voltar ao Hub'.

TELA 4: CALCULADORA LIVRE (acessível pelo menu, tema escuro).
- Segmented control de 3 modos (Dose → Volume, Gotejamento, Peso) com indicador em layoutId e spring.glide.
- Campos em cards #131F2E com inputs escuros (inputMode="decimal", label visível), chips Horas/Minutos e Macro/Micro, e chip de unidade mg/mcg/UI/mEq.
- `<Button size="lg" className="w-full">Calcular</Button>`. O resultado sobe numa folha com valor grande (AnimatedNumber), unidade, fórmula com os números do caso e a nota: 'Em BIC: N mL/h', e alerta âmbar quando gts/min > 100 ou o fármaco for de alta vigilância.
- Sem tabelas laterais em desktop no mobile-first: a referência de fórmulas vira um accordion colapsado.

DADOS E LÓGICA que sustentam o redesign:
- Esquema de problema `{ id, answer: { value, unit, kind, decimals, relTol }, highAlert, steps[] }`, com validação centralizada em simuladorFormulaService.validateCalculoAnswer.
- Navegação por id e procedurais em append.
- Cronômetro por timestamp.
- Catálogo com unidade explícita.
