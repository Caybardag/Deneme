import React from 'react';
import { Mic, MessageSquare, Scale, Flame, ShieldAlert, Layers } from 'lucide-react';
import { AppTab } from './Header';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  hasActiveResolution: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasActiveResolution,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/90 backdrop-blur-lg px-1.5 py-1.5 flex items-center justify-around">
      <button
        type="button"
        onClick={() => onSelectTab('live_verbal')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
          activeTab === 'live_verbal' ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Mic className="w-5 h-5" />
        <span>Sözlü Kalkan</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('message_craft')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
          activeTab === 'message_craft' ? 'text-emerald-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        <span>Zor Mesaj</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('dilemma_solve')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
          activeTab === 'dilemma_solve' ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Scale className="w-5 h-5" />
        <span>Terazi</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('quick_rescue')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
          activeTab === 'quick_rescue' ? 'text-rose-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Flame className="w-5 h-5" />
        <span>Acil</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('strategy')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
          activeTab === 'strategy' ? 'text-teal-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        {hasActiveResolution ? <Layers className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
        <span>{hasActiveResolution ? 'Plan' : 'Strateji'}</span>
      </button>
    </nav>
  );
};
