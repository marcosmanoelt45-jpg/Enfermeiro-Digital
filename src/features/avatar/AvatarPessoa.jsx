import React, { useId } from "react";
import PropTypes from "prop-types";
import { CORES_ACESSORIO, CORES_CABELO, CORES_FUNDO, CORES_ROUPA, PELES, normalizarAvatar } from "./pecas.js";

// Desenho do avatar em vetor (viewBox 200x200), no estilo da arte do Flow escolhida pelo dono
// (assets-brutos/flow/avatar/estilo-2.jpg): rosto oval com queixo, olhos com branco, íris, brilho e cílios,
// nariz pequeno, bochechas, cabelo em camadas com mechas, ombros com mangas e costuras, pijama estampado.
// Proporções medidas na arte (1024 px -> 200): rosto 65..135 x 43..125, orelhas em x 60/140, pescoço 87..113.
// Chapado, sem contorno, sem degradê, sem brilho (critérios de arte do app).
// Camadas: fundo, cabelo de trás, corpo e roupa, pescoço, estetoscópio, orelhas, rosto, olhos, nariz, boca,
// cabelo da frente, barba, óculos, acessório de cabeça, crachá.

const escurecer = (hex, f = 0.82) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (x) => Math.max(0, Math.min(255, Math.round(x * f)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => c(x).toString(16).padStart(2, "0")).join("")}`;
};
const IRIS = "#36231F";
// O cabelo, a barba e os acessórios de cabeça foram desenhados para um rosto mais estreito: alargam 11% em volta
// do centro para acompanhar o rosto redondo da arte.
const LARGO = "translate(100 0) scale(1.11 1) translate(-100 0)";
const LABIO = "#D77C61";

/** Avatar de uma pessoa. `avatar` é o objeto salvo (normalizado aqui); `redondo` corta em círculo. */
export default function AvatarPessoa({ avatar, tamanho = 96, redondo = false, semFundo = false, className = "", titulo }) {
  const a = normalizarAvatar(avatar);
  const uid = useId().replace(/:/g, "");
  const pele = PELES[a.pele];
  const sombra = escurecer(pele, 0.93);
  const cab = CORES_CABELO[a.corCabelo];
  const roupa = CORES_ROUPA[a.corRoupa];
  const acess = CORES_ACESSORIO[a.corAcessorio];
  const fundo = CORES_FUNDO[a.fundo];
  const clip = `av-clip-${uid}`;
  const pad = `av-pad-${uid}`;
  return (
    <svg
      viewBox="0 0 200 200"
      width={tamanho}
      height={tamanho}
      className={className}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <defs>
        <clipPath id={clip}>{redondo ? <circle cx="100" cy="100" r="100" /> : <rect width="200" height="200" />}</clipPath>
        <Estampa id={pad} tipo={a.estampa} cor={roupa} />
      </defs>
      <g clipPath={`url(#${clip})`}>
        {!semFundo && <rect width="200" height="200" fill={fundo} />}
        <g transform={LARGO}>
          <CabeloTras tipo={a.cabelo} cor={cab} />
        </g>
        <Corpo roupa={roupa} padrao={a.estampa === "lisa" ? null : `url(#${pad})`} pele={pele} sombra={sombra} jaleco={a.jaleco} />
        <Pescoco pele={pele} sombra={sombra} />
        <NoPescoco tipo={a.estetoscopio} />
        <Rosto pele={pele} />
        <g transform="translate(100 85) scale(1.2) translate(-100 -85)">
          <Olhos tipo={a.olhos} grandes={a.olhos === "grandes"} />
        </g>
        <g transform="translate(100 71) scale(1.18) translate(-100 -71.5)">
          <Sobrancelhas cor={escurecer(cab, 0.85)} />
        </g>
        <path d="M96.6 95.6 Q100 99.2 103.4 95.6" fill="none" stroke={escurecer(pele, 0.86)} strokeWidth="2.2" strokeLinecap="round" />
        <g transform="translate(100 104) scale(1.12) translate(-100 -104)">
          <Boca tipo={a.boca} />
        </g>
        <g transform={LARGO}>
          <CabeloFrente tipo={a.cabelo} cor={cab} />
          <Barba tipo={a.barba} cor={cab} />
        </g>
        <g transform="translate(100 85) scale(1.2) translate(-100 -85)">
          <Oculos tipo={a.oculos} />
        </g>
        <g transform={LARGO}>
          <AcessorioCabeca tipo={a.cabeca} cor={acess} cabelo={a.cabelo} />
        </g>
        <Cracha tipo={a.cracha} cordao={a.estetoscopio === "cordao"} />
      </g>
    </svg>
  );
}
AvatarPessoa.propTypes = {
  avatar: PropTypes.object,
  tamanho: PropTypes.number,
  redondo: PropTypes.bool,
  semFundo: PropTypes.bool,
  className: PropTypes.string,
  titulo: PropTypes.string,
};

