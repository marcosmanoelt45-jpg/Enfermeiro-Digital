# 01 — Contratos (dados, APIs, estados)

Estes formatos são a fonte da verdade. **Mudar um contrato exige atualizar este arquivo no mesmo PR** e registrar a mudança no `ESTADO.md`. No JS, os formatos viram `@typedef` JSDoc em `src/features/cena/tipos.js`. Nas Edge Functions, viram schemas `zod` em `supabase/functions/_shared/schemas.ts`.

---

## C1. Personagem (`src/features/cena/dados/personagens.js`)
```js
/** @typedef {'parado'|'falando'|'pensando'|'feliz'|'dor'|'desconfiado'|'confuso'|'irritado'|'acerto'|'erro'} Emocao */
{
  id: "marcus",                       // slug estável; é a pasta em public/personagens/<id>/
  nome: "Sr. Marcus",
  papel: "paciente",                  // 'paciente' | 'medico' | 'enfermeira' | 'preceptor'
  faixa: "idoso",                     // 'crianca' | 'jovem' | 'adulto' | 'idoso'
  sexo: "M",                          // 'M' | 'F'
  voz: {
    voiceboxPerfil: "Marcus",         // nome do perfil no VoiceBox
    navegador: { pitch: 0.72, rate: 0.9 }
  },
  clipes: ["parado", "falando", "pensando", "acerto", "erro"],   // emoções que EXISTEM em disco
  poster: "/personagens/marcus/poster.png"
}
```
**Regra de fallback de clipe** (função pura `resolverClipe(personagem, emocao)` em `cena/logica/clipes.js`):
`emocao` existe → usa. Senão: `feliz→acerto`, `dor|irritado|desconfiado|confuso→pensando`, `acerto|erro→parado`, depois `falando`, depois `parado`.
Arquivos: `public/personagens/<id>/<emocao>.webm` e `.mp4`. Até a F8, `marcus` e `teresinha` apontam para `public/pacientes/<id>/` (`fala` vira `falando`).

## C2. Falas fixas e manifesto de voz
Fonte do texto: `src/data/falas/<personagem>.json`
```json
{ "personagem": "medico-rui", "perfilVoicebox": "Rui",
  "falas": [ { "id": "calc.p017.enunciado", "texto": "Enfermeiro, faz ceftriaxona 750 mg EV de 12 em 12. Tem frasco de 1 g." } ] }
```
- `id`: `<área>.<grupo>.<item>`, estável. **Nunca reaproveite um id com texto diferente** (o hash detecta, mas a revisão de áudio é manual).
- O texto é o da **legenda**. O áudio usa `aplicarPronuncia(texto)` (siglas por extenso: `src/data/falas/pronuncia.json`). O hash é calculado sobre o texto **depois** da pronúncia, então mudar o dicionário regera só o que foi afetado.

Gerado pelo script (não editar à mão): `public/vozes/<personagem>/manifest.json`
```json
{ "versao": 1, "falas": { "calc.p017.enunciado": { "arquivo": "calc.p017.enunciado.mp3", "hash": "sha1-do-texto+perfil", "duracaoMs": 4210 } } }
```

## C3. Fala no cliente (fila do `useVozPersonagem`)
```js
/** @typedef {{ id?: string, texto: string, emocao?: Emocao, origem: 'fixa'|'aovivo' }} Fala */
```
Resolução: `origem:'fixa'` + `id` no manifesto → mp3. Senão, se for `'aovivo'` → `POST voz` (204 = sem voz hospedada). Senão → `speechSynthesis`. A legenda aparece **sempre**.

## C4. Máquina de estados da cena (`cena/logica/cenaReducer.js`)
```
           INICIAR (gesto do usuário: libera áudio no iOS)
ocioso ───────────────────────────────► personagem_falando
personagem_falando ──FALA_TERMINOU──► aguardando_aluno
personagem_falando ──ALUNO_SEGUROU──► aluno_falando            (interrompe a fala)
aguardando_aluno   ──ALUNO_SEGUROU──► aluno_falando
aguardando_aluno   ──ENVIOU_TEXTO───► processando
aluno_falando      ──SOLTOU(texto)──► revisando_texto          (aluno pode editar ou enviar)
aluno_falando      ──SOLTOU(vazio)──► aguardando_aluno
revisando_texto    ──ENVIOU_TEXTO───► processando
processando        ──RESPOSTA(falas)► personagem_falando
processando        ──FALHOU(erro)───► erro_recuperavel         (mantém o texto do aluno, mostra "Tentar de novo")
erro_recuperavel   ──REENVIAR───────► processando
*                  ──ENCERRAR───────► encerrada
*                  ──COTA_EXCEDIDA──► bloqueada
```
- O estado guarda `{ status, falaAtual, filaFalas, rascunhoAluno, turnos[], erro, turnoPendenteId }`.
- **Toda transição inválida é ignorada** (ex.: `RESPOSTA` chegando depois de `ENCERRAR`). O teste cobre isso.
- O envio automático ao soltar o botão pode ser ligado nas configurações (padrão: **revisar antes**, porque transcrição errada gera resposta errada).

