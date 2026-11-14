# Monta as camadas do avatar a partir das artes do Flow (assets-brutos/flow/avatar/pecas).
# Cada peça foi gerada como edição da mesma imagem base (careca, pijama liso, fundo verde), então a camada
# da peça é só o que mudou em relação à base. Saída em public/avatar/:
#   <peca>.webp       pixels de cor fixa (RGBA)
#   <peca>.pele.webp  pixels de pele, guardados como sombra (cinza) para tingir com o tom escolhido
#   <peca>.cor.webp   pixels tingíveis (cabelo, barba, acessório, pijama), também como sombra
# e manifesto.json com o que cada peça tem. O tingimento é feito no navegador (AvatarPessoa.jsx):
# cor_final = cor_escolhida * sombra / 170.
# Uso: python scripts/assets/montar-avatar.py
import json, os, time
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

def disco(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r

def salvar(arr_rgb, alfa, caminho):
    """Grava RGBA reduzido a LADO, com alfa pré-multiplicado na redução (sem franja escura)."""
    rgba = np.dstack([np.clip(arr_rgb, 0, 255), np.clip(alfa, 0, 1) * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA').convert('RGBa').resize((LADO, LADO), Image.LANCZOS).convert('RGBA')
    for tentativa in range(5):  # o Windows às vezes segura o arquivo (servidor do Vite lendo): tenta de novo
        try:
            im.save(caminho, 'WEBP', quality=88, method=6)
            return
        except OSError:
            if tentativa == 4: raise
            time.sleep(0.5)

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
# caixa dos olhos com as sobrancelhas (acima deles)
CAIXA_OLHOS = np.zeros(base.shape[:2], bool)
_ys, _xs = np.where(OLHOS)
CAIXA_OLHOS[max(_ys.min() - 80, 0):_ys.max() + 6, max(_xs.min() - 10, 0):_xs.max() + 10] = True

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
    boca_labio = None
    boca_lingua = None
    boca_fresta = None
    cor_interior = None
    pele =classe_pele(img) & vale if cat in PELE_OK else np.zeros_like(vale)
    if cat in ('olhos', 'boca'):
        # no rosto, tudo que é quase cor de pele vira pele (o rastro claro do olho/boca antigos some)
        dist = np.sqrt(((img - PELE_REF) ** 2).sum(2))
        # olhos: o rastro fraco do olho antigo vira pele; boca: só o que é quase pele (língua e traço ficam)
        pele = (classe_pele(img) | (dist < (70 if cat == 'olhos' else 50))) & vale
        lisa = dist < (70 if cat == 'olhos' else 35)
        if cat == 'boca':
            hh, ss, _ = hsv(img)
            pele &= ~((dif_hue(hh, 22) > 14) & (ss > 0.15))  # língua rosa não é pele  # quase pele: fica lisa (some rastro); lábio/traço mantém o tom
            # A boca inteira (traço, interior escuro, dentes e língua) nunca é pele: antes, parte do interior escuro
            # e do traço caía na classe pele e era tingida junto, e nas peles escuras a boca saía granulada.
            # Traços finos (linha da boca, lábio em volta dos dentes) viram sombra de pele, como o sorriso da base:
            # tingidos, saem num tom mais escuro da própria pele e não ficam claros nem granulados nas peles escuras.
            # Só fica cor fixa o que é grosso e escuro (interior da boca), os dentes brancos e a língua rosa.
            # o lábio em volta dos dentes é coral (mais claro que o interior), então o interior é só o bem escuro
            # As máscaras usam a região da boca, não o alfa: o alfa vem da diferença com a base, e a língua rosa-clara
            # é parecida com a pele, então ficava meio transparente e a pele escura vazava em manchas.
            zona = BOCA
            escuro = (lum(img) < LUM_PELE * 0.5) & zona
            grosso = ndimage.binary_opening(escuro, structure=disco(6))
            interior = dilata(grosso, 3) & (lum(img) < LUM_PELE * 0.6) & zona
            # dentes: o branco ligado ao interior (o de cima fica a mais de 12 px do interior e virava pele clara)
            branco = (lum(img) > LUM_PELE * 1.05) & (ss < 0.22) & zona
            dentes = ndimage.binary_propagation(branco & dilata(interior, 12), mask=branco)
            rosa = (dif_hue(hh, 354) < 18) & (ss > 0.18) & (lum(img) > LUM_PELE * 0.55) & zona
            lingua = ndimage.binary_fill_holes(ndimage.binary_closing(ndimage.binary_opening(rosa, structure=disco(8)), iterations=4))
            # tudo o que fica entre interior, dentes e língua (as bordas entre eles) também é cor fixa e opaco,
            # menos a borda coral do lábio que entra ali (essa é tingida com o resto do lábio)
            solido = ndimage.binary_fill_holes(ndimage.binary_closing(interior | dentes | lingua, iterations=2)) & zona
            partes = interior | dentes | lingua
            distp = np.sqrt(((img - PELE_REF) ** 2).sum(2))
            # lábio: coral bem diferente da pele, ou o que sobra dentro da boca entre as partes (o brilho claro
            # do lábio de cima, quase cor de pele)
            lingua = ndimage.binary_opening(lingua, structure=disco(5))  # sem os carocinhos na borda de baixo
            partes = interior | dentes | lingua
            tom_coral = (dif_hue(hh, 16) < 14) & (ss > 0.2)
            linha = tom_coral & (ss > 0.3) & (distp > 40) & zona & ~partes
            # só traços de verdade (linha da boca, lábio): manchinhas soltas do rastro antigo não contam
            rot, qtd = ndimage.label(linha)
            if qtd:
                areas = ndimage.sum(np.ones_like(alfa), rot, index=np.arange(1, qtd + 1))
                linha = np.isin(rot, np.where(areas >= 600)[0] + 1)
            # o que fica cercado pelo lábio (a faixa clara entre o lábio de cima e os dentes) também é lábio;
            # boca sem lábio ("o", aberta) não ganha contorno escuro em volta
            labio = linha | (ndimage.binary_fill_holes(linha | solido) & ~partes & zona)
            solido &= ~labio
            # contorno liso: sem carocinhos embaixo da língua nem filetes nas pontas
            antes = solido
            solido = ndimage.binary_opening(solido, structure=disco(3))
            labio |= antes & ~solido
            # o que fica cercado pelo lábio e não é parte fixa (frestas entre língua e lábio) é lábio também
            labio |= ndimage.binary_fill_holes(labio | solido) & ~solido
            # embaixo da língua o lábio de baixo entrava em dentinhos (claros nas peles escuras): fecha o contorno
            # da boca abaixo do topo da língua e pinta esses dentinhos e as frestas com a cor do interior
            boca_fresta = None
            if lingua.any():
                linhas = np.arange(alfa.shape[0])[:, None] >= np.where(lingua.any(1))[0].min()
                novos = ndimage.binary_closing(solido, structure=disco(6)) & ~solido & zona & linhas
                # a borda de baixo da língua (carocinhos claros) caía como lábio: vira interior também
                meio = np.arange(alfa.shape[0])[:, None] >= np.where(lingua.any(1))[0].mean()
                novos |= dilata(lingua, 10) & labio & meio & ~lingua
                solido |= novos
                labio &= ~novos
                boca_fresta = solido & ~(interior | dentes | lingua) & linhas
                cor_interior = np.median(img[interior], axis=0) if interior.any() else np.array([60, 20, 20], np.float32)
            boca_lingua = lingua & solido
            if os.environ.get('DEBUG_BOCA') == nome:
                ys, xs = np.where(zona)
                cx = slice(xs.min(), xs.max()); cy = slice(ys.min(), ys.max())
                dbg = np.zeros(img.shape, np.uint8)
                dbg[interior] = (120, 0, 0); dbg[dentes] = (255, 255, 255); dbg[lingua] = (255, 120, 160)
                dbg[labio] = (0, 200, 0); dbg[solido & ~(interior | dentes | lingua)] = (255, 255, 0)
                Image.fromarray(np.hstack([dbg[cy, cx], np.clip(img[cy, cx], 0, 255).astype(np.uint8)])).save(os.environ['DEBUG_SAIDA'])
            alfa = np.maximum(alfa, solido.astype(np.float32))
            vale = alfa > 0.02
            boca_labio = labio & vale
            pele = vale & ~solido
            lisa &= ~solido
            # em cima do traço antigo, o que não é boca nova é pele lisa (some a sombra cinza ao lado do "o")
            lisa |= dilata(BOCA & _longe_da_pele, 5) & ~dilata(solido | labio, 2)
    if cat in ('cabeca', 'mascara'):
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
    if cat == 'boca':
        # traço da boca num marrom bem escuro (como o dos olhos): o marrom claro da arte sumia nas peles escuras.
        # Mantém a variação de tom (o traço mais grosso continua mais escuro que a borda), só puxa para baixo.
        tra = fixo & vale & (lum(img) < LUM_PELE * 0.72)
        if boca_lingua is not None:
            tra &= ~boca_lingua  # a língua fica rosa; o filete avermelhado na borda do interior escurece junto
        alvo = np.array([58, 30, 26], np.float32)
        k = np.clip((LUM_PELE * 0.72 - lum(img)) / (LUM_PELE * 0.4), 0.55, 1.0)[..., None]
        img = np.where(tra[..., None], img * (1 - k) + alvo * k, img)
        if boca_fresta is not None:
            img = np.where(boca_fresta[..., None], cor_interior, img)
    if cat in ('olhos', 'base'):
        # sobrancelha, cílios e olho fechado num marrom quase preto (como a pupila): o marrom médio da arte
        # sumia nas peles escuras
        tra = fixo & vale & CAIXA_OLHOS & (lum(img) < LUM_PELE * 0.62)
        alvo = np.array([46, 26, 22], np.float32)
        k = np.clip((LUM_PELE * 0.62 - lum(img)) / (LUM_PELE * 0.3), 0.6, 1.0)[..., None]
        img = np.where(tra[..., None], img * (1 - k) + alvo * k, img)
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
        if boca_labio is not None and boca_labio.any():
            # lábio num tom só: o brilho claro da arte (entre o lábio e os dentes) ficava uma faixa laranja
            escuro_lab = boca_labio & (lum(img) < LUM_PELE * 0.9)
            med = float(np.median(sp[escuro_lab if escuro_lab.any() else boca_labio, 0]))
            sp[boca_labio] = np.minimum(sp[boca_labio], med)
        m, sp = estender(pele, roupa | cor | fixo, sp)
        ap = alfa * m
        if cat in ('olhos', 'boca'):
            # a pele lisa some aos poucos na borda da área (sem emenda com a pele da base)
            dentro = ndimage.distance_transform_edt(alfa > 0.5)
            # menos em cima do traço antigo da base (sorriso/olho): ali a cobertura fica cheia, senão o contorno
            # do traço antigo aparece como fantasma
            antigo = dilata((OLHOS if cat == 'olhos' else BOCA) & _longe_da_pele, 5)
            ap = np.where(lisa & ~antigo, ap * np.clip(dentro / 8, 0, 1), ap)
            # e some aos poucos em volta dele (corte seco deixava um contorno claro do traço antigo)
            perto = np.clip(1 - ndimage.distance_transform_edt(~antigo) / 6, 0, 1)
            ap = np.where(lisa, np.maximum(ap, perto), ap)
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

def estetoscopio_limpo(img):
    """Estetoscópio redesenhado a partir da arte: recorte pela cor (cinza neutro; pele, pijama e verde não são) em
    vez da diferença com a base (fraca e ruidosa onde o tubo cruza o pijama), ruído do JPEG tirado e cores chapadas
    em 4 tons (tubo, hastes, anel e diafragma). Sai uma camada só, de cor fixa: nada dele é tingido com o pijama."""
    h, s, v = hsv(img)
    L = lum(img)
    cinza = (s < 0.16) & (L < 225) & (img[..., 1] - np.maximum(img[..., 0], img[..., 2]) < 40)
    cinza &= ~classe_pele(img)
    # só o que fica abaixo do pescoço (o resto da arte é igual à base e cinza nenhum)
    cinza[: int(img.shape[0] * 0.55)] = False
    m = ndimage.binary_opening(cinza, iterations=2)
    rot, qtd = ndimage.label(m)
    if qtd:
        areas = ndimage.sum(np.ones_like(L), rot, index=np.arange(1, qtd + 1))
        m = np.isin(rot, np.where(areas > 400)[0] + 1)
    m = ndimage.binary_closing(m, iterations=2)
    m = ndimage.binary_fill_holes(m) & (m | (L > 170))  # o miolo claro do diafragma entra
    # contorno suave e redondo: borra a máscara e corta no meio (sem serrilhado nem pontinhos)
    suave = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)), np.float32) / 255
    alfa = np.clip((suave - 0.35) / 0.3, 0, 1)
    # tons chapados pelo cinza da arte (sem o ruído): 3 tons com limites longe do cinza da borracha (~77), que o
    # JPEG faz variar uns 15 pontos (com limite perto dele o tubo saía listrado): tubo e hastes, anel e diafragma
    Lm = ndimage.median_filter(np.where(m, L, 255), size=9)
    # tubo quase preto: o cinza médio sumia em cima do colete azul-marinho e das roupas escuras
    cores = np.array([[44, 47, 54], [158, 163, 169], [214, 217, 221]], np.float32)
    idx = np.where(Lm < 135, 0, np.where(Lm < 188, 1, 2))
    # pedacinho de outro tom dentro do tubo (ruído que sobrou): vira tubo
    for t in (1, 2):
        rot_t, q_t = ndimage.label(idx == t)
        if q_t:
            ar = ndimage.sum(np.ones_like(L), rot_t, index=np.arange(1, q_t + 1))
            idx = np.where(np.isin(rot_t, np.where(ar < 150)[0] + 1), 0, idx)
    out = cores[idx]
    # borda: a cor do pixel de dentro mais perto (sem o tom misturado com o pijama)
    dentro = alfa > 0.95
    _, (iy, ix) = ndimage.distance_transform_edt(~dentro, return_indices=True)
    out = out[iy, ix]
    return out, alfa


