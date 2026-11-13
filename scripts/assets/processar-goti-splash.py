# Vídeos da tela inicial (Flow, fundo verde) -> public/goti/:
#   goti-lendo.webm/.webp  Goti de costas lendo o prontuário (ida e volta, para o loop fechar sem emenda)
#   goti-susto.webm/.webp  toque no Goti: susto, derruba tudo e vira de frente (toca uma vez)
#   goti-oi.webm/.webp     aceno de frente, depois do susto (loop)
# Uso: python scripts/assets/processar-goti-splash.py <lendo.mp4> <susto.mp4> <oi.mp4> [velocidade_susto=1.4]
# O susto termina e o oi começa no MESMO quadro do Flow (o Goti de frente, q-frente-2): o oi foi gerado com esse
# quadro no início e no fim, então a troca de um vídeo para o outro não aparece e o aceno fecha o loop sozinho.
#
# Regra única de moldura (quadrado de LADO px): o corpo do Goti ocupa ALTURA_CORPO da altura do quadro, centrado na
# horizontal, com os pés a BASE do topo. Lendo e susto usam o 1º quadro de cada um como referência; o "oi" usa o
# último quadro do susto. Assim o Goti não muda de tamanho nem de lugar entre um vídeo e outro, e sobra espaço dos
# lados para os braços.
# Fluidez: só o "lendo" (lento) ganha quadros intermediários (minterpolate, 60 fps). Susto e oi ficam com os
# quadros reais a 30 fps: interpolar movimento rápido inventava quadros borrados no giro.
import os, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

lendo, susto, oi = sys.argv[1], sys.argv[2], sys.argv[3]
vel_susto = float(sys.argv[4]) if len(sys.argv) > 4 else 1.4
FPS = 60
LADO = 560
ALTURA_CORPO = 0.42
BASE = 0.8
INTERP = f"minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"


def extrai(arq, filtro_extra="", interpola=True):
    tmp = tempfile.mkdtemp()
    vf = (filtro_extra + "," if filtro_extra else "") + (INTERP if interpola else "fps=30")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", arq, "-vf", vf, os.path.join(tmp, "q%04d.png")], check=True)
    return tmp, sorted(f for f in os.listdir(tmp) if f.endswith(".png"))


