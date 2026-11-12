import React, { useState } from 'react';
import { X, Search, Bookmark, Trash2, ArrowUpRight, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { ResolutionData } from '../types';

interface ArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedResolutions: ResolutionData[];
  onSelectResolution: (item: ResolutionData) => void;
  onDeleteResolution: (id: string) => void;
}

export const ArchiveDrawer: React.FC<ArchiveDrawerProps> = ({
  isOpen,
  onClose,
  savedResolutions,
  onSelectResolution,
  onDeleteResolution,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = savedResolutions.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.executiveSummary.toLowerCase().includes(q) ||
      (item.originalProblem && item.originalProblem.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Çözüm Arşivi ({savedResolutions.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Arşivde ara..."
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-emerald-500/50 placeholder-slate-600"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Bookmark className="w-8 h-8 mx-auto text-slate-700" />
              <p className="text-sm font-medium">Henüz kayıtlı bir çözüm bulunmuyor.</p>
              <p className="text-xs text-slate-600">Üretilen çözümleri "Arşive Kaydet" butonu ile buraya ekleyebilirsin.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const allSteps = [
                ...(item.actionRoadmap?.phase1?.steps || []),
                ...(item.actionRoadmap?.phase2?.steps || []),
                ...(item.actionRoadmap?.phase3?.steps || []),
              ];
              const completedSteps = allSteps.filter((s) => s.completed).length;
              const percent = allSteps.length > 0 ? Math.round((completedSteps / allSteps.length) * 100) : 0;

              return (
                <div
                  key={item.id || item.title}
                  className="group bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition">
                        {item.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.id) onDeleteResolution(item.id);
                        }}
                        className="text-slate-600 hover:text-rose-400 p-1 transition"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3 font-normal leading-relaxed">
                      {item.executiveSummary}
                    </p>
                  </div>

                  {/* Progress & Select */}
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${percent === 100 ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>%{percent} Tamamlandı</span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectResolution(item);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <span>Aç</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
