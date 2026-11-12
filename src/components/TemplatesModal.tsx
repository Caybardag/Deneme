import React from 'react';
import { X, BookOpen, ArrowRight, Flame, Briefcase, Brain, DollarSign, Scale } from 'lucide-react';
import { PROBLEM_TEMPLATES, ProblemTemplate } from '../constants/templates';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProblemTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-teal-400 block">
                Senaryo Kütüphanesi
              </span>
              <h3 className="text-sm font-bold text-white">
                Evrensel Hayat & İş Krizleri Şablonları
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

        {/* Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {PROBLEM_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate(tpl);
                onClose();
              }}
              className="group bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-lg hover:shadow-emerald-500/5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                    {tpl.title}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {tpl.urgency === 'urgent' ? 'Acil' : 'Stratejik'}
                  </span>
                </div>
                <p className="text-xs text-emerald-400/90 font-medium mb-2">
                  {tpl.highlight}
                </p>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {tpl.problemText}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400 group-hover:text-emerald-400">
                <span>Bu senaryoyu yükle</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
