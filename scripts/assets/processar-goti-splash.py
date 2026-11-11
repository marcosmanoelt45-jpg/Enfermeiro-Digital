# Vídeos da tela inicial (Flow, fundo verde) -> public/goti/:
#   goti-lendo.webm/.webp  (Goti de costas lendo o prontuário; ida e volta, para o loop fechar sem emenda)
#   goti-susto.webm/.webp  (toque no Goti: susto, derruba tudo e vira de frente; toca uma vez)
# e a abertura (logo + "Enfere" sobre fundo escuro) -> public/abertura/enfere-abertura.mp4 (H.264, toca em todo navegador).
# Uso: python scripts/assets/processar-goti-splash.py <lendo.mp4> <susto.mp4> <abertura.mp4>
# Lendo e susto usam a MESMA moldura quadrada, para o 1º quadro do susto cair em cima do lendo sem pulo.
# Recorte do verde igual a processar-pulo-goti.py (d = G - max(R,B), alfa zero com d >= 95, só a maior mancha).
import os, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

lendo, susto, abertura = sys.argv[1:4]
FPS = 24
LADO = 480


def quadros(arq, ini=0.0, fim=None, so_maior=True):
    tmp = tempfile.mkdtemp()
    args = ["ffmpeg", "-v", "error", "-y", "-ss", str(ini)]
    if fim:
        args += ["-to", str(fim)]
    subprocess.run(args + ["-i", arq, "-vf", f"fps={FPS}", os.path.join(tmp, "q%03d.png")], check=True)
    out = []
    for f in sorted(os.listdir(tmp)):
        im = np.asarray(Image.open(os.path.join(tmp, f)).convert("RGB")).astype(np.float32)
        r, g, b = im[..., 0], im[..., 1], im[..., 2]
        d = g - np.maximum(r, b)
        alfa = np.clip((95 - d) / 45, 0, 1)
        g2 = np.minimum(g, np.maximum(r, b) + 40)
        q = Image.fromarray(np.dstack([r, g2, b, alfa * 255]).clip(0, 255).astype(np.uint8))
        a = q.getchannel("A").filter(ImageFilter.MinFilter(3)).point(lambda v: 0 if v < 24 else v)
        an = np.asarray(a)
        rot, n = ndimage.label(ndimage.binary_dilation(an > 60, iterations=1))
        if so_maior and n > 1:
            maior = 1 + int(np.argmax(ndimage.sum(np.ones_like(rot), rot, range(1, n + 1))))
            a = Image.fromarray((an * (rot == maior)).astype(np.uint8))
        q.putalpha(a)
        out.append(q)
    shutil.rmtree(tmp)
    return out


def caixa(lista):
    c = None
    for q in lista:
        bb = q.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
        if bb:
            c = bb if c is None else (min(c[0], bb[0]), min(c[1], bb[1]), max(c[2], bb[2]), max(c[3], bb[3]))
    return c


def salvar(lista, nome, moldura, loop):
    x0, y0, x1, y1 = moldura
    tmp = tempfile.mkdtemp()
    fr = []
    for i, q in enumerate(lista):
        f = q.crop((x0, y0, x1, y1)).resize((LADO, LADO), Image.LANCZOS)
        f.save(os.path.join(tmp, f"o{i:03d}.png"))
        fr.append(f)
    webm = os.path.join("public", "goti", nome + ".webm")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(tmp, "o%03d.png"),
                    "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "34", "-row-mt", "1",
                    "-metadata:s:v:0", "alpha_mode=1", "-an", webm], check=True)
    webp = os.path.join("public", "goti", nome + ".webp")
    pq = [f.resize((360, 360), Image.LANCZOS) for f in fr]  # o WebP só vai para Safari/iOS: menor e mais leve
    pq[0].save(webp, save_all=True, append_images=pq[1:], duration=int(1000 / FPS), loop=0 if loop else 1, quality=66, method=6)
    fr[0].save(os.path.join("public", "goti", nome + "-poster.webp"), quality=85)
    print(nome, len(fr), "quadros", f"{len(fr) / FPS:.2f}s", os.path.getsize(webm) // 1024, "KB webm", os.path.getsize(webp) // 1024, "KB webp")
    shutil.rmtree(tmp)


ql = quadros(lendo)
qs = quadros(susto, so_maior=False)  # no susto a prancheta e os óculos voam soltos: ficam
# Moldura quadrada comum: cabe o Goti de costas e o susto inteiro, com os pés no rodapé.
x0, y0, x1, y1 = caixa(ql + qs)
lado = max(x1 - x0, y1 - y0) + 24
cx = (x0 + x1) // 2
W, H = ql[0].size
mx0 = max(0, min(W - lado, cx - lado // 2))
my1 = min(H, y1 + 8)
moldura = (mx0, my1 - lado, mx0 + lado, my1)
# Loop do lendo: ida e volta (o clipe foi gerado só com o quadro inicial, então não fecha sozinho).
salvar(ql + ql[-2:0:-1], "goti-lendo", moldura, loop=True)
salvar(qs, "goti-susto", moldura, loop=False)

# Abertura: recorte quadrado no centro do conteúdo (logo + nome), 720 px, H.264 sem áudio.
os.makedirs(os.path.join("public", "abertura"), exist_ok=True)
saida = os.path.join("public", "abertura", "enfere-abertura.mp4")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", abertura, "-vf", "crop=720:720:0:250,scale=720:720:flags=lanczos,format=yuv420p",
                "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-movflags", "+faststart", "-an", saida], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-sseof", "-0.05", "-i", saida, "-frames:v", "1", "-q:v", "3",
                os.path.join("public", "abertura", "enfere-abertura-fim.jpg")], check=True)
print("abertura", os.path.getsize(saida) // 1024, "KB")
