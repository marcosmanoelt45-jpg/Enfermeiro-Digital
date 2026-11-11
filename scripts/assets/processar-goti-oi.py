# "Oi" do Goti na tela inicial: o aceno antigo (public/goti/goti-wave.webm, 1920x1080 com alfa) recortado na
# mesma moldura do fim do susto (goti-susto), para a troca susto -> oi não mudar o tamanho nem a posição do Goti.
# Saída: public/goti/goti-oi.webm (480x480, alfa, loop) e goti-oi.webp (360x360, Safari/iOS).
# Uso: python scripts/assets/processar-goti-oi.py   (rodar depois de processar-goti-splash.py)
import os, shutil, subprocess, tempfile
from PIL import Image

FPS = 24
LADO = 480


def caixa(im):
    return im.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()


# Onde o Goti termina o susto (último quadro), na moldura de 480.
s = Image.open(os.path.join("public", "goti", "goti-susto.webp"))
s.seek(s.n_frames - 1)
fim = s.convert("RGBA").resize((LADO, LADO))
fx0, fy0, fx1, fy1 = caixa(fim)
alvo_alt, alvo_cx, alvo_base = fy1 - fy0, (fx0 + fx1) / 2, fy1

tmp = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-c:v", "libvpx-vp9", "-i", os.path.join("public", "goti", "goti-wave.webm"),
                "-vf", f"fps={FPS}", "-pix_fmt", "rgba", os.path.join(tmp, "q%03d.png")], check=True)
qs = [Image.open(os.path.join(tmp, f)).convert("RGBA") for f in sorted(os.listdir(tmp)) if f.endswith(".png")]
x0, y0, x1, y1 = caixa(qs[0])  # quadro parado: mede o corpo sem o braço levantado
esc = alvo_alt / (y1 - y0)
cx = (x0 + x1) / 2

saida = os.path.join(tmp, "out")
os.makedirs(saida)
fr = []
for i, q in enumerate(qs):
    g = q.resize((round(q.width * esc), round(q.height * esc)), Image.LANCZOS)
    tela = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    tela.paste(g, (round(alvo_cx - cx * esc), round(alvo_base - y1 * esc)), g)
    tela.save(os.path.join(saida, f"o{i:03d}.png"))
    fr.append(tela)

webm = os.path.join("public", "goti", "goti-oi.webm")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(saida, "o%03d.png"),
                "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "34", "-row-mt", "1",
                "-metadata:s:v:0", "alpha_mode=1", "-an", webm], check=True)
pq = [f.resize((300, 300), Image.LANCZOS) for f in fr[::2]]  # WebP com metade dos quadros (12 fps): leve
pq[0].save(os.path.join("public", "goti", "goti-oi.webp"), save_all=True, append_images=pq[1:], duration=int(2000 / FPS), loop=0, quality=66, method=4)
print("oi", len(fr), "quadros", os.path.getsize(webm) // 1024, "KB webm", os.path.getsize(os.path.join("public", "goti", "goti-oi.webp")) // 1024, "KB webp")
shutil.rmtree(tmp)
