# Ícone do Flow em fundo verde -> webp com transparência, recortado e quadrado.
# Uso: python scripts/assets/processar-icone-verde.py <entrada.jpg> <saida.webp> [lado=512]
# Mesmo recorte por dominância do verde do braço do estetoscópio (G - max(R, B)), com a borda encolhida 1 px.
import sys
import numpy as np
from PIL import Image, ImageFilter

entrada, saida = sys.argv[1], sys.argv[2]
lado = int(sys.argv[3]) if len(sys.argv) > 3 else 512

im = np.asarray(Image.open(entrada).convert("RGB")).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
d = g - np.maximum(r, b)
alfa = np.clip((95 - d) / 45, 0, 1)
g2 = np.minimum(g, np.maximum(r, b) + 8)
img = Image.fromarray(np.dstack([r, g2, b, alfa * 255]).clip(0, 255).astype(np.uint8))
img.putalpha(img.getchannel("A").filter(ImageFilter.MinFilter(3)))

caixa = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
img = img.crop(caixa)
# centraliza num quadrado com 4% de folga
m = int(max(img.size) * 1.08)
quadro = Image.new("RGBA", (m, m), (0, 0, 0, 0))
quadro.paste(img, ((m - img.width) // 2, (m - img.height) // 2), img)
quadro.resize((lado, lado), Image.LANCZOS).save(saida, "WEBP", quality=90, method=6)
print("ok", saida)
