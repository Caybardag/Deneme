import React, { useState } from 'react';
import { X, ShieldAlert, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StressTestModalProps {
  isOpen: boolean;
  critiqueText: string | null;
  isLoading: boolean;
  onClose: () => void;
}

export const StressTestModal: React.FC<StressTestModalProps> = ({
  isOpen,
  critiqueText,
  isLoading,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!critiqueText) return;
    navigator.clipboard.writeText(critiqueText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-rose-950/40 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-rose-400 block">
                Zırhlandırma Raporu
              </span>
              <h3 className="text-sm font-bold text-white">
                Plan Dayanıklılık ve Stres Denetimi
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-300 font-medium max-w-md">
                Plan en sert kriz senaryolarına, psikolojik dirençlere ve batık maliyetlere karşı test ediliyor...
              </p>
            </div>
          ) : critiqueText ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>Bu denetim, planın zayıf noktalarını önceden tespit edip savunma mekanizması kurman için hazırlanmıştır.</span>
              </div>
              <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-line space-y-3 font-normal">
                {critiqueText}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Stres testi raporu üretilemedi.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hazırlıklı olan asla panik yapmaz</span>
          </div>

          <div className="flex items-center gap-2">
            {critiqueText && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopyalandı' : 'Raporu Kopyala'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
