# F2 — Motor "Cena ao Vivo"

**Branch:** `feat/cenas-f2-motor` · **Depende de:** F1 · **Risco:** médio (áudio e microfone no iOS) · **Tamanho:** grande. Faça em duas sessões: 2.1–2.5 e 2.6–2.9.
**Objetivo:** um único motor de personagem falando e aluno respondendo, usado por todas as áreas. Ao final, `/dev/cena` demonstra tudo.

## Ler
- `00-contexto.md`, `ESTADO.md`, este arquivo · `01-contratos.md` §C1–C5 · `03-design.md` §2, §3, §4 e §6
- `src/components/simulador/PacienteVideoStage.jsx` (198 linhas) · `src/components/simulador/FalaLegendaBubble.jsx` (70)
- `src/services/simuladorVozService.js` (232 linhas: reaproveitar `falaGen`, `pickPtBrVoice` e o karaokê)
- `src/hooks/useAudioRecorder.js` (para a reserva "gravar e enviar")
- `scripts/gerar-voz-goti.js` (conversor WAV→MP3) e `scripts/gerar-vozes-simulador.py` (inicialização do VoiceBox)
- Documentação externa (busque na web; **não confie na memória**): AssemblyAI Streaming v3 (URL do WebSocket, parâmetros, formato das mensagens `Begin`/`Turn`/`Termination`, `speech_model` atual com português) e tokens temporários (`POST https://token.assemblyai.com/v1/token`)

## Não ler
`Videochamada.jsx` (o motor é novo; ele **não** é refatorado aqui).

## Estrutura criada
```
src/features/cena/
  tipos.js                  JSDoc de C1–C5
  servidor.js               (já existe desde a F1) + stt.token, voz.gerar
  dados/personagens.js      C1: marcus, teresinha (paths antigos), medico-rui, enfermeira-ana, goti (placeholders)
  logica/clipes.js          resolverClipe()            + clipes.test.mjs
  logica/cenaReducer.js     C4                         + cenaReducer.test.mjs
  logica/falas.js           resolverFala(), dividirEmFrases(), tempoPorPalavra()  + falas.test.mjs
  logica/pronuncia.js       aplicarPronuncia(texto) com src/data/falas/pronuncia.json (ver producao/voicebox.md §2) + teste
  voz/reprodutor.js         Áudio (mp3 / blob / speechSynthesis), desbloqueio iOS, karaokê
  voz/manifestos.js         Carrega e cacheia public/vozes/<id>/manifest.json (fetch único por personagem)
  stt/capturaPcm.js         getUserMedia + AudioWorklet → PCM16 16 kHz
  stt/pcm-worklet.js        processor do AudioWorklet (carregado com new URL(..., import.meta.url))
  stt/assemblyStream.js     WebSocket da AssemblyAI (token, envio, parciais, finais, fechamento)
  stt/reconhecimentoNavegador.js   webkitSpeechRecognition (reserva 1)
  usePermissaoMicrofone.js
  useVozPersonagem.js
  useFalaAluno.js
  componentes/PersonagemStage.jsx
  componentes/LegendaFala.jsx
  componentes/HistoricoFalas.jsx
  componentes/ControleFala.jsx      (Textarea + botão segurar para falar)
  componentes/BarraCena.jsx         (voltar, título, cronômetro, progresso, slot de rapport)
  componentes/EstadoBloqueado.jsx   (cota, demo, sem IA)
  CenaAoVivo.jsx                    (layout de 03 §3; recebe as props abaixo)
  DevCenaPage.jsx                   (/dev/cena, só em DEV)
supabase/functions/stt-token/index.ts
supabase/functions/voz/index.ts
scripts/voicebox/gerar-falas.mjs · scripts/voicebox/verificar-falas.mjs · scripts/voicebox/README.md
src/data/falas/dev.json             (falas de exemplo do /dev/cena)
```

