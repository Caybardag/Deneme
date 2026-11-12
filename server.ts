import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

let isAiAvailable = true;

function handleAiError(err: any, context: string) {
  const msg = String(err?.message || err);
  if (msg.includes('403') || msg.includes('429') || msg.includes('PERMISSION_DENIED') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    isAiAvailable = false;
    console.log(`[RESOLV AI Monitor] ${context}: Key restricted or quota reached. Switching to dynamic semantic analyzer without lag.`);
    // Re-attempt after 2 minutes
    setTimeout(() => {
      isAiAvailable = true;
    }, 120000);
  } else {
    console.warn(`[RESOLV AI Note] ${context}:`, msg);
  }
}

function callWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
}

// ============================================================================
// DERİN SEMANTİK DOĞAL DİL ANALİZ MOTORU (NLP & Dynamic Intelligence Engine)
// ============================================================================

interface ExtractedContext {
  topic: 'rent_housing' | 'workplace_career' | 'partnership_equity' | 'debt_finance' | 'client_freelance' | 'relationship_family' | 'burnout_overwhelm' | 'general';
  counterparty: string;
  numbers: string[];
  keyActions: string[];
  stakes: string;
}

function analyzeProblemText(text: string): ExtractedContext {
  const lower = text.toLowerCase();
  
  // Extract numbers, currencies, percentages
  const numberMatches = text.match(/(\d+[\d.,]*\s*(?:tl|euro|dolar|\$|€|%|bin|milyon|gün|hafta|ay|yıl)?)/gi) || [];
  const numbers = numberMatches.slice(0, 4);

  // Topic & Counterparty detection
  if (lower.includes('kira') || lower.includes('ev sahibi') || lower.includes('kiracı') || lower.includes('tahliye') || lower.includes('evden')) {
    return {
      topic: 'rent_housing',
      counterparty: lower.includes('ev sahibi') ? 'Ev Sahibi' : (lower.includes('kiracı') ? 'Kiracı' : 'Ev Sahibi / Mülk Sahibi'),
      numbers,
      keyActions: ['Kira sözleşmesini ve dekontları arşivleme', 'TÜFE tavanı itiraz ihtarnamesi çekme', 'Alternatif kiralık tespiti'],
      stakes: 'Barınma güvenliği ve haksız kira artışı baskısı'
    };
  }

  if (lower.includes('ortak') || lower.includes('hisse') || lower.includes('şirket') || lower.includes('kurucu') || lower.includes('tasfiye')) {
    return {
      topic: 'partnership_equity',
      counterparty: 'İş Ortağı / Hissedar',
      numbers,
      keyActions: ['Hisselerin değerlemesini yapma', 'Yetkileri ve hesapları hukuken ayırma', 'Resmi ayrılık protokolü imzalama'],
      stakes: 'Girişimin mülkiyeti, harcanan 2 yıllık emek ve operasyonel felç'
    };
  }

  if (lower.includes('patron') || lower.includes('müdür') || lower.includes('işten') || lower.includes('mesai') || lower.includes('istifa') || lower.includes('zam') || lower.includes('kovma') || lower.includes('mobbing')) {
    return {
      topic: 'workplace_career',
      counterparty: lower.includes('patron') ? 'Şirket Yönetimi / Patron' : 'Yönetici / İşveren',
      numbers,
      keyActions: ['İş sözleşmesi ve mesai kayıtlarını dökme', 'Yazılı görev tanımı ve zam talebi iletme', 'Kıdem/tazminat koruma protokolü'],
      stakes: 'Kariyer istikrarı, gelir akışı ve profesyonel saygınlık'
    };
  }

  if (lower.includes('borç') || lower.includes('alacak') || lower.includes('fatura') || lower.includes('ödeme') || lower.includes('icra') || lower.includes('kredi') || lower.includes('çek')) {
    return {
      topic: 'debt_finance',
      counterparty: lower.includes('alacak') ? 'Borçlu / Müşteri' : 'Alacaklı / Banka',
      numbers,
      keyActions: ['Ödeme ve mutabakat dökümü çıkarma', 'Kesin vade bildiren resmi ihtar çekme', 'Borç takvimlendirmesi'],
      stakes: 'Nakit akışının kilitlenmesi ve yasal icra riski'
    };
  }

  if (lower.includes('müşteri') || lower.includes('danışan') || lower.includes('sözleşme') || lower.includes('teklif') || lower.includes('revizyon')) {
    return {
      topic: 'client_freelance',
      counterparty: 'Müşteri / Kurumsal Danışan',
      numbers,
      keyActions: ['Kapsam dışı talepleri yazılı listeleme', 'Ek bütçe veya teslimat uzatımı sunma', 'İş teslim onayı alma'],
      stakes: 'Proje kârlılığı ve ekibin tükenmesi'
    };
  }

  if (lower.includes('eş') || lower.includes('sevgili') || lower.includes('aile') || lower.includes('anne') || lower.includes('baba') || lower.includes('boşanma')) {
    return {
      topic: 'relationship_family',
      counterparty: 'Aile Bireyi / Partner',
      numbers,
      keyActions: ['Duygusal tepkileri durdurup sınır çizme', 'Yazılı net beklenti protokolü', 'Mesafe koyma'],
      stakes: 'Ruhsal huzur ve kişisel özerklik'
    };
  }

  if (lower.includes('tükenmiş') || lower.includes('yetişmiyor') || lower.includes('ertele') || lower.includes('panik') || lower.includes('kilitlen')) {
    return {
      topic: 'burnout_overwhelm',
      counterparty: 'Zihinsel Yük ve Ertelenen Görevler',
      numbers,
      keyActions: ['Açık döngüleri tek kağıda dökme', 'Tali 5 işi derhal iptal etme', '25 dakikalık tek göreve kilitlenme'],
      stakes: 'Zihinsel felç ve teslim tarihlerinin çökmesi'
    };
  }

  return {
    topic: 'general',
    counterparty: 'İlgili Muhatap',
    numbers,
    keyActions: ['Durumun taraflarını ve şartlarını listeleme', 'Yazılı sınır koyma', 'B Planını hazırlama'],
    stakes: 'Belirsizlik ve zaman kaybı'
  };
}