## C5. Cliente de servidor (`src/features/cena/servidor.js`)
Único ponto que chama as Edge Functions dos módulos novos. Usa `supabase.functions.invoke`, com timeout por `AbortSignal` (15 s; 30 s para `gerar_ficha` e `finalizar`) e **uma** nova tentativa automática só para erros de rede, reaproveitando o mesmo `turnoId`.
```js
consulta.criar({ arquetipoId|null, tema|null, idade, sexo, personagemId, personalidadeId, dificuldade }) → { sessaoId, briefing, personagemId }
consulta.turno({ sessaoId, turnoId /*uuid do cliente*/, texto, canal: 'voz'|'texto' }) → { fala, emocao, rapport: 'baixo'|'medio'|'alto', turnosRestantes }
consulta.finalizar({ sessaoId, registro }) → { relatorio }
plantao.avaliar({ cenarioId, respostas[] }) → { avaliacao }
stt.token() → { token, expiraEm, wsUrl, parametros }
voz.gerar({ texto, personagemId }) → Blob audio/mpeg | null (204)
transcrever({ audio: Blob, contexto }) → { texto }
```
**Erros** (todas as funções): HTTP 4xx/5xx com `{ erro: { codigo, mensagem } }`. `servidor.js` converte isso em `class ErroServidor { codigo }`.

| codigo | HTTP | O que a interface faz |
|---|---|---|
| `NAO_AUTENTICADO` | 401 | Manda para o login, preservando `returnTo` (`src/lib/authReturnTo.js`) |
| `SESSAO_DEMO` | 403 | Cartão "Crie sua conta para conversar com pacientes" |
| `COTA_EXCEDIDA` | 429 | Cartão "Você usou suas N consultas de hoje. Volta amanhã!" + sugestão de Cálculo ou Técnicas |
| `ENTRADA_INVALIDA` | 400 | Toast genérico + log no console (bug nosso) |
| `SESSAO_ENCERRADA` | 409 | Vai para o relatório |
| `TURNO_DUPLICADO` | 200 | Devolve a resposta já salva (idempotência), sem erro para a interface |
| `IA_INDISPONIVEL` | 503 | `erro_recuperavel` ("O paciente ficou em silêncio… tente de novo") |

## C6. Personalidade (`src/features/consulta/dados/personalidades.js`, espelhada no servidor)
```js
{
  id: "desconfiado", nome: "Desconfiado", icone: "ShieldQuestion",
  descricao: "Responde curto e só se abre quando sente respeito.",
  confiancaInicial: 30,                       // 0–100
  tracos: ["respostas curtas", "pergunta por que você quer saber"],
  gatilhosPositivos: ["se apresenta pelo nome", "explica o motivo da pergunta", "usa linguagem simples", "demonstra empatia"],
  gatilhosNegativos: ["jargão técnico", "pressa ou interrupção", "julgamento moral"],
  tendencias: { esquece: 0.1, confunde: 0.0, minimiza: 0.3, mente: 0.4 }   // 0–1, viram texto no prompt
}
```
Lista: `colaborativo`, `ansioso`, `desconfiado`, `esquecido` (idoso com déficit de memória leve), `minimizador`, `poliqueixoso`, `envergonhado`, `surpresa` (sorteia entre as demais **no servidor** e só revela no relatório).
**Dificuldade:** `facil` | `normal` | `dificil` altera só a **distribuição das regras de revelação** dos fatos (C7). A personalidade não muda.

