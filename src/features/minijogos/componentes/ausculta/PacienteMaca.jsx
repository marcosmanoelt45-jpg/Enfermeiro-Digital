import React from "react";
import PropTypes from "prop-types";

// Paciente sentado na beira da maca, com a camisola baixada até a cintura para a ausculta, de frente ou de
// costas. Mesmo estilo dos personagens dos vídeos (cabeça grande e redonda, formas lisas, cores chapadas com uma
// luz e uma sombra). viewBox 0 0 400 500. Os campos pulmonares do jogo ficam sob o tórax (y ~ 205 a 330).

const CORES = {
  marcus: { pele: "#F2C6A4", sombra: "#E2A985", luz: "#F8D9C0", cabelo: "#EEF1F3", cabeloSombra: "#CDD3D8" },
  teresinha: { pele: "#F5D0B5", sombra: "#E5B192", luz: "#FADFCB", cabelo: "#F3D27A", cabeloSombra: "#DDB458" },
};
const CAMISOLA = { base: "#A9D8EA", sombra: "#86C3DB", luz: "#C7E7F3" };

function Ambiente() {
  return (
    <g aria-hidden="true">
      <rect x="0" y="0" width="400" height="500" fill="#E3ECF1" />
      <rect x="0" y="360" width="400" height="140" fill="#D3DFE6" />
      <rect x="0" y="356" width="400" height="6" fill="#C5D3DB" />
    </g>
  );
}

function Maca() {
  return (
    <g aria-hidden="true">
      <rect x="22" y="404" width="356" height="30" rx="15" fill="#F4F8FA" />
      <rect x="22" y="426" width="356" height="12" rx="6" fill="#C4D0D8" />
      <rect x="54" y="438" width="14" height="52" rx="5" fill="#9AA7B1" />
      <rect x="332" y="438" width="14" height="52" rx="5" fill="#9AA7B1" />
      <rect x="40" y="482" width="320" height="8" rx="4" fill="#9AA7B1" />
    </g>
  );
}

// Tronco, ombros e braços. As mãos descansam nas coxas.
function Corpo({ c, frente }) {
  const braco = (lado) => {
    const s = lado === "esq" ? 1 : -1; // esq = lado esquerdo da tela
    const ox = lado === "esq" ? 0 : 400;
    const x = (v) => (lado === "esq" ? v : ox - v);
    return (
      <g key={lado}>
        <path d={`M${x(132)} 214 C${x(110)} 236 ${x(104)} 290 ${x(110)} 340 C${x(112)} 362 ${x(122)} 382 ${x(140)} 392`} fill="none" stroke={c.pele} strokeWidth="38" strokeLinecap="round" />
        <path d={`M${x(124)} 226 C${x(108)} 250 ${x(102)} 300 ${x(106)} 338`} fill="none" stroke={c.sombra} strokeWidth="8" strokeLinecap="round" opacity="0.35" />
        {/* vão entre o braço e o tronco */}
        <path d={`M${x(152)} 236 C${x(134)} 262 ${x(128)} 306 ${x(132)} 350 C${x(134)} 366 ${x(140)} 378 ${x(150)} 386`} fill="none" stroke={c.sombra} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        {/* mão */}
        <ellipse cx={x(150)} cy="394" rx="20" ry="14" fill={c.pele} transform={`rotate(${s * 18} ${x(150)} 394)`} />
        <path d={`M${x(140)} 400 Q${x(152)} 408 ${x(164)} 400`} fill="none" stroke={c.sombra} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </g>
    );
  };
  return (
    <g>
      {/* tronco */}
      <path d="M140 206 C168 196 232 196 260 206 C284 214 292 246 290 296 C288 336 284 366 280 392 L120 392 C116 366 112 336 110 296 C108 246 116 214 140 206 Z" fill={c.pele} />
      {/* ombros arredondados */}
      <ellipse cx="136" cy="222" rx="30" ry="24" fill={c.pele} />
      <ellipse cx="264" cy="222" rx="30" ry="24" fill={c.pele} />
      {/* luz e sombra laterais */}
      <path d="M118 250 C114 290 116 340 122 388 L136 388 C130 340 128 290 132 252 Z" fill={c.sombra} opacity="0.45" />
      <path d="M282 250 C286 290 284 340 278 388 L264 388 C270 340 272 290 268 252 Z" fill={c.sombra} opacity="0.45" />
      {frente ? (
        <g fill="none" strokeLinecap="round">
          <path d="M150 214 C166 208 184 210 196 216 M250 214 C234 208 216 210 204 216" stroke={c.sombra} strokeWidth="4" opacity="0.8" />
          <path d="M200 222 L200 300" stroke={c.sombra} strokeWidth="3" opacity="0.35" />
          <path d="M156 296 C174 304 190 304 198 298 M244 296 C226 304 210 304 202 298" stroke={c.sombra} strokeWidth="3" opacity="0.35" />
          <circle cx="168" cy="268" r="3.5" fill={c.sombra} stroke="none" />
          <circle cx="232" cy="268" r="3.5" fill={c.sombra} stroke="none" />
          <ellipse cx="200" cy="350" rx="12" ry="5" fill={c.sombra} opacity="0.35" stroke="none" />
        </g>
      ) : (
        <g fill="none" strokeLinecap="round">
          {/* escápulas e coluna: referências para achar os campos pulmonares */}
          <path d="M150 220 C172 216 184 232 182 256 C180 278 170 292 158 296" stroke={c.sombra} strokeWidth="4" opacity="0.55" />
          <path d="M250 220 C228 216 216 232 218 256 C220 278 230 292 242 296" stroke={c.sombra} strokeWidth="4" opacity="0.55" />
          <path d="M200 214 L200 386" stroke={c.sombra} strokeWidth="3.5" opacity="0.45" />
          {[236, 262, 288, 314, 340].map((y) => (
            <circle key={y} cx="200" cy={y} r="2.5" fill={c.sombra} stroke="none" opacity="0.6" />
          ))}
        </g>
      )}
      {braco("esq")}
      {braco("dir")}
    </g>
  );
}

