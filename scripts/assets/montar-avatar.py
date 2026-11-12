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

def separar_fundo(img, manter_tracos=False):
    """Separa o verde do fundo: devolve (alfa do fundo 0..1, imagem com a cor de frente nas bordas).
    Na borda, o pixel é mistura do verde com a cor da peça; estima quanto é verde projetando o pixel na reta
    entre o verde e a cor do pixel de frente mais próximo (sem isso sobra um contorno claro/esverdeado)."""
    k = img[..., 1] - np.maximum(img[..., 0], img[..., 2])
    verde = k > 200
    G = np.median(img[verde], axis=0) if verde.any() else np.array([12, 245, 5], np.float32)
    perto = ndimage.binary_dilation(verde, iterations=8)  # a transição da arte chega a ~8 px
    frente = ~perto  # longe do verde: cor pura da peça
    faixa = perto & ~verde
    a = np.zeros(img.shape[:2], np.float32)
    a[verde] = 1
    out = img.copy()
    if faixa.any() and frente.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~frente, return_indices=True)
        by, bx = np.where(faixa)
        F = img[iy[by, bx], ix[by, bx]]
        P = img[by, bx]
        d = G - F
        t = np.clip(((P - F) * d).sum(1) / np.maximum((d * d).sum(1), 1), 0, 1)
        resto = np.sqrt(((P - (F + t[:, None] * d)) ** 2).sum(1))
        explica = resto < 45  # o pixel é mesmo mistura de verde com a cor de dentro
        # o que não é mistura (fio fino, cílio na borda) fica com a própria cor e transparência pelo verde
        t_k = np.clip((k[by, bx] - 25) / 175, 0, 1)
        if not manter_tracos:
            # pedaço do contorno escuro da arte colado no verde: vira a cor de dentro (senão sai pontilhado)
            escuro = lum(P) < lum(F) * 0.85
            explica |= escuro
            t = np.where(escuro & ~(resto < 45), t_k, t)
        a[by, bx] = np.where(resto < 45, t, t_k)
        out[by, bx] = np.where(explica[:, None], F, P)
    return a, out

_cache_fundo = {}
def alfa_fundo(img):
    chave = id(img)
    if chave not in _cache_fundo:
        _cache_fundo.clear()
        _cache_fundo[chave] = separar_fundo(img)
    return _cache_fundo[chave][0]

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
    return ((dif_hue(h, 22) < 14) & (s > 0.08) & (s < 0.7) & (v > 0.58)) | perto

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

base = ler('base')
bg, base_sep = separar_fundo(base)
alfa_base = 1 - bg
base_limpa = sem_verde(base_sep)
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
# traços do rosto da base (olhos com cílios e sobrancelha de baixo, boca): as variações cobrem essa área
# inteira, senão sobra a borda fraquinha do olho/boca originais por baixo (fantasma)
_longe_da_pele = np.sqrt(((base - PELE_REF) ** 2).sum(2)) > 18
OLHOS_BASE = dilata(OLHOS & _longe_da_pele, 6) & OLHOS
BOCA_BASE = dilata(BOCA & _longe_da_pele, 7) & dilata(BOCA, 3)

TINGE_CABECA = {'cabeca-gato', 'cabeca-urso', 'cabeca-coelho', 'cabeca-touca', 'cabeca-laco', 'cabeca-antenas'}
os.makedirs(SAIDA, exist_ok=True)
manifesto = {}
ALFA_CABELO = {}

# Que classes de tingimento cada categoria pode ter (ex.: estampa não tem pele, senão confete rosa vira pele).
PELE_OK = {'base', 'olhos', 'boca', 'barba', 'cabelo', 'oculos', 'jaleco', 'colete'}
ROUPA_OK = {'base', 'estampa', 'jaleco', 'colete', 'cordao', 'estetoscopio', 'cracha', 'cabelo'}