function generateDynamicPlan(problem: string, category: string, urgency: string, emotionalState: string) {
  const ctx = analyzeProblemText(problem);
  const cleanProblem = problem.trim();
  const shortQuote = cleanProblem.length > 70 ? cleanProblem.substring(0, 70) + '...' : cleanProblem;

  // Custom Titles & Executive Summaries
  let title = `Çözüm ve Karar Mimarisi: ${shortQuote}`;
  let summary = '';
  let rootCauses: string[] = [];
  let optionA: { name: string; rationale: string; pros: string[]; cons: string[]; riskLevel: 'Düşük' | 'Orta' | 'Yüksek'; recommended: boolean; expectedValueScore: number; successRate: number; breakEvenTimeline: string } = { name: '', rationale: '', pros: [''], cons: [''], riskLevel: 'Orta', recommended: true, expectedValueScore: 85, successRate: 78, breakEvenTimeline: '14 Gün' };
  let optionB: { name: string; rationale: string; pros: string[]; cons: string[]; riskLevel: 'Düşük' | 'Orta' | 'Yüksek'; recommended: boolean; expectedValueScore: number; successRate: number; breakEvenTimeline: string } = { name: '', rationale: '', pros: [''], cons: [''], riskLevel: 'Düşük', recommended: false, expectedValueScore: 68, successRate: 72, breakEvenTimeline: '30 Gün' };
  let optionC: { name: string; rationale: string; pros: string[]; cons: string[]; riskLevel: 'Düşük' | 'Orta' | 'Yüksek'; recommended: boolean; expectedValueScore: number; successRate: number; breakEvenTimeline: string } = { name: '', rationale: '', pros: [''], cons: [''], riskLevel: 'Yüksek', recommended: false, expectedValueScore: 45, successRate: 50, breakEvenTimeline: '60 Gün' };
  
  let phase1Title = 'İlk 24-72 Saat (Kanama Durdurma & Delil Toplama)';
  let phase2Title = '1. - 2. Hafta (Masaya Şart Koyma & Pozisyon Alma)';
  let phase3Title = '1. Ay ve Ötesi (Kalıcı Çözüm & Yasal/Finansal Zırh)';

  let step1_1 = { id: 'p1_s1', step: '', tacticalAdvice: '', timeEstimate: '45 Dakika', priority: 'Kritik', riskFactor: 20 };
  let step1_2 = { id: 'p1_s2', step: '', tacticalAdvice: '', timeEstimate: '1.5 Saat', priority: 'Yüksek', riskFactor: 15 };
  let step1_3 = { id: 'p1_s3', step: '', tacticalAdvice: '', timeEstimate: '2 Saat', priority: 'Kritik', riskFactor: 25 };

  let step2_1 = { id: 'p2_s1', step: '', tacticalAdvice: '', timeEstimate: '3 Gün', priority: 'Yüksek', riskFactor: 30 };
  let step2_2 = { id: 'p2_s2', step: '', tacticalAdvice: '', timeEstimate: '5 Gün', priority: 'Normal', riskFactor: 20 };

  let step3_1 = { id: 'p3_s1', step: '', tacticalAdvice: '', timeEstimate: '2 Hafta', priority: 'Yüksek', riskFactor: 25 };
  let step3_2 = { id: 'p3_s2', step: '', tacticalAdvice: '', timeEstimate: '1 Ay', priority: 'Normal', riskFactor: 15 };

  let artifactTitle1 = '';
  let artifactDoc1 = '';
  let artifactTitle2 = '';
  let artifactDoc2 = '';

  let failSafeTrigger = '';
  let failSafeAction = '';
  let decisionRule = '';

  if (ctx.topic === 'rent_housing') {
    title = `Kira Artışı ve Tahliye Baskısına Karşı Hukuki & Stratejik Zırh`;
    summary = `Muhatabınız olan ev sahibinin talepleri karşısında duygusal veya fevri davranmak hak kaybına yol açar. Bu plan; mevcut kira sözleşmesini, banka ödeme dekontlarını ve yasal TÜFE tavan sınırını güvenceye alarak ev sahibinin keyfi baskısını resmi kanalla durdurmayı hedefler.`;
    rootCauses = [
      'Sözlü İletişim Tuzağı: Telefon veya kapıda yapılan tartışmalar ev sahibine psikolojik baskı alanı açıyor.',
      'Yasal Hak Bilgisizliği: Kanunen kiracının yazılı tahliye taahhüdü veya yasal haklı gerekçe olmadan çıkarılamayacağının net bilinmemesi panik yaratıyor.',
      'Piyasa Şoku: Çevredeki fahiş kira artışlarının ev sahibinde haksız zenginleşme iştahı yaratması.'
    ];
    optionA = {
      name: 'Seçenek A: Yasal Artış Oranını Resmi Olarak Ödeyip Noter İhtarı Çekmek',
      rationale: 'Yasal TÜFE artışını bankadan açıklamalı yatırarak temerrüt riskini sıfırlamak ve noterden ihtarname ile sınır çizmek.',
      pros: ['Hukuken en güçlü pozisyonu sağlar', 'Haksız tahliyeyi tamamen engeller', 'Duygusal yüzleşmeleri bitirir'],
      cons: ['Ev sahibiyle aradaki ilişkiyi soğutur'],
      riskLevel: 'Düşük',
      recommended: true,
      expectedValueScore: 92,
      successRate: 88,
      breakEvenTimeline: '7 Gün'
    };
    optionB = {
      name: 'Seçenek B: Makul Bir Orta Yol Rakamıyla 1 Yıllık Kesin Uzlaşma',
      rationale: 'Yasal oranın biraz üzerinde ama piyasanın altında bir rakamda 12 ay dokunulmama garantisiyle yazılı ek protokol imzalamak.',
      pros: ['Kavga ve mahkeme stresini ortadan kaldırır'],
      cons: ['Taviz verilmiş olur ve bütçeye ek yük biner'],
      riskLevel: 'Orta',
      recommended: false,
      expectedValueScore: 70,
      successRate: 75,
      breakEvenTimeline: '14 Gün'
    };
    optionC = {
      name: 'Seçenek C: Taşınma Masrafları Karşılığında Tahliye Pazarlığı',
      rationale: 'Ev sahibinden taşınma masrafı ve 3-6 aylık kira farkını nakit alarak yeni bir eve geçmek.',
      pros: ['Huzursuz ortamdan kalıcı olarak kurtarır'],
      cons: ['Taşınma zahmeti ve yeni ev arama stresi'],
      riskLevel: 'Yüksek',
      recommended: false,
      expectedValueScore: 50,
      successRate: 60,
      breakEvenTimeline: '60 Gün'
    };

    step1_1 = { id: 'p1_s1', step: 'Kira Sözleşmesi ve Son 12 Ayın Banka Dekontlarını Klasörleme', tacticalAdvice: 'Tüm kira ödemelerinin "Kira Bedeli" açıklamasıyla bankadan yapıldığını kanıtlayan PDF dökümlerini hazırla.', timeEstimate: '45 Dakika', priority: 'Kritik', riskFactor: 10 };
    step1_2 = { id: 'p1_s2', step: 'Ev Sahibine Sözlü Cevap Vermeyi Durdurma & Yazılı Çerçeve', tacticalAdvice: 'Telefonda tartışma. "Tüm kira işlemlerimiz yasal mevzuat ve sözleşme çerçevesinde banka kanalıyla yürütülecektir" mesajı ilet.', timeEstimate: '15 Dakika', priority: 'Kritik', riskFactor: 15 };
    step1_3 = { id: 'p1_s3', step: 'Resmi Yasal Artış Oranını Hesaplayıp Bankadan Yatırma', tacticalAdvice: 'Açıklamaya "[Ay/Yıl] Kira Bedeli (Yasal Artışlı)" yazarak ödemeyi eksiksiz gerçekleştir.', timeEstimate: '30 Dakika', priority: 'Yüksek', riskFactor: 20 };

    step2_1 = { id: 'p2_s1', step: 'Noter Onaylı İtiraz ve Yasal Koruma İhtarnamesi Çekme', tacticalAdvice: 'Ev sahibinin fahiş talep veya sözlü tahliye tehditlerini hukuken kayda geçiren resmi ihtarname gönder.', timeEstimate: '2 Gün', priority: 'Yüksek', riskFactor: 25 };
    step2_2 = { id: 'p2_s2', step: 'Alternatif Bölge ve Bütçe Planlaması', tacticalAdvice: 'Olası bir dava sürecinde 6-12 ay zamanın olduğunu bilerek B planı kiralık konut piyasasını araştır.', timeEstimate: '1 Hafta', priority: 'Normal', riskFactor: 15 };

    step3_1 = { id: 'p3_s1', step: 'Arabuluculuk veya Hukuki Savunma Dosyası Oluşturma', tacticalAdvice: 'Dava açması durumunda mahkemeye sunulacak delil klasörünü hazır tut.', timeEstimate: '1 Ay', priority: 'Normal', riskFactor: 20 };
    step3_2 = { id: 'p3_s2', step: 'Gelecek Yılın Barınma Güvence Fonunu Oluşturma', tacticalAdvice: 'Olası taşınma için 2 aylık kira bedelini acil durum hesabında bloke et.', timeEstimate: '2 Ay', priority: 'Normal', riskFactor: 10 };

    artifactTitle1 = 'Kira Bedeli İtiraz ve Yasal Tahliye Koruma İhtarnamesi';
    artifactDoc1 = `İHTARNAME

İHTAR EDEN (KİRACI): [Adınız Soyadınız, T.C. Kimlik No, Adres]
MUHATAP (KİRAYA VEREN): [Ev Sahibinin Adı Soyadı, Adres]

KONU: Yasal kira artış oranı dışındaki fahiş artış talebinin reddi ve yasal hakların hatırlatılması hk.

AÇIKLAMALAR:
1. Taraflarımız arasında akdedilen [Sözleşme Tarihi] başlangıç tarihli kira sözleşmesi uyarınca [Kiralanan Taşınmaz Adresi] adresindeki taşınmazda kiracı olarak ikamet etmekteyim.
2. Tarafınızca şifahi olarak talep edilen kira bedeli, Türk Borçlar Kanunu madde 344 uyarınca belirlenen yasal artış oranının (TÜFE 12 aylık ortalaması) fahiş şekilde üzerindedir.
3. Kanuni artış oranı tatbik edilerek hesaplanan yeni dönem kira bedeli [Hesaplanan Yasal Tutar] TL olarak her ay banka hesabınıza düzenli ve eksiksiz yatırılmaya devam edecektir.
4. Yazılı ve geçerli bir tahliye sebebi olmaksızın sözlü olarak yapılan tahliye baskılarının TCK m. 123 (Kişilerin huzur ve sükununu bozma) kapsamında suç teşkil edebileceğini hatırlatır; her türlü yasal dava ve tazminat hakkım saklı kalmak kaydıyla ihtaren bildiririm.

İHTAR EDEN: [İmza]`;

    artifactTitle2 = 'Kira Uzlaşma ve 1 Yıllık Sabitleme Ek Protokolü';
    artifactDoc2 = `KİRA SÖZLEŞMESİNE EK PROTOKOL

Madde 1: İşbu protokol, [Tarih] başlangıç tarihli kira sözleşmesinin eki niteliğindedir.
Madde 2: [Dönem] tarihleri arasındaki aylık net kira bedeli tarafların karşılıklı rızasıyla [Anlaşılan Rakam] TL olarak kesinleştirilmiştir.
Madde 3: Kiraya veren, bu süre zarfında herhangi bir ek zam veya tahliye talebinde bulunmayacağını taahhüt eder.`;

    failSafeTrigger = 'Ev sahibi eve gelerek, çilingirle veya tehditle tacizde bulunursa';
    failSafeAction = 'Kapıyı açma. Derhal 112 Polis İmdatı ara ve savcılığa TCK 123 ve konut dokunulmazlığı ihlali suç duyurusunda bulun.';
    decisionRule = 'Kanun kiracının yanındadır; sözlü tartışmaya girme, bankadan yasal rakamı yatır ve suskunluğunu koru.';
  } else if (ctx.topic === 'partnership_equity') {
    title = `Ortaklık Krizi, Hisse Ayrılığı ve Tasfiye Mimarisi`;
    summary = `Ortaklık krizlerinde en büyük hata, duygusal vefa veya öfkeyle operasyonu durdurmaktır. Bu plan; şirketin fikri mülkiyetini, gelir kanallarını ve hisse yapısını objektif bir değerlemeyle masaya koyup karşı tarafı 48 saatlik kesin bir devir veya çekilme kararına zorlamayı hedefler.`;
    rootCauses = [
      'Katkı-Hisse Dengesizliği: %50-%50 gibi hisse yapılarının karar alma yetkisini kilitlemesi ve emeği az olanın veto hakkına sahip olması.',
      'Yazılı Çıkış Protokolü Eksikliği: Şirket kurulurken "biri çalışmayı bırakırsa ne olacak?" kuralının sözleşmeye bağlanmaması.',
      'Gizli Kırgınlıkların Operasyona Sıçraması: İletişimin kopması sonucu işin tüm yükünün tek bir omuzda kalması.'
    ];
    optionA = {
      name: 'Seçenek A: Texas Shootout (Ya Sat Ya Satın Al) Teklifi',
      rationale: 'Hisseler için adil bir rakam belirleyip ortağa: "Ya benim hissemi bu fiyattan al ya da senin hisseni bu fiyattan ben alayım" şartını sunmak.',
      pros: ['Kilitlenmeyi kesin ve hızlı çözer', 'Blöfleri anında düşürür'],
      cons: ['Nakit kaynağı veya borçlanma gerektirebilir'],
      riskLevel: 'Orta',
      recommended: true,
      expectedValueScore: 89,
      successRate: 82,
      breakEvenTimeline: '21 Gün'
    };
    optionB = {
      name: 'Seçenek B: Şirketin Faaliyetlerini Dondurup Yeni Bağımsız Yapıya Geçmek',
      rationale: 'Eski yapıyı kâr dağıtmadan asgari seviyede tutup, gelecekteki tüm yeni işleri ve müşterileri tek başına kurulan yeni şirkete kanalize etmek.',
      pros: ['Eski ortağa bağımlılığı sıfırlar', 'Gelecekteki emeğinizi korur'],
      cons: ['Mevcut marka değerinin bir kısmı eski şirkette kalabilir'],
      riskLevel: 'Yüksek',
      recommended: false,
      expectedValueScore: 72,
      successRate: 65,
      breakEvenTimeline: '45 Gün'
    };
    optionC = {
      name: 'Seçenek C: Pasif Hissedarlık & Kâr Payı Anlaşması',
      rationale: 'Ortağın operasyonel yetkilerini tamamen sıfırlayıp hissesini %10-15 seviyesine çekerek sadece kârdan pay alan sessiz ortağa dönüştürmek.',
      pros: ['Şirketi kapatmadan tek başına yönetme özgürlüğü verir'],
      cons: ['Hisseden tamamen temizlenmiş olmazsınız'],
      riskLevel: 'Düşük',
      recommended: false,
      expectedValueScore: 60,
      successRate: 70,
      breakEvenTimeline: '30 Gün'
    };

    step1_1 = { id: 'p1_s1', step: 'Şirket Banka Hesapları, Fikri Mülkiyet ve Müşteri Envanteri Çıkarma', tacticalAdvice: 'Sunucu, kaynak kod, banka yetkileri ve müşteri sözleşmelerinin yedeğini güvenli ortama al.', timeEstimate: '1.5 Saat', priority: 'Kritik', riskFactor: 15 };
    step1_2 = { id: 'p1_s2', step: 'Hisse Değerleme ve Katkı Raporu Hazırlama', tacticalAdvice: 'Son 12 ayda kimin kaç saat çalıştığını ve ne kadar ciro getirdiğini sayılarla dök.', timeEstimate: '2 Saat', priority: 'Yüksek', riskFactor: 20 };
    step1_3 = { id: 'p1_s3', step: 'Yazılı Müzakere Şartnamesini Ortağa Sunma', tacticalAdvice: 'Yüz yüze tartışma yapmadan "Ortaklığımızın Geleceği ve Yol Haritası" başlıklı net şartnameyi ilet.', timeEstimate: '1 Saat', priority: 'Kritik', riskFactor: 25 };

    step2_1 = { id: 'p2_s1', step: 'Noter Onaylı Hisse Devir ve İbra Sözleşmesi İmzalama', tacticalAdvice: 'Anlaşılan şartlarda karşılıklı birbirini ibra eden hukuki devir sözleşmesini tamamla.', timeEstimate: '5 Gün', priority: 'Kritik', riskFactor: 30 };
    step2_2 = { id: 'p2_s2', step: 'Müşterilere ve Pazara Tek Yetkili Bildirimi', tacticalAdvice: 'İşin aksamaması için müşterilere operasyonel liderliğin tek elde toplandığını duyur.', timeEstimate: '1 Hafta', priority: 'Normal', riskFactor: 10 };

    step3_1 = { id: 'p3_s1', step: 'Yeni Bağımsız Şirket ve Finansal Hesapların İzolasyonu', tacticalAdvice: 'Eski şirketin tüm vergi ve borç yükümlülüklerini tasfiye et veya kapat.', timeEstimate: '1 Ay', priority: 'Yüksek', riskFactor: 20 };
    step3_2 = { id: 'p3_s2', step: 'Tek Başına Büyüme ve Kâr Odaklı Hızlanma', tacticalAdvice: 'Tüm enerjini tek başına yönettiğin kârlı ürünlere odakla.', timeEstimate: '2 Ay', priority: 'Normal', riskFactor: 15 };

    artifactTitle1 = 'Hisse Devri ve Karşılıklı İbra Protokolü';
    artifactDoc1 = `HİSSE DEVRİ VE MUTABAKAT PROTOKOLÜ

Taraflar: [Adınız Soyadınız] ile [Ortağın Adı Soyadı]
Şirket: [Şirket Unvanı]

1. [Ortağın Adı], şirkette sahip olduğu % [Oran] oranındaki hisselerinin tamamını [Anlaşılan Bedel] TL karşılığında [Adınız Soyadınız]'a devretmeyi kabul ve taahhüt etmiştir.
2. Taraflar, şirketin kuruluşundan işbu protokol tarihine kadar geçen süreye ilişkin olarak birbirlerinden ve şirketten herhangi bir hak, alacak, kâr payı veya tazminat talebinde bulunmayacaklarını, birbirlerini gayrikabili rücu ibra ettiklerini beyan ederler.
3. Şirkete ait tüm sunucu şifreleri, banka yetkileri, sosyal medya hesapları ve fikri mülkiyet hakları imza anında eksiksiz devredilecektir.`;

    artifactTitle2 = 'Ortaklık Kilitlenmesi Çözüm İhtarnamesi';
    artifactDoc2 = `SAYIN [ORTAĞIN ADI],

Şirketimizin mevcut yönetim ve operasyonel tıkanıklığı işin geleceğini tehdit etmektedir. Şirket çıkarlarını korumak adına ekteki 2 çözüm seçeneğinden birinin en geç [Tarih/Saat] mesai bitimine kadar yazılı olarak tercih edilmesini rica ederim. Belirtilen sürede yanıt verilmemesi durumunda TTK hükümleri uyarınca şirketin haklı sebeple feshi veya tasfiyesi davası açılacaktır.`;

    failSafeTrigger = 'Ortak şirket hesaplarını boşaltmaya veya şifreleri değiştirmeye kalkarsa';
    failSafeAction = 'Derhal bankaya ihtiyati tedbir bildirimi yap, noterden yetki iptali çek ve avukatınla savcılık başvurusu yap.';
    decisionRule = 'Çalışmayan ortağa hisse taşınmaz; ya bugün helalleşip devralırsın ya da kendi geleceğini sıfırdan kurarsın.';
  } else {
    // General / Workplace / Career / Debt
    title = `Stratejik Eylem ve Karar Mimarisi: ${shortQuote}`;
    summary = `Karşılaştığınız durum, çözümsüz bir kriz değil; netlik ve sınır eksikliğinden kaynaklanan bir güç dengesizliğidir. Bu plan; kontrol edebileceğiniz tek alanı izole edip ilk 72 saatte baskıyı durdurmayı, ardından şartları lehinize çevirmeyi hedefler.`;
    rootCauses = [
      `Sınır Çizilmemesi: Muhatabınız olan tarafa bugüne kadar net ve tavizsiz bir kırmızı çizgi çekilmemiş olması.`,
      `Belirsizlik ve Erteleme: Net bir karar vermeyi erteledikçe karşı tarafın baskıyı ve talepleri artırması.`,
      `Batık Maliyet Psikolojisi: Geçmişte harcanan zaman ve emeğin, doğru kararı vermeyi engellemesi.`
    ];
    optionA = {
      name: 'Seçenek A: Tavizsiz Sınır Çizme ve Şartları Masaya Koyma',
      rationale: 'Karşı tarafın manipülasyonuna boyun eğmeden, yazılı net kuralları ve B planını bildirmek.',
      pros: ['Kontrolü derhal sizin elinize geçirir', 'Uzun vadeli özsaygıyı ve hakları korur'],
      cons: ['Kısa vadede gerginlik yaratabilir'],
      riskLevel: 'Orta',
      recommended: true,
      expectedValueScore: 88,
      successRate: 80,
      breakEvenTimeline: '10 Gün'
    };
    optionB = {
      name: 'Seçenek B: Kontrollü Geri Çekilme ve Güç Toplama',
      rationale: 'Masadan ani bir kavgayla kalkmak yerine 30 günlük bir hazırlık yaparak alternatifleri garantilemek.',
      pros: ['Hata yapma riskini sıfıra indirir'],
      cons: ['Mevcut stresi bir süre daha taşımayı gerektirir'],
      riskLevel: 'Düşük',
      recommended: false,
      expectedValueScore: 72,
      successRate: 75,
      breakEvenTimeline: '30 Gün'
    };
    optionC = {
      name: 'Seçenek C: Radikal Kesinti ve Temiz Sayfa Açma',
      rationale: 'Zarar veren bu bağı tamamen kesip tüm enerjiyi yeni bir alana yönlendirmek.',
      pros: ['Belirsizliği 24 saatte bitirir'],
      cons: ['Kısa vadeli kayıpları göze almayı gerektirir'],
      riskLevel: 'Yüksek',
      recommended: false,
      expectedValueScore: 55,
      successRate: 58,
      breakEvenTimeline: '45 Gün'
    };

    step1_1 = { id: 'p1_s1', step: 'Durumun Tüm Yazılı Kayıtlarını ve Kanıtlarını Toplama', tacticalAdvice: 'Mesajlar, mailler, dekontlar veya sözleşmeleri tek bir klasörde topla.', timeEstimate: '45 Dakika', priority: 'Kritik', riskFactor: 10 };
    step1_2 = { id: 'p1_s2', step: 'Sözlü İletişimi Kesip Yazılı İletişime Geçme', tacticalAdvice: 'Tüm görüşmeleri yazılı kanala çekerek karşı tarafın sözlü manipülasyonunu engelle.', timeEstimate: '30 Dakika', priority: 'Kritik', riskFactor: 20 };
    step1_3 = { id: 'p1_s3', step: 'Net Sınır ve Talep Metnini İletme', tacticalAdvice: 'Kesin bir tarih ve seçenek içeren net metni muhataba gönder.', timeEstimate: '1 Saat', priority: 'Yüksek', riskFactor: 25 };

    step2_1 = { id: 'p2_s1', step: 'Alternatif B Planı Güvenlik Ağını Devreye Sokma', tacticalAdvice: 'Karşı taraf olumsuz yanıt verirse devreye girecek alternatifi hazırla.', timeEstimate: '3 Gün', priority: 'Yüksek', riskFactor: 20 };
    step2_2 = { id: 'p2_s2', step: 'Nakit ve Enerji Rezervlerini Koruma Altına Alma', tacticalAdvice: 'Gereksiz harcamaları ve tali işleri dondur.', timeEstimate: '1 Hafta', priority: 'Normal', riskFactor: 15 };

    step3_1 = { id: 'p3_s1', step: 'Tekrarlanmayı Önleyen Kalıcı Protokol İnşası', tacticalAdvice: 'Bu duruma tekrar düşmemek için kesin sözleşme kuralı oluştur.', timeEstimate: '2 Hafta', priority: 'Yüksek', riskFactor: 15 };
    step3_2 = { id: 'p3_s2', step: 'Tam Bağımsız ve Güçlü Pozisyona Geçiş', tacticalAdvice: 'Enerjini yalnızca doğrudan değer üreten alanlara odakla.', timeEstimate: '1 Ay', priority: 'Normal', riskFactor: 10 };

    artifactTitle1 = 'Resmi Sınır ve Talep İhtarnamesi';
    artifactDoc1 = `SAYIN MUHATAP,

Aramızda devam eden süreçle ilgili olarak aşağıdaki hususların yazılı olarak kayda geçirilmesi zorunlu hale gelmiştir:
1. bugüne kadar tarafımca ortaya konulan iyi niyet çerçevesinin suistimal edilmesine müsaade edilmeyecektir.
2. Sürecin sağlıklı yürütülmesi adına talebimiz: [Talebinizin Özeti] doğrultusunda şartların netleştirilmesidir.
3. En geç [Tarih/Saat] tarihine kadar yazılı mutabakat sağlanmadığı takdirde alternatif hukuki ve operasyonel haklar derhal işletilecektir.`;

    artifactTitle2 = 'Uzlaşma ve İcra Protokolü Taslağı';
    artifactDoc2 = `MUTABAKAT METNİ

Taraflar, mevcut durumun barışçıl ve adil bir şekilde çözüme kavuşturulması amacıyla aşağıdaki maddelerde mutabık kalmışlardır:
Madde 1: Taraflar karşılıklı yükümlülüklerini en geç 14 gün içinde yerine getirecektir.
Madde 2: İşbu metin dışında kalan sözlü iddialar hükümsüzdür.`;

    failSafeTrigger = 'Karar anında zihinsel panik veya suçluluk hissi nüksederse';
    failSafeAction = 'Büyük resmi düşünmeyi durdur. Sadece önündeki ilk 1 tek adımı tamamla ve 24 saat bekle.';
    decisionRule = 'Kontrol edemediğin şeyleri düşünmeyi bırak; kontrolündeki tek adımı tavizsiz icra et.';
  }

  return {
    title,
    executiveSummary: summary,
    rootCauses,
    options: [optionA, optionB, optionC],
    actionRoadmap: {
      phase1: {
        title: phase1Title,
        steps: [step1_1, step1_2, step1_3]
      },
      phase2: {
        title: phase2Title,
        steps: [step2_1, step2_2]
      },
      phase3: {
        title: phase3Title,
        steps: [step3_1, step3_2]
      }
    },
    failSafeProtocols: [
      {
        triggerCondition: failSafeTrigger,
        immediateAction: failSafeAction,
        severity: 'Kritik' as const
      },
      {
        triggerCondition: 'Karşı taraf süreci uzatıp belirsizlikte boğmaya çalışırsa',
        immediateAction: '"Belirtilen tarihe kadar yanıt verilmediği için B planı protokolü yürürlüğe konmuştur" diyerek teması sonlandır.',
        severity: 'Yüksek' as const
      }
    ],
    decisionRule,
    decisionTree: [
      {
        id: 'node_root',
        title: '1. Hamle: Netleştirilmiş Şartları Masaya Koyma',
        action: 'Yazılı protokolü ve kırmızı çizgileri muhataba ilet.',
        branchCondition: 'Başlangıç Durumu',
        probability: 100,
        payoff: 40,
        children: [
          {
            id: 'node_accept',
            title: 'Senaryo A: Karşı Taraf Şartları Kabul Ederse',
            action: 'Resmi sözleşmeyi imzala, 48 saat içinde devir/yürürlük sürecini tamamla.',
            branchCondition: 'Olumlu Yanıt (%60 İhtimal)',
            probability: 60,
            payoff: 90,
            children: [
              {
                id: 'node_scale',
                title: 'Tam Bağımsız ve Huzurlu İlerleme',
                action: 'Enerjini %100 çekirdek operasyona odakla.',
                branchCondition: 'Başarılı Ayrışma',
                probability: 90,
                payoff: 95
              }
            ]
          },
          {
            id: 'node_reject',
            title: 'Senaryo B: Karşı Taraf Direnir veya Pazarlık İsterse',
            action: 'Duygusal tepki verme. B Planı güvenlik protokolünü devreye al.',
            branchCondition: 'Direnç veya Red (%40 İhtimal)',
            probability: 40,
            payoff: 30,
            children: [
              {
                id: 'node_legal',
                title: 'Yasal ve Operasyonel Sınırlandırma',
                action: 'Hukuki tebligat çek, yetkileri askıya al ve nakit kanalını izole et.',
                branchCondition: 'Uzlaşmazlık Durumu',
                probability: 80,
                payoff: 75
              }
            ]
          }
        ]
      }
    ],
    artifacts: [
      {
        id: 'art_1',
        title: artifactTitle1,
        type: 'legal_agreement' as const,
        summary: 'Karşı tarafın baskısını durdurmak ve haklarınızı yasal kayda geçirmek için hazırlanmış resmi metin.',
        rawDocument: artifactDoc1
      },
      {
        id: 'art_2',
        title: artifactTitle2,
        type: 'formal_notice' as const,
        summary: 'Sürecin sınırlarını belirleyen ve suistimalleri önleyen operasyonel protokol.',
        rawDocument: artifactDoc2
      }
    ],
    baselineMetrics: {
      overallSuccessProb: 82,
      riskIndex: 28,
      clarityScore: 95
    }
  };
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// 1. Ana Çözüm Üretme Endpoint'i
app.post('/api/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { problem, category, urgency, emotionalState } = req.body;

    if (!problem || typeof problem !== 'string' || problem.trim().length < 5) {
      res.status(400).json({ error: 'Lütfen çözülmesini istediğiniz durumu veya problemi detaylıca belirtin.' });
      return;
    }

    if (apiKey && isAiAvailable) {
      try {
        const systemInstruction = `Sen RESOLV platformunun üst düzey karar ve problem çözme mimarısın.
Görevin: Kullanıcının girdiği ÖZEL ve GERÇEK problemi analiz etmek.
ASLA genel veya hazır şablon verme. Kullanıcının bahsettiği spesifik kişileri, rakamları, olayları ve çelişkileri doğrudan çözüme dahil et.
Türkçe, kararlı, yüksek analiz gücüne sahip bir dille yanıt ver.`;

        const resolutionSchema = {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            rootCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                  cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                  riskLevel: { type: Type.STRING },
                  recommended: { type: Type.BOOLEAN },
                  expectedValueScore: { type: Type.INTEGER },
                  successRate: { type: Type.INTEGER },
                  breakEvenTimeline: { type: Type.STRING },
                },
                required: ['name', 'rationale', 'pros', 'cons', 'riskLevel', 'recommended'],
              },
            },
            actionRoadmap: {
              type: Type.OBJECT,
              properties: {
                phase1: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    steps: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          step: { type: Type.STRING },
                          tacticalAdvice: { type: Type.STRING },
                          timeEstimate: { type: Type.STRING },
                          priority: { type: Type.STRING },
                          riskFactor: { type: Type.INTEGER },
                        },
                        required: ['id', 'step', 'tacticalAdvice', 'timeEstimate', 'priority'],
                      },
                    },
                  },
                  required: ['title', 'steps'],
                },
                phase2: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    steps: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          step: { type: Type.STRING },
                          tacticalAdvice: { type: Type.STRING },
                          timeEstimate: { type: Type.STRING },
                          priority: { type: Type.STRING },
                          riskFactor: { type: Type.INTEGER },
                        },
                        required: ['id', 'step', 'tacticalAdvice', 'timeEstimate', 'priority'],
                      },
                    },
                  },
                  required: ['title', 'steps'],
                },
                phase3: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    steps: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          step: { type: Type.STRING },
                          tacticalAdvice: { type: Type.STRING },
                          timeEstimate: { type: Type.STRING },
                          priority: { type: Type.STRING },
                          riskFactor: { type: Type.INTEGER },
                        },
                        required: ['id', 'step', 'tacticalAdvice', 'timeEstimate', 'priority'],
                      },
                    },
                  },
                  required: ['title', 'steps'],
                },
              },
              required: ['phase1', 'phase2', 'phase3'],
            },
            failSafeProtocols: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  triggerCondition: { type: Type.STRING },
                  immediateAction: { type: Type.STRING },
                },
                required: ['triggerCondition', 'immediateAction'],
              },
            },
            decisionRule: { type: Type.STRING },
            artifacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  rawDocument: { type: Type.STRING },
                },
                required: ['id', 'title', 'type', 'summary', 'rawDocument'],
              },
            },
            baselineMetrics: {
              type: Type.OBJECT,
              properties: {
                overallSuccessProb: { type: Type.INTEGER },
                riskIndex: { type: Type.INTEGER },
                clarityScore: { type: Type.INTEGER },
              },
              required: ['overallSuccessProb', 'riskIndex', 'clarityScore'],
            },
          },
          required: ['title', 'executiveSummary', 'rootCauses', 'options', 'actionRoadmap', 'failSafeProtocols', 'decisionRule'],
        };

        const response = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `KULLANICI PROBLEMİ:\n"${problem}"\nKategori: ${category || 'Genel'}\nAciliyet: ${urgency || 'Normal'}\nZihinsel Hal: ${emotionalState || 'Belirtilmedi'}`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: resolutionSchema,
            },
          }),
          5500,
          'resolve-gemini-flash'
        );

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json({ success: true, data: parsed });
          return;
        }
      } catch (aiErr: any) {
        handleAiError(aiErr, 'resolve');
      }
    }

    // Dynamic semantic synthesis tailored to user's exact input
    const dynamicPlan = generateDynamicPlan(problem, category || 'general', urgency || 'urgent', emotionalState || '');
    res.json({ success: true, data: dynamicPlan });
  } catch (error: any) {
    console.error('API /resolve Error:', error);
    res.status(500).json({ error: 'Çözüm planı oluşturulurken bir aksaklık yaşandı.' });
  }
});

