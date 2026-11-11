# Baixa as opções geradas no Flow e monta a folha de comparação, para passar a lista de
# docs/arte/CRITERIOS_DE_ESCOLHA.md em cada uma antes de escolher.
# Uso: python scripts/assets/folha-de-escolha.py <urls.json> <pasta_saida> [largura_celula=300] [proporcao=4:3]
# urls.json: { "chave": ["url1", "url2", ...], ... }  ->  <pasta>/<chave>-<n>.jpg e <pasta>/folha.jpg
import json, os, sys, urllib.request
from PIL import Image, ImageDraw

arq, pasta = sys.argv[1], sys.argv[2]
T = int(sys.argv[3]) if len(sys.argv) > 3 else 300
pw, ph = (int(x) for x in (sys.argv[4] if len(sys.argv) > 4 else "4:3").split(":"))
H = T * ph // pw
os.makedirs(pasta, exist_ok=True)
U = json.load(open(arq, encoding="utf-8"))
por_linha = max(len(v) for v in U.values())
linhas = len(U)
folha = Image.new("RGB", (por_linha * T, linhas * (H + 22)), (11, 19, 29))
d = ImageDraw.Draw(folha)
for i, chave in enumerate(sorted(U)):
    for j, url in enumerate(U[chave]):
        p = os.path.join(pasta, f"{chave}-{j + 1}.jpg")
        if not os.path.exists(p):
            urllib.request.urlretrieve(url, p)
        im = Image.open(p).convert("RGB").resize((T, H))
        folha.paste(im, (j * T, i * (H + 22)))
        d.text((j * T + 4, i * (H + 22) + H + 4), f"{chave} #{j + 1}", fill=(255, 255, 255))
folha.save(os.path.join(pasta, "folha.jpg"), quality=85)
print("folha", os.path.join(pasta, "folha.jpg"), len(U), "itens")
