# Pulo do Goti (vídeo do Flow em fundo verde) -> public/goti/<nome>.webm (VP9 com alfa, 60 fps) + <nome>.webp
# (animado a 30 fps, toca uma vez; é o que o Safari usa, porque ele não mostra WebM com transparência).
# Uso: python scripts/assets/processar-pulo-goti.py <entrada.mp4> <nome> <inicio_s> <fim_s> [velocidade=1]
# - Use só o trecho em que o Goti está NO AR: a subida e a queda pela tela ficam por conta do código
#   (SaltoMascote.jsx), num movimento único, sem pousar.
# - O corpo é estabilizado: em cada quadro, o centro do Goti e a base dos pés vão para o mesmo ponto, para o
#   vídeo trocar só a pose e o movimento vir todo do código.
# - Os quadros intermediários são criados (minterpolate) para chegar a 60 fps e ficar fluido.
# Recorte por dominância do verde, igual a processar-personagem.mjs (d = G - max(R,B); alfa zero com d >= 95).
import os, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

entrada, nome = sys.argv[1], sys.argv[2]
ini, fim = float(sys.argv[3]), float(sys.argv[4])
vel = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
LARGURA = 360  # px do vídeo final (o app mostra com ~210 px de largura; 360 cobre telas 2x/3x sem pesar)
FPS = 60

tmp = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ini), "-to", str(fim), "-i", entrada, "-vf",
                f"setpts=PTS/{vel},minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1",
                os.path.join(tmp, "q%03d.png")], check=True)
arqs = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))

quadros, caixas = [], []
for f in arqs:
    im = np.asarray(Image.open(os.path.join(tmp, f)).convert("RGB")).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    d = g - np.maximum(r, b)
    alfa = np.clip((95 - d) / 45, 0, 1)
    g2 = np.minimum(g, np.maximum(r, b) + 40)
    q = Image.fromarray(np.dstack([r, g2, b, alfa * 255]).clip(0, 255).astype(np.uint8))
    a = q.getchannel("A").filter(ImageFilter.MinFilter(3)).point(lambda v: 0 if v < 24 else v)
    an = np.asarray(a)
    # só a maior mancha (o Goti): some com respingos e borrões da interpolação
    rot, n = ndimage.label(ndimage.binary_dilation(an > 60, iterations=1))
    if n > 1:
        maior = 1 + int(np.argmax(ndimage.sum(np.ones_like(rot), rot, range(1, n + 1))))
        a = Image.fromarray((an * (rot == maior)).astype(np.uint8))
    q.putalpha(a)
    quadros.append(q)
    caixas.append(a.point(lambda v: 255 if v > 40 else 0).getbbox())

# Estabiliza: centro horizontal e base de cada quadro vão para a mediana.
cxs = [(c[0] + c[2]) / 2 for c in caixas if c]
bases = [c[3] for c in caixas if c]
cx_alvo, base_alvo = float(np.median(cxs)), float(np.median(bases))
W0, H0 = quadros[0].size
estab = []
for q, c in zip(quadros, caixas):
    dx = round(cx_alvo - (c[0] + c[2]) / 2) if c else 0
    dy = round(base_alvo - c[3]) if c else 0
    t = Image.new("RGBA", (W0, H0), (0, 0, 0, 0))
    t.paste(q, (dx, dy), q)
    estab.append(t)

caixa = None
for t in estab:
    bb = t.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    if bb:
        caixa = bb if caixa is None else (min(caixa[0], bb[0]), min(caixa[1], bb[1]), max(caixa[2], bb[2]), max(caixa[3], bb[3]))
x0, y0, x1, y1 = caixa
m = 10
x0, y0, x1, y1 = max(0, x0 - m), max(0, y0 - m), min(W0, x1 + m), min(H0, y1 + 2)
W = LARGURA
H = int(round((y1 - y0) * W / (x1 - x0) / 2) * 2)
saida_png = os.path.join(tmp, "out")
os.makedirs(saida_png)
fr = []
for i, t in enumerate(estab):
    o = t.crop((x0, y0, x1, y1)).resize((W, H), Image.LANCZOS)
    o.save(os.path.join(saida_png, f"o{i:03d}.png"))
    fr.append(o)

pub = os.path.join("public", "goti")
webm = os.path.join(pub, nome + ".webm")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(saida_png, "o%03d.png"),
                "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "34", "-row-mt", "1",
                "-metadata:s:v:0", "alpha_mode=1", "-an", webm], check=True)
webp = os.path.join(pub, nome + ".webp")
pq = fr[::2]  # Safari: 30 fps basta e o arquivo fica com metade do peso
pq[0].save(webp, save_all=True, append_images=pq[1:], duration=int(2000 / FPS), loop=1, quality=72, method=4)
print(nome, f"{len(fr)} quadros, {len(fr) / FPS:.2f}s, {W}x{H}", "webm", os.path.getsize(webm) // 1024, "KB", "webp", os.path.getsize(webp) // 1024, "KB")
shutil.rmtree(tmp)
