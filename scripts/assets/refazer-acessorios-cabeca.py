# Refaz o recorte das tiaras do avatar (orelhas de gato, urso e coelho, laço e anteninhas) a partir da arte do
# Flow (assets-brutos/flow/avatar/pecas/cabeca-<nome>.jpg, desenhada na cabeça careca, no lugar certo).
# O recorte antigo (montar-avatar.py) separava a peça pela diferença com a base e tirava o que parecia pele; o rosa
# da arte é quase da cor da pele, então saíam buracos (base da orelha do coelho), partes meio transparentes (laço),
# a tiara das anteninhas vazada e bordas serrilhadas. Aqui a peça é separada pelo matiz (rosa ~340-360°, pele
# ~20°), os buracos fechados, a borda alisada e as cores chapadas em três tons (contorno, cor, parte de dentro).
# Grava public/avatar/cabeca-<nome>.cor.webp (sombra para tingir, 1024) e, nas anteninhas, cabeca-antenas.webp
# (molas e tiara em cor fixa), e atualiza src/features/avatar/camadas.json.
# Uso: python scripts/assets/refazer-acessorios-cabeca.py
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BRUTOS = os.path.join(RAIZ, 'assets-brutos', 'flow', 'avatar', 'pecas')
AVATAR = os.path.join(RAIZ, 'public', 'avatar')
MANIFESTO = os.path.join(RAIZ, 'src', 'features', 'avatar', 'camadas.json')
PECAS = ['gato', 'urso', 'coelho', 'laco', 'antenas']
# tons da sombra (170 = a cor escolhida; ver compor.js)
TOM = {'contorno': 128, 'cor': 170, 'dentro': 226}
ESCURO_FIXO = (52, 46, 62)  # molas e tiara das anteninhas


def hsv(img):
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    mx, mn = img.max(2), img.min(2)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rr = m & (mx == r)
    gg = m & (mx == g) & ~rr
    bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6
    h[gg] = (b - r)[gg] / d[gg] + 2
    h[bb] = (r - g)[bb] / d[bb] + 4
    return h * 60, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx


def alisar(mascara, sigma, abrir=0):
    """Borda lisa: tira pontinhas e dentes e devolve um alfa com antisserrilhado de ~1 px."""
    m = mascara
    if abrir:
        m = ndimage.binary_opening(m, structure=np.ones((3, 3)), iterations=abrir)
        m = ndimage.binary_closing(m, structure=np.ones((3, 3)), iterations=abrir)
    suave = ndimage.gaussian_filter(m.astype(np.float32), sigma)
    duro = suave > 0.5
    return duro, np.clip(ndimage.gaussian_filter(duro.astype(np.float32), 0.7) * 1.15 - 0.075, 0, 1)


def salvar(rgb, alfa, nome):
    rgba = np.dstack([np.clip(rgb, 0, 255), np.clip(alfa * 255, 0, 255)]).astype(np.uint8)
    Image.fromarray(rgba).save(os.path.join(AVATAR, nome), 'WEBP', quality=94, method=6)


with open(MANIFESTO, encoding='utf-8') as f:
    manifesto = json.load(f)

