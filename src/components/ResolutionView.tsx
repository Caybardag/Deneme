import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Copy, 
  Check, 
  Bookmark, 
  Share2, 
  Layers, 
  Compass, 
  Cpu, 
  Zap, 
  ChevronRight,
  TrendingUp,
  FileText,
  GitBranch,
  Swords
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ResolutionData, ActionStep, SensitivityState } from '../types';
import { SensitivitySimulator } from './SensitivitySimulator';
import { DecisionTreeView } from './DecisionTreeView';

interface ResolutionViewProps {
  resolution: ResolutionData;
  onUpdateStep: (phaseKey: 'phase1' | 'phase2' | 'phase3', stepId: string, completed: boolean) => void;
  onRequestTactic: (step: ActionStep) => void;
  onRunStressTest: () => void;
  onOpenWarRoom: () => void;
  onOpenArtifacts: () => void;
  onSaveToArchive: () => void;
  isSaved: boolean;
  onNewProblem: () => void;
}

export const ResolutionView: React.FC<ResolutionViewProps> = ({
  resolution,
  onUpdateStep,
  onRequestTactic,
  onRunStressTest,
  onOpenWarRoom,
  onOpenArtifacts,
  onSaveToArchive,
  isSaved,
  onNewProblem,
}) => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'tree' | 'options' | 'diagnosis' | 'failsafe'>('roadmap');
  const [copied, setCopied] = useState(false);
  const [sensitivity, setSensitivity] = useState<SensitivityState>({
    riskTolerance: 45,
    timePressure: resolution.urgency === 'urgent' ? 80 : 50,
    conflictTolerance: 55,
    capitalBuffer: 50,
  });

  // Calculate overall completion
  const allSteps: ActionStep[] = [
    ...(resolution.actionRoadmap?.phase1?.steps || []),
    ...(resolution.actionRoadmap?.phase2?.steps || []),
    ...(resolution.actionRoadmap?.phase3?.steps || []),
  ];
  const totalCount = allSteps.length;
  const completedCount = allSteps.filter((s) => s.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStepToggle = (phaseKey: 'phase1' | 'phase2' | 'phase3', step: ActionStep) => {
    const nextCompleted = !step.completed;
    onUpdateStep(phaseKey, step.id, nextCompleted);

    if (nextCompleted && completedCount + 1 === totalCount) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const copyFullReport = () => {
    const text = `=== RESOLV: ${resolution.title} ===

ÖZET DEĞERLENDİRME:
${resolution.executiveSummary}

TEMEL KARAR PUSULASI:
${resolution.decisionRule}

KÖK NEDENLER & KÖR NOKTALAR:
${resolution.rootCauses.map((r, i) => `${i + 1}. ${r}`).join('\n')}

STRATEJİK SEÇENEKLER:
${resolution.options.map((opt) => `* [${opt.name}] (Risk: ${opt.riskLevel}) ${opt.recommended ? '[ÖNERİLEN]' : ''}\n  Gerekçe: ${opt.rationale}\n  Artılar: ${opt.pros.join(', ')}\n  Eksiler: ${opt.cons.join(', ')}`).join('\n\n')}

İLK 24 SAAT ADIMLARI:
${(resolution.actionRoadmap?.phase1?.steps || []).map((s) => `- [${s.completed ? 'X' : ' '}] ${s.step} (${s.timeEstimate}) - ${s.tacticalAdvice}`).join('\n')}

2-7. GÜN ADIMLARI:
${(resolution.actionRoadmap?.phase2?.steps || []).map((s) => `- [${s.completed ? 'X' : ' '}] ${s.step} (${s.timeEstimate}) - ${s.tacticalAdvice}`).join('\n')}

1. AY VE ÖTESİ:
${(resolution.actionRoadmap?.phase3?.steps || []).map((s) => `- [${s.completed ? 'X' : ' '}] ${s.step} (${s.timeEstimate}) - ${s.tacticalAdvice}`).join('\n')}

SİGORTA VE ACİL ÇIKIŞ PROTOKOLLERİ:
${(resolution.failSafeProtocols || []).map((p) => `* Eğer: ${p.triggerCondition} -> Aksiyon: ${p.immediateAction}`).join('\n')}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-8 px-4 pb-24">
      {/* Top Banner / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={onNewProblem}
          className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>Farklı Bir Durum Çöz</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* War-Room Simulator Trigger */}
          <button
            onClick={onOpenWarRoom}
            className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-500/10"
          >
            <Swords className="w-4 h-4 text-rose-400" />
            <span>Müzakere Odası</span>
          </button>

          {/* Artifacts Trigger */}
          <button
            onClick={onOpenArtifacts}
            className="px-3 py-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-teal-500/10"
          >
            <FileText className="w-4 h-4 text-teal-400" />
            <span>Resmi Belgeler ({resolution.artifacts?.length || 2})</span>
          </button>

          <button
            onClick={onSaveToArchive}
            className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition flex items-center gap-1.5 cursor-pointer ${
              isSaved
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-emerald-400 fill-emerald-400' : 'text-slate-400'}`} />
            <span>{isSaved ? 'Arşivde' : 'Arşive Kaydet'}</span>
          </button>

          <button
            onClick={copyFullReport}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition flex items-center gap-1.5 cursor-pointer"
            title="Tüm Raporu Kopyala"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopyalandı' : 'Rapor'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition hidden sm:flex items-center gap-1.5 cursor-pointer"
            title="Yazdır / PDF"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl mb-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Netleşmiş Çözüm Mimarisi</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              {resolution.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {resolution.executiveSummary}
            </p>
          </div>

          {/* Quick Progress Badge */}
          <div className="flex-shrink-0 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 min-w-[180px]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>İcra Durumu</span>
              <span className="font-bold text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>{completedCount} / {totalCount} Adım</span>
              {progressPercent === 100 && <span className="text-emerald-400 font-semibold">Tamamlandı!</span>}
            </div>
          </div>
        </div>

        {/* Decision Rule (Altın Pusula) */}
        {resolution.decisionRule && (
          <div className="mt-5 pt-5 border-t border-slate-800/80 flex items-start gap-3 bg-emerald-500/5 -mx-6 -mb-6 p-6 rounded-b-2xl border-t border-emerald-500/20">
            <Compass className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                Temel Karar Pusulası
              </span>
              <p className="text-sm text-slate-200 font-medium italic">
                "{resolution.decisionRule}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Sensitivity Knobs */}
      <SensitivitySimulator
        sensitivity={sensitivity}
        onChange={setSensitivity}
        baseSuccess={resolution.baselineMetrics?.overallSuccessProb || 76}
        baseRisk={resolution.baselineMetrics?.riskIndex || 35}
      />

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-1 sm:gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'roadmap', label: 'Eylem Yol Haritası', icon: Layers, badge: `${completedCount}/${totalCount}` },
          { id: 'tree', label: 'Karar Ağacı (Dallanma)', icon: GitBranch, badge: 'Dinamik' },
          { id: 'options', label: 'Stratejik Yollar', icon: TrendingUp, badge: `${resolution.options?.length || 0}` },
          { id: 'diagnosis', label: 'Kök Neden & Kör Noktalar', icon: Cpu, badge: `${resolution.rootCauses?.length || 0}` },
          { id: 'failsafe', label: 'Sigorta & Stres Testi', icon: ShieldAlert, badge: `${resolution.failSafeProtocols?.length || 0}` },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold rounded-t-xl transition whitespace-nowrap border-b-2 -mb-[2px] cursor-pointer ${
                isActive
                  ? 'border-emerald-400 text-emerald-300 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {[
            { key: 'phase1' as const, data: resolution.actionRoadmap?.phase1, badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
            { key: 'phase2' as const, data: resolution.actionRoadmap?.phase2, badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
            { key: 'phase3' as const, data: resolution.actionRoadmap?.phase3, badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
          ].map(({ key, data, badgeColor }) => {
            if (!data) return null;
            return (
              <div key={key} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs uppercase font-extrabold px-2.5 py-1 rounded-lg border ${badgeColor}`}>
                      {key === 'phase1' ? 'Aşama 1' : key === 'phase2' ? 'Aşama 2' : 'Aşama 3'}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {data.title}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400">
                    {data.steps.filter((s) => s.completed).length} / {data.steps.length} Yapıldı
                  </span>
                </div>

                <div className="space-y-3">
                  {data.steps.map((step) => {
                    const isDone = !!step.completed;
                    return (
                      <div
                        key={step.id}
                        className={`group border rounded-xl p-3.5 sm:p-4 transition-all duration-200 ${
                          isDone
                            ? 'bg-slate-950/40 border-slate-800/50 opacity-70'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleStepToggle(key, step)}
                            className="mt-0.5 text-slate-500 hover:text-emerald-400 transition flex-shrink-0 cursor-pointer"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-600 group-hover:text-slate-400" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                              <h3 className={`text-sm sm:text-base font-semibold ${
                                isDone ? 'text-slate-400 line-through' : 'text-slate-100'
                              }`}>
                                {step.step}
                              </h3>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                                  step.priority === 'Kritik'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : step.priority === 'Yüksek'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {step.priority}
                                </span>
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  {step.timeEstimate}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal mb-3">
                              {step.tacticalAdvice}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                              <button
                                onClick={() => onRequestTactic(step)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>Bu Adım İçin Taktik / Senaryo Al</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Decision Tree */}
      {activeTab === 'tree' && (
        <DecisionTreeView decisionTree={resolution.decisionTree} />
      )}

      {/* Tab 3: Options Matrix */}
      {activeTab === 'options' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resolution.options?.map((opt, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition relative ${
                  opt.recommended
                    ? 'bg-gradient-to-b from-emerald-950/20 to-slate-900 border-emerald-500/40 shadow-xl shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {opt.recommended && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold tracking-wide uppercase shadow-md">
                    Önerilen Yol
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-white">
                      {opt.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      opt.riskLevel === 'Yüksek'
                        ? 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                        : opt.riskLevel === 'Orta'
                        ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                        : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    }`}>
                      {opt.riskLevel} Risk
                    </span>
                  </div>

                  {opt.expectedValueScore && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
                      <span className="font-bold text-emerald-400">EV: +{opt.expectedValueScore}</span>
                      <span>•</span>
                      <span>Başarı: %{opt.successRate || 75}</span>
                      {opt.breakEvenTimeline && (
                        <>
                          <span>•</span>
                          <span>Dönüş: {opt.breakEvenTimeline}</span>
                        </>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-300 mb-4 leading-relaxed font-normal">
                    {opt.rationale}
                  </p>

                  {/* Pros */}
                  <div className="mb-3">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
                      Kazanımlar (Artılar)
                    </span>
                    <ul className="space-y-1">
                      {opt.pros.map((p, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1.5">
                      Bedeller & Riskler
                    </span>
                    <ul className="space-y-1">
                      {opt.cons.map((c, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Diagnosis & Root Causes */}
      {activeTab === 'diagnosis' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">
              Kök Nedenler ve Psikolojik Kör Noktalar
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Yüzeysel sorunların arkasında yatan karar felci, batık maliyet yanılgısı ve sistemik tıkanıklıklar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resolution.rootCauses.map((cause, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm text-slate-200 leading-relaxed font-normal">
                    {cause}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Failsafe & Stress Test */}
      {activeTab === 'failsafe' && (
        <div className="space-y-6">
          {/* Stress test action trigger */}
          <div className="bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>Plan Dayanıklılık ve Stres Testi</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Bu planı en kötü hayat koşullarına, beklenmedik krizlere ve dirençlere karşı test et. Açıkları tespit edip zırhlandır.
              </p>
            </div>
            <button
              onClick={onRunStressTest}
              className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs sm:text-sm transition flex-shrink-0 shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>Stres Testini Başlat</span>
            </button>
          </div>

          {/* Failsafe Protocols list */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Acil Çıkış ve Sigorta Protokolleri</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-5">
              İşler planlandığı gibi gitmediğinde panik yapmadan devreye sokulacak kesin kurallar.
            </p>

            <div className="space-y-3">
              {resolution.failSafeProtocols?.map((proto, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                      Tetikleyici Kriz Koşulu
                    </span>
                    <p className="text-sm font-semibold text-slate-200">
                      "{proto.triggerCondition}"
                    </p>
                  </div>

                  <div className="space-y-1 flex-1 sm:border-l sm:border-slate-800 sm:pl-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                      Derhal Uygulanacak Karşı Hamle
                    </span>
                    <p className="text-sm font-medium text-emerald-300">
                      "{proto.immediateAction}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