def recorta(tmp, arqs, so_maior):
    out = []
    for f in arqs:
        im = np.asarray(Image.open(os.path.join(tmp, f)).convert("RGB")).astype(np.float32)
        r, g, b = im[..., 0], im[..., 1], im[..., 2]
        d = g - np.maximum(r, b)
        # recorte rígido: só o verde forte do fundo (d ~ 230) some; o verde do jaleco e dos sapatos fica
        alfa = np.clip((150 - d) / 40, 0, 1)
        g2 = np.minimum(g, np.maximum(r, b) + 25)
        rgb = np.dstack([r, g2, b])
        cheio = alfa > 0.5
        # furinhos fechados dentro do Goti (furos dos crocs) ficam opacos e claros
        furos, nf = ndimage.label(ndimage.binary_fill_holes(cheio) & ~cheio)
        if nf:
            areas = ndimage.sum(np.ones_like(furos), furos, range(1, nf + 1))
            pequenos = np.isin(furos, 1 + np.flatnonzero(areas < 70))  # só os furinhos dos crocs; o vão entre as pernas é bem maior
            alfa = np.where(pequenos, 1.0, alfa)
            rgb = np.where(pequenos[..., None], np.array([236, 241, 245], np.float32), rgb)
        # sapatos: o Flow pinta os furos dos crocs de verde; na faixa dos pés eles viram cinza-claro
        ys = np.flatnonzero(cheio.any(axis=1))
        if ys.size:
            rot0, n0 = ndimage.label(cheio)
            if n0:
                maior0 = rot0 == (1 + int(np.argmax(ndimage.sum(np.ones_like(rot0), rot0, range(1, n0 + 1)))))
                yb = np.flatnonzero(maior0.any(axis=1))
                faixa = np.zeros_like(cheio)
                faixa[int(yb[-1] - (yb[-1] - yb[0]) * 0.13):yb[-1] + 1] = True
                verdinho = faixa & maior0 & (d > 8)
                rgb = np.where(verdinho[..., None], np.array([196, 205, 214], np.float32), rgb)
        q = Image.fromarray(np.dstack([rgb, alfa * 255]).clip(0, 255).astype(np.uint8))
        a = q.getchannel("A").filter(ImageFilter.MinFilter(3)).point(lambda v: 0 if v < 24 else v)
        an = np.asarray(a)
        rot, n = ndimage.label(ndimage.binary_dilation(an > 60, iterations=1))
        if n > 1:
            tam = ndimage.sum(np.ones_like(rot), rot, range(1, n + 1))
            if so_maior:
                keep = rot == (1 + int(np.argmax(tam)))
            else:
                # mantém objetos soltos grandes (prancheta, folhas, óculos), mas tira os efeitos que o Flow desenha:
                # risquinhos de susto, linhas de pulo e respingos no chão (pedaços pequenos ou chatos perto dos pés)
                maior = 1 + int(np.argmax(tam))
                pe = np.flatnonzero((rot == maior).any(axis=1))[-1]
                altura = an.shape[0]
                keep = np.zeros_like(an, dtype=bool)
                for i, t in enumerate(tam):
                    if i + 1 == maior:
                        keep |= rot == maior
                        continue
                    ys = np.flatnonzero((rot == i + 1).any(axis=1))
                    xs = np.flatnonzero((rot == i + 1).any(axis=0))
                    alto, largo = ys[-1] - ys[0] + 1, xs[-1] - xs[0] + 1
                    fino = min(alto, largo) < 0.012 * altura or max(alto, largo) > 4 * min(alto, largo)
                    no_chao = ys[-1] > pe - 0.03 * altura and alto < 0.04 * altura
                    if t > 1800 and not fino and not no_chao:
                        keep |= rot == i + 1
                # respingo grudado nos pés: na faixa do chão, só fica o que está na largura dos sapatos
                corpo_m = rot == maior
                faixa_sapato = corpo_m[int(pe - 0.07 * altura):int(pe - 0.035 * altura)]
                cols = np.flatnonzero(faixa_sapato.any(axis=0))
                if cols.size:
                    chao = np.zeros_like(keep)
                    chao[int(pe - 0.035 * altura):] = True
                    fora_sapato = np.ones(an.shape[1], dtype=bool)
                    fora_sapato[max(0, cols[0] - 6):cols[-1] + 7] = False
                    keep &= ~(chao & corpo_m & fora_sapato[None, :])
            a = Image.fromarray((an * keep).astype(np.uint8))
        if not so_maior:
            # O vídeo do Flow é estreito: o que ele joga longe sai pela borda e chegava cortado em linha reta (a borda
            # do vídeo cai dentro do quadro da abertura). Perto da borda do vídeo, tudo some aos poucos.
            # Rampa longa (180 px) só nos objetos soltos (folhas, óculos, estrelinhas); o corpo só tem uma margem curta.
            h, w = an.shape
            dist = np.minimum.outer(np.minimum(np.arange(h), np.arange(h)[::-1]), np.minimum(np.arange(w), np.arange(w)[::-1]))
            corpo_r = (rot == (1 + int(np.argmax(ndimage.sum(np.ones_like(rot), rot, range(1, n + 1)))))) if n else np.zeros_like(an, bool)
            rampa = np.where(corpo_r, np.clip((dist - 2) / 30, 0, 1), np.clip((dist - 6) / 180, 0, 1) ** 1.5)
            a = Image.fromarray((np.asarray(a).astype(np.float32) * rampa).astype(np.uint8))
        q.putalpha(a)
        out.append(q)
    return out


