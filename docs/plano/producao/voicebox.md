# Produção: vozes fixas no VoiceBox (no seu PC)

**Quando:** depois da F2, que cria os scripts. Repita sempre que houver falas novas (F3 abertura, F5 instruções, F6 médico, F7 enfermeira).
**Onde:** Claude Code **rodando no seu PC** (Windows), com o VoiceBox instalado em `C:\Program Files\Voicebox\`.

## 1. Perfis de voz (uma vez por personagem)
| Personagem (`id`) | Perfil no VoiceBox | Referência para clonar |
|---|---|---|
| `marcus` | `Marcus` (já existe) | — |
| `teresinha` | `Teresinha` (já existe) | — |
| `goti` | `Goti` (já existe) | — |
| `medico-rui` | `Rui` | Homem, 45–55 anos, voz firme e ritmo rápido |
| `enfermeira-ana` | `Ana` | Mulher, 30–40 anos, voz clara e simpática |
| `paciente-carla` | `Carla` | Mulher, ~38 anos |
| `paciente-diego` | `Diego` | Homem, ~24 anos |

**Áudio de referência:**
- 10–20 s de fala natural em PT-BR, sem música e sem eco, num único arquivo WAV;
- use **apenas** a sua voz, a de pessoas que autorizaram por escrito ou vozes sintéticas já licenciadas para clonagem. **Não clone a voz de terceiros sem autorização.**

## 2. Pronúncia (evita que siglas sejam lidas errado)
O arquivo `src/data/falas/pronuncia.json` traz substituições aplicadas **só ao áudio**; a legenda continua com o texto original:
```json
{ "EV": "endovenoso", "IM": "intramuscular", "SC": "subcutâneo", "VO": "via oral", "mL": "mililitros", "mL/h": "mililitros por hora",
  "gts/min": "gotas por minuto", "mcgts/min": "microgotas por minuto", "UI": "unidades", "mg": "miligramas", "mcg": "microgramas",
  "g": "gramas", "SpO2": "saturação", "PA": "pressão", "FC": "frequência cardíaca", "FR": "frequência respiratória",
  "BIC": "bomba de infusão", "SF 0,9%": "soro fisiológico zero vírgula nove por cento", "KCl": "cloreto de potássio", "DPO": "dia de pós-operatório" }
```
- A substituição é por **palavra inteira** (regex com borda de palavra, sem diferenciar maiúsculas de minúsculas). Números ficam como estão, porque o VoiceBox lê bem; teste "2,5" e, se ler errado, inclua a regra "vírgula".
- A mesma função (`aplicarPronuncia`, em `src/features/cena/logica/pronuncia.js`, com testes) é usada pela voz do navegador e pela Edge Function `voz`.

## 3. Gerar
Com o VoiceBox aberto, peça ao Claude Code:
```
Rode `node scripts/voicebox/gerar-falas.mjs --dry-run` e me mostre quantas falas serão geradas por personagem.
Depois rode sem --dry-run. Ao final, rode `node scripts/voicebox/verificar-falas.mjs` e me mostre o resumo.
```
**Prefira o script ao MCP do VoiceBox:** o script é repetível, só gera o que mudou e grava o manifesto. Use o MCP (`voicebox-mcp.exe`) apenas para testar uma voz.

## 4. Revisar (antes do commit)
- Ouça **uma amostra de 10%** de cada personagem, sorteada pelo script com `--amostra`, que gera `public/vozes/_amostra.html` com players.
- **Confira:**
  - a pronúncia de siglas e números;
  - o ritmo;
  - cortes no começo ou no fim;
  - o volume parecido entre os personagens (o script normaliza para −16 LUFS com ffmpeg `loudnorm`; confira).
- **Para refazer uma fala:** mude o texto (ou acrescente um espaço) e rode de novo. O hash muda e só ela é regerada.
- Faça commit **de `public/vozes/` e de `src/data/falas/` juntos.**

## 5. Tamanho
- mp3 mono, 64 kbps, 24 kHz: cerca de 8 KB por segundo. 1.000 falas de 4 s dão cerca de 32 MB no repositório. Se passar de 50 MB, mova `public/vozes/` para o Supabase Storage (bucket público com cache) e troque a base de URL em `voz/manifestos.js`. Registre essa decisão no `ESTADO.md`.

## 6. Voz ao vivo (D4, quando chegar a hora)
| Opção | Passos |
|---|---|
| Testar com o seu PC (temporário) | Exponha a porta 17493 por um túnel HTTPS **com autenticação** e configure no branch do Supabase `VOZ_AO_VIVO_URL`, `VOZ_AO_VIVO_TOKEN` e `VOZ_PERFIS`. Isso cai quando o PC desliga. |
| Servidor (definitivo) | VoiceBox em Docker numa máquina com GPU (CUDA), atrás de um proxy que exige `Authorization: Bearer`. Os mesmos 3 secrets. Antes, meça a latência por frase (meta < 1,5 s) e o custo mensal com os preços atuais. |
