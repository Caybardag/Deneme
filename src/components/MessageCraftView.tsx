import React, { useState } from 'react';
import { MessageSquare, Send, Copy, Check, ShieldAlert, Sparkles, UserCheck, ArrowRight, CornerDownRight } from 'lucide-react';
import { MessageCraftResult } from '../types';

const RECIPIENTS = [
  'Patron / Yönetici',
  'Müşteri / Danışan',
  'İş Ortağı / Hissedar',
  'Borçlu / Alacaklı',
  'Eş / Sevgili / Yakın Aile',
  'Ev Sahibi / Kiracı',
];

const QUICK_GOALS = [
  { label: 'Ödenmemiş Parayı / Faturayı İsteme', text: 'Vadesi geçen ödemenin derhal hesaba yatırılmasını talep ediyorum.' },
  { label: 'Haftasonu / Gece Mesaisini Reddetme', text: 'Mesai saatleri dışındaki bu talebi karşılayamayacağımı, mesaim başladığında ele alacağımı bildirmek istiyorum.' },
  { label: 'Zam / Fiyat Artışı Bildirimi', text: 'Mevcut enflasyon ve katkım doğrultusunda ücretimi / fiyatımı revize etmem gerektiğini net şekilde iletmek istiyorum.' },
  { label: 'İstifa / İş Bırakma Bildirimi', text: 'Görevimden profesyonelce ve saygı çerçevesinde ayrılmak istediğimi bildirmek istiyorum.' },
  { label: 'Toksik Müdahaleye "Hayır" Deme', text: 'Kişisel alanıma ve kararlarıma saygı duyulmasını, bu konuda sınır çizdiğimi kesin dille anlatmak istiyorum.' },
  { label: 'Ortaklıktan Temiz Ayrılma', text: 'Projedeki hisselerimi devrederek veya şirketi tasfiye ederek temiz bir ayrılık yapmak istiyorum.' },
];

const TONES = [
  'Net & Profesyonel',
  'Sakin ama Tavizsiz',
  'Soğuk & Hukuki',
  'Dostane ama Sınır Çizen',
];

export const MessageCraftView: React.FC = () => {
  const [recipient, setRecipient] = useState(RECIPIENTS[0]);
  const [goal, setGoal] = useState(QUICK_GOALS[0].text);
  const [tone, setTone] = useState(TONES[0]);
  const [customDetails, setCustomDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MessageCraftResult | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/message-craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, goal, tone, customDetails }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Mesaj hazırlanamadı.');
      }
      setResult(data.data);
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-8 px-4 pb-20">
      {/* Intro */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>İletişim & Mesaj Zırhı</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Göndermeye çekindiğin o zor mesajı <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            10 saniyede hazırla ve kopyala.
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          "Hayır" diyememek, parasını isteyememek veya sınır çizememek insanları tüketir. Muhatabı seç, hazır mesajını al ve gönder.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-7 backdrop-blur-md space-y-5 mb-8 shadow-xl">
        {/* Recipient */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-2">
            1. Bu mesaj kime gidecek?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RECIPIENTS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecipient(r)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-left transition ${
                  recipient === r
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Goal Presets */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-2">
            2. Amacın ne? (Hazır durumlardan seç veya aşağıya yaz):
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {QUICK_GOALS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setGoal(q.text)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                  goal === q.text
                    ? 'border-teal-400 bg-teal-500/20 text-teal-300 font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            placeholder="Örn: 'Patronuma haftasonları mesajlara cevap vermeyeceğimi söylemek istiyorum...'"
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl p-3 focus:outline-none focus:border-emerald-500/50 resize-y"
          />
        </div>

        {/* Tone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              3. İletişim Tonu:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`py-1.5 px-2.5 rounded-lg border text-xs text-center transition ${
                    tone === t
                      ? 'border-teal-400 bg-teal-500/15 text-teal-300 font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Özel Not (Opsiyonel):
            </label>
            <input
              type="text"
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
              placeholder="Örn: '3 aydır erteliyor, toplam 25.000 TL alacağım var'"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !goal.trim()}
          className="w-full py-3.5 px-4 rounded-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Kusursuz Mesaj Taslağı Hazırlanıyor...</span>
            </div>
          ) : (
            <>
              <span>Kusursuz Mesajı & İletişim Zırhını Üret</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </>
          )}
        </button>
      </form>

      {/* Result Card */}
      {result && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 sm:p-7 space-y-6 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{result.headline}</span>
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Gönderime Hazır
            </span>
          </div>

          {/* WhatsApp Version (Primary) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                1. WhatsApp / SMS İçin Birebir Metin:
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(result.whatsappMessage, 'whatsapp')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                {copiedType === 'whatsapp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'whatsapp' ? 'Kopyalandı! Doğrudan Yapıştır' : 'WhatsApp İçin Kopyala'}</span>
              </button>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 text-sm sm:text-base text-slate-100 font-sans leading-relaxed whitespace-pre-line shadow-inner">
              {result.whatsappMessage}
            </div>
          </div>

          {/* Email Version */}
          {result.emailVersion && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  2. Resmi E-Posta Versiyonu:
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.emailVersion, 'email')}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedType === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'email' ? 'Kopyalandı' : 'E-Postayı Kopyala'}</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-line">
                {result.emailVersion}
              </div>
            </div>
          )}

          {/* Golden Rules */}
          {result.goldenRules && result.goldenRules.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Bu Mesajı Gönderirken 3 Altın Kural:
              </span>
              <ul className="space-y-1.5">
                {result.goldenRules.map((rule, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* If They Resist Playbook */}
          {result.ifTheyResist && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-1.5">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Eğer İtiraz Eder veya Manipüle Ederse Ne Yazacaksın?</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                {result.ifTheyResist}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