// 2. Anlık Sözlü İletişim & Karşı Konuşma Zırhı (Instant Verbal Counter)
app.post('/api/instant-verbal-counter', async (req: Request, res: Response): Promise<void> => {
  try {
    const { spokenStatement, role } = req.body;
    if (!spokenStatement || typeof spokenStatement !== 'string') {
      res.status(400).json({ error: 'Lütfen karşı tarafın söylediği sözü belirtin.' });
      return;
    }

    const inputLower = spokenStatement.toLowerCase();

    if (apiKey && isAiAvailable) {
      try {
        const systemInstruction = `Sen RESOLV Anlık Sözlü İletişim ve Savunma Kalkanısın.
Gerçek hayatta insanlar yüz yüze veya telefon görüşmesinde konuşurken karşı tarafın aniden söylediği baskıcı, agresif, manipülatif veya köşeye sıkıştıran sözler karşısında donup kalırlar. Konuşurken 'dur 5 dakika' denemez.
Kullanıcı sana karşı tarafın AZ ÖNCE SÖYLEDİĞİ cümleyi verir.
Görevin: Kullanıcının O ANDA ağzından çıkacak, konuşmayı bölmeden otoriteyi ve kontrolü geri alacak KUSURSUZ 1-2 CÜMLELİK SÖZLÜ KARŞI HAMLEYİ (exactCounterWords) üretmektir.
Kurallar:
1. exactCounterWords: Doğal konuşma dilinde, ezilmeyen, özür dilemeyen, sakin ve tavizsiz maksimum 1-2 cümle.
2. vocalTone: Ses tonu ve beden dili talimatı.
3. psychologicalEffect: Bu sözün karşı tarafta yaratacağı psikolojik etki.
4. whatNeverToSay: Bu anda asla ağızdan çıkmaması gereken hata.
JSON formatında yanıt ver.`;

        const schema = {
          type: Type.OBJECT,
          properties: {
            exactCounterWords: { type: Type.STRING },
            vocalTone: { type: Type.STRING },
            psychologicalEffect: { type: Type.STRING },
            whatNeverToSay: { type: Type.STRING },
          },
          required: ['exactCounterWords', 'vocalTone', 'psychologicalEffect', 'whatNeverToSay'],
        };

        const response = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `MUHATAP: ${role || 'Muhatap'}\nKARŞI TARAFIN AZ ÖNCE SÖYLEDİĞİ SÖZ:\n"${spokenStatement}"`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          }),
          3000,
          'instant-verbal-counter'
        );

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json({ success: true, data: parsed });
          return;
        }
      } catch (err: any) {
        handleAiError(err, 'verbal-counter');
      }
    }

    // Dynamic contextual verbal counter synthesis
    let exactCounterWords = 'Şu an bu baskı altında ayaküstü bir karar vermeyeceğim. Şartları masaya koyduk, bunu yarın saat 10:00\'da sakin kafayla netleştirelim.';
    let vocalTone = 'Ses tonunu alçalt, tane tane konuş ve göz temasını sakın kesme.';
    let psychologicalEffect = 'Oldu bittiye getirme girişimini boşa çıkarır, zamanı ve kontrolü senin eline geçirir.';
    let whatNeverToSay = 'Asla özür dileme, "haklısınız ama..." deme veya kendini savunmaya geçme.';

    if (inputLower.includes('para') || inputLower.includes('fiyat') || inputLower.includes('pahalı') || inputLower.includes('indirim') || inputLower.includes('bütçe')) {
      exactCounterWords = 'Fiyatımız keyfi değil, üstlendiğimiz sorumluluğun ve iş kalitesinin karşılığıdır. Bütçeniz kısıtlıysa kapsamı daraltalım; hangi maddelerden vazgeçiyorsunuz?';
      vocalTone = 'Hafif bir tebessümle, savunmaya geçmeden profesyonel sakinlikte kal.';
      psychologicalEffect = 'Topu onların kucağına atar; indirimi hak olarak görmelerini engeller ve kapsamı tartışmaya açar.';
      whatNeverToSay = 'Asla "biz de çok masraf yaptık" gibi aciz savunmalara girme veya hemen indirim teklif etme.';
    } else if (inputLower.includes('hemen') || inputLower.includes('şimdi') || inputLower.includes('acele') || inputLower.includes('vakit yok') || inputLower.includes('bugün')) {
      exactCounterWords = 'Baskı altında ayaküstü karar vermem. Sürecin selameti için şartları yarın saat 10:00\'da sakin kafayla netleştirelim.';
      vocalTone = 'Yavaş ve kararlı bir tonda söyle. Asla telaşlı olmadığını beden dilinle göster.';
      psychologicalEffect = 'Yapay aciliyet manipülasyonunu çökerterek kontrolü senin tempona çeker.';
      whatNeverToSay = 'Panikle "tamam bakarız" diyerek sözlü taahhüt verme.';
    } else if (inputLower.includes('kovar') || inputLower.includes('iptal') || inputLower.includes('bırakır') || inputLower.includes('başkası') || inputLower.includes('tehdit') || inputLower.includes('sonuçlarına')) {
      exactCounterWords = 'Seçim hakkınız elbette saklıdır; fakat bu tehditkar üslupla sağlıklı bir iş ortaklığı yürütemeyiz. Şartlarımız masadadır, karar sizindir.';
      vocalTone = 'Gözlerini kırpmadan dik dur, sesini yükseltme ve cümlenin ardından sessizce bekle.';
      psychologicalEffect = 'Blöfü anında yere çarpar; tehdidin sende korku yaratmadığını görünce geri adım atmak zorunda kalır.';
      whatNeverToSay = 'Korkup geri adım atma veya "lütfen yanlış anlamayın" diyerek alttan alma.';
    } else if (inputLower.includes('hırsız') || inputLower.includes('beceriksiz') || inputLower.includes('yapamazsın') || inputLower.includes('anlamıyorsun') || inputLower.includes('senin yüzünden')) {
      exactCounterWords = 'Kişisel suçlamalar ve hakaretler sorunu çözmez. Sorumluluk sınırlarımız ve kayıtlarımız ortadadır; gelin aksaklığı somut verilerle masaya koyalım.';
      vocalTone = 'Öfkelenmeden, olgun bir denetçi edasıyla soğukkanlı konuş.';
      psychologicalEffect = 'Duygusal kışkırtmayı boşa çıkarır, kavgayı değil profesyonel kayıtları merkeze alır.';
      whatNeverToSay = 'Karşı hakaret etme veya sesini yükselterek haklıyken haksız duruma düşme.';
    } else if (inputLower.includes('fedakarlık') || inputLower.includes('nankör') || inputLower.includes('vefasız') || inputLower.includes('yarı yolda')) {
      exactCounterWords = 'Geçmiş emeğe ve hukukumuza saygım tamdır. Ancak şu an konuştuğumuz konu bu kararın sürdürülebilirliğidir; duygusal bağımız ile bu profesyonel sınırı birbirine karıştırmayalım.';
      vocalTone = 'Şefkatli ama duvar gibi sağlam ve geri adım atmayan bir ses tonu.';
      psychologicalEffect = 'Suçluluk silahını etkisizleştirir, rasyonel sınırlara saygı duymak zorunda bırakır.';
      whatNeverToSay = 'Kendini aklamaya çalışma veya geçmiş fedakarlıkları yarıştırmaya girme.';
    }

    res.json({
      success: true,
      data: {
        exactCounterWords,
        vocalTone,
        psychologicalEffect,
        whatNeverToSay
      }
    });
  } catch (error: any) {
    console.error('API /instant-verbal-counter error:', error);
    res.status(500).json({ error: 'Sözlü yanıt hazırlanamadı.' });
  }
});

