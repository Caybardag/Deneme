import React, { useState } from 'react';
import { Flame, Sparkles, Copy, Check, ShieldAlert, ArrowRight, RotateCcw, AlertTriangle, Coffee, Clock } from 'lucide-react';
import { QuickRescueResult } from '../types';

interface QuickRescueViewProps {
  onBack?: () => void;
}

const SITUATION_PRESETS = [
  {
    title: 'Aşırı Yük & Tükenmişlik',
    text: 'Her şey üstüme geliyor, 20 farklı iş var, kafam durdu ve hiçbir şeye başlayamıyorum.'
  },
  {
    title: 'Son Gün Erteleme Felci',
    text: 'Yarın teslim etmem veya bitirmem gereken kritik bir iş var ama panikten kilitlendim.'
  },
  {
    title: 'Finansal / Borç Kaygısı',
    text: 'Ödemeler yaklaştı, nakit yetersiz ve sürekli geleceği düşünüp uykusuz kalıyorum.'
  },
  {
    title: 'Zor Bir Yanıtı Geciktirme',
    text: 'Biri benden önemli bir cevap veya iş bekliyor, günlerdir erteledim ve utançtan yazamıyorum.'
  }
];

export const QuickRescueView: React.FC<QuickRescueViewProps> = () => {
  const [situation, setSituation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuickRescueResult | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleRescue = async (customSituation?: string) => {
    const textToSubmit = customSituation || situation;
    if (!textToSubmit.trim()) {
      setError('Lütfen şu an sizi en çok bunaltan durumu belirtin.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/quick-rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: textToSubmit })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Kurtarma planı hazırlanamadı.');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Bir aksaklık oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const copyScript = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.scriptToSend);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Flame className="w-3.5 h-3.5" />
          Acil Yangın Söndürücü & Zihinsel Reset
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Aşırı Yük, Panik veya Karar Felci mi Yaşıyorsunuz?
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mt-2">
          Şu an her şeyi çözemezsiniz, buna gerek de yok. 5 dakika içinde zihinsel sis perdesini dağıtıp kontrolü geri alalım.
        </p>
      </div>

      {/* Preset Chips */}
      {!result && (
        <div className="mb-6">
          <p className="text-xs font-medium text-zinc-400 mb-2">Sık Karşılaşılan Kriz Durumları:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SITUATION_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSituation(p.text);
                  handleRescue(p.text);
                }}
                className="text-left bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-rose-500/30 p-3 rounded-xl transition-all group"
              >
                <div className="text-xs font-semibold text-rose-400 group-hover:text-rose-300">
                  {p.title}
                </div>
                <div className="text-xs text-zinc-400 mt-1 line-clamp-1">
                  {p.text}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      {!result ? (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Şu an zihninizi en çok kilitleyen durum nedir?
            </label>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Örn: 3 farklı teslim tarihim var, hangisine başlayacağımı bilemiyorum, erteledikçe panik artıyor..."
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleRescue()}
            disabled={loading || !situation.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Acil Odak Protokolü Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Yangını Söndür & 5 Dakikalık Eylemi Getir</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Result View */
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold mb-2">
                  <Flame className="w-3.5 h-3.5" />
                  Acil Odak Protokolü Devrede
                </div>
                <h2 className="text-xl font-bold text-white">
                  {result.headline}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setResult(null)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Yeni Durum
              </button>
            </div>

            {/* 1. 5-Minute Single Action */}
            <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-zinc-950 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4" />
                1. Sadece Önündeki 5 Dakika İçin Tek Eylem (Gözlerini Kapat ve Bunu Yap)
              </div>
              <p className="text-base text-zinc-100 font-medium leading-relaxed">
                {result.fiveMinuteStep}
              </p>
            </div>

            {/* 2. What to drop */}
            <div className="mb-6 p-5 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
                <ShieldAlert className="w-4 h-4" />
                2. Bugün Bilerek ve İsteyerek Çöpe Atacağın Yükler (Sıfır Suçluluk)
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {result.whatToDropImmediately}
              </p>
            </div>

            {/* 3. Script to buy time */}
            <div className="mb-6 p-5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4" />
                  3. Zaman Kazanma & Erteleme Mahcubiyetini Kırma Mesajı
                </div>
                <button
                  onClick={copyScript}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white transition-colors bg-amber-500/10 px-2.5 py-1 rounded-md"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 font-mono select-all">
                "{result.scriptToSend}"
              </div>
            </div>

            {/* 4. Mindset Rule */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                  Günün Zihinsel Pusulası
                </div>
                <p className="text-sm text-zinc-200 italic">
                  "{result.mindsetRule}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
