import React from 'react';
import EnfereClinicalPlayer from './EnfereClinicalPlayer';

/**
 * ProcedurePlayer.jsx
 * Wrapper de compatibilidade que repassa o procedimento para o EnfereClinicalPlayer.
 */
export default function ProcedurePlayer({ procedure }) {
  if (!procedure) return null;

  return (
    <EnfereClinicalPlayer
      videoUrl={procedure.videoUrl}
      title={procedure.title}
      sourceName={procedure.videoSource}
      sourceUrl={procedure.sourceUrl || procedure.officialGuideUrl}
      institutionalBadge={procedure.institutionalBadge}
      cofenNorm={procedure.cofenNorm}
      previewImage={procedure.previewImage}
      duration={procedure.duration}
    />
  );
}
