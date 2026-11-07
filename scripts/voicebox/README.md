# Falas fixas com o VoiceBox

As falas que não mudam (abertura da consulta, enunciados de cálculo, instruções de minijogo) viram mp3 no seu PC, com o VoiceBox, e entram no repositório em `public/vozes/<personagem>/`. O servidor nunca precisa gerar essas falas.

## Passo a passo
1. **Texto.** Edite ou crie `src/data/falas/<personagem>.json`:
   ```json
   { "personagem": "marcus", "perfilVoicebox": "Marcus",
     "falas": [ { "id": "consulta.abertura.1", "texto": "Bom dia, enfermeiro." } ] }
   ```
   O `id` é estável. Nunca reaproveite um `id` com outro texto.
2. **VoiceBox.** Abra o aplicativo, ou rode `"C:\Program Files\Voicebox\voicebox-server.exe" --port 17493`. O perfil precisa existir com o mesmo nome de `perfilVoicebox`.
3. **Ver o que vai ser gerado**, sem gerar nada:
   ```bash
   node scripts/voicebox/gerar-falas.mjs --dry-run
   ```
4. **Gerar** (todos, ou um personagem):
   ```bash
   node scripts/voicebox/gerar-falas.mjs
   node scripts/voicebox/gerar-falas.mjs --personagem marcus
   ```
   Rodar de novo não gera nada: só o que mudou (texto, perfil ou dicionário de pronúncia) é regerado. Precisa do `ffmpeg` no PATH (ou `FFMPEG=caminho`), que normaliza o volume.
5. **Revisar a escuta.** Com `--amostra`, o script sorteia 10% das falas e cria `public/vozes/_amostra.html` (fora do build). Abra com o servidor de desenvolvimento e ouça.
6. **Conferir antes de commitar:**
   ```bash
   node scripts/voicebox/verificar-falas.mjs
   ```
   Lista falas sem mp3 e mp3 órfãos (sai com erro se houver órfãos).
7. Commit de `src/data/falas/` e `public/vozes/`.

## Pronúncia
A legenda mostra o texto original, mas o áudio usa `src/data/falas/pronuncia.js` (siglas por extenso: "EV" vira "endovenoso"). Mudou o dicionário: rode o passo 4 e só as falas afetadas são regeradas.

## Variáveis
- `VOICEBOX_BASE_URL` (padrão `http://127.0.0.1:17493`)
- `FFMPEG` (padrão `ffmpeg`)

## Scripts antigos
`scripts/gerar-voz-goti.js` e `scripts/gerar-vozes-simulador.py` continuam, porque ainda não há `src/data/falas/goti.json` com as falas atuais do Goti.
