import React, { useState, useEffect } from 'react';
import { Header, AppTab } from './components/Header';
import { NewResolutionForm } from './components/NewResolutionForm';
import { ResolutionView } from './components/ResolutionView';
import { MessageCraftView } from './components/MessageCraftView';
import { DilemmaSolveView } from './components/DilemmaSolveView';
import { QuickRescueView } from './components/QuickRescueView';
import { LiveVerbalDefenseView } from './components/LiveVerbalDefenseView';
import { TacticModal } from './components/TacticModal';
import { StressTestModal } from './components/StressTestModal';
import { WarRoomModal } from './components/WarRoomModal';
import { ArtifactsModal } from './components/ArtifactsModal';
import { ArchiveDrawer } from './components/ArchiveDrawer';
import { TemplatesModal } from './components/TemplatesModal';
import { BottomNav } from './components/BottomNav';
import { ResolutionData, ActionStep, CategoryId, UrgencyLevel } from './types';
import { ProblemTemplate } from './constants/templates';

const STORAGE_KEY_SAVED = 'resolv_saved_v1';
const STORAGE_KEY_ACTIVE = 'resolv_active_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('live_verbal');
  const [activeResolution, setActiveResolution] = useState<ResolutionData | null>(null);
  const [savedResolutions, setSavedResolutions] = useState<ResolutionData[]>([]);
  const [currentView, setCurrentView] = useState<'form' | 'resolution'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [prefillData, setPrefillData] = useState<{
    problem: string;
    category: CategoryId;
    urgency: UrgencyLevel;
    emotionalState: string;
  } | null>(null);

  // Tactic Modal State
  const [activeTacticStep, setActiveTacticStep] = useState<ActionStep | null>(null);
  const [tacticText, setTacticText] = useState<string | null>(null);
  const [isTacticLoading, setIsTacticLoading] = useState(false);

  // Stress Test Modal State
  const [isStressTestOpen, setIsStressTestOpen] = useState(false);
  const [stressCritique, setStressCritique] = useState<string | null>(null);
  const [isStressLoading, setIsStressLoading] = useState(false);

  // War-Room & Artifacts State
  const [isWarRoomOpen, setIsWarRoomOpen] = useState(false);
  const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);

  // Drawer / Modals
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY_SAVED);
      if (savedRaw) {
        setSavedResolutions(JSON.parse(savedRaw));
      }
      const activeRaw = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (activeRaw) {
        const parsed = JSON.parse(activeRaw);
        setActiveResolution(parsed);
      }
    } catch (e) {
      console.warn('Storage read failed:', e);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleFormSubmit = async (formData: {
    problem: string;
    category: CategoryId;
    urgency: UrgencyLevel;
    emotionalState: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Çözüm üretilemedi.');
      }

      const newRes: ResolutionData = {
        ...json.data,
        id: 'res_' + Date.now(),
        createdAt: new Date().toISOString(),
        originalProblem: formData.problem,
        category: formData.category,
        urgency: formData.urgency,
      };

      setActiveResolution(newRes);
      localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(newRes));
      setCurrentView('resolution');
      setActiveTab('strategy');
      showToast('Çözüm mimarisi başarıyla oluşturuldu.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStep = (
    phaseKey: 'phase1' | 'phase2' | 'phase3',
    stepId: string,
    completed: boolean
  ) => {
    if (!activeResolution) return;

    const updatedPhase = {
      ...activeResolution.actionRoadmap[phaseKey],
      steps: activeResolution.actionRoadmap[phaseKey].steps.map((s) =>
        s.id === stepId ? { ...s, completed } : s
      ),
    };

    const updatedResolution: ResolutionData = {
      ...activeResolution,
      actionRoadmap: {
        ...activeResolution.actionRoadmap,
        [phaseKey]: updatedPhase,
      },
    };

    setActiveResolution(updatedResolution);
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(updatedResolution));

    // Also update in archive if saved
    setSavedResolutions((prev) => {
      const exists = prev.some((x) => x.id === updatedResolution.id);
      if (!exists) return prev;
      const next = prev.map((x) => (x.id === updatedResolution.id ? updatedResolution : x));
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(next));
      return next;
    });
  };

  const handleRequestTactic = async (step: ActionStep) => {
    setActiveTacticStep(step);
    setTacticText(null);
    setIsTacticLoading(true);

    try {
      const res = await fetch('/api/tactic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepTitle: step.step,
          tacticalAdvice: step.tacticalAdvice,
          context: activeResolution?.title || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Taktik üretilemedi.');
      }
      setTacticText(data.tactic);
    } catch (err: any) {
      setTacticText('Taktik yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsTacticLoading(false);
    }
  };

  const handleRunStressTest = async () => {
    if (!activeResolution) return;
    setIsStressTestOpen(true);
    setStressCritique(null);
    setIsStressLoading(true);

    const recommendedOption = activeResolution.options.find((o) => o.recommended)?.name || activeResolution.options[0]?.name;

    try {
      const res = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSummary: activeResolution.executiveSummary,
          chosenOption: recommendedOption,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Stres testi tamamlanamadı.');
      }
      setStressCritique(data.critique);
    } catch (err: any) {
      setStressCritique('Stres testi sırasında bir hata oluştu: ' + (err.message || ''));
    } finally {
      setIsStressLoading(false);
    }
  };

  const handleSaveToArchive = () => {
    if (!activeResolution) return;
    setSavedResolutions((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === activeResolution.id);
      let updated: ResolutionData[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = activeResolution;
        showToast('Arşivdeki kayıt güncellendi.');
      } else {
        updated = [activeResolution, ...prev];
        showToast('Plan arşive kaydedildi.');
      }
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteResolution = (id: string) => {
    setSavedResolutions((prev) => {
      const next = prev.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(next));
      return next;
    });
    showToast('Plan arşivden silindi.');
  };

  const handleSelectTemplate = (template: ProblemTemplate) => {
    setPrefillData({
      problem: template.problemText,
      category: template.category,
      urgency: template.urgency,
      emotionalState: template.emotionalState,
    });
    setCurrentView('form');
    setActiveTab('strategy');
  };

  const isCurrentSaved = !!activeResolution && savedResolutions.some((r) => r.id === activeResolution.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header with Tool Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'strategy' && !activeResolution) {
            setCurrentView('form');
          }
        }}
        onOpenArchive={() => setIsArchiveOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        savedCount={savedResolutions.length}
        hasActiveResolution={!!activeResolution}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pb-16 sm:pb-0">
        {activeTab === 'live_verbal' && (
          <LiveVerbalDefenseView />
        )}

        {activeTab === 'message_craft' && (
          <MessageCraftView />
        )}

        {activeTab === 'dilemma_solve' && (
          <DilemmaSolveView />
        )}

        {activeTab === 'quick_rescue' && (
          <QuickRescueView />
        )}

        {activeTab === 'strategy' && (
          <>
            {currentView === 'resolution' && activeResolution ? (
              <ResolutionView
                resolution={activeResolution}
                onUpdateStep={handleUpdateStep}
                onRequestTactic={handleRequestTactic}
                onRunStressTest={handleRunStressTest}
                onOpenWarRoom={() => setIsWarRoomOpen(true)}
                onOpenArtifacts={() => setIsArtifactsOpen(true)}
                onSaveToArchive={handleSaveToArchive}
                isSaved={isCurrentSaved}
                onNewProblem={() => {
                  setCurrentView('form');
                }}
              />
            ) : (
              <NewResolutionForm
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
                onOpenTemplates={() => setIsTemplatesOpen(true)}
                prefillData={prefillData}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Nav for Mobile */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'strategy' && !activeResolution) {
            setCurrentView('form');
          }
        }}
        hasActiveResolution={!!activeResolution}
      />

      {/* Tactic Modal */}
      <TacticModal
        step={activeTacticStep}
        tacticText={tacticText}
        isLoading={isTacticLoading}
        onClose={() => setActiveTacticStep(null)}
      />

      {/* War-Room Simulator Modal */}
      <WarRoomModal
        isOpen={isWarRoomOpen}
        onClose={() => setIsWarRoomOpen(false)}
        contextTitle={activeResolution?.title || ''}
      />

      {/* Operational Artifacts Modal */}
      <ArtifactsModal
        isOpen={isArtifactsOpen}
        onClose={() => setIsArtifactsOpen(false)}
        artifacts={activeResolution?.artifacts}
      />

      {/* Stress Test Modal */}
      <StressTestModal
        isOpen={isStressTestOpen}
        critiqueText={stressCritique}
        isLoading={isStressLoading}
        onClose={() => setIsStressTestOpen(false)}
      />

      {/* Archive Drawer */}
      <ArchiveDrawer
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        savedResolutions={savedResolutions}
        onSelectResolution={(item) => {
          setActiveResolution(item);
          localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(item));
          setCurrentView('resolution');
          setActiveTab('strategy');
        }}
        onDeleteResolution={handleDeleteResolution}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