def limpa_pernas(q):
    """Entre a barra do jaleco e os sapatos só existe a perna azul. O Flow às vezes pinta um borrão branco nesse
    vão (entre as pernas); tudo que é branco/cinza ali vira transparente."""
    a = np.array(q.getchannel("A"))
    rgb = np.asarray(q.convert("RGB")).astype(np.int16)
    m = a > 60
    rot, n = ndimage.label(m)
    if n == 0:
        return q
    tam = ndimage.sum(np.ones_like(rot), rot, range(1, n + 1))
    corpo_m = rot == (1 + int(np.argmax(tam)))
    ys = np.flatnonzero(corpo_m.any(axis=1))
    topo, pe = ys[0], ys[-1]
    alt = pe - topo
    larg = corpo_m.sum(axis=1)
    ref = np.median(larg[int(topo + 0.5 * alt):int(topo + 0.7 * alt)])
    barra = None
    for y in range(int(topo + 0.6 * alt), pe):
        if larg[y] < 0.55 * ref:
            barra = y
            break
    if barra is None:
        return q
    # Onde o sapato começa: no fim da perna azul (menos a tira do croc), medido em cada quadro. Uma linha fixa
    # (8,5% da altura) cortava o topo dos sapatos no pulo do "oi", quando os pés sobem.
    azul = (rgb[..., 2] > 150) & (rgb[..., 2] - rgb[..., 0] > 60) & corpo_m
    # Cada perna separada: com um pé levantado, vale o fim da perna MAIS ALTA (senão o sapato levantado cai na
    # zona e some junto com o borrão).
    pernas = np.zeros_like(m)
    pernas[barra + 1:pe + 1] = azul[barra + 1:pe + 1]
    rp, nper = ndimage.label(pernas)
    L = R = None
    if nper:
        areas_p = ndimage.sum(np.ones_like(rp), rp, range(1, nper + 1))
        duas = 1 + np.argsort(areas_p)[::-1][:2]
        fins, bordas = [], []
        for i in duas:
            yy, xx = np.nonzero(rp == i)
            fins.append(yy.max())
            bordas.append((xx.min(), xx.max()))
        sapato = int(min(fins)) - int(0.025 * alt)
        if len(bordas) == 2:
            esq, dir_ = sorted(bordas)
            L, R = esq[1], dir_[0]
    else:
        sapato = int(pe - 0.085 * alt)
    sapato = min(sapato, int(pe - 0.05 * alt))
    if barra >= sapato:
        return q
    zona = np.zeros_like(m)
    zona[barra + 1:sapato] = True
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    branco = (mn > 165) & (mx - mn < 45)
    # O borrão do Flow é um retângulo branco pendurado no jaleco, entre as pernas. As colunas dele são medidas
    # acima dos sapatos (onde só ele pode ser branco) e, abaixo, só essas colunas são apagadas: os sapatos ao
    # lado ficam inteiros.
    bz = zona & branco & corpo_m
    a[bz] = 0
    altura_zona = max(1, sapato - barra - 1)
    colunas = np.flatnonzero(bz.sum(axis=0) > 0.6 * altura_zona)
    if L is not None and R is not None:
        colunas = colunas[(colunas > L) & (colunas < R)]  # o borrão fica entre as pernas, nunca sobre elas
    else:
        colunas = colunas[:0]
    if colunas.size > 6:
        grupos = np.split(colunas, np.flatnonzero(np.diff(colunas) > 2) + 1)
        g = max(grupos, key=len)
        if g.size > 6:
            vao = np.zeros_like(m)
            vao[sapato:pe + 1, g[0] + 2:g[-1] - 1] = True
            a[vao & branco & corpo_m] = 0
    q.putalpha(Image.fromarray(a))
    return q


def limpa_sapatos(q):
    """Os sapatos do Goti são brancos (crocs com furinhos). O Flow às vezes deixa uma mancha preta grande no lado
    de dentro (sobra do sapato preto original ou sombra entre os pés). Na faixa dos pés, mancha escura grande vira
    a cor do sapato; os furinhos (pequenos) ficam."""
    a = np.array(q.getchannel("A"))
    rgb = np.asarray(q.convert("RGB")).astype(np.int16)
    # pernas e sapatos às vezes ficam soltos do corpo (o vão sob o jaleco é transparente): usa tudo o que é opaco
    corpo_m = a > 60
    ys = np.flatnonzero(corpo_m.any(axis=1))
    if ys.size == 0:
        return q
    topo, pe = ys[0], ys[-1]
    alt = pe - topo
    faixa = np.zeros_like(corpo_m)
    faixa[int(pe - 0.11 * alt):pe + 1] = True
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    branco = (mn > 165) & (mx - mn < 45) & corpo_m & faixa
    if not branco.any():
        return q
    cor = np.median(np.asarray(q.convert("RGB"))[branco], axis=0)
    # buraco na transparência dentro do sapato (o recorte do verde comeu um pedaço perto da tira): o fundo escuro
    # aparecia como mancha preta. Fecha o contorno de cada pé e preenche o que ficou vazio dentro dele.
    # Cada pé separado (para não fechar o vão entre os dois): fecha o contorno com folga e preenche.
    pes_m = (a > 200) & faixa
    rp, npes = ndimage.label(pes_m)
    cheio = np.zeros_like(pes_m)
    if npes:
        areas_p = ndimage.sum(np.ones_like(rp), rp, range(1, npes + 1))
        for i in 1 + np.flatnonzero(areas_p > 0.002 * alt * alt):
            pe_i = rp == i
            pe_i = np.pad(pe_i, 12)
            fech = ndimage.binary_fill_holes(ndimage.binary_closing(pe_i, iterations=9))[12:-12, 12:-12]
            cheio |= fech
    cheio &= faixa
    buraco = cheio & ~(a > 200)
    if buraco.any():
        arr = np.array(q.convert("RGBA"))
        arr[buraco, :3] = cor.astype(np.uint8)
        arr[buraco, 3] = 255
        q = Image.fromarray(arr, "RGBA")
        a = np.array(q.getchannel("A"))
        rgb = np.asarray(q.convert("RGB")).astype(np.int16)
        mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    escuro = (mx < 95) & (mx - mn < 40) & corpo_m & faixa
    r2, n2 = ndimage.label(ndimage.binary_dilation(escuro, iterations=1) & corpo_m & faixa)
    if n2 == 0:
        return q
    areas = ndimage.sum(np.ones_like(r2), r2, range(1, n2 + 1))
    limite = max(40, 0.0016 * alt * alt)  # furinho do croc é bem menor que isso
    grandes = np.isin(r2, 1 + np.flatnonzero(areas > limite))
    if not grandes.any():
        return q
    arr = np.array(q.convert("RGBA"))
    arr[grandes, :3] = cor.astype(np.uint8)
    out = Image.fromarray(arr, "RGBA")
    out.putalpha(Image.fromarray(a))
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