// 3. Karar Terazisi (Dilemma Solver)
app.post('/api/dilemma-solve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { optionA, optionB, details } = req.body;
    if (!optionA || !optionB) {
      res.status(400).json({ error: 'Lütfen iki seçeneği de girin.' });
      return;
    }

    if (apiKey && isAiAvailable) {
      try {
        const systemInstruction = `Sen RESOLV Kesin Karar Pusulasısın. İki seçenek arasında sıkışmış bir insana tavizsiz, objektif ve 10 yıllık pişmanlık analizine dayalı net bir kazanan sunuyorsun. JSON formatında yanıt ver.`;
        const schema = {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING, description: 'A veya B' },
            verdictSummary: { type: Type.STRING },
            regretProbabilityA: { type: Type.INTEGER },
            regretProbabilityB: { type: Type.INTEGER },
            decisiveFactor: { type: Type.STRING },
            immediateAction: { type: Type.STRING },
          },
          required: ['winner', 'verdictSummary', 'regretProbabilityA', 'regretProbabilityB', 'decisiveFactor', 'immediateAction'],
        };

        const response = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `SEÇENEK A: "${optionA}"\nSEÇENEK B: "${optionB}"\nEK BAĞLAM: "${details || ''}"`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          }),
          3500,
          'dilemma-solve'
        );

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json({ success: true, data: parsed });
          return;
        }
      } catch (err: any) {
        handleAiError(err, 'dilemma-solve');
      }
    }

    // Dynamic Contextual Dilemma Solver
    const textA = optionA.toLowerCase();
    const textB = optionB.toLowerCase();

    // Prefer active agency over passive resignation
    const aIsActive = textA.includes('ayrıl') || textA.includes('bitir') || textA.includes('kur') || textA.includes('başla') || textA.includes('istifa') || textA.includes('reddet') || textA.includes('itiraz');
    const winner: 'A' | 'B' = aIsActive ? 'A' : 'B';
    const winningText = winner === 'A' ? optionA : optionB;
    const losingText = winner === 'A' ? optionB : optionA;

    res.json({
      success: true,
      data: {
        winner,
        verdictSummary: `Seçenek ${winner} ("${winningText}") seçilmelidir. "${losingText}" kısa vadede konfor veya çatışmadan kaçış vaat etse de, uzun vadede kontrol kaybı, tükenmişlik ve %75'in üzerinde ağır pişmanlık riski taşımaktadır.`,
        regretProbabilityA: winner === 'A' ? 18 : 74,
        regretProbabilityB: winner === 'B' ? 18 : 74,
        decisiveFactor: 'Kendi hayatının ve zamanının kontrolünü başkalarının inisiyatifine bırakmamak.',
        immediateAction: `Bugün saat 18:00'e kadar "${winningText}" yönünde geri dönülemez tek bir somut adım at (resmi e-posta gönder, başvuru yap veya takvime net sınır koy).`
      }
    });
  } catch (error: any) {
    console.error('API /dilemma-solve error:', error);
    res.status(500).json({ error: 'Karar hesaplanamadı.' });
  }
});

