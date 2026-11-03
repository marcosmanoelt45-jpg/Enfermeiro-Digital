import { useEffect, useState } from "react";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";

// Relógio da prática: só ele re-renderiza a cada segundo, não a página inteira.
export default function ElapsedClock({ getSeconds }) {
  const [seconds, setSeconds] = useState(getSeconds);
  useEffect(() => {
    const timer = setInterval(() => setSeconds(getSeconds()), 1000);
    return () => clearInterval(timer);
  }, [getSeconds]);
  return clinicalHistoryService.formatDuration(seconds);
}
