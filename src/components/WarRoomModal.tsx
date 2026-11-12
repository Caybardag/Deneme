import React, { useState } from 'react';
import { X, Swords, Send, ShieldAlert, Sparkles, Check, Copy, ArrowRight, UserCheck, Flame, Scale } from 'lucide-react';
import { WarRoomTurn } from '../types';

interface WarRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextTitle: string;
}

const ARCHETYPES = [
  { id: 'manipulative_passive', label: 'Manipülatif & Pasif-Agresif Ortak', desc: 'Sürekli suçlu hissettirir, konuyu saptırır, geçmiş fedakarlıkları öne sürer.' },
  { id: 'cold_rationalist', label: 'Katı & Tavizsiz Finansçı/Müşteri', desc: 'Duygulara kapalıdır, yalnızca rakamları, sözleşme maddelerini ve cezaları konuşur.' },
  { id: 'aggressive_dominator', label: 'Baskıcı & Tehditkar Otorite', desc: 'Sesini yükseltir, alternatifleri yok sayar, güç gösterisiyle sindirmeye çalışır.' },
  { id: 'anxious_dependent', label: 'Duygusal & Panikleyen Yakın Çevre', desc: 'Aşırı korku yayar, "bizi mahvedeceksin" diyerek risk almanı engeller.' },
];

export const WarRoomModal: React.FC<WarRoomModalProps> = ({
  isOpen,
  onClose,
  contextTitle,
}) => {
  const [selectedArchetype, setSelectedArchetype] = useState(ARCHETYPES[0].id);
  const [inputStatement, setInputStatement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turns, setTurns] = useState<WarRoomTurn[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputStatement.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const activeArchetype = ARCHETYPES.find((a) => a.id === selectedArchetype)?.label || selectedArchetype;
      const res = await fetch('/api/war-room/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userStatement: inputStatement.trim(),
          stakeholderArchetype: activeArchetype,
          context: contextTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Simülasyon yanıtı alınamadı.');
      }

      const newTurn: WarRoomTurn = {
        id: 'turn_' + Date.now(),
        userStatement: inputStatement.trim(),
        stakeholderResponse: data.stakeholderResponse,
        stakeholderArchetype: activeArchetype,
        resistancePercent: data.resistancePercent,
        psychologicalLeverage: data.psychologicalLeverage,
        tacticalCounterMove: data.tacticalCounterMove,
      };

      setTurns((prev) => [newTurn, ...prev]);
      setInputStatement('');
    } catch (err: any) {
      alert(err.message || 'Simülasyon çalıştırılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Swords className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-rose-400 block">
                Psikolojik Müzakere & Kriz Odası
              </span>
              <h3 className="text-sm font-bold text-white">
                Muhatap Reaksiyon & Karşı Hamle Simülatörü
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Archetype Selector */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40">
          <label className="text-xs font-bold text-slate-300 block mb-2">
            Muhatap Kişilik / Müzakere Arketipini Seç:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                type="button"
                onClick={() => setSelectedArchetype(arch.id)}
                className={`text-left p-2.5 rounded-xl border text-xs transition ${
                  selectedArchetype === arch.id
                    ? 'border-rose-500/50 bg-rose-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold block text-slate-200 mb-0.5">{arch.label}</span>
                <span className="text-[11px] text-slate-400 line-clamp-1">{arch.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Turns Conversation Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {turns.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Swords className="w-8 h-8 mx-auto text-slate-700" />
              <p className="text-sm font-semibold text-slate-300">Henüz bir simülasyon hamlesi yapılmadı.</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Karşı tarafa söylemek istediğin cümleyi, teklifini veya tavrını aşağıya yaz. Karşı tarafın direnç seviyesi ölçülecek ve savunmasını çökertecek "Mat Hamlesi" hazırlanacaktır.
              </p>
            </div>
          ) : (
            turns.map((turn) => (
              <div key={turn.id} className="space-y-3 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                {/* User Move */}
                <div className="flex items-start gap-2.5">
                  <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                    Senin Hamlen
                  </span>
                  <p className="text-sm text-slate-200 italic font-medium">
                    "{turn.userStatement}"
                  </p>
                </div>

                {/* Simulated Reaction */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 text-xs">
                    <span className="font-bold text-rose-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{turn.stakeholderArchetype} Tepkisi:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Direnç: %{turn.resistancePercent}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        turn.psychologicalLeverage === 'Hakim'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : turn.psychologicalLeverage === 'Dengeli'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        Üstünlük: {turn.psychologicalLeverage}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    "{turn.stakeholderResponse}"
                  </p>
                </div>

                {/* Winning Counter-Move */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Önerilen Mat Hamlesi (Kusursuz Karşı Yanıt):</span>
                    </span>
                    <p className="text-xs sm:text-sm text-emerald-200 font-medium">
                      "{turn.tacticalCounterMove}"
                    </p>
                  </div>
                  <button
                    onClick={() => copyText(turn.id, turn.tacticalCounterMove)}
                    className="self-end sm:self-start px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition flex-shrink-0"
                  >
                    {copiedId === turn.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === turn.id ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSimulate} className="p-4 border-t border-slate-800 bg-slate-950/70 flex gap-2">
          <input
            type="text"
            value={inputStatement}
            onChange={(e) => setInputStatement(e.target.value)}
            placeholder="Muhataba söyleyeceğin hamleyi yaz (örn: 'Hisselerimi devretmek veya projeyi tasfiye etmek istiyorum')..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputStatement.trim()}
            className="px-4 py-2.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs sm:text-sm flex items-center gap-1.5 transition disabled:opacity-50 flex-shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sına</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