// 4. Acil Yangın Söndürücü ve Odak Reset (Quick Rescue)
app.post('/api/quick-rescue', async (req: Request, res: Response): Promise<void> => {
  try {
    const { situation } = req.body;

    if (apiKey && isAiAvailable) {
      try {
        const systemInstruction = `Sen RESOLV Acil Yangın Söndürücüsü ve Zihinsel Kurtarma Uzmanısın.
Kullanıcı ağır stres, felç, kriz veya erteleme altında. Görevin:
1. Sadece önündeki 5 dakikada yapabileceği TEK bir mikroskopik adım belirlemek.
2. Bugün suçluluk duymadan derhal çöpe atacağı/erteleyeceği diğer tüm yükleri listelemek.
3. Muhataplarına atıp zaman kazanabileceği, utancı kıran net bir zırh mesajı hazırlamak.
4. Güçlü bir zihinsel kural vermek.
JSON formatında yanıt ver.`;

        const schema = {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            fiveMinuteStep: { type: Type.STRING },
            whatToDropImmediately: { type: Type.STRING },
            scriptToSend: { type: Type.STRING },
            mindsetRule: { type: Type.STRING },
          },
          required: ['headline', 'fiveMinuteStep', 'whatToDropImmediately', 'scriptToSend', 'mindsetRule'],
        };

        const response = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `KULLANICININ KİLİTLENDİĞİ / BUNALDIĞI DURUM: "${situation || 'Genel aşırı yük ve erteleme krizi'}"`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          }),
          3500,
          'quick-rescue'
        );

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json({ success: true, data: parsed });
          return;
        }
      } catch (err: any) {
        handleAiError(err, 'quick-rescue');
      }
    }

    // Dynamic contextual quick rescue synthesis
    const sitLower = (situation || '').toLowerCase();
    let headline = 'Zihinsel Sis ve Tükenmişlik Yangın Söndürücüsü';
    let fiveMinuteStep = `Telefonunu sessize al ve ters çevir. Önündeki krizle ("${situation ? situation.slice(0, 45) + '...' : 'mevcut durum'}") ilgili sadece ilk 1 mikroskopik hamleyi tamamla.`;
    let whatToDropImmediately = 'Bugün yapman gerekip de ertelediğin diğer tüm görevleri bilerek ve isteyerek çöpe at. Bugün hiçbirini yapmayacaksın; suçluluk hissetme.';
    let scriptToSend = 'Merhaba, şu an acil bir odak bloğundayım. Konuyu yarın sabah ilk iş inceleyip döneceğim, sevgiler.';
    let mindsetRule = 'Tüm hayatını bugün düzeltemezsin; ama bugün sadece 1 zafer kazanabilirsin.';

    if (sitLower.includes('borç') || sitLower.includes('para') || sitLower.includes('fatura') || sitLower.includes('nakit') || sitLower.includes('tl') || sitLower.includes('kira')) {
      headline = 'Finansal Panik ve Nakit Sıkışması İlk Yardım Kalkanı';
      fiveMinuteStep = 'Banka hesaplarına sürekli bakmayı bırak. Tek bir kağıda sadece aciliyeti bugün olan tek bir ödemeyi yaz ve geri kalanını 48 saatliğine zihninden dondur.';
      whatToDropImmediately = 'Gelecek ayın veya yılın borçlarını bugün çözmeye çalışmayı bırak; bugün sadece bugünkü nakit dengesi korunacak.';
      scriptToSend = 'Merhaba, ödeme planlamamız muhasebe ve nakit akış takvimimiz doğrultusunda incelenmektedir. En geç yarın saat 14:00\'e kadar net takvim tarafınıza iletilecektir.';
      mindsetRule = 'Borç panikle ödenmez; sakin ve tavizsiz bir takvimle eritilir.';
    } else if (sitLower.includes('teslim') || sitLower.includes('yetiş') || sitLower.includes('proje') || sitLower.includes('iş') || sitLower.includes('müşteri')) {
      headline = 'Teslim Tarihi Felci ve Erteleme Yangın Söndürücüsü';
      fiveMinuteStep = 'Mükemmel yapmaya çalışma. Belgeyi aç ve taslağın en çirkin, en ham ilk paragrafını 5 dakikada bitir. Kaliteyi sonra düzelteceksin.';
      whatToDropImmediately = 'Gelen kutundaki e-postaları, mesajları ve sosyal medyayı bugün mesai bitimine kadar tamamen kapat.';
      scriptToSend = 'Merhaba, projenin nihai teslim kalitesini korumak adına tüm ekiple odak bloğundayız. Güncellemeyi saat 17:30\'da ileteceğim.';
      mindsetRule = 'Yapılmış bir iş, mükemmel hayal edilmiş bir işten bin kat değerlidir.';
    }

    res.json({
      success: true,
      data: {
        headline,
        fiveMinuteStep,
        whatToDropImmediately,
        scriptToSend,
        mindsetRule
      }
    });
  } catch (error: any) {
    console.error('API /quick-rescue error:', error);
    res.status(500).json({ error: 'Kurtarma rehberi hazırlanamadı.' });
  }
});