function Camisola({ frente }) {
  return (
    <g aria-hidden="true">
      {/* camisola baixada: tecido amontoado na cintura e sobre as coxas */}
      <path d="M112 372 C150 360 250 360 288 372 C296 386 300 402 296 414 L104 414 C100 402 104 386 112 372 Z" fill={CAMISOLA.base} />
      <path d="M112 372 C150 360 250 360 288 372" fill="none" stroke={CAMISOLA.luz} strokeWidth="6" strokeLinecap="round" />
      <path d="M140 384 C146 396 150 404 150 412 M200 380 L200 412 M258 384 C252 396 250 404 250 412" fill="none" stroke={CAMISOLA.sombra} strokeWidth="3" strokeLinecap="round" />
      {frente && (
        <>
          {/* coxas e pernas pendentes à frente da maca */}
          <rect x="132" y="404" width="58" height="34" rx="16" fill={CAMISOLA.base} />
          <rect x="210" y="404" width="58" height="34" rx="16" fill={CAMISOLA.base} />
        </>
      )}
    </g>
  );
}

function Pernas({ c }) {
  return (
    <g aria-hidden="true">
      <rect x="146" y="430" width="30" height="50" rx="14" fill={c.pele} />
      <rect x="224" y="430" width="30" height="50" rx="14" fill={c.pele} />
      <ellipse cx="160" cy="484" rx="22" ry="9" fill="#5B6B78" />
      <ellipse cx="240" cy="484" rx="22" ry="9" fill="#5B6B78" />
    </g>
  );
}

