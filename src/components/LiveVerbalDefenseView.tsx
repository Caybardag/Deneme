import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Shield, Sparkles, AlertCircle, ArrowRight, Zap, Eye, RotateCcw, Activity, CheckCircle2, History, MessageSquare } from 'lucide-react';
import { VerbalCounterResult } from '../types';

interface PresetAmbush {
  id: string;
  triggerLabel: string;
  opponentWords: string;
  instantCounter: string;
  toneAdvice: string;
  trapToAvoid: string;
}

interface ExchangeTurn {
  id: string;
  timestamp: string;
  spokenText: string;
  counterWords: string;
  vocalTone: string;
}

const PRESET_AMBUSHES: PresetAmbush[] = [
  {
    id: 'urgency',
    triggerLabel: 'Aceleye Getirme & Baskı',
    opponentWords: 'Buna şimdi hemen karar vermek zorundayız, yarın çok geç olur!',
    instantCounter: 'Baskı altında ayaküstü karar vermem. Sürecin selameti için şartları yarın saat 10:00\'da sakin kafayla netleştirelim.',
    toneAdvice: 'Sesini yükseltme. Yavaş ve tane tane konuş. Asla acele etmediğini hissettir.',
    trapToAvoid: 'Panikle "tamam bakarız" veya "olur" diyerek teslim olma.'
  },
  {
    id: 'undervalue',
    triggerLabel: 'Fiyat & Emeği Kırma',
    opponentWords: 'Bu fiyat çok yüksek, piyasada bunu yarı paraya yapanlar var!',
    instantCounter: 'Piyasada her fiyata iş bulabilirsiniz; ancak bizim sunduğumuz garanti ve sorumluluk bu bütçenin karşılığıdır. İndirim istenirse kapsamı daraltırız, hangisini çıkaralım?',
    toneAdvice: 'Hafif bir tebessümle, savunmaya geçmeden profesyonel sakinlikte kal.',
    trapToAvoid: 'Özür dileme veya "biz de çok masraf yaptık" gibi aciz savunmalara girme.'
  },
  {
    id: 'threat',
    triggerLabel: 'Tehdit & İptal Resti',
    opponentWords: 'Eğer dediğimi yapmazsanız sözleşmeyi iptal eder, başka kapıya gideriz!',
    instantCounter: 'Seçim hakkınız saklıdır, ancak bu tehditkar üslupla rasyonel bir iş ortaklığı yürütemeyiz. Şartlarımız masada; karar sizin.',
    toneAdvice: 'Göz temasını sakın kesme, arkana yaslan ve sessizliğin baskı kurmasına izin ver.',
    trapToAvoid: 'Hemen taviz verip geri adım atma; blöfü yutarsan kontrolü tamamen kaybedersin.'
  },
  {
    id: 'guilt',
    triggerLabel: 'Duygu Sömürüsü & Suçluluk',
    opponentWords: 'Biz senin için bu kadar fedakarlık yaptık, sen ise bizi yarı yolda bırakıyorsun!',
    instantCounter: 'Geçmiş emeğe ve ilişkimize saygım tam; ancak şu an konuştuğumuz konu bu kararın sürdürülebilirliği. Duygusal bağımız ile bu profesyonel sınırı birbirine karıştırmayalım.',
    toneAdvice: 'Şefkatli ama duvar gibi sağlam bir ton takın.',
    trapToAvoid: 'Kendini aklamaya çalışma, suçluluk duygusuna kapılıp açıklama yapma.'
  },
  {
    id: 'silence',
    triggerLabel: 'Sessizlikle Köşeye Sıkıştırma',
    opponentWords: 'Sözünü kestikten sonra sana dik dik bakıp sessiz kalıyor ve yanıt bekliyor.',
    instantCounter: 'Sessizlik mevcut şartları değiştirmiyor. Süreci tıkayan konudaki somut alternatif teklifiniz nedir?',
    toneAdvice: 'Önce 3 saniye sen de sessizce bak, sonra sakin bir otoriteyle cümleyi söyle.',
    trapToAvoid: 'Sessizlikten rahatsız olup boşluğu doldurmak için fazladan taviz verme.'
  },
  {
    id: 'delegation',
    triggerLabel: 'Yetki Dışı Sorumluluk Yıkma',
    opponentWords: 'Bu iş senin yüzünden aksadı, hesabı sen vereceksin!',
    instantCounter: 'Kişisel suçlamalar sorunu çözmez. Sorumluluk sınırlarımız ve kayıtlarımız ortada; gelin aksaklığı objektif verilerle çözelim.',
    toneAdvice: 'Savunmacı değil, olgun bir denetçi tavrıyla yanıt ver.',
    trapToAvoid: 'Öfkelenip sesini yükseltme; sesini yükselten haklıyken haksız duruma düşer.'
  }
];

