import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Tema escuro Enfere Vivo permanente
  const [theme, setTheme] = useState('dark');

  // Tamanho de Fonte para leitura clínica: 'normal' | 'large' | 'xlarge'
  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem('enfermeiro_font_size') || 'normal';
    } catch {
      return 'normal';
    }
  });

  // Modo Plantão Noturno (Anti-Ofuscamento para enfermarias)
  const [nightShiftMode, setNightShiftMode] = useState(() => {
    try {
      return localStorage.getItem('enfermeiro_night_shift') === 'true';
    } catch {
      return false;
    }
  });

  // Feedback Tátil / Vibração
  const [hapticFeedback, setHapticFeedback] = useState(() => {
    try {
      const saved = localStorage.getItem('enfermeiro_haptic');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Diretriz Assistencial Padrão: 'cofen' | 'nanda' | 'oms'
  const [clinicalStandard, setClinicalStandard] = useState(() => {
    try {
      return localStorage.getItem('enfermeiro_standard') || 'cofen';
    } catch {
      return 'cofen';
    }
  });

  // Contexto de áudio para bip tátil no desktop/mobile
  const audioCtxRef = useRef(null);

  // Atualizar a classe na tag <html> e persistir tema
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('enfermeiro_theme', theme);
    } catch (e) {
      console.warn('Erro ao salvar tema:', e);
    }
  }, [theme]);

  // Atualizar tamanho de fonte na tag <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
    root.classList.add(`font-size-${fontSize}`);
    try {
      localStorage.setItem('enfermeiro_font_size', fontSize);
    } catch (e) {
      console.warn('Erro ao salvar fonte:', e);
    }
  }, [fontSize]);

  // Atualizar Modo Plantão Noturno na tag <html>
  useEffect(() => {
    const root = document.documentElement;
    if (nightShiftMode) {
      root.classList.add('night-shift-mode');
    } else {
      root.classList.remove('night-shift-mode');
    }
    try {
      localStorage.setItem('enfermeiro_night_shift', String(nightShiftMode));
    } catch {}
  }, [nightShiftMode]);

  // Persistir Feedback Tátil
  useEffect(() => {
    try {
      localStorage.setItem('enfermeiro_haptic', String(hapticFeedback));
    } catch {}
  }, [hapticFeedback]);

  // Persistir Norma Assistencial
  useEffect(() => {
    try {
      localStorage.setItem('enfermeiro_standard', clinicalStandard);
    } catch {}
  }, [clinicalStandard]);

  const toggleTheme = () => {
    setTheme('dark');
  };

  // Helper para acionar vibração curta e clique tátil de confirmação
  const triggerHaptic = (pattern = 40) => {
    if (!hapticFeedback) return;

    // Vibração física no smartphone desativada por preferência do usuário

    // Clique sonoro sutil de feedback mecânico (funciona no PC e celular para feedback imediato)
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.045);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.045);
      }
    } catch {}
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        fontSize,
        setFontSize,
        nightShiftMode,
        setNightShiftMode,
        hapticFeedback,
        setHapticFeedback,
        clinicalStandard,
        setClinicalStandard,
        triggerHaptic
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark',
      setTheme: () => {},
      toggleTheme: () => {},
      fontSize: 'normal',
      setFontSize: () => {},
      nightShiftMode: false,
      setNightShiftMode: () => {},
      hapticFeedback: true,
      setHapticFeedback: () => {},
      clinicalStandard: 'cofen',
      setClinicalStandard: () => {},
      triggerHaptic: () => {}
    };
  }
  return context;
}