// ---------------------------------------------------------------- corpo e roupa
const TRONCO = "M22 200 L26 168 C28 151 44 140 76 134 L124 134 C156 140 172 151 174 168 L178 200 Z";

function Corpo({ roupa, padrao, pele, sombra, jaleco }) {
  const costura = escurecer(roupa, 0.86);
  return (
    <g>
      {/* braços (a pele aparece abaixo das mangas, nas bordas) */}
      <path d="M22 200 L25 178 L40 180 L38 200 Z" fill={pele} />
      <path d="M178 200 L175 178 L160 180 L162 200 Z" fill={pele} />
      <path d={TRONCO} fill={roupa} />
      {padrao && <path d={TRONCO} fill={padrao} />}
      {/* mangas: costura do ombro descendo e a barra */}
      <path d="M58 146 C56 160 56 172 58 188" fill="none" stroke={costura} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M142 146 C144 160 144 172 142 188" fill="none" stroke={costura} strokeWidth="2.4" strokeLinecap="round" />
      {/* decote em V com a gola */}
      <path d="M79 134 L100 168 L121 134 Z" fill={pele} />
      <path d="M85 134 L100 158 L115 134 Z" fill={sombra} opacity="0.35" />
      <path d="M77 134 L100 170 L123 134" fill="none" stroke={escurecer(roupa, 0.8)} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      {jaleco === "jaleco" && (
        <g>
          <path d="M22 200 L26 168 C28 151 44 140 72 135 L95 200 Z" fill="#F5F7FA" />
          <path d="M178 200 L174 168 C172 151 156 140 128 135 L105 200 Z" fill="#F5F7FA" />
          <path d="M72 135 L86 166 L80 170 L95 200" fill="none" stroke="#DCE3EA" strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M128 135 L114 166 L120 170 L105 200" fill="none" stroke="#DCE3EA" strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M44 158 C42 172 42 184 44 196" fill="none" stroke="#DCE3EA" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M156 158 C158 172 158 184 156 196" fill="none" stroke="#DCE3EA" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="140" y="182" width="20" height="3" rx="1.5" fill="#DCE3EA" />
        </g>
      )}
      {jaleco === "colete" && (
        <g fill={escurecer(roupa, 0.72)}>
          <path d="M44 200 C46 178 58 160 76 150 L93 200 Z" />
          <path d="M156 200 C154 178 142 160 124 150 L107 200 Z" />
        </g>
      )}
    </g>
  );
}
Corpo.propTypes = { roupa: PropTypes.string, padrao: PropTypes.string, pele: PropTypes.string, sombra: PropTypes.string, jaleco: PropTypes.string };

