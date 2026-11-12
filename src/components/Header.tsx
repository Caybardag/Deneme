import React from 'react';
import { Compass, Mic, MessageSquare, Scale, Flame, ShieldAlert, BookOpen, Bookmark } from 'lucide-react';

export type AppTab = 'live_verbal' | 'message_craft' | 'dilemma_solve' | 'quick_rescue' | 'strategy';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenArchive: () => void;
  onOpenTemplates: () => void;
  savedCount: number;
  hasActiveResolution: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenArchive,
  onOpenTemplates,
  savedCount,
  hasActiveResolution,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div 
          onClick={() => onSelectTab('live_verbal')}
          className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
            <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-emerald-400 group-hover:rotate-45 transition-transform duration-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-white font-sans">
                RESOLV
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium hidden md:block">
              Evrensel Karar & Çözüm Mimarisi
            </p>
          </div>
        </div>

        {/* Center Tool Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/70 border border-zinc-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onSelectTab('live_verbal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'live_verbal'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Mic className="w-3.5 h-3.5" />
            <span>Canlı Sözlü Kalkan</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('message_craft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'message_craft'
                ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Zor Mesaj</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('dilemma_solve')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'dilemma_solve'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Karar Terazisi</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('quick_rescue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'quick_rescue'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Acil Odak</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('strategy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'strategy'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
            <span>Kriz Mimarisi</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenTemplates}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white transition flex items-center gap-1.5"
            title="Hazır Çözüm Senaryoları"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Senaryolar</span>
          </button>

          <button
            type="button"
            onClick={onOpenArchive}
            className="relative text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white transition flex items-center gap-1.5"
            title="Kayıtlı Planlar"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Arşiv</span>
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-500 text-black">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Tool Scroller */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-zinc-800/60 bg-zinc-950/60 no-scrollbar">
        <button
          type="button"
          onClick={() => onSelectTab('live_verbal')}
          className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'live_verbal'
              ? 'bg-emerald-500 text-black font-bold'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Mic className="w-3 h-3 text-emerald-400" />
          <span>Sözlü Kalkan</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('message_craft')}
          className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'message_craft'
              ? 'bg-zinc-800 text-emerald-300 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          <span>Zor Mesaj</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('dilemma_solve')}
          className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'dilemma_solve'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Scale className="w-3 h-3" />
          <span>Karar Terazisi</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('quick_rescue')}
          className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'quick_rescue'
              ? 'bg-rose-500 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Flame className="w-3 h-3" />
          <span>Acil Odak</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('strategy')}
          className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'strategy'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <ShieldAlert className="w-3 h-3 text-teal-400" />
          <span>Kriz Mimarisi</span>
        </button>
      </div>
    </header>
  );
};
