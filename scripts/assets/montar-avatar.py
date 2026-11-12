# Monta as camadas do avatar a partir das artes do Flow (assets-brutos/flow/avatar/pecas).
# Cada peça foi gerada como edição da mesma imagem base (careca, pijama liso, fundo verde), então a camada
# da peça é só o que mudou em relação à base. Saída em public/avatar/:
#   <peca>.webp       pixels de cor fixa (RGBA)
#   <peca>.pele.webp  pixels de pele, guardados como sombra (cinza) para tingir com o tom escolhido
#   <peca>.cor.webp   pixels tingíveis (cabelo, barba, acessório, pijama), também como sombra
# e manifesto.json com o que cada peça tem. O tingimento é feito no navegador (AvatarPessoa.jsx):
# cor_final = cor_escolhida * sombra / 170.
# Uso: python scripts/assets/montar-avatar.py
import json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENTRADA = os.path.join(RAIZ, 'assets-brutos', 'flow', 'avatar', 'pecas')
SAIDA = os.path.join(RAIZ, 'public', 'avatar')
LADO = 512
REF_SOMBRA = 170.0

def ler(nome):
    return np.asarray(Image.open(os.path.join(ENTRADA, nome + '.jpg')).convert('RGB')).astype(np.float32)

def hsv(img):
    r, g, b = img[..., 0] / 255, img[..., 1] / 255, img[..., 2] / 255
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-6), 0)
    return h, s, mx

def lum(img):
    return img[..., 0] * 0.299 + img[..., 1] * 0.587 + img[..., 2] * 0.114

def alfa_fundo(img):
    """1 onde é verde do fundo, 0 onde não é."""
    k = img[..., 1] - np.maximum(img[..., 0], img[..., 2])
    return np.clip((k - 60) / 110, 0, 1)

def sem_verde(img):
    out = img.copy()
    lim = np.maximum(out[..., 0], out[..., 2]) + 8
    out[..., 1] = np.minimum(out[..., 1], lim)
    return out

def dif_hue(h, ref):
    d = np.abs(h - ref) % 360
    return np.minimum(d, 360 - d)

PELE_REF = np.array([250, 196, 166], np.float32)  # ajustada pela base logo abaixo

def classe_pele(img):
    h, s, v = hsv(img)
    perto = np.sqrt(((img - PELE_REF) ** 2).sum(2)) < 42
    return ((dif_hue(h, 22) < 13) & (s > 0.12) & (s < 0.62) & (v > 0.58)) | perto

def classe_roupa(img):
    h, s, v = hsv(img)
    return (dif_hue(h, 226) < 16) & (s > 0.14) & (v > 0.58)

def dilata(m, r):
    return ndimage.binary_dilation(m, iterations=r)