def gravar_camadas(nome, img, alfa, fundo, cor_mask=None, cor_ref=None, gama=1.0):
    cat = nome.split('-')[0]
    vale = alfa > 0.02
    lisa = np.zeros_like(vale)
    pele = classe_pele(img) & vale if cat in PELE_OK else np.zeros_like(vale)
    if cat in ('olhos', 'boca'):
        # no rosto, tudo que é quase cor de pele vira pele (o rastro claro do olho/boca antigos some)
        dist = np.sqrt(((img - PELE_REF) ** 2).sum(2))
        # olhos: o rastro fraco do olho antigo vira pele; boca: só o que é quase pele (língua e traço ficam)
        pele = (classe_pele(img) | (dist < (70 if cat == 'olhos' else 50))) & vale
        lisa = dist < (70 if cat == 'olhos' else 35)
        if cat == 'boca':
            hh, ss, _ = hsv(img)
            pele &= ~((dif_hue(hh, 22) > 14) & (ss > 0.15))  # língua rosa não é pele  # quase pele: fica lisa (some rastro); lábio/traço mantém o tom
    if cat == 'cabeca':
        # acessório não leva pele: a cabeça careca em volta dele seria pintada por cima do cabelo escolhido
        sem_cor = ~(cor_mask if cor_mask is not None else np.zeros_like(vale))
        careca = (classe_pele(img) | (np.sqrt(((img - PELE_REF) ** 2).sum(2)) < 40)) & sem_cor
        alfa = np.where(careca, 0, alfa)
        vale = alfa > 0.02
    roupa = classe_roupa(img) & vale & ~pele if cat in ROUPA_OK else np.zeros_like(vale)
    cor = (cor_mask & vale & ~pele) if cor_mask is not None else np.zeros_like(vale)
    roupa &= ~cor
    img = img.copy()
    # borda com o fundo verde: a cor ali é mistura com o verde. Copia cor e classe do pixel de dentro mais perto,
    # mantendo só a transparência da borda (tira o contorno claro/esverdeado).
    dentro = (fundo < 0.02) & (alfa > 0.5)
    borda = (fundo >= 0.02) & vale
    if dentro.any() and borda.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~dentro, return_indices=True)
        by, bx = np.where(borda)
        sy, sx = iy[by, bx], ix[by, bx]
        img[by, bx] = img[sy, sx]
        for m in (pele, roupa, cor):
            m[by, bx] = m[sy, sx]
    fixo = ~(pele | roupa | cor)
    # pontinho de cor fixa grudado na borda de fora (resto do contorno da arte): sai
    rot, qtd = ndimage.label(fixo & vale)
    if qtd:
        areas = ndimage.sum(np.ones_like(alfa), rot, index=np.arange(1, qtd + 1))
        fora = ndimage.binary_dilation(alfa < 0.05, iterations=3)
        for i in np.where(areas < 80)[0] + 1:
            comp = rot == i
            if (comp & fora).any() and cat != 'base':
                alfa = np.where(comp, 0, alfa)
    info = {}
    def sombra_de(mask, ref, g=1.0):
        r = np.clip(lum(img) / max(ref, 1), 0, 3) ** g
        sh = np.clip(r * REF_SOMBRA, 0, 255)
        return np.dstack([sh, sh, sh])
    # Divisas entre classes: cada arquivo é desenhado por cima do outro (tingidos primeiro, cor fixa por último).
    # Se cada um parar exatamente na divisa, os dois ficam meio transparentes ali e o que está embaixo vaza
    # (anel claro em volta do olho). Então cada classe tingida se estende 3 px por baixo das que vêm depois,
    # com o tom do pixel dela mais próximo.
    def estender(mask, sob, sombra):
        ext = dilata(mask, 3) & (mask | sob) & vale
        if not mask.any():
            return ext, sombra
        _, (iy, ix) = ndimage.distance_transform_edt(~mask, return_indices=True)
        sh = sombra.copy()
        novo = ext & ~mask
        sh[novo] = sombra[iy[novo], ix[novo]]
        return ext, sh
    if (alfa * pele).sum() > 50:
        sp = sombra_de(pele, LUM_PELE)
        if cat in ('olhos', 'boca'):
            # pele lisa igual à da base embaixo: some o rastro do olho/boca antigos sem marcar a emenda
            sp[lisa] = PELE_LISA[lisa][:, None]
        m, sp = estender(pele, roupa | cor | fixo, sp)
        ap = alfa * m
        if cat in ('olhos', 'boca'):
            # a pele lisa some aos poucos na borda da área (sem emenda com a pele da base)
            dentro = ndimage.distance_transform_edt(alfa > 0.5)
            ap = np.where(lisa, ap * np.clip(dentro / 8, 0, 1), ap)
        salvar(sp, ap, os.path.join(SAIDA, nome + '.pele.webp')); info['pele'] = True
    if (alfa * roupa).sum() > 50:
        m, sr = estender(roupa, cor | fixo, sombra_de(roupa, LUM_ROUPA))
        salvar(sr, alfa * m, os.path.join(SAIDA, nome + '.roupa.webp')); info['roupa'] = True
    if (alfa * cor).sum() > 50:
        m, sc = estender(cor, fixo, sombra_de(cor, cor_ref, gama))
        salvar(sc, alfa * m, os.path.join(SAIDA, nome + '.cor.webp')); info['cor'] = True
    if (alfa * fixo).sum() > 50:
        salvar(img, alfa * fixo, os.path.join(SAIDA, nome + '.webp')); info['fixo'] = True
    manifesto[nome] = info
    print(nome, info)