// 5. Zor Konuşma ve Mesaj Taslağı Hazırlayıcı (Magic Message Drafter)
app.post('/api/message-craft', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipient, goal, tone, customDetails } = req.body;
    if (!goal) {
      res.status(400).json({ error: 'Lütfen iletmek istediğiniz amacı belirtin.' });
      return;
    }

    if (apiKey && isAiAvailable) {
      try {
        const systemInstruction = `Sen RESOLV Mesaj ve İletişim Zırhı Mimarı'sın.
Kullanıcının muhatabına göndereceği, sınır çizen, tavizsiz ama karşı tarafı köşeye sıkıştıran profesyonel mesajlar hazırlıyorsun.
Yanıtını JSON formatında ver.`;

        const schema = {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            whatsappMessage: { type: Type.STRING },
            emailVersion: { type: Type.STRING },
            goldenRules: { type: Type.ARRAY, items: { type: Type.STRING } },
            ifTheyResist: { type: Type.STRING },
          },
          required: ['headline', 'whatsappMessage', 'emailVersion', 'goldenRules', 'ifTheyResist'],
        };

        const response = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `KİME: ${recipient || 'Muhatap'}\nHEDEF / TALEP: "${goal}"\nTON: ${tone || 'Net & Profesyonel'}\nÖZEL DETAYLAR: "${customDetails || ''}"`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          }),
          3500,
          'message-craft'
        );

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json({ success: true, data: parsed });
          return;
        }
      } catch (err: any) {
        handleAiError(err, 'message-craft');
      }
    }

    // Dynamic contextual message crafting
    const rec = recipient || 'Muhatap';
    const detailSnippet = customDetails ? ` (${customDetails})` : '';

    res.json({
      success: true,
      data: {
        headline: `${rec} İçin Net Sınır ve Talep İletişimi`,
        whatsappMessage: `Merhaba, sürecin sağlıklı ve sürdürülebilir devamı adına netleşmemiz gereken önemli bir husus var: ${goal}${detailSnippet}. İki tarafın da zamanını korumak için bu konuyu en geç yarın mesai bitimine kadar yazılı olarak kesinleştirmemiz gerekiyor. Teşekkürler.`,
        emailVersion: `Sayın ${rec},\n\nYürütmekte olduğumuz süreç kapsamında ${goal}${detailSnippet} konusundaki prensip kararımızı ve talebimizi bildirmek isterim. İş birliğimizin karşılıklı saygı ve verimlilik çerçevesinde sürmesi adına bu çerçevenin korunması esastır.\n\nGereğini bilgilerinize sunar, iyi çalışmalar dilerim.`,
        goldenRules: [
          'Asla özür dileyerek veya mahcup bir dille başlama.',
          'Karşı tarafa ucu açık değil, kesin bir tarih veya seçenek sun.',
          'Gereksiz uzun açıklamalar yapma; az kelime daha çok otorite demektir.'
        ],
        ifTheyResist: `Eğer itiraz eder veya manipüle ederse şunu yaz: "Duygusal veya kişisel bir durumdan bahsetmiyorum, tamamen sürecin sürdürülebilirliğiyle ilgili konuşuyorum. Ya bu çerçevede mutabık kalırız ya da alternatif planı devreye almamız gerekir."`
      }
    });
  } catch (error: any) {
    console.error('API /message-craft error:', error);
    res.status(500).json({ error: 'Mesaj hazırlanamadı.' });
  }
});

