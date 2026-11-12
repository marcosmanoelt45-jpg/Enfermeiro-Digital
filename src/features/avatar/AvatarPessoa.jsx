import React, { useId } from "react";
import PropTypes from "prop-types";
import { CORES_ACESSORIO, CORES_CABELO, CORES_FUNDO, CORES_ROUPA, PELES, normalizarAvatar } from "./pecas.js";

// Desenho do avatar em vetor (viewBox 200x200), em camadas: fundo, cabelo de trás, corpo e pijama, pescoço,
// cabeça, rosto, cabelo da frente, barba, óculos, acessório de cabeça, crachá. Estilo chapado e redondo das
// artes do Flow; sem contorno, sem degradê, sem brilho (critérios de arte do app).

const escurecer = (hex, f = 0.82) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (x) => Math.max(0, Math.min(255, Math.round(x * f)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => c(x).toString(16).padStart(2, "0")).join("")}`;
};
const BOCHECHA = "#F29A9A";
const TINTA = "#2B2433";

/** Avatar de uma pessoa. `avatar` é o objeto salvo (normalizado aqui); `redondo` corta em círculo. */
export default function AvatarPessoa({ avatar, tamanho = 96, redondo = false, semFundo = false, className = "", titulo }) {
  const a = normalizarAvatar(avatar);
  const uid = useId().replace(/:/g, "");
  const pele = PELES[a.pele];
  const peleSombra = escurecer(pele, 0.9);
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
        <clipPath id={clip}>{redondo ? <circle cx="100" cy="100" r="100" /> : <rect width="200" height="200" rx="0" />}</clipPath>
        <Estampa id={pad} tipo={a.estampa} cor={roupa} />
      </defs>
      <g clipPath={`url(#${clip})`}>
        {!semFundo && <rect width="200" height="200" fill={fundo} />}
        <CabeloTras tipo={a.cabelo} cor={cab} />
        <Corpo roupa={roupa} padrao={a.estampa === "lisa" ? null : `url(#${pad})`} pele={pele} jaleco={a.jaleco} />
        <Pescoco extra={a.estetoscopio} />
        <Cabeca pele={pele} sombra={peleSombra} />
        <Olhos tipo={a.olhos} />
        <Sobrancelhas cor={escurecer(cab, 0.8)} tipo={a.olhos} />
        <Boca tipo={a.boca} />
        <CabeloFrente tipo={a.cabelo} cor={cab} />
        <Barba tipo={a.barba} cor={cab} />
        <Oculos tipo={a.oculos} />
        <AcessorioCabeca tipo={a.cabeca} cor={acess} cabelo={a.cabelo} />
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
function Corpo({ roupa, padrao, pele, jaleco }) {
  const tronco = "M14 200 C16 168 44 150 78 145 L122 145 C156 150 184 168 186 200 Z";
  return (
    <g>
      <path d={tronco} fill={roupa} />
      {padrao && <path d={tronco} fill={padrao} />}
      {/* decote em V: pele por dentro, gola de outro tom */}
      <path d="M80 145 L100 175 L120 145 Z" fill={pele} />
      <path d="M77 145 L100 179 L123 145" fill="none" stroke={escurecer(roupa, 0.78)} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
      {jaleco === "jaleco" && (
        <g>
          <path d="M14 200 C16 168 44 150 74 145 L96 200 Z" fill="#F4F6F8" />
          <path d="M186 200 C184 168 156 150 126 145 L104 200 Z" fill="#F4F6F8" />
          <path d="M74 145 L88 172 L82 176 L96 200" fill="none" stroke="#DCE3EA" strokeWidth="3" strokeLinejoin="round" />
          <path d="M126 145 L112 172 L118 176 L104 200" fill="none" stroke="#DCE3EA" strokeWidth="3" strokeLinejoin="round" />
          <rect x="138" y="182" width="22" height="3" rx="1.5" fill="#DCE3EA" />
        </g>
      )}
      {jaleco === "colete" && (
        <g>
          <path d="M40 200 C42 176 58 160 76 152 L94 200 Z" fill={escurecer(roupa, 0.7)} />
          <path d="M160 200 C158 176 142 160 124 152 L106 200 Z" fill={escurecer(roupa, 0.7)} />
        </g>
      )}
    </g>
  );
}
Corpo.propTypes = { roupa: PropTypes.string, padrao: PropTypes.string, pele: PropTypes.string, jaleco: PropTypes.string };

function Estampa({ id, tipo, cor }) {
  if (tipo === "lisa") return null;
  const t = escurecer(cor, 0.72);
  const claro = "#FFFFFF";
  const desenho = {
    coracoes: (
      <>
        <path d="M6 9 C6 6 10 6 10 9 C10 6 14 6 14 9 C14 12 10 14 10 15 C10 14 6 12 6 9 Z" fill={claro} opacity="0.85" />
        <path d="M22 25 C22 23 25 23 25 25 C25 23 28 23 28 25 C28 27 25 29 25 29.5 C25 29 22 27 22 25 Z" fill={t} />
      </>
    ),
    cruzes: (
      <>
        <path d="M8 5 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4 Z" fill={claro} opacity="0.85" />
        <path d="M25 22 h2.5 v2.5 h2.5 v2.5 h-2.5 v2.5 h-2.5 v-2.5 h-2.5 v-2.5 h2.5 Z" fill={t} />
      </>
    ),
    estrelas: (
      <>
        <path d="M10 4 L11.8 8.6 L16.6 8.8 L12.8 11.8 L14.2 16.4 L10 13.6 L5.8 16.4 L7.2 11.8 L3.4 8.8 L8.2 8.6 Z" fill="#FFF3B0" />
        <circle cx="27" cy="26" r="1.8" fill={claro} opacity="0.9" />
      </>
    ),
    gotinhas: (
      <>
        <path d="M10 4 C13 9 15 11 15 13.5 C15 16.3 12.8 18 10 18 C7.2 18 5 16.3 5 13.5 C5 11 7 9 10 4 Z" fill="#4FA6E8" />
        <path d="M26 21 C27.6 23.6 28.6 24.8 28.6 26.2 C28.6 27.8 27.4 28.8 26 28.8 C24.6 28.8 23.4 27.8 23.4 26.2 C23.4 24.8 24.4 23.6 26 21 Z" fill={claro} opacity="0.85" />
      </>
    ),
    patinhas: (
      <>
        <ellipse cx="10" cy="12" rx="3.4" ry="2.8" fill={claro} opacity="0.85" />
        <circle cx="6.2" cy="8" r="1.4" fill={claro} opacity="0.85" />
        <circle cx="9" cy="6.4" r="1.4" fill={claro} opacity="0.85" />
        <circle cx="12" cy="6.6" r="1.4" fill={claro} opacity="0.85" />
        <circle cx="14.4" cy="8.6" r="1.4" fill={claro} opacity="0.85" />
        <ellipse cx="26" cy="27" rx="2.4" ry="2" fill={t} />
        <circle cx="23.6" cy="24.2" r="1" fill={t} />
        <circle cx="26" cy="23.2" r="1" fill={t} />
        <circle cx="28.4" cy="24.2" r="1" fill={t} />
      </>
    ),
    curativos: (
      <>
        <g transform="rotate(-30 10 10)">
          <rect x="2" y="7" width="16" height="6" rx="3" fill="#F6D7B5" />
          <rect x="7.5" y="7" width="5" height="6" fill="#EBC197" />
        </g>
        <circle cx="26" cy="26" r="1.6" fill={claro} opacity="0.85" />
      </>
    ),
    confete: (
      <>
        <circle cx="6" cy="7" r="1.6" fill="#FFF3B0" />
        <rect x="14" y="4" width="4" height="1.8" rx="0.9" fill={claro} transform="rotate(30 16 5)" />
        <circle cx="24" cy="15" r="1.4" fill={t} />
        <rect x="6" y="24" width="4" height="1.8" rx="0.9" fill="#F7B7CF" transform="rotate(-25 8 25)" />
        <circle cx="27" cy="28" r="1.5" fill={claro} opacity="0.85" />
      </>
    ),
    ecg: <path d="M0 16 H8 L10.5 11 L13.5 22 L16.5 8 L19 16 H32" fill="none" stroke={claro} strokeOpacity="0.85" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />,
  }[tipo];
  if (!desenho) return null;
  return (
    <pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse">
      {desenho}
    </pattern>
  );
}
Estampa.propTypes = { id: PropTypes.string, tipo: PropTypes.string, cor: PropTypes.string };

function Pescoco({ extra }) {
  if (extra === "estetoscopio")
    return (
      <g fill="none" strokeLinecap="round">
        <path d="M74 148 C70 168 84 182 96 184" stroke="#5B6575" strokeWidth="4" />
        <path d="M126 148 C130 166 128 176 122 182" stroke="#5B6575" strokeWidth="4" />
        <circle cx="120" cy="186" r="7" fill="#8C96A6" />
        <circle cx="120" cy="186" r="3.6" fill="#C9D1DB" />
      </g>
    );
  return null;
}
Pescoco.propTypes = { extra: PropTypes.string };

// ---------------------------------------------------------------- cabeça e rosto
function Cabeca({ pele, sombra }) {
  return (
    <g>
      <rect x="86" y="118" width="28" height="34" rx="10" fill={sombra} />
      <circle cx="53" cy="96" r="10" fill={pele} />
      <circle cx="147" cy="96" r="10" fill={pele} />
      <ellipse cx="100" cy="90" rx="47" ry="50" fill={pele} />
      <ellipse cx="72" cy="108" rx="9" ry="6" fill={BOCHECHA} opacity="0.55" />
      <ellipse cx="128" cy="108" rx="9" ry="6" fill={BOCHECHA} opacity="0.55" />
    </g>
  );
}
Cabeca.propTypes = { pele: PropTypes.string, sombra: PropTypes.string };

function Olhos({ tipo }) {
  const olhoAberto = (x, grande = false) => (
    <g key={x}>
      <ellipse cx={x} cy="95" rx={grande ? 7 : 5.5} ry={grande ? 8 : 6.5} fill={TINTA} />
      <circle cx={x + (grande ? 2.4 : 1.8)} cy={grande ? 91.8 : 92.6} r={grande ? 2.6 : 1.9} fill="#fff" />
      {grande && <circle cx={x - 2.4} cy="98" r="1.2" fill="#fff" />}
    </g>
  );
  const fechadoFeliz = (x) => <path key={x} d={`M${x - 7} 97 Q${x} 88 ${x + 7} 97`} fill="none" stroke={TINTA} strokeWidth="3.6" strokeLinecap="round" />;
  switch (tipo) {
    case "cilios":
      return (
        <g>
          {[78, 122].map((x) => olhoAberto(x))}
          <path d="M71 90 L68 87 M73 88.6 L71 85" stroke={TINTA} strokeWidth="2" strokeLinecap="round" />
          <path d="M129 90 L132 87 M127 88.6 L129 85" stroke={TINTA} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "grandes":
      return <g>{[78, 122].map((x) => olhoAberto(x, true))}</g>;
    case "feliz":
      return <g>{[78, 122].map(fechadoFeliz)}</g>;
    case "piscando":
      return (
        <g>
          {olhoAberto(78)}
          {fechadoFeliz(122)}
        </g>
      );
    case "sono":
      return (
        <g>
          {[78, 122].map((x) => (
            <g key={x}>
              <path d={`M${x - 7} 94 Q${x} 99 ${x + 7} 94`} fill="none" stroke={TINTA} strokeWidth="3.4" strokeLinecap="round" />
              <path d={`M${x - 6} 102 Q${x} 104 ${x + 6} 102`} fill="none" stroke="#9AA3B5" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
            </g>
          ))}
        </g>
      );
    default:
      return <g>{[78, 122].map((x) => olhoAberto(x))}</g>;
  }
}
Olhos.propTypes = { tipo: PropTypes.string };

function Sobrancelhas({ cor, tipo }) {
  const y = tipo === "grandes" ? 80 : 82;
  return (
    <g fill="none" stroke={cor} strokeWidth="3.4" strokeLinecap="round">
      <path d={`M70 ${y + 1} Q78 ${y - 3} 86 ${y}`} />
      <path d={`M114 ${y} Q122 ${y - 3} 130 ${y + 1}`} />
    </g>
  );
}
Sobrancelhas.propTypes = { cor: PropTypes.string, tipo: PropTypes.string };

function Boca({ tipo }) {
  switch (tipo) {
    case "aberta":
      return (
        <g>
          <path d="M89 112 Q100 112 111 112 Q109 126 100 126 Q91 126 89 112 Z" fill="#7A2E3A" />
          <path d="M93 121 Q100 117 107 121 Q104 125.5 100 125.5 Q96 125.5 93 121 Z" fill="#F08A9A" />
        </g>
      );
    case "dentes":
      return (
        <g>
          <path d="M86 111 Q100 111 114 111 Q111 127 100 127 Q89 127 86 111 Z" fill="#7A2E3A" />
          <path d="M88 112 Q100 112 112 112 L111 116 Q100 117 89 116 Z" fill="#fff" />
        </g>
      );
    case "lingua":
      return (
        <g>
          <path d="M88 113 Q100 122 112 113" fill="none" stroke={TINTA} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M97 117.5 Q100 126 104 117.5 Z" fill="#F08A9A" />
        </g>
      );
    case "neutra":
      return <path d="M92 116 L108 116" stroke={TINTA} strokeWidth="3.2" strokeLinecap="round" />;
    case "o":
      return <ellipse cx="100" cy="117" rx="5" ry="6" fill="#7A2E3A" />;
    default:
      return <path d="M88 112 Q100 123 112 112" fill="none" stroke={TINTA} strokeWidth="3.4" strokeLinecap="round" />;
  }
}
Boca.propTypes = { tipo: PropTypes.string };

// ---------------------------------------------------------------- cabelo
function CabeloTras({ tipo, cor }) {
  switch (tipo) {
    case "longo":
      return <path d="M50 92 C44 36 156 36 150 92 L158 166 C142 176 58 176 42 166 Z" fill={cor} />;
    case "chanel":
      return <path d="M50 92 C44 36 156 36 150 92 L154 132 C138 140 62 140 46 132 Z" fill={cor} />;
    case "cacheado":
      return (
        <g fill={cor}>
          {[
            [56, 58, 22], [80, 42, 22], [108, 38, 22], [134, 50, 22], [148, 76, 20], [150, 104, 18], [146, 128, 16],
            [52, 82, 20], [48, 108, 18], [54, 130, 16], [100, 46, 20],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case "rabo":
      return <path d="M146 76 C176 84 178 132 160 160 C170 132 160 104 142 96 Z" fill={cor} />;
    case "coque":
      return <circle cx="100" cy="30" r="20" fill={cor} />;
    default:
      return null;
  }
}
CabeloTras.propTypes = { tipo: PropTypes.string, cor: PropTypes.string };

function CabeloFrente({ tipo, cor }) {
  switch (tipo) {
    case "longo":
    case "chanel":
      return <path d="M50 96 C42 20 158 20 150 96 C146 74 132 62 112 58 C102 70 80 78 56 82 C53 87 51 92 50 96 Z" fill={cor} />;
    case "rabo":
    case "coque":
      return <path d="M51 90 C46 20 154 20 149 90 C140 66 122 56 100 56 C78 56 60 66 51 90 Z" fill={cor} />;
    case "cacheado":
      return (
        <g fill={cor}>
          {[[66, 62, 15], [86, 54, 15], [108, 52, 15], [128, 58, 15], [142, 72, 12], [58, 76, 12]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case "curto":
      return <path d="M50 92 C42 14 158 14 150 92 C144 72 134 62 120 60 C104 66 84 64 70 60 C60 66 54 78 50 92 Z" fill={cor} />;
    case "topete":
      return <path d="M50 92 C44 40 66 18 100 20 C124 12 152 24 153 52 C154 68 152 80 150 92 C144 72 134 64 118 62 C100 64 80 60 66 64 C58 70 52 80 50 92 Z" fill={cor} />;
    case "raspado":
      return <path d="M52 86 C48 24 152 24 148 86 C140 66 122 58 100 58 C78 58 60 66 52 86 Z" fill={cor} opacity="0.55" />;
    default:
      return null;
  }
}
CabeloFrente.propTypes = { tipo: PropTypes.string, cor: PropTypes.string };

function Barba({ tipo, cor }) {
  switch (tipo) {
    case "bigode":
      return <path d="M86 108 Q93 102 100 106 Q107 102 114 108 Q107 110 100 108.5 Q93 110 86 108 Z" fill={cor} />;
    case "cavanhaque":
      return (
        <g fill={cor}>
          <path d="M88 107 Q94 102 100 105 Q106 102 112 107 Q106 109 100 107.5 Q94 109 88 107 Z" />
          <path d="M93 127 Q100 124 107 127 Q106 136 100 137 Q94 136 93 127 Z" />
        </g>
      );
    case "curta":
      return <path d="M56 100 C58 128 76 142 100 142 C124 142 142 128 144 100 C138 120 126 130 100 130 C74 130 62 120 56 100 Z" fill={cor} opacity="0.45" />;
    case "cheia":
      return (
        <g fill={cor}>
          <path d="M54 96 C54 132 74 148 100 148 C126 148 146 132 146 96 C140 114 128 124 116 124 Q100 118 84 124 C72 124 60 114 54 96 Z" />
          <path d="M86 108 Q93 102 100 106 Q107 102 114 108 Q107 111 100 109 Q93 111 86 108 Z" />
        </g>
      );
    default:
      return null;
  }
}
Barba.propTypes = { tipo: PropTypes.string, cor: PropTypes.string };

function Oculos({ tipo }) {
  const aro = { fill: "none", strokeWidth: 3.6 };
  switch (tipo) {
    case "redondo":
      return (
        <g {...aro} stroke="#3D3346">
          <circle cx="78" cy="95" r="13" fill="#fff" fillOpacity="0.18" />
          <circle cx="122" cy="95" r="13" fill="#fff" fillOpacity="0.18" />
          <path d="M91 94 Q100 89 109 94" />
        </g>
      );
    case "quadrado":
      return (
        <g {...aro} stroke="#3D3346">
          <rect x="63" y="84" width="30" height="22" rx="6" fill="#fff" fillOpacity="0.18" />
          <rect x="107" y="84" width="30" height="22" rx="6" fill="#fff" fillOpacity="0.18" />
          <path d="M93 93 Q100 89 107 93" />
        </g>
      );
    case "gatinho":
      return (
        <g {...aro} stroke="#C2457A">
          <path d="M62 86 Q78 82 93 88 Q94 104 79 106 Q64 104 62 86 Z" fill="#fff" fillOpacity="0.18" />
          <path d="M138 86 Q122 82 107 88 Q106 104 121 106 Q136 104 138 86 Z" fill="#fff" fillOpacity="0.18" />
          <path d="M93 92 Q100 88 107 92" />
        </g>
      );
    case "protecao":
      return (
        <g>
          <path d="M56 84 Q100 74 144 84 Q146 104 128 108 Q100 102 72 108 Q54 104 56 84 Z" fill="#BFE8F5" fillOpacity="0.55" stroke="#7FB7CC" strokeWidth="3" />
        </g>
      );
    default:
      return null;
  }
}
Oculos.propTypes = { tipo: PropTypes.string };

// ---------------------------------------------------------------- acessório de cabeça
function AcessorioCabeca({ tipo, cor, cabelo }) {
  const dentro = "#F6B8C8";
  const tiara = <path d="M54 72 Q100 26 146 72" fill="none" stroke={cor} strokeWidth="7" strokeLinecap="round" />;
  const alto = cabelo === "cacheado" || cabelo === "topete" ? -8 : 0;
  const g = (filhos) => <g transform={`translate(0 ${alto})`}>{filhos}</g>;
  switch (tipo) {
    case "gato":
      return g(
        <>
          {tiara}
          <path d="M60 58 L62 30 L84 46 Z" fill={cor} />
          <path d="M65 52 L66 38 L77 46 Z" fill={dentro} />
          <path d="M140 58 L138 30 L116 46 Z" fill={cor} />
          <path d="M135 52 L134 38 L123 46 Z" fill={dentro} />
        </>
      );
    case "urso":
      return g(
        <>
          {tiara}
          <circle cx="66" cy="44" r="14" fill={cor} />
          <circle cx="66" cy="44" r="7" fill={dentro} />
          <circle cx="134" cy="44" r="14" fill={cor} />
          <circle cx="134" cy="44" r="7" fill={dentro} />
        </>
      );
    case "coelho":
      return g(
        <>
          {tiara}
          <ellipse cx="80" cy="22" rx="10" ry="28" fill={cor} transform="rotate(-12 80 22)" />
          <ellipse cx="80" cy="24" rx="5" ry="20" fill={dentro} transform="rotate(-12 80 24)" />
          <ellipse cx="120" cy="22" rx="10" ry="28" fill={cor} transform="rotate(12 120 22)" />
          <ellipse cx="120" cy="24" rx="5" ry="20" fill={dentro} transform="rotate(12 120 24)" />
        </>
      );
    case "touca":
      return g(
        <>
          <path d="M48 84 C42 30 158 30 152 84 C140 74 122 70 100 70 C78 70 60 74 48 84 Z" fill={cor} />
          <path d="M48 84 C60 74 78 70 100 70 C122 70 140 74 152 84" fill="none" stroke={escurecer(cor, 0.8)} strokeWidth="4" />
          {[70, 92, 114, 132].map((x, i) => (
            <circle key={i} cx={x} cy={i % 2 ? 46 : 56} r="3" fill="#fff" opacity="0.7" />
          ))}
        </>
      );
    case "flores":
      return g(
        <>
          {tiara}
          {[[64, 56], [82, 42], [100, 38], [118, 42], [136, 56]].map(([x, y], i) => (
            <g key={i}>
              {[0, 72, 144, 216, 288].map((ang) => (
                <circle key={ang} cx={x + 5 * Math.cos((ang * Math.PI) / 180)} cy={y + 5 * Math.sin((ang * Math.PI) / 180)} r="4.2" fill={i % 2 ? "#F7B7CF" : "#FFF3B0"} />
              ))}
              <circle cx={x} cy={y} r="3" fill="#F2A33C" />
            </g>
          ))}
        </>
      );
    case "laco":
      return g(
        <g transform="translate(128 50) rotate(18)">
          <path d="M0 0 L-20 -12 Q-24 0 -20 12 Z" fill={cor} />
          <path d="M0 0 L20 -12 Q24 0 20 12 Z" fill={cor} />
          <circle cx="0" cy="0" r="6" fill={escurecer(cor, 0.85)} />
        </g>
      );
    case "quepe":
      return g(
        <>
          <path d="M66 54 L72 30 Q100 22 128 30 L134 54 Q100 46 66 54 Z" fill="#FFFFFF" />
          <path d="M66 54 Q100 46 134 54" fill="none" stroke="#DCE3EA" strokeWidth="3" />
          <path d="M97 32 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 v-6 h6 Z" fill="#20BFA3" />
        </>
      );
    case "antenas":
      return g(
        <>
          {tiara}
          <path d="M74 50 Q66 30 60 20" fill="none" stroke={escurecer(cor, 0.8)} strokeWidth="3" strokeLinecap="round" />
          <path d="M126 50 Q134 30 140 20" fill="none" stroke={escurecer(cor, 0.8)} strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="18" r="7" fill={cor} />
          <circle cx="140" cy="18" r="7" fill={cor} />
        </>
      );
    default:
      return null;
  }
}
AcessorioCabeca.propTypes = { tipo: PropTypes.string, cor: PropTypes.string, cabelo: PropTypes.string };

// ---------------------------------------------------------------- crachá
function Cracha({ tipo, cordao }) {
  if (tipo === "nenhum") return null;
  const x = cordao ? 88 : 128;
  const y = cordao ? 172 : 168;
  const cartao = (cor, topo, simbolo) => (
    <g>
      {cordao ? (
        <path d="M78 146 L94 172 M122 146 L106 172" stroke="#20BFA3" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <rect x={x + 9} y={y - 6} width="6" height="8" rx="2" fill="#7D8794" />
      )}
      <rect x={x} y={y} width="24" height="20" rx="3.5" fill={cor} />
      <rect x={x} y={y} width="24" height="6" rx="3" fill={topo} />
      {simbolo}
    </g>
  );
  const foto = <rect x={x + 3} y={y + 8} width="7" height="8" rx="1.5" fill="#C9D3DD" />;
  const linhas = (
    <g fill="#C9D3DD">
      <rect x={x + 12} y={y + 9} width="9" height="2" rx="1" />
      <rect x={x + 12} y={y + 13} width="6" height="2" rx="1" />
    </g>
  );
  switch (tipo) {
    case "goti":
      return cartao(
        "#FFFFFF",
        "#20BFA3",
        <path d={`M${x + 12} ${y + 8} C${x + 15} ${y + 12} ${x + 16} ${y + 13.5} ${x + 16} ${y + 15} C${x + 16} ${y + 17} ${x + 14.2} ${y + 18} ${x + 12} ${y + 18} C${x + 9.8} ${y + 18} ${x + 8} ${y + 17} ${x + 8} ${y + 15} C${x + 8} ${y + 13.5} ${x + 9} ${y + 12} ${x + 12} ${y + 8} Z`} fill="#3FA0E5" />
      );
    case "estrela":
      return cartao("#FFF6D6", "#F2C14E", <path d={`M${x + 12} ${y + 8} l1.7 3.6 3.9 .4 -2.9 2.6 .8 3.9 -3.5 -2 -3.5 2 .8 -3.9 -2.9 -2.6 3.9 -.4 Z`} fill="#F2A33C" />);
    case "coracao":
      return cartao("#FFE8EF", "#F28AAE", <path d={`M${x + 8} ${y + 12} C${x + 8} ${y + 9} ${x + 12} ${y + 9} ${x + 12} ${y + 12} C${x + 12} ${y + 9} ${x + 16} ${y + 9} ${x + 16} ${y + 12} C${x + 16} ${y + 15} ${x + 12} ${y + 17} ${x + 12} ${y + 18} C${x + 12} ${y + 17} ${x + 8} ${y + 15} ${x + 8} ${y + 12} Z`} fill="#E5577F" />);
    case "arcoiris":
      return cartao(
        "#FFFFFF",
        "#B8A4E3",
        <g fill="none" strokeWidth="1.8" strokeLinecap="round">
          <path d={`M${x + 6} ${y + 17} a6 6 0 0 1 12 0`} stroke="#F08A7E" />
          <path d={`M${x + 8.2} ${y + 17} a3.8 3.8 0 0 1 7.6 0`} stroke="#F6C77E" />
          <path d={`M${x + 10.2} ${y + 17} a1.8 1.8 0 0 1 3.6 0`} stroke="#7CCBC0" />
        </g>
      );
    default:
      return cartao(
        "#FFFFFF",
        "#3FA0E5",
        <>
          {foto}
          {linhas}
        </>
      );
  }
}
Cracha.propTypes = { tipo: PropTypes.string, cordao: PropTypes.bool };