### API do `CenaAoVivo` (as áreas só usam isto)
```jsx
<CenaAoVivo
  personagemId="marcus"
  titulo="Sr. Marcus · Leito 7"
  progresso={{ atual: 12, total: 40 }}          // opcional
  slotTopo={<Rapport nivel="medio" />}          // opcional
  acoes={[{ id: 'prontuario', rotulo: 'Prontuário', icone: 'ClipboardList', onClick }]}
  onEnviar={async (texto, canal) => [/* Fala[] da resposta */]}   // a área decide o que fazer
  falasIniciais={[{ id: 'consulta.abertura.1', texto: '...', origem: 'fixa' }]}
  onEncerrar={() => ...}
  bloqueio={null | { tipo: 'cota'|'demo'|'ia', mensagem, acao }}
  permitirVoz={true}
/>
```
O `CenaAoVivo` controla o `cenaReducer`, a fila de voz, o microfone, o estado de erro e a nova tentativa. A área só transforma texto em falas.

## Etapas

### 2.1 Lógica pura e testes (primeiro, antes de qualquer interface)
- `cenaReducer.js` seguindo §C4 à risca. Testes:
  - todas as transições válidas;
  - transições inválidas ignoradas (ex.: `RESPOSTA` em `encerrada`);
  - `ALUNO_SEGUROU` durante `personagem_falando` limpa a fila;
  - `FALHOU` preserva `rascunhoAluno`;
  - `REENVIAR` reaproveita o `turnoPendenteId`.
- `clipes.js`: tabela de fallback de §C1 com teste para cada emoção.
- `falas.js`:
  - `dividirEmFrases(texto)` corta em `. ! ? …` sem quebrar "Dr." ou "Sra." nem números como "2,5";
  - `tempoPorPalavra(texto, duracaoMs)` faz a distribuição proporcional ao tamanho das palavras (para o karaokê);
  - `resolverFala(fala, manifesto)` → `{ tipo:'mp3', url } | { tipo:'aovivo' } | { tipo:'navegador' }`.

### 2.2 Reprodutor de voz
- `reprodutor.js` exporta `criarReprodutor()` com `desbloquear()`, `tocar(fala, { personagem, onPalavra })` → Promise que resolve no fim, e `parar()`.
  - Use **um único** `HTMLAudioElement` reaproveitado (o iOS só libera o elemento que tocou num gesto).
  - `desbloquear()` precisa rodar dentro do primeiro toque ("Começar"): toca um mp3 silencioso de 0,1 s (`public/vozes/_silencio.mp3`, gerado com ffmpeg) e chama `speechSynthesis.speak` com um utterance vazio.
  - **Pronúncia:** antes de falar pelo navegador ou de enviar à função `voz`, aplique `aplicarPronuncia`. A legenda mostra o texto original.
  - **speechSynthesis:** fale **frase por frase** (`dividirEmFrases`), porque o Chrome corta falas longas e o iOS para após ~15 s. Use `pickPtBrVoice` e o pitch/rate do personagem.
  - O padrão `falaGen` invalida callbacks de falas antigas.
- `useVozPersonagem(personagemId)` → `{ falar(falas[]), parar(), falando, palavraAtual, falaAtual }`. Ele carrega o manifesto do personagem uma vez. Para `aovivo`, chama `voz.gerar()`; se vier `null` (204) ou der erro, usa o navegador **sem toast**.

### 2.3 `PersonagemStage` e legenda
- Generalize o `PacienteVideoStage` mantendo: flags de iOS, `webm` + `mp4`, camada anti-PiP, fallback visual (inicial do nome + poster), crossfade por opacidade e tempo-limite nos clipes não loop.
  - **Montagem preguiçosa:** monte só os `<video>` de `parado`, `falando` e `pensando`. Os outros são montados na primeira vez que forem pedidos (`preload="metadata"`). Personagem sem nenhum clipe mostra o poster e anima "falando" com um leve `scale` do avatar.
  - `falando` fica em loop enquanto a voz toca; ao terminar, volta a `parado`. `acerto`/`erro` tocam uma vez e chamam `onReacaoTerminou`.
