# Vídeos da tela inicial (Flow, fundo verde) -> public/goti/:
#   goti-lendo.webm/.webp  Goti de costas lendo o prontuário (ida e volta, para o loop fechar sem emenda)
#   goti-susto.webm/.webp  toque no Goti: susto, derruba tudo e vira de frente (toca uma vez)
#   goti-oi.webm/.webp     aceno de frente, depois do susto (loop; vem de public/goti/goti-wave.webm)
# Uso: python scripts/assets/processar-goti-splash.py <lendo.mp4> <susto.mp4> [velocidade_susto=1.25]
#
# Regra única de moldura (quadrado de LADO px): o corpo do Goti ocupa ALTURA_CORPO da altura do quadro, centrado na
# horizontal, com os pés a BASE do topo. Lendo e susto usam o 1º quadro de cada um como referência; o "oi" usa o
# último quadro do susto. Assim o Goti não muda de tamanho nem de lugar entre um vídeo e outro, e sobra espaço dos
# lados para os braços.
# Fluidez: os quadros intermediários são criados (minterpolate) e tudo sai a 60 fps; o WebP do Safari sai a 30.
import os, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

lendo, susto = sys.argv[1], sys.argv[2]
vel_susto = float(sys.argv[3]) if len(sys.argv) > 3 else 1.25
FPS = 60
LADO = 480
ALTURA_CORPO = 0.60
BASE = 0.92
INTERP = f"minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
VERDE = "0x0AF609"


def extrai(arq, filtro_extra=""):
    tmp = tempfile.mkdtemp()
    vf = (filtro_extra + "," if filtro_extra else "") + INTERP
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", arq, "-vf", vf, os.path.join(tmp, "q%04d.png")], check=True)
    return tmp, sorted(f for f in os.listdir(tmp) if f.endswith(".png"))


def recorta(tmp, arqs, so_maior):
    out = []
    for f in arqs:
        im = np.asarray(Image.open(os.path.join(tmp, f)).convert("RGB")).astype(np.float32)
        r, g, b = im[..., 0], im[..., 1], im[..., 2]
        d = g - np.maximum(r, b)
        alfa = np.clip((95 - d) / 45, 0, 1)
        g2 = np.minimum(g, np.maximum(r, b) + 40)
        q = Image.fromarray(np.dstack([r, g2, b, alfa * 255]).clip(0, 255).astype(np.uint8))
        a = q.getchannel("A").filter(ImageFilter.MinFilter(3)).point(lambda v: 0 if v < 24 else v)
        an = np.asarray(a)
        rot, n = ndimage.label(ndimage.binary_dilation(an > 60, iterations=1))
        if n > 1:
            tam = ndimage.sum(np.ones_like(rot), rot, range(1, n + 1))
            if so_maior:
                keep = rot == (1 + int(np.argmax(tam)))
            else:  # mantém objetos soltos (prancheta, óculos), mas tira sujeira pequena
                keep = np.isin(rot, [i + 1 for i, t in enumerate(tam) if t > 400])
            a = Image.fromarray((an * keep).astype(np.uint8))
        q.putalpha(a)
        out.append(q)
    return out


def corpo(q):
    """Caixa do corpo: a maior mancha (ignora objetos que voam)."""
    an = np.asarray(q.getchannel("A")) > 60
    rot, n = ndimage.label(an)
    if n == 0:
        return None
    tam = ndimage.sum(np.ones_like(rot), rot, range(1, n + 1))
    ys, xs = np.nonzero(rot == (1 + int(np.argmax(tam))))
    return xs.min(), ys.min(), xs.max(), ys.max()


def moldura(ref, alvo_alt=ALTURA_CORPO, alvo_base=BASE, alvo_cx=0.5):
    x0, y0, x1, y1 = corpo(ref)
    lado = (y1 - y0) / alvo_alt
    cx = (x0 + x1) / 2
    return (cx - lado * alvo_cx, y1 - lado * alvo_base, lado)


