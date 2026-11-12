import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { CORES_FUNDO, normalizarAvatar } from "./pecas.js";
import { comporAvatar, ladoPara } from "./compor.js";

// Avatar montado em camadas (arte do Flow, uma peça por vez sobre a mesma base). O desenho é feito em canvas
// por compor.js e fica em cache; aqui só mostramos a imagem pronta sobre a cor de fundo escolhida.

/** Avatar de uma pessoa. `avatar` é o objeto salvo (normalizado aqui); `nome` vai no crachá; `redondo` corta em círculo. */
export default function AvatarPessoa({ avatar, nome = "", tamanho = 96, redondo = false, semFundo = false, className = "", titulo }) {
  const a = normalizarAvatar(avatar);
  const chave = JSON.stringify(a);
  const lado = ladoPara(tamanho);
  const [src, setSrc] = useState(null);
  const fluido = /\bw-full\b/.test(className); // ocupa a largura do pai (editor); senão, tamanho fixo

  useEffect(() => {
    let vivo = true;
    comporAvatar(JSON.parse(chave), lado, nome)
      .then((url) => vivo && setSrc(url))
      .catch(() => vivo && setSrc(null));
    return () => {
      vivo = false;
    };
  }, [chave, lado, nome]);

  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden ${redondo ? "rounded-full" : ""} ${className}`}
      style={{
        width: fluido ? undefined : tamanho,
        height: fluido ? undefined : tamanho,
        aspectRatio: "1 / 1",
        background: semFundo ? undefined : CORES_FUNDO[a.fundo],
      }}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      {src && <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />}
    </span>
  );
}
AvatarPessoa.propTypes = {
  avatar: PropTypes.object,
  nome: PropTypes.string,
  tamanho: PropTypes.number,
  redondo: PropTypes.bool,
  semFundo: PropTypes.bool,
  className: PropTypes.string,
  titulo: PropTypes.string,
};
