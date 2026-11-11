# Pulo do Goti (vídeo do Flow em fundo verde) -> public/goti/<nome>.webm (VP9 com alfa) + <nome>.webp (animado,
# toca uma vez; é o que o Safari usa, porque ele não mostra WebM com transparência).
# Uso: python scripts/assets/processar-pulo-goti.py <entrada.mp4> <nome> <inicio_s> <fim_s> [velocidade=1.35]
# Recorte por dominância do verde, igual a processar-personagem.mjs (d = G - max(R,B); alfa zero com d >= 95).
# O quadro final é a caixa que contém o Goti em TODOS os quadros, com a base dos pés no rodapé.
import os, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

entrada, nome = sys.argv[1], sys.argv[2]
ini, fim = float(sys.argv[3]), float(sys.argv[4])
vel = float(sys.argv[5]) if len(sys.argv) > 5 else 1.35
LARGURA = 360  # px do vídeo final (o app mostra com ~200 px de largura; 360 cobre telas 2x/3x sem pesar)
FPS = 24

tmp = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ini), "-to", str(fim), "-i", entrada,
                "-vf", f"setpts=PTS/{vel},fps={FPS}", os.path.join(tmp, "q%03d.png")], check=True)
arqs = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))

quadros, caixa = [], None
for f in arqs:
    im = np.asarray(Image.open(os.path.join(tmp, f)).convert("RGB")).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    d = g - np.maximum(r, b)
    alfa = np.clip((95 - d) / 45, 0, 1)
    g2 = np.minimum(g, np.maximum(r, b) + 40)
    q = Image.fromarray(np.dstack([r, g2, b, alfa * 255]).clip(0, 255).astype(np.uint8))
    a = q.getchannel("A").filter(ImageFilter.MinFilter(3))
    # some com respingos soltos: só fica o que tem alfa forte, e só a maior mancha (o Goti) com o que encosta nela
    a = a.point(lambda v: 0 if v < 24 else v)
    an = np.asarray(a)
    rot, n = ndimage.label(ndimage.binary_dilation(an > 60, iterations=1))
    if n > 1:
        maior = 1 + int(np.argmax(ndimage.sum(np.ones_like(rot), rot, range(1, n + 1))))
        a = Image.fromarray((an * (rot == maior)).astype(np.uint8))
    q.putalpha(a)
    quadros.append(q)
    bb = a.point(lambda v: 255 if v > 40 else 0).getbbox()
    if bb:
        caixa = bb if caixa is None else (min(caixa[0], bb[0]), min(caixa[1], bb[1]), max(caixa[2], bb[2]), max(caixa[3], bb[3]))

x0, y0, x1, y1 = caixa
m = 12
x0, y0, x1, y1 = max(0, x0 - m), max(0, y0 - m), min(quadros[0].width, x1 + m), min(quadros[0].height, y1 + 2)
w = x1 - x0
h = y1 - y0
W = LARGURA
H = int(round(h * W / w / 2) * 2)
saida_png = os.path.join(tmp, "out")
os.makedirs(saida_png)
for i, q in enumerate(quadros):
    q.crop((x0, y0, x1, y1)).resize((W, H), Image.LANCZOS).save(os.path.join(saida_png, f"o{i:03d}.png"))

pub = os.path.join("public", "goti")
webm = os.path.join(pub, nome + ".webm")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(saida_png, "o%03d.png"),
                "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "34", "-row-mt", "1",
                "-metadata:s:v:0", "alpha_mode=1", "-an", webm], check=True)
fr = [Image.open(os.path.join(saida_png, f"o{i:03d}.png")) for i in range(len(quadros))]
webp = os.path.join(pub, nome + ".webp")
fr[0].save(webp, save_all=True, append_images=fr[1:], duration=int(1000 / FPS), loop=1, quality=78, method=5)
fr[len(fr) // 2].save(os.path.join(tempfile.gettempdir(), nome + "-meio.png"))
print(nome, f"{len(fr)} quadros, {len(fr) / FPS:.2f}s, {W}x{H}", "webm", os.path.getsize(webm) // 1024, "KB", "webp", os.path.getsize(webp) // 1024, "KB")
shutil.rmtree(tmp)