def salva(fr, nome, loop, fps=FPS):
    tmp = tempfile.mkdtemp()
    for i, f in enumerate(fr):
        f.save(os.path.join(tmp, f"o{i:04d}.png"))
    webm = os.path.join("public", "goti", nome + ".webm")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(fps), "-i", os.path.join(tmp, "o%04d.png"),
                    "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "36", "-row-mt", "1",
                    "-metadata:s:v:0", "alpha_mode=1", "-an", webm], check=True)
    webp = os.path.join("public", "goti", nome + ".webp")
    passo = 2 if fps > 30 else 1  # o WebP do Safari sai a 30 fps
    pq = [f.resize((340, 340), Image.LANCZOS) for f in fr[::passo]]
    pq[0].save(webp, save_all=True, append_images=pq[1:], duration=int(1000 * passo / fps), loop=0 if loop else 1, quality=62, method=4)
    fr[0].resize((420, 420), Image.LANCZOS).save(os.path.join("public", "goti", nome + "-poster.webp"), quality=85)
    print(nome, len(fr), "quadros", f"{len(fr) / fps:.2f}s", os.path.getsize(webm) // 1024, "KB webm", os.path.getsize(webp) // 1024, "KB webp")
    shutil.rmtree(tmp)


# Lendo: 1x (é parado de propósito), ida e volta.
t, a = extrai(lendo)
ql = [limpa_sapatos(limpa_pernas(q)) for q in recorta(t, a, True)]
shutil.rmtree(t)
fl = aplica(ql, moldura(ql[0]))
salva(fl + fl[-2:0:-1], "goti-lendo", True)

# Susto: mais rápido (vel_susto) e sem filtrar a prancheta e os óculos que voam.
t, a = extrai(susto, f"setpts=PTS/{vel_susto}", interpola=False)
qs = [limpa_sapatos(limpa_pernas(q)) for q in recorta(t, a, False)]
shutil.rmtree(t)
# Respingo no chão quando ele pousa: na faixa do chão, só fica o que cabe na largura dos sapatos do último
# quadro (ele termina parado no mesmo lugar em que pousa).
_, y0f, _, pef = corpo(qs[-1])
alt_f = pef - y0f
ultimo = np.asarray(qs[-1].getchannel("A")) > 60
cols = np.flatnonzero(ultimo[int(pef - 0.12 * alt_f):pef + 1].any(axis=0))
if cols.size:
    lim0, lim1 = cols[0] - 24, cols[-1] + 24
    for i, q in enumerate(qs):
        an = np.array(q.getchannel("A"))
        an[int(pef - 0.06 * alt_f):, :max(0, lim0)] = 0
        an[int(pef - 0.06 * alt_f):, lim1:] = 0
        q.putalpha(Image.fromarray(an))
        qs[i] = q
# Nuvem de poeira no pouso: na segunda metade do susto (ele já está de frente, parado no lugar), o corpo fica
# limitado à silhueta do último quadro, alargada um pouco. As folhas que caem (soltas do corpo) não são afetadas.
_fim = ndimage.binary_dilation(np.asarray(qs[-1].getchannel("A")) > 60, iterations=18)
# no pouso ele afunda um pouco (agacha): a máscara desce junto, para não cortar os pés
_fim = np.logical_or.reduce([np.roll(_fim, k, axis=0) for k in range(0, 72, 8)])
for i in range(len(qs) // 2, len(qs)):
    a = np.array(qs[i].getchannel("A"))
    rot, n = ndimage.label(a > 60)
    if n:
        tam = ndimage.sum(np.ones_like(rot), rot, range(1, n + 1))
        corpo_m = rot == (1 + int(np.argmax(tam)))
        a[corpo_m & ~_fim] = 0
        qs[i].putalpha(Image.fromarray(a))
fs = aplica(qs, moldura(qs[0]))
# O Flow entrega o Goti de frente maior que o de costas: encolhe aos poucos (pelos pés, no centro) para ele
# terminar com a mesma altura do começo, sem "crescer" ao virar.
h0 = corpo(fs[0])[3] - corpo(fs[0])[1]
h1 = corpo(fs[-1])[3] - corpo(fs[-1])[1]
alvo = h0 / h1
x0, y0, x1, y1 = corpo(fs[0])
px, py = (x0 + x1) / 2, y1
n = len(fs)
ks = []
for i, f in enumerate(fs):
    t = i / (n - 1)
    k = 1 + (alvo - 1) * (t * t * (3 - 2 * t))  # suave no começo e no fim
    ks.append(k)
    if abs(k - 1) < 1e-3:
        continue
    g = f.resize((round(LADO * k), round(LADO * k)), Image.LANCZOS)
    tela = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    tela.paste(g, (round(px - px * k), round(py - py * k)), g)
    fs[i] = tela
# Objetos que voam para fora (folhas, óculos) somem aos poucos perto da borda do quadro, em vez de serem
# cortados pela borda.
# (só nas laterais e no topo: embaixo ficam os pés)
_lat = np.minimum(np.arange(LADO), np.arange(LADO)[::-1]) / (LADO * 0.1)
_top = np.arange(LADO) / (LADO * 0.1)
_borda = np.clip(np.minimum(_lat[None, :], _top[:, None]), 0, 1)
for i, f in enumerate(fs):
    a = np.asarray(f.getchannel("A")).astype(np.float32) * _borda
    f.putalpha(Image.fromarray(a.astype(np.uint8)))
# Nuvem de poeira grudada nos sapatos quando ele pousa (branco com branco, não dá para separar pela cor):
# depois de pousado, a faixa dos pés de cada quadro é trocada pela do último quadro (limpo), na mesma escala.
# Os quadros só diferem pela rampa de escala em volta de (px, py), então a troca encaixa; no chão os pés não mexem.
_, _y0f, _, _y1f = corpo(fs[-1])
_hf = _y1f - _y0f
_fim_rgba = fs[-1]
for i in range(int(n * 0.45), n - 1):
    if corpo(fs[i])[3] < _y1f - 0.1 * _hf:
        continue  # ainda no ar
    r = ks[i] / ks[-1]
    g = _fim_rgba.resize((round(LADO * r), round(LADO * r)), Image.LANCZOS)
    alvo_img = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    alvo_img.paste(g, (round(px - px * r), round(py - py * r)), g)
    y1i = py + (_y1f - py) * r
    faixa0 = int(y1i - 0.13 * _hf * r)
    ga = np.asarray(alvo_img)
    fa = np.array(fs[i])
    cols = np.flatnonzero(ga[faixa0:, :, 3].max(axis=0) > 60)
    if not cols.size:
        continue
    c0, c1 = max(0, cols[0] - 30), min(LADO, cols[-1] + 31)
    fa[faixa0:, c0:c1] = ga[faixa0:, c0:c1]
    fs[i] = Image.fromarray(fa)
salva([limpa_sapatos(f) for f in fs], "goti-susto", False, fps=30)

# Oi: o aceno novo do Flow (começa e termina no mesmo quadro de frente do fim do susto), no mesmo tamanho e
# lugar do último quadro do susto.
x0, y0, x1, y1 = corpo(fs[-1])
alt_fim, base_fim, cx_fim = (y1 - y0) / LADO, y1 / LADO, (x0 + x1) / 2 / LADO
t, a = extrai(oi, interpola=False)
qo = [limpa_sapatos(limpa_pernas(q)) for q in recorta(t, a, True)]
shutil.rmtree(t)
fo = aplica(qo, moldura(qo[0], alt_fim, base_fim, cx_fim))
salva([limpa_sapatos(f) for f in fo], "goti-oi", True, fps=30)