function Estampa({ id, tipo, cor }) {
  if (tipo === "lisa") return null;
  const t = escurecer(cor, 0.7);
  const c = "#FFFFFF";
  // confete no jeito da arte: tracinhos e pontinhos coloridos e espalhados
  const desenho = {
    coracoes: (
      <>
        <path d="M6 9 C6 6.5 9.5 6.5 9.5 9 C9.5 6.5 13 6.5 13 9 C13 11.6 9.5 13.5 9.5 14.2 C9.5 13.5 6 11.6 6 9 Z" fill="#F7B7C8" />
        <path d="M22 24 C22 22.2 24.6 22.2 24.6 24 C24.6 22.2 27.2 22.2 27.2 24 C27.2 26 24.6 27.4 24.6 28 C24.6 27.4 22 26 22 24 Z" fill={c} opacity="0.9" />
      </>
    ),
    cruzes: (
      <>
        <path d="M8 5 h3.6 v3.6 h3.6 v3.6 h-3.6 v3.6 h-3.6 v-3.6 h-3.6 v-3.6 h3.6 Z" fill={c} opacity="0.9" />
        <path d="M25 21 h2.4 v2.4 h2.4 v2.4 h-2.4 v2.4 h-2.4 v-2.4 h-2.4 v-2.4 h2.4 Z" fill={t} />
      </>
    ),
    estrelas: (
      <>
        <path d="M10 4 L11.6 8.4 L16.2 8.6 L12.6 11.4 L13.9 15.8 L10 13.2 L6.1 15.8 L7.4 11.4 L3.8 8.6 L8.4 8.4 Z" fill="#FFF0A8" />
        <circle cx="26" cy="25" r="1.6" fill={c} opacity="0.9" />
      </>
    ),
    gotinhas: (
      <>
        <path d="M10 4 C13 9 14.6 11 14.6 13.4 C14.6 16 12.6 17.6 10 17.6 C7.4 17.6 5.4 16 5.4 13.4 C5.4 11 7 9 10 4 Z" fill="#4FA6E8" />
        <path d="M26 21 C27.6 23.6 28.4 24.8 28.4 26.1 C28.4 27.6 27.3 28.6 26 28.6 C24.7 28.6 23.6 27.6 23.6 26.1 C23.6 24.8 24.4 23.6 26 21 Z" fill={c} opacity="0.9" />
      </>
    ),
    patinhas: (
      <>
        <ellipse cx="10" cy="12" rx="3.2" ry="2.6" fill={c} opacity="0.9" />
        {[[6.4, 8.2], [9, 6.6], [12, 6.8], [14.2, 8.8]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="1.3" fill={c} opacity="0.9" />
        ))}
        <ellipse cx="26" cy="27" rx="2.2" ry="1.8" fill={t} />
        {[[23.8, 24.4], [26, 23.4], [28.2, 24.4]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="0.95" fill={t} />
        ))}
      </>
    ),
    curativos: (
      <>
        <g transform="rotate(-30 10 10)">
          <rect x="2.5" y="7" width="15" height="6" rx="3" fill="#F6D7B5" />
          <rect x="7.5" y="7" width="5" height="6" fill="#EBC197" />
        </g>
        <circle cx="26" cy="26" r="1.5" fill={c} opacity="0.9" />
      </>
    ),
    confete: (
      <>
        <rect x="4" y="5" width="4" height="1.8" rx="0.9" fill="#F4A7B4" transform="rotate(35 6 6)" />
        <circle cx="16" cy="6" r="1.2" fill={c} opacity="0.9" />
        <rect x="22" y="10" width="4" height="1.8" rx="0.9" fill="#FFE29A" transform="rotate(-20 24 11)" />
        <circle cx="9" cy="17" r="1.2" fill="#7FD6C2" />
        <rect x="15" y="21" width="4" height="1.8" rx="0.9" fill={c} opacity="0.9" transform="rotate(60 17 22)" />
        <circle cx="28" cy="26" r="1.2" fill="#F7B79A" />
        <rect x="4" y="27" width="4" height="1.8" rx="0.9" fill="#9DB8F2" transform="rotate(-40 6 28)" />
      </>
    ),
    ecg: <path d="M0 16 H8 L10.5 11 L13.5 22 L16.5 8 L19 16 H32" fill="none" stroke={c} strokeOpacity="0.9" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />,
  }[tipo];
  if (!desenho) return null;
  return (
    <pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse">
      {desenho}
    </pattern>
  );
}
Estampa.propTypes = { id: PropTypes.string, tipo: PropTypes.string, cor: PropTypes.string };

function Pescoco({ pele, sombra }) {
  return (
    <g>
      <path d="M87 112 L87 136 Q100 141 113 136 L113 112 Z" fill={pele} />
      {/* sombra do queixo no pescoço */}
      <path d="M87 116 Q100 131 113 116 L113 124 Q100 133 87 124 Z" fill={sombra} />
    </g>
  );
}
Pescoco.propTypes = { pele: PropTypes.string, sombra: PropTypes.string };

function NoPescoco({ tipo }) {
  if (tipo !== "estetoscopio") return null;
  return (
    <g fill="none" strokeLinecap="round">
      <path d="M82 134 C76 152 84 170 94 176" stroke="#5B6575" strokeWidth="3.2" />
      <path d="M118 134 C124 150 124 162 120 170" stroke="#5B6575" strokeWidth="3.2" />
      <circle cx="119" cy="175" r="6" fill="#8C96A6" />
      <circle cx="119" cy="175" r="3" fill="#C9D1DB" />
    </g>
  );
}
NoPescoco.propTypes = { tipo: PropTypes.string };