for nome in PECAS:
    img = np.asarray(Image.open(os.path.join(BRUTOS, f'cabeca-{nome}.jpg')).convert('RGB')).astype(np.float32) / 255
    h, s, v = hsv(img)
    fundo = (img[..., 1] - np.maximum(img[..., 0], img[..., 2])) > 0.18
    rosa = ((h >= 318) | (h <= 6)) & (s > 0.08) & ~fundo
    escuro = (v < 0.55) & ~fundo & ~((h > 10) & (h < 40) & (s > 0.25))  # traço escuro (não é sombra de pele)
    if nome != 'antenas':
        # o contorno escuro da peça conta como peça; o rosto (olhos, boca) fica longe dela
        rosa |= escuro & ndimage.binary_dilation(rosa, iterations=4)
        escuro = np.zeros_like(rosa)
    # só a peça: a maior parte e o que encosta nela (tira os pontinhos rosados das bochechas)
    rot, qtd = ndimage.label(rosa)
    areas = ndimage.sum(rosa, rot, range(1, qtd + 1))
    rosa = np.isin(rot, [i + 1 for i, a in enumerate(areas) if a > 1200])
    rosa[int(img.shape[0] * 0.42):] = False  # nada abaixo da testa
    # buracos fechados por dentro da peça (base da orelha do coelho, miolo da orelha) viram peça
    cheio = ndimage.binary_fill_holes(ndimage.binary_closing(rosa, iterations=3))
    duro, alfa = alisar(cheio, 1.4, abrir=2)
    # tons: contorno (escuro), cor (rosa médio) e parte de dentro (rosa claro); buraco fechado = parte de dentro
    tom = np.full(img.shape[:2], TOM['cor'], np.float32)
    lum = 0.3 * img[..., 0] + 0.59 * img[..., 1] + 0.11 * img[..., 2]
    classe = np.ones(img.shape[:2], np.uint8)  # 1 = cor
    med = float(np.median(lum[rosa]))
    classe[(lum > med * 1.16) & (s < 0.32)] = 2  # dentro (rosa claro)
    classe[cheio & ~rosa] = 2
    classe[lum < med * 0.84] = 0  # contorno e dobras (rosa escuro)
    classe = ndimage.median_filter(classe, size=7)
    # contorno fino em volta, igual em toda a peça
    borda = duro & ~ndimage.binary_erosion(duro, iterations=4)
    classe[borda] = 0
    for k, t in ((0, TOM['contorno']), (1, TOM['cor']), (2, TOM['dentro'])):
        tom[classe == k] = t
    tom = ndimage.gaussian_filter(tom, 0.6)
    salvar(np.dstack([tom, tom, tom]), alfa, f'cabeca-{nome}.cor.webp')
    entrada = {'cor': True}
    if nome == 'antenas':
        # molas e tiara: o traço escuro acima da testa (os olhos ficam abaixo de y 300 da arte de 1024)
        esc = escuro.copy()
        yy, xx = np.mgrid[0:esc.shape[0], 0:esc.shape[1]]
        # a tiara desce até perto das orelhas pelos lados; no meio, nada abaixo de y 300 (sobrancelhas e olhos)
        esc &= (yy < 300) | ((yy < 430) & (np.abs(xx - esc.shape[1] / 2) > 165))
        xs = np.where(cheio.any(0))[0]
        esc[:, :max(0, xs.min() - 60)] = False
        esc[:, xs.max() + 60:] = False
        rot, qtd = ndimage.label(esc)
        if qtd:
            areas = ndimage.sum(esc, rot, range(1, qtd + 1))
            esc = np.isin(rot, [i + 1 for i, a in enumerate(areas) if a > 60])
        esc = ndimage.binary_dilation(ndimage.binary_closing(esc, iterations=2), iterations=1) & ~duro
        d_esc, a_esc = alisar(esc, 0.7)
        cor = np.zeros(img.shape, np.float32)
        cor[...] = ESCURO_FIXO
        salvar(cor, a_esc, f'cabeca-{nome}.webp')
        entrada['fixo'] = True
        duro = duro | d_esc
    else:
        velho = os.path.join(AVATAR, f'cabeca-{nome}.webp')
        if os.path.exists(velho):
            os.remove(velho)
    for velho in (f'cabeca-{nome}.pele.webp', f'cabeca-{nome}.roupa.webp', f'cabeca-{nome}.apaga.webp'):
        if os.path.exists(os.path.join(AVATAR, velho)):
            os.remove(os.path.join(AVATAR, velho))
    ys = np.where(duro.any(1))[0]
    entrada['topo'] = round(float(ys.min()) / 2, 1)
    manifesto[f'cabeca-{nome}'] = entrada
    print(nome, entrada)

with open(MANIFESTO, 'w', encoding='utf-8') as f:
    json.dump(manifesto, f, ensure_ascii=False, indent=0, sort_keys=True)
print('ok')