## C7. Ficha verdade (só no servidor: tabela `consulta_fichas`)
```js
{
  arquetipoId: "sc_icc" | null,
  identificacao: { nome, idade, sexo, ocupacao, escolaridade: 'fundamental'|'medio'|'superior', mora_com },
  setor: "Clínica Médica • Leito 7",
  queixaPrincipal: "falta de ar há 3 dias",
  sinaisVitais: { pa_sistolica, pa_diastolica, fc, fr, sat, tax, dor },   // MESMO formato de sbarHandoffScenarios
  fatos: [ {
    id: "f1",                         // f1..fN, N entre 8 e 14
    tema: "hda"|"antecedentes"|"medicacoes"|"alergias"|"habitos"|"familia"|"social"|"sintomas_associados"|"adesao"|"sono"|"eliminacoes"|"alimentacao",
    texto: "piora ao deitar, dorme com 3 travesseiros",
    peso: 1|2|3,                      // 3 = crítico para segurança e diagnóstico
    revelacao: "livre"|"pergunta_direta"|"confianca"|"esquecido",
    confiancaMin: 60,                 // só quando revelacao = 'confianca'
    versaoFalsa: "diz que toma tudo certinho",   // obrigatório quando revelacao = 'confianca'
    perguntaQueRevela: "O senhor tem tomado os remédios todo dia, do jeito que o médico passou?"
  } ],
  examesDisponiveis: ["ausculta-pulmonar", "contar-fr"],    // ids de minijogo (C11), com hífen
  diagnosticosEsperados: ["00026", "00032"],                  // códigos NANDA validados com findNandaByCode
  intervencoesEsperadas: ["Controlar balanço hídrico", "Elevar cabeceira 30–45°"],
  personalidadeId: "desconfiado",
  dificuldade: "normal"
}
```
**Invariantes validados por código no servidor** (rejeita e regera **uma** vez; se falhar de novo, usa o arquétipo puro com fatos derivados por template):
- pelo menos 1 fato `peso 3` sobre `alergias` ou `medicacoes`;
- todo `confianca` tem `versaoFalsa` e `confiancaMin` entre 40 e 85;
- sinais vitais dentro de faixas fisiológicas possíveis, e iguais aos do arquétipo ± 10%, quando houver arquétipo;
- os códigos NANDA existem no catálogo;
- distribuição por dificuldade: fácil ≥ 50% `livre`; difícil ≥ 40% `confianca` ou `esquecido`.

## C8. Turno (tabela `consulta_turnos`)
```js
{ id: turnoId, sessao_id, ordem, autor: 'aluno'|'paciente', texto, canal, emocao, revelados: ['f2'], confianca_depois, criado_em }
```
O cliente **nunca** recebe `revelados` nem `confianca` numérica durante a sessão, só `rapport` em três níveis.

## C9. Banco (migrations da F1 e da F3)
```sql
-- 010_ai_cota.sql (F1)
create table ai_uso_diario (user_id uuid references auth.users not null, dia date not null default (now() at time zone 'America/Sao_Paulo')::date,
  tipo text not null, contagem int not null default 0, primary key (user_id, dia, tipo));
alter table ai_uso_diario enable row level security;            -- sem policies para o cliente
create function consumir_cota(p_tipo text, p_limite int, p_qtd int default 1) returns boolean
  language plpgsql security definer set search_path = public as $$ ... auth.uid() ... upsert atômico ... $$;
revoke all on function consumir_cota from public; grant execute on function consumir_cota to authenticated;

-- 011_consultas.sql (F3)
consulta_sessoes (id uuid pk, user_id uuid not null default auth.uid(), personagem_id text, personalidade_publica text, -- 'surpresa' fica 'surpresa'
                  tema text, status text check (status in ('ativa','encerrada')), turnos_aluno int default 0,
                  confianca int, contagem_temas jsonb default '{}', notas_memoria text[] default '{}', relatorio jsonb, criado_em timestamptz default now(), encerrado_em timestamptz)
consulta_fichas  (sessao_id uuid pk references consulta_sessoes on delete cascade, ficha jsonb not null)
consulta_turnos  (id uuid pk, sessao_id uuid references consulta_sessoes on delete cascade, ordem int, autor text, texto text,
                  canal text, emocao text, revelados text[], confianca_depois int, criado_em timestamptz default now(),
                  unique (sessao_id, ordem))
```
**RLS:**
- `consulta_sessoes`: o cliente faz SELECT dos próprios registros. INSERT e UPDATE só pela função.
- `consulta_turnos`: o cliente faz SELECT dos próprios registros só quando `status='encerrada'`, para rever a conversa.
- `consulta_fichas`: **nenhuma policy**, só o service role acessa.
- O cliente nunca define `user_id`, conforme o `CLAUDE.md`.

## C10. Registro e relatório da Consulta
```js
registro = { achados: string, diagnosticos: ["00026"], intervencoes: string[], examesFeitos: [{minijogoId, resultado}] }
relatorio = {
  notas: { anamnese: 0-100 /*código*/, comunicacao: 0-100 /*IA*/, seguranca: 0-100 /*código*/, raciocinio: 0-100 /*código + IA*/, geral },
  cobertura: { revelados: [{id, texto, peso}], escondidos: [{id, texto, peso, perguntaQueRevela, porque}] },
  comunicacao: { pontosFortes: [{ordem, trecho}], melhorar: [{ordem, trecho, sugestao}] },
  seguranca: { identificou: bool, alergias: bool, medicacoes: bool },   // por código: fatos dos temas revelados
  raciocinio: { diagnosticosCertos: [], diagnosticosFaltando: [], extras: [], comentario },
  personalidadeRevelada: "desconfiado",
  linhaConfianca: [30, 35, 35, 50, ...]
}
```
**Fórmulas (código, `consulta/logica/pontuacao.js`, testadas):**
- `anamnese = round(100 × Σpeso(revelados) / Σpeso(todos))`;
- `seguranca = (alergias? 40) + (medicacoes? 40) + (identificou? 20)`;
- `raciocinio = round(70 × |certos| / |esperados| + 30 × notaIA/100) − 10 × |extras sem relação|` (mínimo 0);
- `geral = round(0.35 anamnese + 0.25 comunicacao + 0.2 seguranca + 0.2 raciocinio)`.

