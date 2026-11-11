# Braço com estetoscópio do minijogo de ausculta (Flow, Nano Banana 2.1, fundo verde, escolhido pelo dono).
# Entrada: assets-brutos/ausculta/opcoes-2026-11-11/mao-v2-1.jpg
# Saída:   public/minijogos/ausculta/mao-estetoscopio.webp (com transparência), recortada em volta do desenho.
# Passos: (1) suaviza os brilhos claros do dorso da mão (pedido do dono), sem mexer nas unhas nem no diafragma;
# (2) tira o verde por dominância (G - max(R, B)), com a borda suave e sem franja verde; (3) recorta e salva.
# Uso: python scripts/assets/processar-mao-estetoscopio.py
import json
import numpy as np
from PIL import Image

ENTRADA = "assets-brutos/ausculta/opcoes-2026-11-11/mao-v2-1.jpg"
SAIDA = "public/minijogos/ausculta/mao-estetoscopio.webp"
PELE = np.array([247, 175, 137], dtype=np.float32)

im = np.asarray(Image.open(ENTRADA).convert("RGB")).astype(np.float32)
h, w, _ = im.shape
r, g, b = im[..., 0], im[..., 1], im[..., 2]

# (1) Brilhos: rosa bem claro no dorso da mão (à direita e abaixo dos dedos), puxados de volta para a cor da pele.
yy, xx = np.mgrid[0:h, 0:w]
dorso = (xx > 560) & (yy > 470)
claro = (r > 240) & (g > 178) & (b > 140) & (r - b > 40)
t = np.clip((g - 178) / (205 - 178), 0, 1) * (dorso & claro)
im = im * (1 - t[..., None]) + PELE * t[..., None]
r, g, b = im[..., 0], im[..., 1], im[..., 2]

# (2) Fundo verde: alfa cheio quando o verde não domina, zero quando domina bem.
d = g - np.maximum(r, b)
alfa = np.clip((95 - d) / 45, 0, 1)
# tira o verde que vazou na borda
g2 = np.minimum(g, np.maximum(r, b) + 8)
rgba = np.dstack([r, g2, b, alfa * 255]).clip(0, 255).astype(np.uint8)
img = Image.fromarray(rgba)
# encolhe a borda do alfa 1 px: some a franja verde que sobra entre o desenho e o fundo
from PIL import ImageFilter
img.putalpha(img.getchannel("A").filter(ImageFilter.MinFilter(3)))

# (3) Recorte justo em volta do desenho, com 4 px de folga.
caixa = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
x0, y0, x1, y1 = max(caixa[0] - 4, 0), max(caixa[1] - 4, 0), min(caixa[2] + 4, w), min(caixa[3] + 4, h)
img = img.crop((x0, y0, x1, y1))
img.save(SAIDA, "WEBP", quality=88, method=6)

# Centro e raio do diafragma na imagem original (medidos), já no sistema do recorte.
centro = {"cx": 411 - x0, "cy": 470 - y0, "raio": 140, "largura": img.width, "altura": img.height}
print(json.dumps(centro))
