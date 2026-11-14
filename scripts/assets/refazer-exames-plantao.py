# Refaz as imagens dos exames do Plantão (public/plantao/exames/*.webp) com mais resolução e qualidade, a partir dos
# originais do Flow (assets-brutos/flow/exames-plantao*/). As publicadas estavam em 768x576 com 6-14 KB.
# Para cada imagem publicada, escolhe o original mais parecido (o mesmo usado antes) e regrava em 1024x768.
# Uso: python scripts/assets/refazer-exames-plantao.py [--testar]
import glob, os, sys
import numpy as np
from PIL import Image

L, A = 1024, 768
QUALIDADE = 86
testar = "--testar" in sys.argv
originais = sorted(glob.glob("assets-brutos/flow/exames-plantao*/*.jpg") + glob.glob("assets-brutos/flow/exames-plantao*/*.png"))


def pequena(im, n=48):
    return np.asarray(im.convert("L").resize((n, n * 3 // 4), Image.LANCZOS), dtype=np.float32)


def recorte_4x3(im):
    w, h = im.size
    if w / h > 4 / 3:
        nw = round(h * 4 / 3)
        return im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    nh = round(w * 3 / 4)
    return im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))


cache = {}
for pub in sorted(glob.glob("public/plantao/exames/*.webp")):
    nome = os.path.splitext(os.path.basename(pub))[0]
    alvo = pequena(Image.open(pub))
    # candidatos com o mesmo nome primeiro; se nenhum bater, todos
    mesmos = [o for o in originais if os.path.basename(o).startswith(nome)]
    melhor = None
    for lista in (mesmos, originais):
        notas = []
        for o in lista:
            if o not in cache:
                cache[o] = pequena(recorte_4x3(Image.open(o)))
            notas.append((float(np.mean((cache[o] - alvo) ** 2)), o))
        if notas:
            erro, o = min(notas)
            if erro < 250:
                melhor = (erro, o)
                break
    antes = os.path.getsize(pub) // 1024
    if not melhor:
        print(f"{nome}: nenhum original bate, fica como está")
        continue
    erro, o = melhor
    if not testar:
        recorte_4x3(Image.open(o).convert("RGB")).resize((L, A), Image.LANCZOS).save(pub, quality=QUALIDADE, method=6)
    print(f"{nome}: {os.path.relpath(o, 'assets-brutos/flow')} (erro {erro:.0f}) {antes} KB -> {os.path.getsize(pub) // 1024} KB")
