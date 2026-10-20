import React, { useRef, useState, useEffect } from 'react';
import { Search, X, Sparkles, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MobileHeader({
  userName = '',
  userType = 'aluno',
  searchQuery = '',
  onSearchChange = () => {},
  selectedCategory = 'all',
  onSelectCategory = () => {},
  categories = [],
  onOpenOptions = () => {},
  onOpenAIChat = () => {}
}) {
  const chipsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Estados para Drag-to-Scroll por mouse (arrastar com o clique no desktop/Responsive Viewer)
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const checkScroll = () => {
    if (chipsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = chipsRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const handleMouseDown = (e) => {
    if (!chipsRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - chipsRef.current.offsetLeft;
    scrollLeftRef.current = chipsRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !chipsRef.current) return;
    e.preventDefault();
    const x = e.pageX - chipsRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    chipsRef.current.scrollLeft = scrollLeftRef.current - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Conversão da roda do mouse em scroll horizontal
  const handleWheel = (e) => {
    if (chipsRef.current && Math.abs(e.deltaY) > 0) {
      chipsRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const scrollByAmount = (amount) => {
    if (chipsRef.current) {
      chipsRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <header className="pt-3 pb-2 px-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md sticky top-0 z-30 border-b border-emerald-50/60 dark:border-slate-800/80 transition-colors">
      {/* Top Greeting & User Avatar & Options Button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 dark:bg-emerald-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-none ring-2 ring-emerald-100 dark:ring-emerald-900/60">
              {(() => {
                const clean = (userName || '').trim();
                const isGeneric = !clean || ['estudante', 'enfermeiro', 'aluno', 'professor'].includes(clean.toLowerCase());
                if (!isGeneric) return clean.charAt(0).toUpperCase();
                return userType === 'professor' ? 'P' : 'A';
              })()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></span>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500 dark:text-emerald-400 inline" /> Enfere
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {(() => {
                const clean = (userName || '').trim();
                const isGeneric = !clean || ['estudante', 'enfermeiro', 'aluno', 'professor'].includes(clean.toLowerCase());
                const roleText = userType === 'professor' ? 'Olá professor' : 'Olá aluno';
                return isGeneric ? `${roleText} 👋` : `${roleText}, ${clean} 👋`;
              })()}
            </h1>
          </div>
        </div>

        {/* Botão de Preceptor IA e Ajustes (Engrenagem) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenAIChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-100 text-xs font-bold transition-all active:scale-95 shadow-xs"
            aria-label="Abrir Chat com Preceptor Goti"
            title="Dúvidas clínicas? Conversar com o Goti"
          >
            <div className="relative flex items-center justify-center">
              <img src="/goti/goti-icone.jpg" alt="Goti" className="w-6 h-6 rounded-full object-cover ring-1 ring-teal-400/50 shadow-xs" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900 animate-pulse" />
            </div>
            <span className="text-[11px] font-black">Goti IA</span>
          </button>

          <button
            onClick={onOpenOptions}
            className="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-300 active:scale-95 transition-all shadow-xs"
            aria-label="Abrir Ajustes e Opções de Tema"
            title="Ajustes de Tema & Opções Clínicas"
          >
            <Settings className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Pill Search Bar (Inspirado no shot 16244904 Orizon) */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar caso clínico, cálculo, SBAR..."
          className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:focus:ring-emerald-500/40 focus:border-emerald-600 dark:focus:border-emerald-500 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Container de Chips Deslizáveis com Drag-to-Scroll e Setas Laterais */}
      <div className="relative group">
        {/* Seta esquerda para rolagem */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount(-180)}
            className="hidden sm:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        <div
          ref={chipsRef}
          onScroll={checkScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onWheel={handleWheel}
          style={{ touchAction: 'pan-x', overscrollBehaviorX: 'contain' }}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 cursor-grab active:cursor-grabbing select-none"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-sm shadow-emerald-200/50 dark:shadow-none ring-2 ring-emerald-700/20 dark:ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
                {cat.count !== undefined && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-800 dark:bg-emerald-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Seta direita para rolagem */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount(180)}
            className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
}