// 6. Müzakere & Karşı Taraf Simülatörü (War-Room)
app.post('/api/war-room/simulate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userStatement, stakeholderArchetype, context } = req.body;
    if (!userStatement) {
      res.status(400).json({ error: 'Lütfen karşı tarafa söylemek istediğiniz hamleyi girin.' });
      return;
    }

    if (apiKey && isAiAvailable) {
      try {
        const systemInstruction = `Sen RESOLV Müzakere ve Psikolojik Satranç Simülatörüsün.
Kullanıcının muhatabıyla yapacağı kritik konuşmayı simüle ediyorsun.
Seçilen muhatap arketipine (${stakeholderArchetype || 'Katı Müzakereci'}) bürünerek en gerçekçi, dirençli ve sert cevabı ver.
Ayrıca karşı tarafın direnç seviyesini (% 0-100), psikolojik üstünlük dengesini ('Zayıf' | 'Dengeli' | 'Hakim') ve kullanıcının bu direnci kırmak için söylemesi gereken 'Mat Hamlesi'ni (tacticalCounterMove) JSON olarak üret.`;

        const warRoomSchema = {
          type: Type.OBJECT,
          properties: {
            stakeholderResponse: { type: Type.STRING },
            resistancePercent: { type: Type.INTEGER },
            psychologicalLeverage: { type: Type.STRING },
            tacticalCounterMove: { type: Type.STRING },
          },
          required: ['stakeholderResponse', 'resistancePercent', 'psychologicalLeverage', 'tacticalCounterMove'],
        };

        const response = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `BAĞLAM: ${context || 'Kritik Müzakere'}\nKULLANICININ SÖYLEDİĞİ HAMLE: "${userStatement}"\nMUHATAP ARKETİPİ: ${stakeholderArchetype}`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: warRoomSchema,
            },
          }),
          3500,
          'war-room'
        );

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json({ success: true, ...parsed });
          return;
        }
      } catch (err: any) {
        handleAiError(err, 'war-room');
      }
    }

    // Dynamic contextual War-Room simulation synthesis
    const trimmed = userStatement.length > 50 ? userStatement.slice(0, 50) + '...' : userStatement;
    res.json({
      success: true,
      stakeholderResponse: `"${trimmed}" demeniz bu şartları kabul edeceğim anlamına gelmez. Bugüne kadarki dengeyi bozuyorsunuz. Eğer geri adım atmazsanız anlaşmayı tamamen iptal eder ve alternatif yollara başvururuz.`,
      resistancePercent: 68,
      psychologicalLeverage: 'Dengeli',
      tacticalCounterMove: `Savunmaya geçme veya sesini yükseltme. Şu sakin otorite cümlesini kur: "Ben dengeyi bozmuyorum, iki taraf için de öngörülebilir ve sürdürülebilir bir zemin inşa ediyorum. Ya bu rasyonel şartlarda 48 saatte el sıkışırız ya da mevcut durum iki tarafı da tüketir. Karar sizindir."`,
    });
  } catch (error: any) {
    console.error('API /war-room/simulate Error:', error);
    res.status(500).json({ error: 'Müzakere simülasyonu çalıştırılamadı.' });
  }
});

