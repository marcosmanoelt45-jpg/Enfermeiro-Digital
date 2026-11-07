# Produção: arte e vídeo com o Google Flow pelo MCP (no seu PC)

**Ferramenta:** `gflow-cli` (D8). É um MCP **da comunidade, não oficial**: controla o seu Chrome logado, gasta os seus créditos do Flow e pode quebrar quando o Google mudar o site. O uso é por sua conta perante os termos do Google; se possível, use uma conta separada.
**Onde:** Claude Code **no seu PC**, com o Chrome logado no Flow.

## 1. Configuração (uma vez)
1. Instale e faça login seguindo o README atual do `gflow-cli` (ex.: `pip install gflow-cli` e `gflow auth login --browser chrome`). **Confira os comandos no README, que muda com frequência.**
2. Registre no Claude Code **primeiro sem gasto**: `claude mcp add gflow -- gflow mcp run --no-spend`. Teste listando projetos e personagens.
3. Quando estiver confortável, registre a versão que gera (sem `--no-spend`). **Mantenha as duas** e use a sem gasto para tudo que não for gerar.
4. Instale o ffmpeg e confira com `ffmpeg -version`.

## 2. Bíblia visual (vale para tudo)
- **Prompt-base (fixo; cada pedido só acrescenta a ação):**
  ```
  2D chibi cartoon character in the same art style as the Enfere mascot "Goti" reference: clean thick outlines, soft cel shading, friendly rounded proportions, teal (#20D5B5) accents on clothing, half body, facing camera, centered, static camera, flat pure green background #00FF00, even soft lighting, no shadow on background, no text, no logo.
  ```
- **Referência de estilo:** anexe sempre `public/goti/goti-pose-happy.png`. Para clipes, anexe também a **imagem de referência do próprio personagem**.
- **Enquadramento:** meio corpo, a cabeça no terço superior, com margem de 10% nas laterais (o corte final é 4:3, 560x424).
- **Loop:** os clipes começam e terminam na mesma pose neutra ("starts and ends in the same neutral pose").
- **Nada de marcas, logos, texto, crachá com nome, símbolos religiosos ou políticos.** Jaleco liso.

## 3. Elenco e clipes
| id | Descrição para o prompt | Clipes (fase 1 → fase 2) |
|---|---|---|
| `medico-rui` | "male doctor, around 50, short grey hair, white coat over teal shirt, stethoscope around neck, focused but kind" | `parado`, `falando`, `pensando` → `acerto`, `erro` |
| `enfermeira-ana` | "female nurse, around 35, dark hair in a bun, teal scrubs, badge clip without text, warm expression" | `parado`, `falando`, `pensando` → `acerto`, `erro` |
| `paciente-carla` | "woman around 38, hospital gown, slightly tired, sitting on hospital bed" | `parado`, `falando`, `pensando` → `dor`, `desconfiado`, `feliz` |
| `paciente-diego` | "young man around 24, hospital gown, a bit anxious, sitting on hospital bed" | `parado`, `falando`, `pensando` → `dor`, `irritado`, `confuso` |
| `marcus`, `teresinha` (já existem) | use o 1º quadro do `fala.mp4` atual como referência | `parado`, `pensando` → `dor`, `desconfiado`, `confuso`, `feliz` |

**Ações por emoção** (acrescente ao prompt-base):

| Emoção | Ação |
|---|---|
| `parado` | "idle: gentle breathing, one slow blink, tiny head movement, 5 seconds" |
| `falando` | "talking naturally to the viewer, mouth moving, small hand gesture, 5 seconds" |
| `pensando` | "thinking: looks up slightly, hand near chin, 4 seconds" |
| `acerto` | "pleased nod and small thumbs up, 4 seconds" |
| `erro` | "concerned frown, slight head shake, 4 seconds" |
| `dor` | "wincing in pain, hand on chest or belly, 4 seconds" |
| `desconfiado` | "suspicious squint, arms crossed, 4 seconds" |
| `confuso` | "confused expression, tilts head, 4 seconds" |
| `irritado` | "annoyed expression, sighs, 4 seconds" |
| `feliz` | "relieved smile, relaxes shoulders, 4 seconds" |

**Objetos dos minijogos** (imagem; geração de imagem não gasta crédito no gflow): vista de cima, um objeto por imagem, centralizado, fundo verde `#00FF00`, mesmo estilo. A lista sai do `dados/*.js` dos minijogos (campo `imagem` pendente).

## 4. Pedido (`assets/pedidos/<id>.json`)
```json
{ "personagem": "enfermeira-ana",
  "referencia": { "acao": "neutral standing pose", "saida": "assets-brutos/personagens/enfermeira-ana/ref.png" },
  "clipes": [ { "emocao": "parado" }, { "emocao": "falando" }, { "emocao": "pensando" } ],
  "modeloVideo": "o mais barato que mantenha a qualidade (ex.: Veo Fast); confirmar o preço no dry run",
  "limiteCreditos": 60 }
```

## 5. Prompt para o Claude Code
```
Leia docs/plano/producao/flow.md e assets/pedidos/<id>.json.
1) Pelo MCP gflow, gere a imagem de referência (prompt-base + descrição do elenco + ação) anexando a referência de estilo. Mostre as opções e ESPERE minha escolha.
2) Para cada clipe: monte o prompt (prompt-base + descrição + ação da emoção), faça image-to-video a partir da referência escolhida, mostre o custo estimado (dry run) e PARE se a soma passar de limiteCreditos. Gere UM por vez.
3) Baixe cada resultado em assets-brutos/personagens/<id>/<emocao>.mp4.
4) Rode node scripts/assets/processar-personagem.mjs <id>.
5) Registre em assets/LOG.md: data, personagem, emoção, prompt completo, modelo, créditos e arquivo.
6) Mostre o relatório de QA do script e NÃO faça commit até eu aprovar.
```

## 6. Pós-processamento (`scripts/assets/processar-personagem.mjs`, criado quando chegar o primeiro pedido)
Para cada `assets-brutos/personagens/<id>/<emocao>.mp4`:
1. **Recorte e escala:** corte central para 4:3 e escale para 560x424 a 24 fps.
2. **Remoção do fundo verde:** `chromakey=0x00FF00:0.12:0.06` + `despill=type=green`. Calibre os valores no primeiro personagem e fixe no script.
3. **WebM com alfa:** `-c:v libvpx-vp9 -pix_fmt yuva420p -crf 34 -b:v 0 -row-mt 1 -an` → `public/personagens/<id>/<emocao>.webm`.
4. **MP4 de reserva:** sobreposição em `color=0x16222E` → `-c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -movflags +faststart -an` → `.mp4`.
5. **Poster:** PNG do 1º quadro do `parado` → `poster.png` (+ `.webp`).
6. **QA automático** (relatório no terminal):
   - SSIM entre o 1º e o último quadro (< 0,85 → "loop vai pular, regerar ou cortar");
   - % de pixels verdes remanescentes (> 0,5% → "vazou verde");
   - duração (fora de 3–7 s → aviso);
   - tamanho (webm > 1,5 MB → aviso).
7. Atualiza `clipes` e `poster` em `src/features/cena/dados/personagens.js` (só a entrada do personagem).

Para objetos: `processar-objetos.mjs` (recorte de verde → `.webp` com alfa, 512 px no maior lado, `-quality 80`).

## 7. Se o MCP quebrar
Gere manualmente no site do Flow com os mesmos prompts, salve em `assets-brutos/` com os mesmos nomes e rode só o passo 6. O pipeline não depende do MCP.