def aplica(quadros, mold):
    mx, my, lado = mold
    out = []
    for q in quadros:
        tela = Image.new("RGBA", (round(lado), round(lado)), (0, 0, 0, 0))
        tela.paste(q, (round(-mx), round(-my)), q)
        out.append(tela.resize((LADO, LADO), Image.LANCZOS))
    return out


def salva(fr, nome, loop):
    tmp = tempfile.mkdtemp()
    for i, f in enumerate(fr):
        f.save(os.path.join(tmp, f"o{i:04d}.png"))
    webm = os.path.join("public", "goti", nome + ".webm")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(tmp, "o%04d.png"),
                    "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "36", "-row-mt", "1",
                    "-metadata:s:v:0", "alpha_mode=1", "-an", webm], check=True)
    webp = os.path.join("public", "goti", nome + ".webp")
    pq = [f.resize((300, 300), Image.LANCZOS) for f in fr[::2]]
    pq[0].save(webp, save_all=True, append_images=pq[1:], duration=int(2000 / FPS), loop=0 if loop else 1, quality=62, method=4)
    fr[0].resize((360, 360), Image.LANCZOS).save(os.path.join("public", "goti", nome + "-poster.webp"), quality=85)
    print(nome, len(fr), "quadros", f"{len(fr) / FPS:.2f}s", os.path.getsize(webm) // 1024, "KB webm", os.path.getsize(webp) // 1024, "KB webp")
    shutil.rmtree(tmp)


# Lendo: 1x (é parado de propósito), ida e volta.
t, a = extrai(lendo)
ql = recorta(t, a, True)
shutil.rmtree(t)
fl = aplica(ql, moldura(ql[0]))
salva(fl + fl[-2:0:-1], "goti-lendo", True)

# Susto: mais rápido (vel_susto) e sem filtrar a prancheta e os óculos que voam.
t, a = extrai(susto, f"setpts=PTS/{vel_susto}")
qs = recorta(t, a, False)
shutil.rmtree(t)
fs = aplica(qs, moldura(qs[0]))
# O Flow entrega o Goti de frente maior que o de costas: encolhe aos poucos (pelos pés, no centro) para ele
# terminar com a mesma altura do começo, sem "crescer" ao virar.
h0 = corpo(fs[0])[3] - corpo(fs[0])[1]
h1 = corpo(fs[-1])[3] - corpo(fs[-1])[1]
alvo = h0 / h1
x0, y0, x1, y1 = corpo(fs[0])
px, py = (x0 + x1) / 2, y1
n = len(fs)
for i, f in enumerate(fs):
    t = i / (n - 1)
    k = 1 + (alvo - 1) * (t * t * (3 - 2 * t))  # suave no começo e no fim
    if abs(k - 1) < 1e-3:
        continue
    g = f.resize((round(LADO * k), round(LADO * k)), Image.LANCZOS)
    tela = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    tela.paste(g, (round(px - px * k), round(py - py * k)), g)
    fs[i] = tela
salva(fs, "goti-susto", False)

# Oi: o aceno antigo, sobre verde para interpolar, no mesmo tamanho e lugar do último quadro do susto.
x0, y0, x1, y1 = corpo(fs[-1])
alt_fim, base_fim, cx_fim = (y1 - y0) / LADO, y1 / LADO, (x0 + x1) / 2 / LADO
t0 = tempfile.mkdtemp()
verde = os.path.join(t0, "oi.mp4")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-c:v", "libvpx-vp9", "-i", os.path.join("public", "goti", "goti-wave.webm"),
                "-filter_complex", f"color=c={VERDE}:s=1920x1080[bg];[bg][0:v]overlay=shortest=1,format=yuv420p",
                "-an", "-c:v", "libx264", "-crf", "16", verde], check=True)
t, a = extrai(verde)
qo = recorta(t, a, True)
shutil.rmtree(t)
shutil.rmtree(t0)
fo = aplica(qo, moldura(qo[0], alt_fim, base_fim, cx_fim))
salva(fo, "goti-oi", True)
