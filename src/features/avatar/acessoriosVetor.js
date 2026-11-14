// Peças do avatar desenhadas em código (canvas), em coordenadas da arte de 512 px.

/**
 * Crachá arco-íris em vetor (coordenadas da arte, onde a peça original ficava: cartão de 286,428 a 348,467).
 * A arte trazia a faixa colorida borrada e torta; aqui é um cartão branco com um arco-íris nítido em cima e o
 * nome embaixo (o nome é escrito por compor.js na plaquinha).
 */
export function desenharCrachaArcoiris(ctx) {
  ctx.save();
  // presilha
  ctx.fillStyle = "#8C95A3";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(311, 419, 13, 13, 3);
  else ctx.rect(311, 419, 13, 13);
  ctx.fill();
  // cartão
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(286, 428, 62, 40, 6);
  else ctx.rect(286, 428, 62, 40);
  ctx.fillStyle = "#FEFDFC";
  ctx.fill();
  ctx.strokeStyle = "#D6D0DA";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // arco-íris
  const cores = ["#F0524F", "#F7943B", "#F9CF3A", "#5CC77A", "#4A9BE8", "#9B6BDB"];
  ctx.lineWidth = 2.6;
  ctx.lineCap = "butt";
  cores.forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(317, 447, 16 - i * 2.4, Math.PI, 0);
    ctx.strokeStyle = c;
    ctx.stroke();
  });
  ctx.restore();
}
