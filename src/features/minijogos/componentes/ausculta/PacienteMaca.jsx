import React from "react";
import PropTypes from "prop-types";

// Paciente sentado na maca, sem a camisola no tronco (para a ausculta), visto de frente ou de costas.
// Desenho em SVG no estilo do app (formas arredondadas, cores chapadas). viewBox 0 0 400 500.

const PELE = { marcus: ["#F1C29E", "#DFA580"], teresinha: ["#F4CDB0", "#E2AE8D"] };

function Maca() {
  return (
    <g aria-hidden="true">
      <rect x="10" y="402" width="380" height="34" rx="14" fill="#E6EEF3" />
      <rect x="10" y="402" width="380" height="10" rx="5" fill="#FFFFFF" opacity="0.7" />
      <rect x="10" y="430" width="380" height="14" rx="6" fill="#B9C6D0" />
      <rect x="40" y="444" width="12" height="46" rx="4" fill="#8E9BA6" />
      <rect x="348" y="444" width="12" height="46" rx="4" fill="#8E9BA6" />
    </g>
  );
}

function Tronco({ pele, sombra }) {
  return (
    <g>
      {/* braços */}
      <path d="M100 182 C76 196 70 250 74 330 C76 370 82 396 92 404 L118 404 C112 380 110 330 116 262 Z" fill={pele} />
      <path d="M300 182 C324 196 330 250 326 330 C324 370 318 396 308 404 L282 404 C288 380 290 330 284 262 Z" fill={pele} />
      {/* tronco */}
      <path d="M118 176 C150 160 250 160 282 176 C300 186 304 214 300 262 C296 320 290 372 286 404 L114 404 C110 372 104 320 100 262 C96 214 100 186 118 176 Z" fill={pele} />
      <path d="M118 176 C108 184 104 200 104 220 C122 214 130 196 140 172 Z" fill={sombra} opacity="0.35" />
      <path d="M282 176 C292 184 296 200 296 220 C278 214 270 196 260 172 Z" fill={sombra} opacity="0.35" />
      {/* pescoço */}
      <path d="M178 136 L222 136 L226 172 C214 180 186 180 174 172 Z" fill={sombra} />
    </g>
  );
}