for n in nomes:
    img = ler(n)
    if n == 'estetoscopio':
        cor_e, alfa_e = estetoscopio_limpo(img)
        salvar(cor_e, alfa_e, os.path.join(SAIDA, n + '.webp'))
        for velho in (n + '.roupa.webp', n + '.pele.webp', n + '.cor.webp'):
            if os.path.exists(os.path.join(SAIDA, velho)):
                os.remove(os.path.join(SAIDA, velho))
        manifesto[n] = {'fixo': True}
        print(n, manifesto[n], '(redesenhado)')
        continue
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
    if cat not in ('boca', 'barba', 'mascara'): alfa[BOCA] = 0
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
    elif cat == 'mascara':
        # máscara inteira tinge com a cor escolhida (o elástico branco da cirúrgica fica branco)
        h, s, v = hsv(img)
        sel = (alfa > 0.8) & (s > 0.15) & (dif_hue(h, 22) > 12)
        hue_ref = float(np.median(h[sel]))
        cor_mask = (dif_hue(h, hue_ref) < 22) & (s > 0.08)
        cor_ref = float(np.median(lum(img)[cor_mask & (alfa > 0.8)]))
        # rosa claro perto da cor da pele: a diferença com a base fica fraca e a máscara sairia transparente.
        # A área da máscara (cor dela, sem buracos) fica opaca.
        regiao = ndimage.binary_fill_holes(ndimage.binary_closing(cor_mask & dilata(alfa > 0.15, 4), iterations=3))
        regiao = ndimage.binary_opening(regiao, iterations=2)
        alfa = np.where(regiao, 1.0, alfa)
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
        # inclui a borda suavizada da peça (fundo > 0.2): ali o pijama vazava como uma linha fina nos ombros
        apaga = (alfa_base > 0.1) & (fundo > 0.2)
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
