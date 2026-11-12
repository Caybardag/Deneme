import React, { useState } from 'react';
import { Scale, CheckCircle2, ArrowRight, Sparkles, Copy, Check, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DilemmaResult } from '../types';

interface DilemmaSolveViewProps {
  onBack?: () => void;
}

const PRESETS = [
  {
    title: 'Kariyer & İş',
    a: 'Mevcut maaşlı ve garantili işte kalmak',
    b: 'İstifa edip kendi girişimimi başlatmak',
    details: '6 aylık geçim birikimim var ama konforumdan çıkmaktan çekiniyorum.'
  },
  {
    title: 'Zor İlişki & Ortaklık',
    a: 'Yıpratıcı iş ortaklığını tamamen tasfiye etmek',
    b: 'Şartları yeniden revize edip son bir şans vermek',
    details: 'Ortak sürekli vaatler veriyor ama somut operasyonda yük benim üzerimde kalıyor.'
  },
  {
    title: 'Finansal Karar',
    a: 'Birikimi likit tutup fırsat beklemek',
    b: 'Borçlanarak gayrimenkul / mülk almak',
    details: 'Piyasadaki belirsizlik ve faiz oranları beni kararsız bırakıyor.'
  },
  {
    title: 'Müşteri & Sınır',
    a: 'Sürekli talepkar olan büyük müşteriyi nazikçe reddetmek',
    b: 'Fiyatı artırıp taviz vererek çalışmaya devam etmek',
    details: 'Müşteri ekibimin tüm enerjisini tüketiyor ve diğer büyüme fırsatlarını engelliyor.'
  }
];

export const DilemmaSolveView: React.FC<DilemmaSolveViewProps> = () => {
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DilemmaResult | null>(null);
  const [copiedAction, setCopiedAction] = useState(false);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setOptionA(preset.a);
    setOptionB(preset.b);
    setDetails(preset.details);
    setResult(null);
    setError(null);
  };

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionA.trim() || !optionB.trim()) {
      setError('Lütfen kıyaslanacak iki seçeneği de yazın.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/dilemma-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionA,
          optionB,
          details
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Karar analizi tamamlanamadı.');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const copyAction = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.immediateAction);
    setCopiedAction(true);
    setTimeout(() => setCopiedAction(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Scale className="w-3.5 h-3.5" />
          5 Dakikalık Karar Terazisi
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          İki Seçenek Arasında Sıkışıp Kaldınız mı?
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mt-2">
          Hangi yolun uzun vadede daha az pişmanlık yaratacağını ve net rasyonel kazananı saniyeler içinde hesaplayın.
        </p>
      </div>

      {/* Preset Chips */}
      {!result && (
        <div className="mb-6">
          <p className="text-xs font-medium text-zinc-400 mb-2">Hızlı Örnek İkilemler:</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors text-left"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      {!result ? (
        <form onSubmit={handleSolve} className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Option A */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">A</span>
                1. Seçenek (Seçenek A)
              </label>
              <textarea
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="Örn: Güvenli işimde kalmaya devam etmek..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all resize-none"
              />
            </div>

            {/* Option B */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">B</span>
                2. Seçenek (Seçenek B)
              </label>
              <textarea
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="Örn: İstifa edip kendi işimi kurmak..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all resize-none"
              />
            </div>
          </div>

          {/* Context */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              Ek Bağlam / Çekinceleriniz (İsteğe Bağlı)
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Örn: 2 çocuğum var, en büyük korkum nakit akışının kesilmesi..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !optionA.trim() || !optionB.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Rasyonel Pişmanlık Analizi Hesaplanıyor...</span>
              </>
            ) : (
              <>
                <Scale className="w-4 h-4" />
                <span>Teraziyi Çalıştır & Net Kararı Ver</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Result View */
        <div className="space-y-6">
          {/* Top Verdict Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-lg ${
                  result.winner === 'A' 
                    ? 'bg-emerald-500 text-black shadow-emerald-500/20' 
                    : 'bg-blue-500 text-black shadow-blue-500/20'
                }`}>
                  {result.winner}
                </div>
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-amber-400">
                    Önerilen Kesin Karar
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {result.winner === 'A' ? optionA : optionB}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setResult(null)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Yeni Karar
              </button>
            </div>

            {/* Verdict Explanation */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/60 mb-6 text-sm text-zinc-300 leading-relaxed">
              <p className="font-semibold text-white mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Gerekçe ve Çözüm Mantığı:
              </p>
              {result.verdictSummary}
            </div>

            {/* Regret Risk Comparison Meter */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <span>10 Yıl Sonraki Pişmanlık Olasılığı Kıyası</span>
                <span className="text-zinc-500">Düşük olan tercih edilir</span>
              </div>

              {/* Bar A */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Seçenek A: {optionA.slice(0, 45)}...
                  </span>
                  <span className="font-bold text-zinc-300">%{result.regretProbabilityA} Pişmanlık Riski</span>
                </div>
                <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${
                      result.winner === 'A' ? 'bg-emerald-500' : 'bg-red-500/70'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, result.regretProbabilityA))}%` }}
                  />
                </div>
              </div>

              {/* Bar B */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-blue-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Seçenek B: {optionB.slice(0, 45)}...
                  </span>
                  <span className="font-bold text-zinc-300">%{result.regretProbabilityB} Pişmanlık Riski</span>
                </div>
                <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${
                      result.winner === 'B' ? 'bg-blue-500' : 'bg-red-500/70'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, result.regretProbabilityB))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Decisive Factor & Next Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  Kırılma Noktası (Belirleyici Faktör)
                </div>
                <p className="text-xs sm:text-sm text-zinc-300">
                  {result.decisiveFactor}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Şimdi Yapılacak İlk Eylem
                  </div>
                  <button
                    onClick={copyAction}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-white transition-colors"
                  >
                    {copiedAction ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAction ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200">
                  {result.immediateAction}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
