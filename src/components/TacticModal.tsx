import React, { useState } from 'react';
import { X, Zap, Copy, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { ActionStep } from '../types';

interface TacticModalProps {
  step: ActionStep | null;
  tacticText: string | null;
  isLoading: boolean;
  onClose: () => void;
}

export const TacticModal: React.FC<TacticModalProps> = ({
  step,
  tacticText,
  isLoading,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!step) return null;

  const handleCopy = () => {
    if (!tacticText) return;
    navigator.clipboard.writeText(tacticText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 block">
                Saha İcra Taktiği
              </span>
              <h3 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
                {step.step}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-300 font-medium">
                Bu adım için özel konuşma metni, psikolojik zırh ve hata tuzakları hazırlanıyor...
              </p>
            </div>
          ) : tacticText ? (
            <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-line space-y-3 font-normal">
              {tacticText}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Taktik bilgisi alınamadı.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hedef: Sıfır hata ile net uygulama</span>
          </div>

          <div className="flex items-center gap-2">
            {tacticText && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopyalandı' : 'Metni Kopyala'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