- `LegendaFala`: balão com karaokê (palavra atual em `#EAF2F8`, já ditas em `#EAF2F8`, futuras em `#9FB3C6`), `aria-live="polite"` e animação `fadeUp`.

### 2.4 Microfone e transcrição
- `usePermissaoMicrofone()` → `{ estado: 'desconhecido'|'concedido'|'negado'|'indisponivel', pedir() }`. O `pedir()` só é chamado num gesto. Trate `NotAllowedError`, `NotFoundError`, `NotReadableError` e contexto inseguro.
- **Fluxo `useFalaAluno({ ativo })`:**
  1. Ao entrar em `aguardando_aluno`, **pré-busca** o token (`stt.token()`, que consome 1 de cota `stt` = 1 min). Se o token estiver para expirar, busca outro.
  2. `segurar()` abre o WebSocket com o token, inicia `capturaPcm` (stream reaproveitado durante a cena, liberado em `encerrar`, no unmount ou em `visibilitychange: hidden`) e envia frames de ~50 ms.
  3. As mensagens parciais atualizam `textoParcial`; as finais acumulam em `textoFinal`.
  4. `soltar()` envia a mensagem de término, espera o último final (no máximo 1,5 s), fecha o socket e devolve o texto.
- **Reservas, em ordem:**
  1. `COTA_EXCEDIDA` ou falha de socket → `reconhecimentoNavegador` (se existir);
  2. senão → gravação com `useAudioRecorder` + `transcrever()` (F1);
  3. senão → só teclado (`sem_microfone`).
- Exponha `{ suportaVoz, segurando, nivel /*0–1 para a onda*/, textoParcial, segurar(), soltar(), cancelar() }`.

### 2.5 Edge Functions `stt-token` e `voz`
- `stt-token`: `exigirUsuario` → `consumirCota('stt', LIMITES.stt)` → `POST https://token.assemblyai.com/v1/token` com `{ product: "streaming", expires_in_seconds: 300, max_session_duration_seconds: 60 }` → devolve `{ token, expiraEm, wsUrl, parametros }`. Os parâmetros de conexão ficam **no servidor** (`wsUrl` com `sample_rate=16000`, `encoding=pcm_s16le`, o `speech_model` atual e `language_codes`, conforme a doc), assim dá para trocar sem deploy do cliente.
- `voz`: `exigirUsuario` → se não houver `VOZ_AO_VIVO_URL`, responde **204**. Senão:
  - `consumirCota('voz', LIMITES.voz)`;
  - limite de 400 caracteres;
  - cache no Storage (bucket privado `vozes-cache`, chave `sha1(perfil+texto).mp3`; se existir, devolve);
  - `POST {VOZ_AO_VIVO_URL}/generate` com `{ text, profile_id }` e `Authorization: Bearer {VOZ_AO_VIVO_TOKEN}`, timeout de 10 s;
  - WAV base64 → mp3. No Deno, prefira devolver WAV e deixar o navegador tocar, se a conversão pesar; meça e registre no `ESTADO.md`.
  - O mapa `personagemId → profile_id` fica num secret `VOZ_PERFIS` (JSON).
- CSP Report-Only: acrescente o host do WebSocket da AssemblyAI em `connect-src` e `worker-src 'self' blob:` (já existe). Confira se o `AudioWorklet` carrega com `script-src 'self'`.

### 2.6 Componentes de layout
- `HistoricoFalas` (balões: aluno à direita, personagem à esquerda, rolagem automática só se o usuário estiver no fim), `ControleFala` (03 §3: segurar para falar, toque curto mostra a dica, Espaço no desktop, Textarea autoexpansível, Enviar/Descartar no `revisando_texto`), `BarraCena` (botão voltar com `alert-dialog` "Sair da consulta? O progresso desta conversa será perdido"), `EstadoBloqueado`.
- `CenaAoVivo` monta tudo e usa o `PageShell` com `semDock`.