## C11. Minijogo (`src/features/minijogos/dados/*.js`)
```js
{
  id: "bandeja-curativo-simples", versao: 1,
  tipo: "arrastar" | "tocar-regiao" | "ordenar" | "medir" | "escolher",
  titulo, instrucao /* também é fala fixa: id 'mj.<id>.instrucao' */,
  categoria: "curativos"|"avaliacao"|"biosseguranca"|"medicacao"|"sinais_vitais",
  fonte: { titulo: "POP …", url?: "…" },
  // específico de cada tipo:
  arrastar:     { fundo, alvos: [{id, label, imagem, area:{x,y,w,h} /* % */}], itens: [{id, label, imagem, alvoCorreto: "bandeja"|null, explicacao}] },
  "tocar-regiao": { imagem, vista: "anterior"|"posterior", regioes: [{id, label, x, y, raio /* % */, audio?, achado, correta?: bool}], objetivo: "explorar"|"encontrar" },
  ordenar:      { passos: [{id, texto}] /* ordem correta */, origem?: { procedimentoId } },
  medir:        { instrumento: "termometro"|"esfigmo"|"glicosimetro"|"contar-fr"|"contar-pulso", valorCorreto, unidade, tolerancia, duracaoSeg? },
  escolher:     { imagem?, pergunta, opcoes: [{id, texto, correta, feedback}] }
}
```
**Resultado (devolvido por `MinijogoRunner.onConcluir`):**
```js
{ minijogoId, acertos, erros, tempoMs, concluido: bool, achado?: { campo, valor, texto } }   // achado preenche lacunas do Plantão
```

## C12. Item do banco do Cálculo (`src/data/calculo/banco.json`, gerado por script)
```js
{ id: "p017", tipo: "reconstituicao"|"gotejamento_macro"|"gotejamento_micro"|"bic"|"diluicao"|"ampolas"|"pediatrica",
  prescricao: { farmaco, dose, unidadeDose, via, frequencia }, disponivel: "frasco 1 g + 10 mL AD",
  resposta: 7.5, unidade: "mL", casas: 1, tolerancia: 0.05,
  memoria: ["1 g = 1000 mg", "1000 mg — 10 mL", "750 mg — x", "x = 7,5 mL"],
  erroProposital: null | { tipo: "dose10x"|"via"|"unidade"|"alergia", correcao, explicacao },
  falas: { enunciado: "calc.p017.enunciado", dica: "calc.p017.dica" } }
```

## C13. Cenário de Plantão (extensão de `sbarHandoffScenarios.js`)
Campos novos e opcionais (não quebram o uso atual):
```js
lacunas: [ { campo: "ausculta_pulmonar", rotulo: "Ausculta pulmonar", minijogo: "ausculta-pulmonar" | null, gapKey: "tiragem" | null, valorEsperado: "crepitações em bases" } ],
perguntas: [ { id: "plt.icc.s1", letra: "S"|"B"|"A"|"R", texto, espera: { tipo: "numero"|"texto", campos?: ["pa","fc"] }, dependeDe?: "ausculta_pulmonar" } ],
elementosChave: { S: ["identificação", "leito e setor", "motivo da internação"], B: [...], A: [...], R: [...] }   // 3–6 por letra, extraídos do goldenSbar (usados pelo avaliador)
```
Se `minijogo` for `null`, a lacuna usa o `ClinicalGapRadar` com o `gapKey` (reserva).

## C14. Registro de módulos (`src/features/navegacao/modulos.js`, F0)
```js
{ id: "consulta", rotulo: "Consulta ao Vivo", rota: "/consulta", icone: "MessagesSquare", grupo: "pratica"|"principal",
  flag: "consulta", novo: true, briefingId: "consulta" | null, ordem: 10 }
```
`StudentHeader`, `MobileBottomDock` (itens e gaveta "Prática") e `EnfereVivoTrail` **leem daqui**. Itens com flag desligada não aparecem.

## C15. Flags (`src/features/flags.js`, F0)
```js
export const FLAGS = { consulta: false, calculoMedico: false, plantaoVivo: false, tecnicas: false };
export function flagAtiva(nome) { /* FLAGS[nome] || localStorage `enfere_flag_${nome}` === '1' (para testar em produção sem expor) */ }
```
