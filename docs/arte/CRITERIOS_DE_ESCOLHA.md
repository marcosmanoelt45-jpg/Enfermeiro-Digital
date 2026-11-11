# Como escolher as artes geradas (Flow)

Este guia junta o que o dono costuma escolher quando vê as opções e o que ele já recusou. Gere sempre 2 opções de cada arte, monte a folha (`scripts/assets/folha-de-escolha.py`) e passe cada opção pela lista abaixo. Só mostre ao dono o que passou. Quando for escolha de gosto (personagem, abertura, ícone), a decisão final é dele.

## O que o dono escolheu e o que recusou

| Pedido | Escolheu | Recusou ou pediu para mudar |
|---|---|---|
| Visual do app (Higgsfield) | manter o visual atual e só refinar | mockups "com muita cara de IA" |
| Braço com estetoscópio | o mais parecido com o desenho antigo | "remova um pouco dos brilhos da mão" |
| Foguinho da ofensiva | fogo de pontas suaves, estilo Duolingo (v3-3) | pontas arredondadas demais e depois afiadas demais |
| Selo dos 5 acertos | moeda lisa com o check (v2-3) | estrelinhas e brilhos em volta |
| Goti lendo | costas-1 (mais simples, prancheta à mostra) | — |
| Abertura | a A (logo + nome simples) | — |
| Imagens dos exames | desenho chapado do app | fotos realistas |

**Padrão:** simples, chapado e arredondado. Nada de brilho, estrela, gradiente ou detalhe a mais. Tem que parecer da mesma família das artes que já estão no app: retratos dos pacientes, costas da ausculta, Goti e objetos dos minijogos.

## Lista de checagem (0 = falha, 1 = aceitável, 2 = bom)

1. **Estilo do app:** vetor chapado, formas arredondadas, cores suaves, sem contorno grosso, sem gradiente, sem brilho e sem textura. Fundo cinza-azulado claro e liso, como nos retratos dos pacientes.
2. **Cara de IA:** sem simetria perfeita demais, sem pele de plástico, sem detalhes inventados, sem texto falso, sem brilho decorativo e sem "fofura" fora de lugar (como um coração no lugar do coração do raio X).
3. **Fidelidade clínica:** o achado certo aparece e se vê bem, do lado certo do paciente (esquerda do paciente fica à direita da imagem). Se a imagem mostra o achado de uma alternativa errada, a imagem está errada.
4. **Anatomia:** nada faltando ou sobrando (dedos, braços, pés), proporção humana, articulações no lugar.
5. **Ângulo:** ponto de vista natural para quem examina o paciente, sem perspectiva torta e sem corte estranho do corpo.
6. **Excesso:** só o que o exame pede. Sem cenário, móveis, janela ou objetos que não ajudam a responder.
7. **Consistência:** mesmo enquadramento (4:3, assunto centralizado) e mesma paleta das outras imagens do mesmo conjunto.

**Regra:** qualquer 0 nos itens 3 ou 4 reprova a opção. Entre as que passam, vence a de maior soma; no empate, a mais simples.

## Como escrever o prompt

- Comece pelo estilo, sempre com o mesmo texto: "Flat vector illustration matching the attached reference style exactly…". Anexe uma arte já aprovada do app como referência de estilo.
- Descreva só o recorte do corpo que importa, de perto, e diga o lado em termos da imagem ("on the right side of the image").
- Liste o que NÃO pode aparecer: "no outlines, no gradients, no shine, no sparkles, no text, no extra objects, no room scenery".
- Para personagem, peça enquadramento e tamanho (ex.: "centered, full body at 45% of the frame height, wide margins").
