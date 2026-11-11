# Ícone do Flow em fundo verde -> webp com transparência, recortado e quadrado.
# Uso: python scripts/assets/processar-icone-verde.py <entrada.jpg> <saida.webp> [lado=512] [--sem-amarelo]
# Mesmo recorte por dominância do verde do braço do estetoscópio (G - max(R, B)), com a borda encolhida 1 px.
# --sem-amarelo apaga os brilhos amarelos soltos (as estrelinhas em volta do selo).
import sys
import numpy as np
from PIL import Image, ImageFilter

args = [a for a in sys.argv[1:] if not a.startswith("--")]
sem_amarelo = "--sem-amarelo" in sys.argv
entrada, saida = args[0], args[1]
lado = int(args[2]) if len(args) > 2 else 512

im = np.asarray(Image.open(entrada).convert("RGB")).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
d = g - np.maximum(r, b)
alfa = np.clip((95 - d) / 45, 0, 1)
if sem_amarelo:
    # amarelo: vermelho alto e azul baixo (o verde do fundo tem vermelho baixo; o teal e o branco têm azul alto)
    amarelo = (r > 150) & (b < 140) & (r - b > 70)
    m = Image.fromarray((amarelo * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))
    alfa = alfa * (np.asarray(m) < 128)
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
