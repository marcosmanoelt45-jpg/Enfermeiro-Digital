import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { PACIENTES } from "@/data/simuladorCasosData";

/**
 * PacienteVideoStage
 *
 * Gerencia o palco de visualização do paciente animado (Marcus ou Teresinha).
 * Mantém os 3 clipes (fala, acerto, erro) empilhados e pré-carregados no DOM.
 * Utiliza <source webm> (transparência VP9) e <source mp4> (fundo #16222E) de reserva.
 */
export default function PacienteVideoStage({
  pacienteId = "marcus",
  clipeAtivo = "fala", // 'fala' | 'acerto' | 'erro'
  isSpeaking = false,
  small = false,
  className = "",
  onClipeEnded
}) {
  const paciente = PACIENTES[pacienteId] || PACIENTES.marcus;

  const videoFalaRef = useRef(null);
  const videoAcertoRef = useRef(null);
  const videoErroRef = useRef(null);

  // Controle de reprodução e pausa sem loop e sem saltos bruscos de zoom
  useEffect(() => {
    const videoFala = videoFalaRef.current;
    const videoAcerto = videoAcertoRef.current;
    const videoErro = videoErroRef.current;

    if (!videoFala || !videoAcerto || !videoErro) return;

    if (clipeAtivo === "fala") {
      videoAcerto.pause();
      videoErro.pause();

      if (isSpeaking) {
        videoFala.loop = false;
        videoFala.play().catch(() => {});
      } else {
        videoFala.pause();
      }
    } else if (clipeAtivo === "acerto") {
      videoFala.pause();
      videoErro.pause();
      videoAcerto.loop = false;
      try {
        videoAcerto.currentTime = 0;
      } catch {
        // ignore
      }
      videoAcerto.play().catch(() => {});
    } else if (clipeAtivo === "erro") {
      videoFala.pause();
      videoAcerto.pause();
      videoErro.loop = false;
      try {
        videoErro.currentTime = 0;
      } catch {
        // ignore
      }
      videoErro.play().catch(() => {});
    }
  }, [clipeAtivo, isSpeaking, pacienteId]);

  const hasCustomHeight = className.includes("h-");
  const hasCustomWidth = className.includes("w-") || className.includes("max-w-");

  const defaultHeightClass = small
    ? "h-[160px] md:h-[260px] lg:h-[300px]"
    : "h-[185px] xs:h-[200px] sm:h-[220px] md:h-[300px] lg:h-[340px]";
  const defaultWidthClass = small
    ? "w-full max-w-[320px] md:max-w-none"
    : "w-full";

  const heightClass = hasCustomHeight ? "" : defaultHeightClass;
  const widthClass = hasCustomWidth ? "" : defaultWidthClass;

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] bg-[#16222E] border-2 border-[#27394B] border-b-[5px] border-b-[#0A1118] select-none transition-all duration-300 ${widthClass} ${heightClass} ${className}`}
    >
      {/* Camada Protetora Transparente: Bloqueia injeção de botões PiP e skip do navegador */}
      <div
        className="absolute inset-0 z-30 pointer-events-auto bg-transparent select-none"
        aria-hidden="true"
      />

      {/* 1. Clipes Fala */}
      <video
        key={`fala-${pacienteId}`}
        ref={videoFalaRef}
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate nofullscreen"
        preload="auto"
        onEnded={() => {
          if (videoFalaRef.current) {
            videoFalaRef.current.pause();
          }
        }}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-150 ${
          clipeAtivo === "fala" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
        }`}
      >
        <source src={paciente.videos.fala.webm} type="video/webm" />
        <source src={paciente.videos.fala.mp4} type="video/mp4" />
      </video>

      {/* 2. Clipes Acerto */}
      <video
        key={`acerto-${pacienteId}`}
        ref={videoAcertoRef}
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate nofullscreen"
        preload="auto"
        onEnded={() => {
          if (onClipeEnded) onClipeEnded("acerto");
        }}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-150 ${
          clipeAtivo === "acerto" ? "opacity-100 z-20" : "opacity-0 z-0 pointer-events-none"
        }`}
      >
        <source src={paciente.videos.acerto.webm} type="video/webm" />
        <source src={paciente.videos.acerto.mp4} type="video/mp4" />
      </video>

      {/* 3. Clipes Erro */}
      <video
        key={`erro-${pacienteId}`}
        ref={videoErroRef}
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate nofullscreen"
        preload="auto"
        onEnded={() => {
          if (onClipeEnded) onClipeEnded("erro");
        }}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-150 ${
          clipeAtivo === "erro" ? "opacity-100 z-20" : "opacity-0 z-0 pointer-events-none"
        }`}
      >
        <source src={paciente.videos.erro.webm} type="video/webm" />
        <source src={paciente.videos.erro.mp4} type="video/mp4" />
      </video>
    </div>
  );
}

PacienteVideoStage.propTypes = {
  pacienteId: PropTypes.string,
  clipeAtivo: PropTypes.string,
  isSpeaking: PropTypes.bool,
  small: PropTypes.bool,
  className: PropTypes.string,
  onClipeEnded: PropTypes.func
};