// ---------------------------------------------------------------- rosto
function Rosto({ pele }) {
  const dentro = escurecer(pele, 0.9);
  return (
    <g>
      <ellipse cx="59" cy="91" rx="7.6" ry="10" fill={pele} />
      <ellipse cx="60.6" cy="91.6" rx="3.9" ry="6.2" fill={dentro} />
      <ellipse cx="141" cy="91" rx="7.6" ry="10" fill={pele} />
      <ellipse cx="139.4" cy="91.6" rx="3.9" ry="6.2" fill={dentro} />
      <path d="M61 82 C61 56 78 41 100 41 C122 41 139 56 139 82 C139 106 122 125 100 125 C78 125 61 106 61 82 Z" fill={pele} />
      <ellipse cx="75.5" cy="98" rx="8" ry="4.6" fill="#F59A86" opacity="0.6" />
      <ellipse cx="124.5" cy="98" rx="8" ry="4.6" fill="#F59A86" opacity="0.6" />
    </g>
  );
}
Rosto.propTypes = { pele: PropTypes.string };

function Olhos({ tipo, grandes }) {
  // olho aberto: branco, íris, brilho e a linha da pálpebra; com cílios na ponta de fora
  const aberto = (x, lado, cilios = false) => {
    const k = grandes ? 1.15 : 1;
    return (
      <g key={x}>
        <ellipse cx={x} cy="84.5" rx={7 * k} ry={6.4 * k} fill="#FFFFFF" />
        <circle cx={x + 0.4 * lado * -1} cy="85.2" r={4.8 * k} fill={IRIS} />
        <circle cx={x + 1.6} cy={83.2} r={1.35 * k} fill="#FFFFFF" />
        {grandes && <circle cx={x - 1.8} cy="87.3" r="0.8" fill="#FFFFFF" />}
        <path d={`M${x - 7.4 * k} 83.6 Q${x} ${77.2 - (k - 1) * 6} ${x + 7.4 * k} 83.6`} fill="none" stroke={IRIS} strokeWidth="1.9" strokeLinecap="round" />
        {cilios && (
          <path
            d={lado < 0 ? `M${x - 6.4} 80.8 L${x - 9.2} 78.6 M${x - 7.2} 83 L${x - 10.2} 81.8` : `M${x + 6.4} 80.8 L${x + 9.2} 78.6 M${x + 7.2} 83 L${x + 10.2} 81.8`}
            stroke={IRIS}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </g>
    );
  };
  const feliz = (x) => <path key={x} d={`M${x - 7} 86 Q${x} 78 ${x + 7} 86`} fill="none" stroke={IRIS} strokeWidth="2.8" strokeLinecap="round" />;
  switch (tipo) {
    case "ponto":
      return (
        <g fill={IRIS}>
          <ellipse cx="84" cy="85" rx="4.4" ry="5" />
          <ellipse cx="116" cy="85" rx="4.4" ry="5" />
          <circle cx="85.4" cy="83.3" r="1.2" fill="#fff" />
          <circle cx="117.4" cy="83.3" r="1.2" fill="#fff" />
        </g>
      );
    case "cilios":
      return (
        <g>
          {aberto(84, -1, true)}
          {aberto(116, 1, true)}
        </g>
      );
    case "feliz":
      return <g>{[84, 116].map(feliz)}</g>;
    case "piscando":
      return (
        <g>
          {aberto(84, -1)}
          {feliz(116)}
        </g>
      );
    case "sono":
      return (
        <g>
          {[84, 116].map((x) => (
            <g key={x}>
              <path d={`M${x - 7} 84 Q${x} 89 ${x + 7} 84`} fill="none" stroke={IRIS} strokeWidth="2.6" strokeLinecap="round" />
              <path d={`M${x - 5.5} 91 Q${x} 93 ${x + 5.5} 91`} fill="none" stroke="#C99A8A" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
    default:
      return (
        <g>
          {aberto(84, -1)}
          {aberto(116, 1)}
        </g>
      );
  }
}
Olhos.propTypes = { tipo: PropTypes.string, grandes: PropTypes.bool };

function Sobrancelhas({ cor }) {
  return (
    <g fill="none" stroke={cor} strokeWidth="3" strokeLinecap="round">
      <path d="M76 72.6 Q84 68.6 92 71.4" />
      <path d="M108 71.4 Q116 68.6 124 72.6" />
    </g>
  );
}
Sobrancelhas.propTypes = { cor: PropTypes.string };

function Boca({ tipo }) {
  switch (tipo) {
    case "aberta":
      return (
        <g>
          <path d="M91 102.5 Q100 102.5 109 102.5 Q107.5 113 100 113 Q92.5 113 91 102.5 Z" fill="#8E3B3B" />
          <path d="M94.5 109.6 Q100 106.4 105.5 109.6 Q103 112.6 100 112.6 Q97 112.6 94.5 109.6 Z" fill="#F08A95" />
        </g>
      );
    case "dentes":
      return (
        <g>
          <path d="M89 102 Q100 102 111 102 Q109 114 100 114 Q91 114 89 102 Z" fill="#8E3B3B" />
          <path d="M90.5 102.6 Q100 102.6 109.5 102.6 L108.8 106 Q100 107 91.2 106 Z" fill="#FFFFFF" />
        </g>
      );
    case "lingua":
      return (
        <g>
          <path d="M90 103 Q100 110.5 110 103" fill="none" stroke={LABIO} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M97.2 107 Q100 114 103.6 107 Z" fill="#F08A95" />
        </g>
      );
    case "neutra":
      return <path d="M93 106 L107 106" stroke={LABIO} strokeWidth="2.8" strokeLinecap="round" />;
    case "o":
      return <ellipse cx="100" cy="106.5" rx="4" ry="5" fill="#8E3B3B" />;
    default:
      return <path d="M90 103 Q100 111 110 103" fill="none" stroke={LABIO} strokeWidth="2.8" strokeLinecap="round" />;
  }
}
Boca.propTypes = { tipo: PropTypes.string };

// ---------------------------------------------------------------- cabelo
// O cabelo tem duas camadas: a de trás (com a parte de dentro mais escura, que aparece ao lado do pescoço) e a
// franja/calota da frente, que cobre a testa até a linha do cabelo (y ~58) e desce pelas laterais do rosto.
function CabeloTras({ tipo, cor }) {
  const escuro = escurecer(cor, 0.78);
  switch (tipo) {
    case "longo":
      return (
        <g>
          <path d="M100 24 C68 24 52 46 52 76 C52 102 50 124 42 144 C46 145 50 144 53 141 L58 146 C60 140 62 132 64 124 L136 124 C138 132 140 140 142 146 L147 141 C150 144 154 145 158 144 C150 124 148 102 148 76 C148 46 132 24 100 24 Z" fill={cor} />
          <path d="M66 96 L66 136 L134 136 L134 96 Z" fill={escuro} />
        </g>
      );
    case "chanel":
      return (
        <g>
          <path d="M100 24 C68 24 52 46 52 76 C52 96 52 108 50 118 Q76 124 100 122 Q124 124 150 118 C148 108 148 96 148 76 C148 46 132 24 100 24 Z" fill={cor} />
          <path d="M66 96 L66 120 L134 120 L134 96 Z" fill={escuro} />
        </g>
      );
    case "cacheado":
      return (
        <g fill={cor}>
          {[
            [62, 50, 17], [80, 34, 17], [100, 28, 17], [120, 34, 17], [138, 50, 17], [146, 70, 15], [148, 92, 14], [146, 112, 13],
            [54, 70, 15], [52, 92, 14], [54, 112, 13], [100, 44, 18],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
          <circle cx="66" cy="124" r="11" fill={escuro} />
          <circle cx="134" cy="124" r="11" fill={escuro} />
        </g>
      );
    case "rabo":
      return (
        <g>
          <path d="M132 52 C162 58 168 98 156 126 C152 116 150 106 146 96 C144 84 138 74 130 68 Z" fill={cor} />
          <rect x="128" y="56" width="8" height="10" rx="3" fill={escurecer(cor, 0.6)} transform="rotate(-25 132 61)" />
        </g>
      );
    case "coque":
      return (
        <g>
          <circle cx="100" cy="22" r="14" fill={cor} />
          <path d="M92 33 Q100 30 108 33" fill="none" stroke={escurecer(cor, 0.6)} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}
CabeloTras.propTypes = { tipo: PropTypes.string, cor: PropTypes.string };

function CabeloFrente({ tipo, cor }) {
  const mecha = escurecer(cor, 0.85);
  switch (tipo) {
    case "longo":
    case "chanel":
      // franja de lado com pontas, como na arte
      return (
        <g>
          <path d="M64 92 C60 50 78 32 100 32 C124 32 141 50 136 92 C134 78 130 68 124 60 C121 66 116 70 110 72 C111 64 109 58 105 54 C97 63 84 69 70 71 C67 77 65 84 64 92 Z" fill={cor} />
          <path d="M105 54 C102 62 96 67 88 70" fill="none" stroke={mecha} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M124 60 C126 70 129 80 130 88" fill="none" stroke={mecha} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    case "rabo":
    case "coque":
      return (
        <g>
          <path d="M64 88 C60 48 80 31 100 31 C120 31 140 48 136 88 C131 70 119 58 100 57 C81 58 69 70 64 88 Z" fill={cor} />
          <path d="M100 57 C96 50 92 44 86 40" fill="none" stroke={mecha} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    case "cacheado":
      return (
        <g fill={cor}>
          {[[72, 54, 11], [86, 47, 11], [100, 45, 11], [114, 47, 11], [128, 54, 11], [66, 66, 8], [134, 66, 8]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case "curto":
      return (
        <g>
          <path d="M63 90 C58 46 80 28 100 28 C122 28 144 46 137 90 C135 76 131 66 125 59 C113 65 96 65 80 59 C72 66 66 76 63 90 Z" fill={cor} />
          <path d="M80 59 C86 54 92 50 98 48" fill="none" stroke={mecha} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    case "topete":
      return (
        <g>
          <path d="M63 90 C57 52 70 30 94 28 C110 18 138 24 141 46 C143 60 140 76 137 90 C134 74 128 64 118 60 C104 63 88 60 76 61 C70 67 65 78 63 90 Z" fill={cor} />
          <path d="M96 30 C108 30 120 36 126 46" fill="none" stroke={mecha} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case "raspado":
      return <path d="M65 82 C63 46 82 34 100 34 C118 34 137 46 135 82 C130 66 118 57 100 57 C82 57 70 66 65 82 Z" fill={cor} opacity="0.55" />;
    default:
      return null;
  }
}
CabeloFrente.propTypes = { tipo: PropTypes.string, cor: PropTypes.string };

function Barba({ tipo, cor }) {
  const bigode = <path d="M90 100.6 Q95 96.6 100 99.4 Q105 96.6 110 100.6 Q105 102.6 100 101.2 Q95 102.6 90 100.6 Z" fill={cor} />;
  switch (tipo) {
    case "bigode":
      return bigode;
    case "cavanhaque":
      return (
        <g fill={cor}>
          {bigode}
          <path d="M94 115 Q100 112.6 106 115 Q105 123 100 124 Q95 123 94 115 Z" />
        </g>
      );
    case "curta":
      return <path d="M66 94 C68 116 82 126 100 126 C118 126 132 116 134 94 C128 110 116 118 100 118 C84 118 72 110 66 94 Z" fill={cor} opacity="0.42" />;
    case "cheia":
      return (
        <g fill={cor}>
          <path d="M65 90 C65 116 80 130 100 130 C120 130 135 116 135 90 C130 104 121 110 111 110 Q100 105 89 110 C79 110 70 104 65 90 Z" />
          {bigode}
        </g>
      );
    default:
      return null;
  }
}
Barba.propTypes = { tipo: PropTypes.string, cor: PropTypes.string };

function Oculos({ tipo }) {
  const aro = { fill: "#FFFFFF", fillOpacity: 0.16, strokeWidth: 2.8 };
  switch (tipo) {
    case "redondo":
      return (
        <g stroke="#3D3346" {...aro}>
          <circle cx="84" cy="85" r="10.5" />
          <circle cx="116" cy="85" r="10.5" />
          <path d="M94.5 84 Q100 80.5 105.5 84" fill="none" />
        </g>
      );
    case "quadrado":
      return (
        <g stroke="#3D3346" {...aro}>
          <rect x="72" y="76" width="24" height="18" rx="5" />
          <rect x="104" y="76" width="24" height="18" rx="5" />
          <path d="M96 84 Q100 81 104 84" fill="none" />
        </g>
      );
    case "gatinho":
      return (
        <g stroke="#C2457A" {...aro}>
          <path d="M71 78 Q84 74 96 79 Q97 93 84 95 Q72 93 71 78 Z" />
          <path d="M129 78 Q116 74 104 79 Q103 93 116 95 Q128 93 129 78 Z" />
          <path d="M96 83 Q100 80 104 83" fill="none" />
        </g>
      );
    case "protecao":
      return <path d="M66 77 Q100 69 134 77 Q136 93 120 96 Q100 91 80 96 Q64 93 66 77 Z" fill="#BFE8F5" fillOpacity="0.5" stroke="#7FB7CC" strokeWidth="2.6" />;
    default:
      return null;
  }
}
Oculos.propTypes = { tipo: PropTypes.string };

// ---------------------------------------------------------------- acessório de cabeça
function AcessorioCabeca({ tipo, cor, cabelo }) {
  const dentro = "#FCCDB7";
  const tiara = <path d="M64 70 Q100 12 136 70" fill="none" stroke={cor} strokeWidth="6" strokeLinecap="round" />;
  const alto = cabelo === "cacheado" ? -8 : cabelo === "topete" ? -4 : 0;
  const g = (filhos) => <g transform={`translate(0 ${alto})`}>{filhos}</g>;
  switch (tipo) {
    case "gato":
      return g(
        <>
          {tiara}
          <path d="M64 54 C61 44 62 34 67 27 C75 29 84 35 89 43 Z" fill={cor} />
          <path d="M68 48 C67 41 67 36 70 32 C75 34 80 38 83 43 Z" fill={dentro} />
          <path d="M136 54 C139 44 138 34 133 27 C125 29 116 35 111 43 Z" fill={cor} />
          <path d="M132 48 C133 41 133 36 130 32 C125 34 120 38 117 43 Z" fill={dentro} />
        </>
      );
    case "urso":
      return g(
        <>
          {tiara}
          <circle cx="71" cy="38" r="11" fill={cor} />
          <circle cx="71" cy="38" r="5.5" fill={dentro} />
          <circle cx="129" cy="38" r="11" fill={cor} />
          <circle cx="129" cy="38" r="5.5" fill={dentro} />
        </>
      );
    case "coelho":
      return g(
        <>
          {tiara}
          <ellipse cx="86" cy="16" rx="8" ry="22" fill={cor} transform="rotate(-12 86 16)" />
          <ellipse cx="86" cy="18" rx="4" ry="15" fill={dentro} transform="rotate(-12 86 18)" />
          <ellipse cx="114" cy="16" rx="8" ry="22" fill={cor} transform="rotate(12 114 16)" />
          <ellipse cx="114" cy="18" rx="4" ry="15" fill={dentro} transform="rotate(12 114 18)" />
        </>
      );
    case "touca":
      return g(
        <>
          <path d="M60 76 C54 30 146 30 140 76 C128 66 116 62 100 62 C84 62 72 66 60 76 Z" fill={cor} />
          <path d="M60 76 C72 66 84 62 100 62 C116 62 128 66 140 76" fill="none" stroke={escurecer(cor, 0.8)} strokeWidth="3.2" />
          {[[76, 50], [92, 40], [108, 40], [124, 50], [100, 54]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.4" fill="#fff" opacity="0.75" />
          ))}
        </>
      );
    case "flores":
      return g(
        <>
          {tiara}
          {[[70, 52], [84, 38], [100, 33], [116, 38], [130, 52]].map(([x, y], i) => (
            <g key={i}>
              {[0, 72, 144, 216, 288].map((ang) => (
                <circle key={ang} cx={x + 4.2 * Math.cos((ang * Math.PI) / 180)} cy={y + 4.2 * Math.sin((ang * Math.PI) / 180)} r="3.6" fill={i % 2 ? "#F7B7CF" : "#FFF3B0"} />
              ))}
              <circle cx={x} cy={y} r="2.6" fill="#F2A33C" />
            </g>
          ))}
        </>
      );
    case "laco":
      return g(
        <g transform="translate(124 44) rotate(18)">
          <path d="M0 0 L-16 -10 Q-19 0 -16 10 Z" fill={cor} />
          <path d="M0 0 L16 -10 Q19 0 16 10 Z" fill={cor} />
          <circle cx="0" cy="0" r="5" fill={escurecer(cor, 0.85)} />
        </g>
      );
    case "quepe":
      return g(
        <>
          <path d="M74 48 L79 26 Q100 19 121 26 L126 48 Q100 41 74 48 Z" fill="#FFFFFF" />
          <path d="M74 48 Q100 41 126 48" fill="none" stroke="#DCE3EA" strokeWidth="2.6" />
          <path d="M97.5 27 h5 v5 h5 v5 h-5 v5 h-5 v-5 h-5 v-5 h5 Z" fill="#20BFA3" />
        </>
      );
    case "antenas":
      return g(
        <>
          {tiara}
          <path d="M80 44 Q74 26 68 16" fill="none" stroke={escurecer(cor, 0.8)} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M120 44 Q126 26 132 16" fill="none" stroke={escurecer(cor, 0.8)} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="68" cy="14" r="6" fill={cor} />
          <circle cx="132" cy="14" r="6" fill={cor} />
        </>
      );
    default:
      return null;
  }
}
AcessorioCabeca.propTypes = { tipo: PropTypes.string, cor: PropTypes.string, cabelo: PropTypes.string };

// ---------------------------------------------------------------- crachá (presilha azul, foto e linhas, como na arte)
function Cracha({ tipo, cordao }) {
  if (tipo === "nenhum") return null;
  const x = cordao ? 84 : 108;
  const y = cordao ? 168 : 170;
  const cartao = (cor, simbolo) => (
    <g transform={`translate(${x} ${y}) scale(1.22) translate(${-x} ${-y})`}>
      {cordao ? (
        <path d="M80 136 L95 168 M120 136 L105 168" stroke="#20BFA3" strokeWidth="3.4" strokeLinecap="round" />
      ) : (
        <rect x={x + 11} y={y - 6} width="4.6" height="9" rx="1.6" fill="#4382C9" />
      )}
      <rect x={x} y={y} width="26.6" height="19" rx="3" fill={cor} />
      {simbolo}
    </g>
  );
  const foto = (
    <g>
      <rect x={x + 2.6} y={y + 3} width="8.4" height="10.6" rx="1.2" fill="#A8DCC2" />
      <circle cx={x + 6.8} cy={y + 7} r="2.2" fill="#E8836E" />
      <path d={`M${x + 3.4} ${y + 13.6} Q${x + 6.8} ${y + 8.6} ${x + 10.2} ${y + 13.6} Z`} fill="#4E7FD0" />
    </g>
  );
  const linhas = (
    <g>
      <rect x={x + 13} y={y + 4} width="10.6" height="2.2" rx="1" fill="#E07A6E" />
      <rect x={x + 13} y={y + 8.4} width="9" height="1.8" rx="0.9" fill="#AFC1E8" />
      <rect x={x + 13} y={y + 11.6} width="6.4" height="1.8" rx="0.9" fill="#AFC1E8" />
    </g>
  );
  switch (tipo) {
    case "goti":
      return cartao(
        "#FFFFFF",
        <>
          <path d={`M${x + 6.8} ${y + 3.6} C${x + 9.8} ${y + 7.6} ${x + 10.8} ${y + 9} ${x + 10.8} ${y + 10.6} C${x + 10.8} ${y + 12.8} ${x + 9} ${y + 14} ${x + 6.8} ${y + 14} C${x + 4.6} ${y + 14} ${x + 2.8} ${y + 12.8} ${x + 2.8} ${y + 10.6} C${x + 2.8} ${y + 9} ${x + 3.8} ${y + 7.6} ${x + 6.8} ${y + 3.6} Z`} fill="#3FA0E5" />
          {linhas}
        </>
      );
    case "estrela":
      return cartao(
        "#FFF6D6",
        <>
          <path d={`M${x + 6.8} ${y + 3.4} l1.7 3.5 3.9 .4 -2.9 2.6 .8 3.8 -3.5 -2 -3.5 2 .8 -3.8 -2.9 -2.6 3.9 -.4 Z`} fill="#F2A33C" />
          {linhas}
        </>
      );
    case "coracao":
      return cartao(
        "#FFE8EF",
        <>
          <path d={`M${x + 2.8} ${y + 7.4} C${x + 2.8} ${y + 4.4} ${x + 6.8} ${y + 4.4} ${x + 6.8} ${y + 7.4} C${x + 6.8} ${y + 4.4} ${x + 10.8} ${y + 4.4} ${x + 10.8} ${y + 7.4} C${x + 10.8} ${y + 10.4} ${x + 6.8} ${y + 12.4} ${x + 6.8} ${y + 13.4} C${x + 6.8} ${y + 12.4} ${x + 2.8} ${y + 10.4} ${x + 2.8} ${y + 7.4} Z`} fill="#E5577F" />
          {linhas}
        </>
      );
    case "arcoiris":
      return cartao(
        "#FFFFFF",
        <>
          <g fill="none" strokeWidth="1.7" strokeLinecap="round">
            <path d={`M${x + 1.8} ${y + 13} a5 5 0 0 1 10 0`} stroke="#F08A7E" />
            <path d={`M${x + 3.8} ${y + 13} a3 3 0 0 1 6 0`} stroke="#F6C77E" />
            <path d={`M${x + 5.6} ${y + 13} a1.2 1.2 0 0 1 2.4 0`} stroke="#7CCBC0" />
          </g>
          {linhas}
        </>
      );
    default:
      return cartao(
        "#FFFFFF",
        <>
          {foto}
          {linhas}
        </>
      );
  }
}
Cracha.propTypes = { tipo: PropTypes.string, cordao: PropTypes.bool };

