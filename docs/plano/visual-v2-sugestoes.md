# Visual 2.0 do Enfere: sugestões (10/11/2026)

Baseado nos 3 vídeos do Jason Lee (apps que cresceram rápido; recriando o Finch com mascote animado; recriando o Water Llama com animação suave), vistos por inteiro pela transcrição e por quadros.

## O que os vídeos ensinam

1. **O mascote é o produto.** Finch, Water Llama, Ziggy e Duolingo vendem a mesma ideia de vários apps chatos, só que com um personagem vivo e um pouco de jogo. O Enfere já tem o Goti, a Ana e o Rui: falta usá-los em todo lugar, não só em telas soltas.
2. **Dois tipos de animação, cada um com a sua ferramenta.**
   - Interface (botões, barras, sliders, líquido enchendo): **código**. É interativo, leve e fica nítido em qualquer tamanho.
   - Personagem andando, pulando, bebendo: **vídeo gerado** (Higgsfield: Seedance 2.5, ou Genjutsu para copiar um movimento de referência), com fundo verde para recortar e depois comprimir. Animar personagem em código fica duro, "boneco de palito".
   - Imagem parada que precisa crescer: **SVG** (o GPT Image 2.6 do Higgsfield já gera SVG editável).
3. **O cadastro é parte da experiência.** O Finch faz chocar um ovo e escolher a cor antes de pedir conta. O Water Llama deixa você usar o app (encher o copo) antes do cadastro.
4. **Fundo ilustrado com vida.** Cenário desenhado no mesmo estilo do mascote, com água e plantas mexendo devagar, e o personagem com uma rotina (anda, para, toma café, volta).
5. **Efeitos prontos e recoloridos.** Lottie (LottieFiles) para check, estrelas e confete, com as cores da marca.
6. **Processo:** gravar a tela do app atual e entregar ao Claude; pedir ajustes gravando a tela com voz; deixar o Claude escrever os prompts do Higgsfield pelo MCP.

## Por que o Enfere ainda tem "cara de IA"

- Fundo escuro com degradês e brilho verde-água, que é o visual padrão de site feito por IA.
- Ícones genéricos de biblioteca (lucide) em tudo e cartões todos iguais.
- Pouca ilustração própria: o Goti aparece, mas as telas em volta são só caixas e texto.

## Propostas

### A. Identidade
- **Decisão sua: tema.** (1) claro e quente, como o Duolingo (fundo creme ou branco, cores sólidas, sem degradê); ou (2) manter o escuro, mas tirar degradês e brilhos, com superfícies sólidas e ilustrações coloridas por cima. A minha recomendação é a 1, com um modo escuro opcional.
- **Ícones ilustrados próprios** para cada módulo (Consulta, Plantão, Cálculo, Técnicas, Casos), no traço do Goti, gerados em SVG.
- **Cenário de fundo por módulo:** posto de enfermagem, beira de leito, sala de medicação. Mesmo estilo, com movimento sutil (soro gotejando, monitor piscando).

### B. Entrada, cadastro e login
- **Abertura:** o Goti entra, acena e chama: "Bora pro plantão?".
- **Teste antes da conta:** um desafio de 30 segundos (ex.: arrastar o EPI certo) antes de pedir e-mail, como o copo do Water Llama.
- **Cadastro como crachá:** o aluno escolhe a cor do jaleco e do crachá, digita o nome e o crachá "sai da impressora", com foto do Goti ao lado. Faz o papel do ovo do Finch, com tema de enfermagem.
- **Login:** os olhos do Goti seguem o campo que está sendo preenchido e ele tapa os olhos no campo de senha. Erro de senha: ele inclina a cabeça, sem drama.

### C. Dentro do app
- **Início:** cena ilustrada no topo com o Goti fazendo a rotina dele (vídeo curto em loop, gerado no Higgsfield), muda com a hora do dia (manhã, tarde, plantão noturno).
- **Trilha:** o Goti fica parado ao lado da próxima lição (como na trilha do Ziggy); lições feitas viram um carimbo.
- **Cálculo com o Dr. Rui:** seringa interativa em código, com o êmbolo enchendo conforme o aluno arrasta a dose (o "copo" do Water Llama, versão enfermagem); gotejamento do soro em gotas por minuto, ao vivo.
- **Botão que convida:** o botão principal balança uma vez quando o aluno fica parado alguns segundos (dica, não um loop eterno).

### D. Acerto e erro (sem som, como já combinado)
- **Acerto:** a folha de baixo sobe verde, o botão escolhido dá um pop, um check desenhado em código e um "+10 PE" que voa até o contador do topo. Três acertos seguidos: o Goti comemora em vídeo curto (1 s).
- **Erro:** a opção errada treme (o shake de hoje) e fica vermelha, a certa acende em verde, a folha vem em vermelho suave com o Goti "pensando" e a explicação curta. Nunca uma tela inteira vermelha.
- **Fim da sessão:** resumo com números contando, o Goti feliz, e confete só nos momentos raros que já existem (acerto de primeira, 70% ou mais, meta do dia).
- **Ofensiva:** a chama cresce um pouco a cada dia e tem uma animação só quando o dia é concluído.

## Como fazer
1. Você entra no Higgsfield com a sua conta (cadastro e senha ficam com você) e conecta o **Higgsfield MCP** ao Claude (botão "Connect Higgsfield MCP" no site).
2. Eu gero 3 opções de estilo (tema claro e escuro, ícones, cenário do Início) e você escolhe.
3. Com o estilo escolhido: ícones em SVG, cenários e clipes do Goti (fundo verde, recorte e webm leve).
4. Código: entrada e cadastro, depois feedback de acerto e erro, depois Início e trilha, depois Cálculo interativo. Cada etapa testada no local antes da Vercel.