### 2.7 Página `/dev/cena`
- Rota registrada **só** quando `import.meta.env.DEV`.
- Demonstra:
  - Sr. Marcus com 2 falas fixas de `src/data/falas/dev.json`;
  - eco: o que o aluno disser volta como fala `aovivo` "Você disse: …";
  - um botão para simular cada erro de §C5.

### 2.8 Pipeline de falas fixas do VoiceBox (roda no PC do dono)
- `scripts/voicebox/gerar-falas.mjs [--personagem <id>] [--dry-run]`:
  1. checa `GET http://127.0.0.1:17493/profiles` (se não responder, mostra como abrir o VoiceBox ou iniciar `voicebox-server.exe --port 17493`, como no script Python atual);
  2. lê `src/data/falas/*.json` e, para cada fala, calcula `hash = sha1(perfil + "|" + aplicarPronuncia(texto))`;
  3. pula se `manifest.falas[id].hash === hash` e o arquivo existir;
  4. senão, faz `POST /generate` (`{ text: aplicarPronuncia(texto), profile_id }`), converte o WAV para mp3 (reaproveite a função de `gerar-voz-goti.js`) e salva como `public/vozes/<personagem>/<id>.<hash8>.mp3`;
  5. apaga o mp3 antigo daquele id;
  6. normaliza o volume (ffmpeg `loudnorm` I=−16) e grava o manifesto (§C2) com `duracaoMs`;
  - opção `--amostra`: gera `public/vozes/_amostra.html` (fora do build: acrescente `_amostra.html` ao `.gitignore`) com 10% das falas sorteadas, para revisão;
  7. mostra o resumo: geradas, puladas e falhas.
- `verificar-falas.mjs`: lista falas sem mp3 e mp3 órfãos e sai com 1 se houver órfãos (útil antes de commit).
- `README.md` com o passo a passo para o dono.
- Apague `scripts/gerar-vozes-simulador.py` e `scripts/gerar-voz-goti.js` **só** se o novo script cobrir o Goti (crie `src/data/falas/goti.json` com as falas atuais). Senão, mantenha e registre no `ESTADO.md`.

### 2.9 Verificação no aparelho real
O Claude Code não tem iPhone. Gere um checklist no PR para o dono testar no preview:
- [ ] iPhone (Safari): a primeira fala toca depois de "Começar"; segurar o microfone transcreve; a fala do personagem é interrompida ao segurar; o app volta do segundo plano sem microfone preso (o indicador laranja some)
- [ ] Android (Chrome): idem, mais a reserva com o microfone negado
- [ ] Desktop: Espaço segura para falar; o texto funciona sem microfone
- [ ] Modo avião no meio da conversa: aparecem `erro_recuperavel` e o texto preservado

## Aceite
- [ ] Os testes de `logica/` passam (reducer com ≥ 20 casos)
- [ ] O `/dev/cena` cumpre o checklist 2.9 (relato do dono no PR)
- [ ] A chave da AssemblyAI não aparece no navegador (só o token temporário)
- [ ] Rodar `gerar-falas.mjs` duas vezes: a segunda gera 0
- [ ] `/dev/cena` ausente no build de produção (grep por `DevCenaPage` em `dist/`)

## Armadilhas
- **iOS:** `getUserMedia` e `audio.play()` só funcionam a partir de gesto. Nunca chame os dois num `useEffect` sem gesto anterior.
- **Eco:** o microfone pode captar a voz do personagem. Por isso segurar **interrompe** a fala antes de abrir o microfone, e `echoCancellation: true` vai nas constraints.
- **AudioWorklet** precisa de contexto seguro (HTTPS ou localhost).
- Não deixe o WebSocket aberto entre falas: cobra por tempo.
- `speechSynthesis.getVoices()` vem vazio na primeira chamada no Chrome: aguarde o evento `voiceschanged`, com timeout de 1 s.