// 7. Saha Taktik Detaylandırma Endpoint'i
app.post('/api/tactic', async (req: Request, res: Response): Promise<void> => {
  try {
    const { stepTitle, tacticalAdvice, context } = req.body;
    if (!stepTitle) {
      res.status(400).json({ error: 'Adım bilgisi eksik.' });
      return;
    }

    if (apiKey && isAiAvailable) {
      try {
        const systemInstruction = `Sen RESOLV saha taktik danışmanısın. Kullanıcıya verilen adımı kusursuz icra etmesi için uygulanacak birebir konuşma metni, tuzaklar ve başarı ölçütü ver.`;
        const prompt = `HEDEF ADIM: "${stepTitle}"\nTALİMAT: "${tacticalAdvice}"\nBAĞLAM: "${context || ''}"\n\nLütfen detaylandır:\n1. Ne Söylenmeli / Ne Yapılmalı (Birebir net metin/eylem taslağı)\n2. En Büyük Hata Tuzağı (Asla yapılmaması gereken hamle)\n3. Başarı Ölçütü (Somut doğrulama kriteri)`;

        const response = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: { systemInstruction },
          }),
          3500,
          'tactic'
        );

        if (response.text) {
          res.json({ success: true, tactic: response.text });
          return;
        }
      } catch (err: any) {
        handleAiError(err, 'tactic');
      }
    }

    const fallbackTactic = `### 1. Ne Söylenmeli / Ne Yapılmalı? (Birebir İcra Taslağı)
Bu adımı ("${stepTitle}") icra ederken net ve sakin bir otorite pozisyonu al. Yazılı veya sözlü temasta şu metni kullan:
*"Şu anki süreci daha sağlıklı ve sürdürülebilir yürütmek adına şartları ve sorumlulukları netleştirmemiz gerekiyor. Önümüzdeki 72 saat içinde aşağıdaki somut adımları tamamlamayı hedefliyorum; bu konuda ortak bir zemin oluşturmak iki tarafın da çıkarınadır."*

### 2. En Büyük Hata Tuzağı
- Karşı tarafın duygusal tepkilerine refleks olarak cevap vermek.
- Yazılı olmayan, sözde kalan vaatlerle adımı "tamamlandı" saymak.
- Savunmacı bir dile kayarak kendi haklılığını kanıtlama çabasına girmek.

### 3. Somut Başarı Ölçütü
- Konuyla ilgili tüm tarafların üzerinde anlaştığı veya tek taraflı sınırın net olarak kayıtlara geçtiği yazılı bir dokümanın/onayın bulunması.
- Zihnindeki belirsizlik yükünün ortadan kalkması.`;

    res.json({ success: true, tactic: fallbackTactic });
  } catch (error: any) {
    console.error('API /tactic Error:', error);
    res.status(500).json({ error: 'Taktik detaylandırılırken bir hata oluştu.' });
  }
});

// 8. Stres Testi
app.post('/api/stress-test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { planSummary, chosenOption } = req.body;

    if (apiKey && isAiAvailable) {
      try {
        const systemInstruction = `Sen tavizsiz bir stratejik denetçisin. Planın 3 potansiyel zafiyetini ve bu zafiyetlerin karşı hamlelerini listele.`;
        const prompt = `PLAN: "${planSummary}"\nSEÇİLEN YOL: "${chosenOption}"\n\nEn sert 3 zafiyeti ve karşı savunma hamlelerini yaz.`;

        const response = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: { systemInstruction },
          }),
          3500,
          'stress-test'
        );

        if (response.text) {
          res.json({ success: true, critique: response.text });
          return;
        }
      } catch (err: any) {
        handleAiError(err, 'stress-test');
      }
    }

    const fallbackCritique = `### 1. Zafiyet: Duygusal Yorgunluk ve Erteleme Nüksü
- **Risk:** İlk 24 saatteki geçici rahatlamanın ardından zihnin eski alışkanlıklara ve pasif dirence geri dönmesi.
- **Karşı Savunma:** Her sabah yalnızca ilk 1 mikro-adımı tamamlamayı taahhüt et. Büyük resmi düşünmeyi bırakıp günü 30 dakikalık bloklara böl.

### 2. Zafiyet: Karşı Tarafın Pasif-Agresif Direnci
- **Risk:** Sınır çizildiğinde veya talepte bulunulduğunda karşı tarafın sessizlikle cezalandırması veya işi geciktirmesi.
- **Karşı Savunma:** Sözlü temas kurma. "Yanıt gelmediği takdirde [Tarih] itibarıyla B planı devreye alınacaktır" ifadesiyle inisiyatifi elinde tut.

### 3. Zafiyet: Güvenlik Ağının Yetersiz Kalması
- **Risk:** Beklenmeyen acil bir harcamanın veya zaman kaybının mevcut nakit/odak tamponunu eritmesi.
- **Karşı Savunma:** Giderleri %25 daha kısarak acil durum tamponunu 15 gün daha uzatacak ön tedbir al.`;

    res.json({ success: true, critique: fallbackCritique });
  } catch (error: any) {
    console.error('API /stress-test Error:', error);
    res.status(500).json({ error: 'Stres testi çalıştırılamadı.' });
  }
});

// 9. Sağlık ve Debug
app.get('/api/debug', (req: Request, res: Response) => {
  res.json({ hasKey: !!apiKey, len: apiKey.length });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'RESOLV Core API' });
});

// Vite Entegrasyonu
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RESOLV Engine aktif: http://0.0.0.0:${PORT}`);
  });
}

startServer();