export const LiveVerbalDefenseView: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<VerbalCounterResult | null>(null);
  const [whisperAudio, setWhisperAudio] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);
  const [isPendingAutoAction, setIsPendingAutoAction] = useState(false);
  const [exchangeHistory, setExchangeHistory] = useState<ExchangeTurn[]>([]);

  // References for reliable real-time dispatch and audio cleanup
  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Buffer refs to prevent stale closure bugs in SpeechRecognition callbacks
  const latestTranscriptRef = useRef('');
  const lastProcessedTextRef = useRef('');
  const autoTriggerTimerRef = useRef<number | null>(null);
  const isRequestInProgressRef = useRef(false);

  // Check initial permission status if available
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        if (result.state === 'granted') {
          setMicPermissionGranted(true);
        } else if (result.state === 'denied') {
          setMicPermissionGranted(false);
        }
        result.onchange = () => {
          setMicPermissionGranted(result.state === 'granted');
        };
      }).catch(() => {
        // Permissions API not fully supported for mic in some browsers
      });
    }

    return () => {
      stopListeningCleanup();
      if (autoTriggerTimerRef.current) {
        clearTimeout(autoTriggerTimerRef.current);
      }
    };
  }, []);

  const stopListeningCleanup = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setIsPendingAutoAction(false);

    if (autoTriggerTimerRef.current) {
      clearTimeout(autoTriggerTimerRef.current);
      autoTriggerTimerRef.current = null;
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Safe ignore
      }
      recognitionRef.current = null;
    }

    // Stop audio stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // Safe ignore
      }
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setAudioLevel(0);
  };

  const startAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!isListeningRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Audio meter init error:', e);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  const executeVerbalCounter = async (statementText: string, role?: string) => {
    const cleanText = statementText.trim();
    if (!cleanText || cleanText.length < 3) return;

    if (isRequestInProgressRef.current) return;
    isRequestInProgressRef.current = true;
    setIsLoading(true);
    setIsPendingAutoAction(false);
    setError(null);
    setActivePresetId(null);

    try {
      const res = await fetch('/api/instant-verbal-counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spokenStatement: cleanText, role: role || 'Muhatap' })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Sözlü yanıt üretilemedi.');
      }

      const result: VerbalCounterResult = data.data;
      setCurrentResult(result);
      lastProcessedTextRef.current = cleanText;

      // Add to exchange history
      const newTurn: ExchangeTurn = {
        id: 'turn_' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        spokenText: cleanText,
        counterWords: result.exactCounterWords,
        vocalTone: result.vocalTone
      };
      setExchangeHistory((prev) => [newTurn, ...prev.slice(0, 9)]);

      // Whisper if enabled
      if (whisperAudio && result.exactCounterWords) {
        speakText(result.exactCounterWords);
      }
    } catch (err: any) {
      setError(err.message || 'Sözlü yanıt alınamadı.');
    } finally {
      setIsLoading(false);
      isRequestInProgressRef.current = false;
    }
  };

  // Schedule auto-dispatch when speech pause is detected
  const scheduleAutoDispatch = (detectedText: string, hasFinalResult: boolean) => {
    if (!autoTriggerEnabled) return;
    const cleanText = detectedText.trim();
    if (cleanText.length < 4) return;
    if (cleanText === lastProcessedTextRef.current) return;

    setIsPendingAutoAction(true);

    if (autoTriggerTimerRef.current) {
      clearTimeout(autoTriggerTimerRef.current);
    }

    // If final result arrived, dispatch in 650ms; if interim silence, dispatch in 1100ms
    const delayMs = hasFinalResult ? 650 : 1100;

    autoTriggerTimerRef.current = window.setTimeout(() => {
      setIsPendingAutoAction(false);
      if (cleanText && cleanText !== lastProcessedTextRef.current && !isRequestInProgressRef.current) {
        executeVerbalCounter(cleanText);
      }
    }, delayMs);
  };

  const toggleListening = async () => {
    if (isListeningRef.current) {
      // User tapped to stop listening - immediately execute if there is unprocessed speech
      const textToRun = (latestTranscriptRef.current || spokenTranscript).trim();
      stopListeningCleanup();

      if (textToRun.length >= 3 && textToRun !== lastProcessedTextRef.current) {
        executeVerbalCounter(textToRun);
      }
      return;
    }

    setError(null);

    // Step 1: Explicitly request microphone stream permission via getUserMedia
    let stream: MediaStream;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tarayıcınız mikrofon erişimini desteklemiyor.');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setMicPermissionGranted(true);
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      setMicPermissionGranted(false);
      setError('Mikrofon erişim izni alınamadı. Lütfen tarayıcı adres çubuğundaki kilit/izin simgesinden mikrofona izin verin veya aşağıdaki hazır pusu savar butonlarını kullanın.');
      return;
    }

    // Step 2: Initialize Speech Recognition safely
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Tarayıcınız konuşma tanıma motorunu desteklemiyor. Lütfen mikrofona konuşmak yerine aşağıdaki kutuya yazın veya hazır butonlara dokunun.');
      return;
    }

    try {
      // Fresh recognition instance per session prevents InvalidStateError
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR';
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        startAudioMeter(stream);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        let hasFinal = false;

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item && item[0]) {
            fullTranscript += item[0].transcript + ' ';
            if (item.isFinal) {
              hasFinal = true;
            }
          }
        }

        const trimmed = fullTranscript.trim();
        if (trimmed) {
          latestTranscriptRef.current = trimmed;
          setSpokenTranscript(trimmed);

          // AUTOMATIC REAL-TIME DISPATCH: No manual button press required!
          scheduleAutoDispatch(trimmed, hasFinal);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setError('Mikrofon erişim izni verilmedi. Lütfen tarayıcı ayarlarından mikrofona izin verin.');
          setMicPermissionGranted(false);
          stopListeningCleanup();
        } else if (event.error === 'no-speech') {
          // Normal timeout when silence, do not break session
        } else {
          setError(`Ses tanıma uyarısı: ${event.error}. Dilerseniz doğrudan metin yazabilirsiniz.`);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            stopListeningCleanup();
          }
        }
      };

      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (err: any) {
      console.warn('Recognition start caught error:', err);
      stopListeningCleanup();
      if (err.name !== 'InvalidStateError') {
        setError('Mikrofon başlatılamadı. Lütfen tekrar deneyin veya metni doğrudan yazın.');
      }
    }
  };

  const handleSelectPreset = (preset: PresetAmbush) => {
    setActivePresetId(preset.id);
    setSpokenTranscript(preset.opponentWords);
    latestTranscriptRef.current = preset.opponentWords;
    lastProcessedTextRef.current = preset.opponentWords;

    const result: VerbalCounterResult = {
      exactCounterWords: preset.instantCounter,
      vocalTone: preset.toneAdvice,
      psychologicalEffect: 'Kontrolü ve inisiyatifi karşı tarafın elinden alıp rasyonel çerçeveye çeker.',
      whatNeverToSay: preset.trapToAvoid
    };

    setCurrentResult(result);

    // Record turn
    setExchangeHistory((prev) => [
      {
        id: 'preset_' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        spokenText: preset.opponentWords,
        counterWords: preset.instantCounter,
        vocalTone: preset.toneAdvice
      },
      ...prev.slice(0, 9)
    ]);

    if (whisperAudio) {
      speakText(preset.instantCounter);
    }
  };

  const handleQuickTestPhrase = (phrase: string) => {
    setSpokenTranscript(phrase);
    latestTranscriptRef.current = phrase;
    executeVerbalCounter(phrase);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            0 Saniye Canlı Sözlü Savunma & Otomatik Kalkan
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Gerçek Hayatta Konuşulurken "Dur 5 Dakika" Denemez.
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Muhatap konuştuğu an dinler; söz bittiği saniye <strong>otomatik olarak</strong> ağzınızdan çıkacak en net otorite cümlesini ekrana getirir ve fısıldar.
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Auto Trigger Toggle */}
          <button
            type="button"
            onClick={() => setAutoTriggerEnabled(!autoTriggerEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              autoTriggerEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Konuşma duraksadığı an butona basmadan otomatik analiz üretir"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${autoTriggerEnabled ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span>Otomatik Yanıt: {autoTriggerEnabled ? 'Açık' : 'Kapalı'}</span>
          </button>

          {/* Earbud Whisper Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextState = !whisperAudio;
              setWhisperAudio(nextState);
              if (nextState && currentResult) {
                speakText(currentResult.exactCounterWords);
              }
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
              whisperAudio
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Kulaklık takılıysa karşı hamleyi sesli olarak kulağınıza fısıldar"
          >
            {whisperAudio ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{whisperAudio ? 'Kulaklık Fısıltısı Açık' : 'Kulaklık Fısıltısı Kapalı'}</span>
          </button>
        </div>
      </div>

      {/* Quick Test Bar (Instant Voice Test) */}
      <div className="mb-6 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" />
          Hızlı Test:
        </span>
        <button
          type="button"
          onClick={() => handleQuickTestPhrase('Bu fiyata bu işi yapmayız, yarı yarıya ineceksiniz!')}
          className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs transition-colors cursor-pointer"
        >
          "Fiyatı yarı yarıya ineceksiniz!"
        </button>
        <button
          type="button"
          onClick={() => handleQuickTestPhrase('Bunu hemen şimdi imzalamazsanız masadan kalkarız!')}
          className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs transition-colors cursor-pointer"
        >
          "Hemen imzalamazsanız kalkarız!"
        </button>
        <button
          type="button"
          onClick={() => handleQuickTestPhrase('Tüm aksaklık senin yüzünden oldu, zararı sen karşılayacaksın!')}
          className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs transition-colors cursor-pointer"
        >
          "Zararı sen karşılayacaksın!"
        </button>
      </div>

      {/* Main Real-Time HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column: Live Mic & Audio Pipeline (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 text-center shadow-xl backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
                Canlı Dinleme & Dinamik Analiz
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                {isListening ? (
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Mikrofon Aktif & Dinliyor
                  </span>
                ) : micPermissionGranted === false ? (
                  <span className="text-amber-400">İzin Bekleniyor</span>
                ) : (
                  <span className="text-zinc-500">Hazır</span>
                )}
              </div>
            </div>

            {/* Big Mic Button with Audio Level Ring */}
            <div className="flex flex-col items-center justify-center mb-4 relative">
              <button
                type="button"
                onClick={toggleListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl z-10 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white scale-110 shadow-rose-500/50'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30 hover:scale-105'
                }`}
                title={isListening ? 'Dinlemeyi durdur' : 'Dinlemeyi başlat'}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>

              {/* Real-time moving sound wave indicator */}
              {isListening && (
                <div className="mt-3 flex items-center gap-1 h-5">
                  <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span className="text-xs font-mono text-rose-300">Ses Seviyesi: %{audioLevel}</span>
                  <div className="w-16 bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800 ml-1">
                    <div
                      className="bg-rose-500 h-full transition-all duration-75"
                      style={{ width: `${Math.max(5, audioLevel)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Status Notification */}
            <div className="mb-3">
              {isPendingAutoAction ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Söz Algılandı — Otomatik Çözüm Üretiliyor...
                </div>
              ) : isListening ? (
                <p className="text-xs font-semibold text-zinc-300">
                  Karşı tarafı dinliyor. Cümle bittiğinde <strong>otomatik olarak</strong> karşı hamleyi çıkaracaktır.
                </p>
              ) : (
                <p className="text-xs font-semibold text-zinc-400">
                  Muhatap konuşmaya başlayınca yeşil butona dokunun.
                </p>
              )}
            </div>

            {/* Live Transcript / Manual Input Box */}
            <div className="mt-4 text-left">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Algılanan Sözler:
              </label>
              <div className="relative">
                <textarea
                  value={spokenTranscript}
                  onChange={(e) => {
                    setSpokenTranscript(e.target.value);
                    latestTranscriptRef.current = e.target.value;
                  }}
                  placeholder="Örn: 'Bunu hemen kabul etmezseniz anlaşma bozulur' (Konuşun veya buraya yazın...)"
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between mt-2.5 gap-2">
                <button
                  type="button"
                  onClick={() => executeVerbalCounter(spokenTranscript)}
                  disabled={isLoading || !spokenTranscript.trim()}
                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Sözlü Kalkan Hesaplanıyor...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Anında Karşı Hamleyi Getir</span>
                    </>
                  )}
                </button>

                {spokenTranscript && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpokenTranscript('');
                      latestTranscriptRef.current = '';
                      lastProcessedTextRef.current = '';
                      setCurrentResult(null);
                      setActivePresetId(null);
                    }}
                    className="p-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950 transition-colors cursor-pointer"
                    title="Temizle"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <div className="flex-1">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      toggleListening();
                    }}
                    className="mt-1.5 underline font-bold text-red-200 hover:text-white text-[11px] cursor-pointer"
                  >
                    Tekrar İzin İste / Yeniden Başlat
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Exchanges Timeline */}
          {exchangeHistory.length > 0 && (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                <History className="w-3.5 h-3.5 text-zinc-500" />
                <span>Son Konuşma Akışı ({exchangeHistory.length})</span>
              </div>
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {exchangeHistory.map((turn) => (
                  <div key={turn.id} className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800/60 text-xs">
                    <div className="flex items-center justify-between text-zinc-500 text-[10px] mb-1">
                      <span className="font-semibold text-rose-400">Muhatap</span>
                      <span>{turn.timestamp}</span>
                    </div>
                    <p className="text-zinc-300 mb-1.5 italic">"{turn.spokenText}"</p>
                    <div className="text-emerald-400 font-semibold flex items-start gap-1">
                      <ArrowRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-emerald-500" />
                      <span>"{turn.counterWords}"</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Giant HUD Response (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          {isLoading ? (
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-2xl p-8 flex-1 flex flex-col items-center justify-center text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">
                Otorite Kalkanı Hesaplanıyor...
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                Karşı tarafın psikolojik manipülasyonu çözümleniyor ve tavizsiz sözlü karşılık oluşturuluyor.
              </p>
            </div>
          ) : currentResult ? (
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-2xl p-6 sm:p-7 shadow-2xl flex-1 flex flex-col justify-between relative overflow-hidden animate-fadeIn">
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold uppercase tracking-widest">
                    <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                    ŞU AN AĞZINDAN ÇIKACAK TEK CÜMLE (OKU VEYA SÖYLE):
                  </div>
                  {whisperAudio && (
                    <button
                      type="button"
                      onClick={() => speakText(currentResult.exactCounterWords)}
                      className="text-xs text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Tekrar Dinle
                    </button>
                  )}
                </div>

                {/* GIANT HIGH-CONTRAST COUNTER PHRASE */}
                <div className="p-5 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 mb-5 shadow-inner">
                  <p className="text-lg sm:text-2xl font-black text-white leading-relaxed tracking-tight select-all">
                    "{currentResult.exactCounterWords}"
                  </p>
                </div>

                {/* Tone & Body Language Directive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                      <Eye className="w-3.5 h-3.5" />
                      Ses Tonu & Duruş Direktifi:
                    </div>
                    <p className="text-xs text-zinc-300 font-medium leading-normal">
                      {currentResult.vocalTone}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Bu Anda Asla Yapılmayacak Hata:
                    </div>
                    <p className="text-xs text-zinc-300 font-medium leading-normal">
                      {currentResult.whatNeverToSay}
                    </p>
                  </div>
                </div>
              </div>

              {/* Psychological Impact */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300/90 flex items-center gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>
                  <strong>Psikolojik Etki:</strong> {currentResult.psychologicalEffect}
                </span>
              </div>
            </div>
          ) : (
            /* Idle Placeholder */
            <div className="bg-zinc-900/40 border border-zinc-800/60 border-dashed rounded-2xl p-8 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-base font-bold text-zinc-300 mb-1">
                Sözlü Savunma Kalkanı Beklemede
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-4">
                Sol taraftaki mikrofonu açarak konuşun (otomatik olarak yanıt üretir) veya alttaki hazır pusu savarlardan birine dokunun.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Söz bittiği an ekranda belirecektir.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 0-Second Ambush Deck (Instant Reflex Triggers) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              0 Saniye Pusu Savar (Tek Dokunuşla Sözlü Kalkan)
            </h2>
          </div>
          <span className="text-xs text-zinc-500 hidden sm:inline">
            Konuşurken vakit yoksa doğrudan duruma dokunun
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_AMBUSHES.map((ambush) => {
            const isSelected = activePresetId === ambush.id;
            return (
              <button
                key={ambush.id}
                type="button"
                onClick={() => handleSelectPreset(ambush)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10'
                    : 'bg-zinc-900/70 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-zinc-200 group-hover:text-amber-400 transition-colors'}`}>
                    {ambush.triggerLabel}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs text-zinc-400 italic line-clamp-1 mb-2">
                  "{ambush.opponentWords}"
                </p>
                <div className="text-[11px] text-emerald-400/90 font-medium line-clamp-2">
                  ↳ "{ambush.instantCounter}"
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