function CabecaFrente({ paciente, c }) {
  const ter = paciente === "teresinha";
  return (
    <g>
      <path d="M182 168 L218 168 L222 206 C210 212 190 212 178 206 Z" fill={c.sombra} />
      {ter && <path d="M132 112 C130 52 270 52 268 112 L272 178 C256 186 238 170 236 146 L164 146 C162 170 144 186 128 178 Z" fill={c.cabelo} />}
      <ellipse cx="138" cy="122" rx="12" ry="16" fill={c.pele} />
      <ellipse cx="262" cy="122" rx="12" ry="16" fill={c.pele} />
      <ellipse cx="200" cy="116" rx="62" ry="64" fill={c.pele} />
      <ellipse cx="178" cy="86" rx="26" ry="16" fill={c.luz} opacity="0.7" />
      {ter ? (
        <>
          <path d="M140 108 C142 62 258 62 260 106 C238 88 214 80 186 86 C168 90 152 98 140 108 Z" fill={c.cabelo} />
          <path d="M186 86 C200 76 236 80 252 98" fill="none" stroke={c.cabeloSombra} strokeWidth="5" strokeLinecap="round" />
          <circle cx="176" cy="122" r="16" fill="#FFFFFF" fillOpacity="0.15" stroke="#1F2328" strokeWidth="4.5" />
          <circle cx="224" cy="122" r="16" fill="#FFFFFF" fillOpacity="0.15" stroke="#1F2328" strokeWidth="4.5" />
          <path d="M192 122 L208 122" stroke="#1F2328" strokeWidth="4" />
          <circle cx="160" cy="148" r="3" fill="#3A2A22" />
          <circle cx="138" cy="140" r="4" fill="#FFFFFF" />
          <circle cx="262" cy="140" r="4" fill="#FFFFFF" />
        </>
      ) : (
        <>
          <path d="M140 118 C138 92 148 80 158 76 C154 94 154 108 156 124 Z" fill={c.cabelo} />
          <path d="M260 118 C262 92 252 80 242 76 C246 94 246 108 244 124 Z" fill={c.cabelo} />
          <path d="M162 100 C170 96 182 96 190 100 M210 100 C218 96 230 96 238 100" fill="none" stroke={c.cabeloSombra} strokeWidth="5" strokeLinecap="round" />
          <path d="M176 70 C190 66 210 66 224 70" fill="none" stroke={c.sombra} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        </>
      )}
      <circle cx="176" cy="122" r="6" fill="#2A211C" />
      <circle cx="224" cy="122" r="6" fill="#2A211C" />
      <circle cx="178" cy="120" r="2" fill="#FFFFFF" />
      <circle cx="226" cy="120" r="2" fill="#FFFFFF" />
      <ellipse cx="200" cy="140" rx="8" ry="6" fill={c.sombra} />
      <ellipse cx="160" cy="148" rx="10" ry="6" fill="#F2A6A0" opacity={ter ? 0 : 0.5} />
      <ellipse cx="240" cy="148" rx="10" ry="6" fill="#F2A6A0" opacity="0.5" />
      <path d="M182 158 C192 166 208 166 218 158" fill="none" stroke="#9A5B4B" strokeWidth="4.5" strokeLinecap="round" />
    </g>
  );
}

function CabecaCostas({ paciente, c }) {
  const ter = paciente === "teresinha";
  return (
    <g>
      <path d="M182 168 L218 168 L222 206 C210 212 190 212 178 206 Z" fill={c.sombra} />
      <ellipse cx="138" cy="122" rx="12" ry="16" fill={c.pele} />
      <ellipse cx="262" cy="122" rx="12" ry="16" fill={c.pele} />
      <ellipse cx="200" cy="116" rx="62" ry="64" fill={ter ? c.cabelo : c.pele} />
      {ter ? (
        <>
          {/* chanel visto de trás: cobre a nuca, com a ponta mais escura */}
          <path d="M134 116 C134 48 266 48 266 116 L272 182 C244 194 156 194 128 182 Z" fill={c.cabelo} />
          <path d="M131 168 C164 180 236 180 269 168 L272 182 C244 194 156 194 128 182 Z" fill={c.cabeloSombra} />
          <path d="M168 70 C184 60 220 60 236 72" fill="none" stroke="#F8E09A" strokeWidth="6" strokeLinecap="round" />
          <circle cx="138" cy="140" r="4" fill="#FFFFFF" />
          <circle cx="262" cy="140" r="4" fill="#FFFFFF" />
        </>
      ) : (
        <>
          <ellipse cx="186" cy="86" rx="28" ry="16" fill={c.luz} opacity="0.7" />
          <path d="M140 118 C140 154 166 176 200 176 C234 176 260 154 260 118 C246 142 154 142 140 118 Z" fill={c.cabelo} />
        </>
      )}
    </g>
  );
}

export default function PacienteMaca({ paciente = "marcus", vista = "costas", comAmbiente = true }) {
  const c = CORES[paciente] ?? CORES.marcus;
  const frente = vista === "frente";
  return (
    <g>
      {comAmbiente && <Ambiente />}
      <Maca />
      {frente && <Pernas c={c} />}
      <Corpo c={c} frente={frente} />
      <Camisola frente={frente} />
      {frente ? <CabecaFrente paciente={paciente} c={c} /> : <CabecaCostas paciente={paciente} c={c} />}
    </g>
  );
}

PacienteMaca.propTypes = { paciente: PropTypes.oneOf(["marcus", "teresinha"]), vista: PropTypes.oneOf(["frente", "costas"]), comAmbiente: PropTypes.bool };