function Camisola({ y = 372 }) {
  // camisola baixada até a cintura
  return (
    <g aria-hidden="true">
      <path d={`M104 ${y} C150 ${y - 12} 250 ${y - 12} 296 ${y} L300 410 L100 410 Z`} fill="#9FD3E6" />
      <path d={`M104 ${y} C150 ${y - 12} 250 ${y - 12} 296 ${y}`} fill="none" stroke="#7CBFD6" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

function CabecaFrente({ paciente, pele, sombra }) {
  const ter = paciente === "teresinha";
  return (
    <g>
      {ter && <path d="M140 92 C138 40 262 40 260 92 L262 150 C246 156 232 140 232 120 L168 120 C168 140 154 156 138 150 Z" fill="#F2CF6B" />}
      <ellipse cx="200" cy="100" rx="50" ry="56" fill={pele} />
      <ellipse cx="150" cy="104" rx="9" ry="13" fill={sombra} />
      <ellipse cx="250" cy="104" rx="9" ry="13" fill={sombra} />
      {ter ? (
        <>
          <path d="M150 84 C156 50 244 50 252 82 C232 70 206 62 176 74 C166 78 158 82 150 84 Z" fill="#F7DA85" />
          <circle cx="182" cy="100" r="13" fill="none" stroke="#1F2328" strokeWidth="4" />
          <circle cx="218" cy="100" r="13" fill="none" stroke="#1F2328" strokeWidth="4" />
          <path d="M195 100 L205 100" stroke="#1F2328" strokeWidth="4" />
          <circle cx="166" cy="122" r="3" fill="#3A2A22" />
          <circle cx="150" cy="122" r="4" fill="#FFFFFF" />
          <circle cx="250" cy="122" r="4" fill="#FFFFFF" />
        </>
      ) : (
        <>
          <path d="M150 96 C150 76 158 66 164 64 C160 78 160 88 160 100 Z" fill="#E9ECEF" />
          <path d="M250 96 C250 76 242 66 236 64 C240 78 240 88 240 100 Z" fill="#E9ECEF" />
          <path d="M170 84 L190 86 M210 86 L230 84" stroke="#C9CED3" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      <circle cx="182" cy="100" r="5" fill="#2A211C" />
      <circle cx="218" cy="100" r="5" fill="#2A211C" />
      <path d="M194 112 C196 120 204 120 206 112" fill={sombra} />
      <path d="M184 132 C194 138 206 138 216 132" fill="none" stroke="#9A5B4B" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

function CabecaCostas({ paciente, pele, sombra }) {
  const ter = paciente === "teresinha";
  return (
    <g>
      <ellipse cx="200" cy="100" rx="50" ry="56" fill={ter ? "#F2CF6B" : pele} />
      {ter ? (
        <path d="M150 100 C150 140 168 152 200 152 C232 152 250 140 250 100 L262 150 C246 158 154 158 138 150 Z" fill="#E8BF55" />
      ) : (
        <path d="M152 104 C152 136 172 150 200 150 C228 150 248 136 248 104 C236 124 164 124 152 104 Z" fill="#E9ECEF" />
      )}
      <ellipse cx="150" cy="104" rx="8" ry="12" fill={sombra} />
      <ellipse cx="250" cy="104" rx="8" ry="12" fill={sombra} />
    </g>
  );
}

export default function PacienteMaca({ paciente = "marcus", vista = "costas" }) {
  const [pele, sombra] = PELE[paciente] ?? PELE.marcus;
  const frente = vista === "frente";
  return (
    <g>
      <Maca />
      <Tronco pele={pele} sombra={sombra} />
      {frente ? (
        <g aria-hidden="true" fill="none" stroke={sombra} strokeLinecap="round">
          {/* clavículas, esterno e uma sugestão das costelas: referência anatômica para achar os focos */}
          <path d="M132 184 C156 178 178 182 194 188 M268 184 C244 178 222 182 206 188" strokeWidth="5" />
          <path d="M200 192 L200 300" strokeWidth="3" opacity="0.7" />
          <path d="M150 238 C170 246 186 246 196 240 M250 238 C230 246 214 246 204 240" strokeWidth="2.5" opacity="0.45" />
          <path d="M140 266 C164 276 184 276 196 270 M260 266 C236 276 216 276 204 270" strokeWidth="2.5" opacity="0.45" />
          <path d="M134 296 C160 308 182 308 196 300 M266 296 C240 308 218 308 204 300" strokeWidth="2.5" opacity="0.45" />
          <circle cx="164" cy="262" r="4" fill={sombra} stroke="none" />
          <circle cx="236" cy="262" r="4" fill={sombra} stroke="none" />
        </g>
      ) : (
        <g aria-hidden="true" fill="none" stroke={sombra} strokeLinecap="round">
          {/* coluna e escápulas */}
          <path d="M200 176 L200 380" strokeWidth="4" strokeDasharray="2 10" />
          <path d="M150 196 C176 196 186 214 184 236 C182 262 170 286 156 292 C142 270 138 230 150 196 Z" strokeWidth="3" opacity="0.6" />
          <path d="M250 196 C224 196 214 214 216 236 C218 262 230 286 244 292 C258 270 262 230 250 196 Z" strokeWidth="3" opacity="0.6" />
        </g>
      )}
      <Camisola />
      {frente ? <CabecaFrente paciente={paciente} pele={pele} sombra={sombra} /> : <CabecaCostas paciente={paciente} pele={pele} sombra={sombra} />}
    </g>
  );
}

PacienteMaca.propTypes = { paciente: PropTypes.oneOf(["marcus", "teresinha"]), vista: PropTypes.oneOf(["frente", "costas"]) };
