import React, { useState } from 'react';
import { X, FileText, Copy, Check, Download, Edit3, Printer, ShieldCheck } from 'lucide-react';
import { OperationalArtifact } from '../types';

interface ArtifactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifacts?: OperationalArtifact[];
}

export const ArtifactsModal: React.FC<ArtifactsModalProps> = ({
  isOpen,
  onClose,
  artifacts,
}) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(
    artifacts && artifacts.length > 0 ? artifacts[0].id : ''
  );
  const [copied, setCopied] = useState(false);
  const [editableDocs, setEditableDocs] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    (artifacts || []).forEach((a) => {
      map[a.id] = a.rawDocument;
    });
    return map;
  });

  if (!isOpen) return null;

  const activeArtifact = artifacts?.find((a) => a.id === selectedArtifactId) || artifacts?.[0];
  const currentText = activeArtifact ? (editableDocs[activeArtifact.id] || activeArtifact.rawDocument) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeArtifact) return;
    const blob = new Blob([currentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArtifact.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-teal-400 block">
                Operasyonel Doküman ve İcra Paketi
              </span>
              <h3 className="text-sm font-bold text-white">
                İmzaya & Gönderime Hazır Resmi Metinler
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

        {/* Document Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {artifacts?.map((art) => (
            <button
              key={art.id}
              onClick={() => setSelectedArtifactId(art.id)}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-[2px] whitespace-nowrap ${
                activeArtifact?.id === art.id
                  ? 'border-teal-400 text-teal-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{art.title}</span>
            </button>
          ))}
        </div>

        {/* Content & Editor */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {activeArtifact ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>{activeArtifact.summary}</span>
                <span className="text-[10px] font-bold uppercase text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                  Doğrudan Düzenlenebilir
                </span>
              </div>

              <textarea
                value={currentText}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditableDocs((prev) => ({ ...prev, [activeArtifact.id]: val }));
                }}
                rows={14}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs sm:text-sm p-4 rounded-xl leading-relaxed focus:outline-none focus:border-teal-500/50 resize-y"
              />
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Doküman bulunamadı.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Hukuki ve operasyonel netlik sağlar</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>İndir (.txt)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