# base
gravar_camadas('base', base_limpa, alfa_base, bg)
BORDA_BASE = (bg > 0.02) & (bg < 0.98)
# tom da pele da base em volta dos olhos/boca (sem os traços), para as variações preencherem a área antiga.
# Tom único por região (mediana do anel de pele em volta): média suavizada puxava o escuro da pupila.
PELE_LISA = np.full(base.shape[:2], REF_SOMBRA, np.float32)
for _reg in (OLHOS, BOCA):
    _anel = dilata(_reg, 10) & ~dilata(_reg, 2) & pele_base
    if _anel.any():
        PELE_LISA[dilata(_reg, 10)] = float(np.median(lum(base_limpa)[_anel])) / LUM_PELE * REF_SOMBRA

for n in nomes:
    img = ler(n)
    d = dif(img)
    alfa = np.clip((d - 35) / 45, 0, 1)
    m = ndimage.binary_opening(alfa > 0.3, iterations=2)
    m = dilata(m, 2)
    alfa = alfa * m
    fundo, img_sep = separar_fundo(img, manter_tracos=(n == 'cabeca-antenas'))
    alfa = np.minimum(alfa, 1 - fundo)
    # contorno do corpo que só mudou de leve (a peça não cobre ali): fica com a base
    alfa[BORDA_BASE & (fundo > 0.02)] = 0
    cat = n.split('-')[0]
    if cat in ('olhos', 'boca'):
        regiao = OLHOS_BASE if cat == 'olhos' else BOCA_BASE
        # só o traço novo (mudança forte) e a área do traço antigo; o resto é rastro fraco da edição (anel claro)
        alfa = alfa * dilata(regiao | ndimage.binary_opening(d > 60, iterations=1), 2)
        alfa = np.maximum(alfa, regiao.astype(np.float32))
    if cat not in ('olhos', 'oculos'): alfa[OLHOS] = 0
    if cat not in ('boca', 'barba'): alfa[BOCA] = 0
    # óculos ficam com os olhos originais nas lentes; a camada de olhos escolhida é desenhada por cima
    # pedacinhos soltos (ruído do JPEG longe da peça) saem
    rot, qtd = ndimage.label(alfa > 0.1)
    if qtd:
        areas = ndimage.sum(np.ones_like(alfa), rot, index=np.arange(1, qtd + 1))
        pequenos = np.isin(rot, np.where(areas < 60)[0] + 1)
        alfa[pequenos] = 0
    limpa = sem_verde(img_sep)
    cor_mask = cor_ref = None
    gama = 1.0
    if cat in ('cabelo', 'barba'):
        h, s, v = hsv(img)
        cor_mask = ~classe_pele(img) & ~classe_roupa(img)
        sel = cor_mask & (alfa > 0.8)
        cor_ref = float(np.median(lum(img)[sel])) if sel.any() else 60.0
        if cat == 'barba':
            # o traço da boca que aparece por baixo do bigode não é pelo
            cor_mask &= v < float(np.median(v[sel])) * 1.7
        gama = 0.65  # reflexos mais suaves quando a cor escolhida é clara
    elif n in TINGE_CABECA:
        h, s, v = hsv(img)
        sel = (alfa > 0.8) & (s > 0.18) & (dif_hue(h, 22) > 10)
        hue_ref = float(np.median(h[sel]))
        cor_mask = (dif_hue(h, hue_ref) < 14) & (s > 0.08) & (v > 0.25)
        if n == 'cabeca-antenas':
            cor_mask &= (s > 0.2) & (v > 0.45)  # só as bolinhas; a tiara fina fica com a cor da arte
        cor_ref = float(np.median(lum(img)[cor_mask & (alfa > 0.8)]))
    gravar_camadas(n, limpa, alfa, fundo, cor_mask, cor_ref, gama)
    if cat == 'cabelo':
        ALFA_CABELO[n] = alfa.copy()
    if cat == 'cabeca':
        ys_ = np.where((alfa > 0.3).any(1))[0]
        manifesto[n]['topo'] = round(float(ys_.min()) / 2, 1)  # alto do acessório (512), para não sair da imagem
    apaga = None
    if n in ('jaleco', 'colete'):
        # onde a roupa de baixo aparecia e na arte da peça virou fundo (jaleco mais estreito que a manga): apaga
        apaga = (alfa_base > 0.5) & (fundo > 0.5)
        apaga[: int(base.shape[0] * 0.55)] = False  # só no corpo
    elif n == 'cabeca-touca':
        # a touca cobre o alto da cabeça: some o cabelo que passaria por cima dela (coque, topete...)
        touca = alfa > 0.5
        apaga = np.zeros_like(touca)
        cols = np.where(touca.any(0))[0]
        for x in cols[3:-3]:
            topo = np.argmax(touca[:, x])
            apaga[: topo + 3, x] = True
    if apaga is not None:
        apaga = ndimage.binary_opening(apaga, iterations=1)
        apaga = ndimage.binary_dilation(apaga, iterations=1)
        if apaga.sum() > 50:
            salvar(np.zeros(base.shape, np.float32), apaga.astype(np.float32), os.path.join(SAIDA, n + '.apaga.webp'))
            manifesto[n]['apaga'] = True