def salvar(arr_rgb, alfa, caminho):
    """Grava RGBA reduzido a LADO, com alfa pré-multiplicado na redução (sem franja escura)."""
    rgba = np.dstack([np.clip(arr_rgb, 0, 255), np.clip(alfa, 0, 1) * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA').convert('RGBa').resize((LADO, LADO), Image.LANCZOS).convert('RGBA')
    im.save(caminho, 'WEBP', quality=88, method=6)

FUNDO_ATUAL = None  # alfa do verde da imagem original (antes de tirar o verde), definido por peça

def sombra(img, mascara_classe, ref_lum):
    s = np.clip(lum(img) / max(ref_lum, 1) * REF_SOMBRA, 0, 255)
    # na borda com o fundo verde o brilho vem do verde: usa o tom médio para não sobrar contorno claro
    if FUNDO_ATUAL is not None:
        s = np.where(FUNDO_ATUAL > 0.04, REF_SOMBRA, s)
    return np.dstack([s, s, s]), mascara_classe

base = ler('base')
bg = alfa_fundo(base)
alfa_base = 1 - bg
base_limpa = sem_verde(base)
pele_base = classe_pele(base) & (alfa_base > 0.5)
PELE_REF[:] = np.median(base[pele_base], axis=0)
pele_base = classe_pele(base) & (alfa_base > 0.5)
roupa_base = classe_roupa(base) & (alfa_base > 0.5)
LUM_PELE = float(np.median(lum(base)[pele_base]))
LUM_ROUPA = float(np.median(lum(base)[roupa_base]))

nomes = sorted(n[:-4] for n in os.listdir(ENTRADA) if n.endswith('.jpg') and n != 'base.jpg' and not n.startswith('_'))

def dif(img):
    return np.abs(img - base).sum(2)

# regiões do rosto: olhos e boca (união do que muda nas variações), para as outras peças não mexerem nelas
OLHOS = np.zeros(base.shape[:2], bool); BOCA = np.zeros(base.shape[:2], bool)
for n in nomes:
    if n.startswith('olhos-'): OLHOS |= dif(ler(n)) > 60
    if n.startswith('boca-'): BOCA |= dif(ler(n)) > 60
OLHOS = dilata(ndimage.binary_opening(OLHOS, iterations=1), 6)
BOCA = dilata(ndimage.binary_opening(BOCA, iterations=1), 6)

TINGE_CABECA = {'cabeca-gato', 'cabeca-urso', 'cabeca-coelho', 'cabeca-touca', 'cabeca-laco', 'cabeca-antenas'}
os.makedirs(SAIDA, exist_ok=True)
manifesto = {}

def gravar_camadas(nome, img, alfa, cor_mask=None, cor_ref=None):
    pele = classe_pele(img) & (alfa > 0.02)
    roupa = classe_roupa(img) & (alfa > 0.02) & ~pele
    cor = (cor_mask & (alfa > 0.02) & ~pele) if cor_mask is not None else np.zeros_like(pele)
    roupa &= ~cor
    fixo = ~(pele | roupa | cor)
    info = {}
    if (alfa * fixo).sum() > 50:
        salvar(img, alfa * fixo, os.path.join(SAIDA, nome + '.webp')); info['fixo'] = True
    if (alfa * pele).sum() > 50:
        s, _ = sombra(img, pele, LUM_PELE); salvar(s, alfa * pele, os.path.join(SAIDA, nome + '.pele.webp')); info['pele'] = True
    if (alfa * roupa).sum() > 50:
        s, _ = sombra(img, roupa, LUM_ROUPA); salvar(s, alfa * roupa, os.path.join(SAIDA, nome + '.roupa.webp')); info['roupa'] = True
    if (alfa * cor).sum() > 50:
        s, _ = sombra(img, cor, cor_ref); salvar(s, alfa * cor, os.path.join(SAIDA, nome + '.cor.webp')); info['cor'] = True
    manifesto[nome] = info
    print(nome, info)

# base
FUNDO_ATUAL = bg
gravar_camadas('base', base_limpa, alfa_base)

for n in nomes:
    img = ler(n)
    d = dif(img)
    alfa = np.clip((d - 35) / 45, 0, 1)
    m = ndimage.binary_opening(alfa > 0.3, iterations=2)
    m = dilata(m, 2)
    alfa = alfa * m
    alfa = np.minimum(alfa, 1 - alfa_fundo(img))
    cat = n.split('-')[0]
    if cat not in ('olhos', 'oculos'): alfa[OLHOS] = 0
    if cat not in ('boca', 'barba'): alfa[BOCA] = 0
    # óculos ficam com os olhos originais nas lentes; a camada de olhos escolhida é desenhada por cima
    limpa = sem_verde(img)
    FUNDO_ATUAL = alfa_fundo(img)
    cor_mask = cor_ref = None
    if cat in ('cabelo', 'barba'):
        cor_mask = ~classe_pele(img) & ~classe_roupa(img)
        sel = cor_mask & (alfa > 0.8)
        cor_ref = float(np.median(lum(img)[sel])) if sel.any() else 60.0
    elif n in TINGE_CABECA:
        h, s, v = hsv(img)
        sel = (alfa > 0.8) & (s > 0.18) & ~classe_pele(img)
        hue_ref = float(np.median(h[sel]))
        cor_mask = (dif_hue(h, hue_ref) < 18) & (s > 0.12)
        cor_ref = float(np.median(lum(img)[cor_mask & (alfa > 0.8)]))
    gravar_camadas(n, limpa, alfa, cor_mask, cor_ref)

# o manifesto vai junto do código (import estático em src/features/avatar/compor.js)
with open(os.path.join(RAIZ, 'src', 'features', 'avatar', 'camadas.json'), 'w', encoding='utf-8') as f:
    json.dump(manifesto, f, ensure_ascii=False, indent=0, sort_keys=True)
print('pecas:', len(manifesto))
