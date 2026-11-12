import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertCircle, 
  Flame, 
  Clock, 
  Target, 
  Mic, 
  MicOff, 
  Sparkles, 
  ArrowRight, 
  Lightbulb,
  Briefcase,
  Brain,
  Scale,
  DollarSign,
  HelpCircle
} from 'lucide-react';
import { CategoryId, UrgencyLevel } from '../types';

interface NewResolutionFormProps {
  onSubmit: (formData: {
    problem: string;
    category: CategoryId;
    urgency: UrgencyLevel;
    emotionalState: string;
  }) => Promise<void>;
  isLoading: boolean;
  onOpenTemplates: () => void;
  prefillData?: {
    problem: string;
    category: CategoryId;
    urgency: UrgencyLevel;
    emotionalState: string;
  } | null;
}

const CATEGORIES: { id: CategoryId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'crisis_decision', label: 'Kriz & Kritik Karar', icon: Flame },
  { id: 'career_strategy', label: 'Kariyer & Geçiş', icon: Briefcase },
  { id: 'personal_psychology', label: 'Zihin & Tükenmişlik', icon: Brain },
  { id: 'finance_business', label: 'İş & Finansal Kilitlenme', icon: DollarSign },
  { id: 'negotiation_conflict', label: 'Müzakere & Çatışma', icon: Scale },
  { id: 'general', label: 'Genel İkilem', icon: HelpCircle },
];

const EMOTIONAL_STATES = [
  'Felç olmuş / Kararsız',
  'Stresli / Yoğun baskı altında',
  'Tükenmiş & Odaksız',
  'Öfkeli veya Kırgın',
  'Sakin ama Tıkanmış',
];

export const NewResolutionForm: React.FC<NewResolutionFormProps> = ({
  onSubmit,
  isLoading,
  onOpenTemplates,
  prefillData,
}) => {
  const [problem, setProblem] = useState('');
  const [category, setCategory] = useState<CategoryId>('crisis_decision');
  const [urgency, setUrgency] = useState<UrgencyLevel>('urgent');
  const [emotionalState, setEmotionalState] = useState(EMOTIONAL_STATES[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (prefillData) {
      setProblem(prefillData.problem);
      setCategory(prefillData.category);
      setUrgency(prefillData.urgency);
      setEmotionalState(prefillData.emotionalState);
    }
  }, [prefillData]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Safe ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const toggleRecording = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Safe ignore
        }
        recognitionRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      console.warn('Mic permission error:', err);
      setErrorMessage('Mikrofon erişim izni alınamadı. Lütfen tarayıcı ayarlarından mikrofona izin verin.');
      return;
    }

    try {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'tr-TR';

      const initialBaseText = problem.trim();

      recog.onresult = (event: any) => {
        let fullSpeech = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i] && event.results[i][0]) {
            fullSpeech += event.results[i][0].transcript + ' ';
          }
        }
        const cleanSpeech = fullSpeech.trim();
        if (cleanSpeech) {
          setProblem(initialBaseText ? `${initialBaseText} ${cleanSpeech}` : cleanSpeech);
        }
      };

      recog.onerror = (e: any) => {
        console.warn('Speech error:', e);
        setIsRecording(false);
      };

      recog.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recog;
      recog.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic start error:', err);
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() || problem.trim().length < 10) {
      setErrorMessage('Lütfen çözüme kavuşturmak istediğiniz durumu en az birkaç cümleyle açıklayın.');
      return;
    }
    setErrorMessage(null);
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    await onSubmit({
      problem: problem.trim(),
      category,
      urgency,
      emotionalState,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-8 px-4">
      {/* Hero Intro */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Eylemsel Çözüm ve Karar Mimarisi</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Zihnini kilitleyen her sorunu <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            uygulanabilir bir eylem planına
          </span> dönüştür.
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Belirsizlik, batık maliyetler ve tükenmişlik kararlarımızı felç eder. Durumunu açıkça anlat; kök nedenleri, stratejik seçenekleri ve ilk 72 saatlik net adımları derhal al.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Problem Alanı / Kategori</span>
              </label>
              <button
                type="button"
                onClick={onOpenTemplates}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium transition"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Hazır Senaryoları İncele</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/20'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency & Mental State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Urgency Level */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5 mb-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Aciliyet Seviyesi</span>
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'urgent', label: 'Acil Kriz (24-72 Saat)', color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
                  { id: 'medium', label: 'Haftalık / Kritik', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
                  { id: 'strategic', label: 'Stratejik Yol Ayrımı', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUrgency(item.id as UrgencyLevel)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                      urgency === item.id
                        ? item.color
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mental State */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5 mb-2.5">
                <Brain className="w-4 h-4 text-teal-400" />
                <span>Şu Anki Zihinsel Durumun</span>
              </label>
              <select
                value={emotionalState}
                onChange={(e) => setEmotionalState(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500/50"
              >
                {EMOTIONAL_STATES.map((state) => (
                  <option key={state} value={state} className="bg-slate-900 text-slate-200">
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Problem Input Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-emerald-400" />
                <span>Durumu, İkilemi veya Problemi Açıkla</span>
              </label>
              <div className="flex items-center gap-2">
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                      isRecording
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isRecording ? 'Dinleniyor...' : 'Sesle Yazdır'}</span>
                  </button>
                )}
                <span className="text-[11px] text-slate-500">
                  {problem.length} karakter
                </span>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={5}
                placeholder="Örneğin: '2 yıldır kurucusu olduğum işte ortağımla fikir ayrılığı yaşıyorum. O geri çekildi ama hisseleri vermiyor. Proje gelir üretiyor ama beni tüketiyor. Ne yapmalıyım?' veya 'İki kariyer teklifi arasında sıkıştım...'"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl p-4 text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition resize-y min-h-[140px]"
              />
            </div>
            {errorMessage && (
              <p className="mt-2 text-xs text-rose-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errorMessage}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-950 font-bold">Çözüm Mimarisi İnşa Ediliyor...</span>
                </div>
              ) : (
                <>
                  <span>Kapsamlı Çözüm Planını Üret</span>
                  <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2.5">
              Objektif kök neden analizi, stratejik risk matrisi ve 72 saatlik somut eylem adımları hazırlanacaktır.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