# Acessório de cabeça foi desenhado na cabeça careca. Com cabelo, sobe até o topo do cabelo e alarga junto
# (senão a tiara fica enterrada no cabelo). Ajuste por cabelo, em coordenadas de 512 px: âncora no alto da
# cabeça careca, desloca dy e escala s em volta dela.
cab_base = alfa_base > 0.5
topo_base = int(np.argmax(cab_base.any(1)))
linha = np.where(cab_base[topo_base + 30])[0]
cx = float(linha.mean())
larg_base = int(cab_base[topo_base + 80].sum())
larg_testa = int(cab_base[topo_base + 160].sum())  # largura da cabeça na testa (para escolher onde medir)
ajustes = {}
for n, a_c in ALFA_CABELO.items():
    junto = cab_base | (a_c > 0.5)
    # mede nos lados do alto da cabeça (25% a 40% da largura para cada lado): coque e topete no meio não contam
    xs = [x for x in range(int(cx - 0.4 * larg_testa), int(cx + 0.4 * larg_testa)) if abs(x - cx) >= 0.28 * larg_testa]
    dif_topo = [int(np.argmax(junto[:, x])) - int(np.argmax(cab_base[:, x])) for x in xs if cab_base[:, x].any()]
    topo = topo_base + float(np.median(dif_topo)) + 8  # a tiara assenta um pouco dentro do volume
    lin = np.where(junto[int(topo) + 80])[0]
    larg = int(2 * min(cx - lin.min(), lin.max() - cx)) if lin.size else larg_base  # simétrica: ignora o rabo de lado
    escala = float(np.clip(larg / larg_base, 1.0, 1.7))
    dy = min(topo - topo_base, 0.0)
    # para a touca: largura um pouco mais abaixo (onde fica a borda dela), comparada à da cabeça careca ali
    lin2 = np.where(junto[int(topo) + 150])[0]
    larg2 = int(2 * min(cx - lin2.min(), lin2.max() - cx)) if lin2.size else larg_base
    larg2_base = int(cab_base[topo_base + 150].sum())
    esc_touca = float(np.clip(larg2 / max(larg2_base, 1), 1.0, 1.7))
    if dy < -2 or escala > 1.02 or esc_touca > 1.02:
        ajustes[n] = {'dy': round(dy / 2, 1), 's': round(escala, 3), 'st': round(esc_touca, 3)}
manifesto['_ajusteCabeca'] = {'ancora': [round(cx / 2, 1), round(topo_base / 2, 1)], 'cabelos': ajustes}
print('ajustes', ajustes)

# o manifesto vai junto do código (import estático em src/features/avatar/compor.js)
with open(os.path.join(RAIZ, 'src', 'features', 'avatar', 'camadas.json'), 'w', encoding='utf-8') as f:
    json.dump(manifesto, f, ensure_ascii=False, indent=0, sort_keys=True)
print('pecas:', len(manifesto))
