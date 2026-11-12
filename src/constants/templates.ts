import { CategoryId, UrgencyLevel } from '../types';

export interface ProblemTemplate {
  id: string;
  title: string;
  category: CategoryId;
  urgency: UrgencyLevel;
  emotionalState: string;
  problemText: string;
  highlight: string;
}

export const PROBLEM_TEMPLATES: ProblemTemplate[] = [
  {
    id: 'founder_breakup',
    title: 'Ortaklık Krizi & Şirket Ayrılığı',
    category: 'finance_business',
    urgency: 'urgent',
    emotionalState: 'Stresli ve kararsız',
    highlight: 'Hisse, yetki ve vizyon uyuşmazlığında adil çıkış stratejisi',
    problemText: '2 yıllık teknoloji girişimimde ortağım ile vizyon ve çalışma temposu konusunda ciddi kriz yaşıyoruz. Ben haftalık 70 saat çalışıp tüm satışı ve geliştirmeyi üstlenirken, o motivasyonunu kaybetti ve katkı sağlamıyor. Ancak %50 hissesi var. Projeyi kapatmak istemiyorum ama bu şekilde devam etmek beni tüketiyor. Hisseleri devralmak veya temiz bir ayrılık yapmak için hukuki, finansal ve psikolojik olarak ne yapmalıyım?'
  },
  {
    id: 'career_pivot',
    title: 'Kurumsal Konfor vs. Yüksek Riskli Girişim',
    category: 'career_strategy',
    urgency: 'strategic',
    emotionalState: 'Belirsizlik ve korku',
    highlight: 'Altın kelepçeden kurtulup kendi işini kurma kararı',
    problemText: '10 yıldır iyi bir maaş aldığım kurumsal yöneticilik görevindeyim. Kendi dijital ürün girişimimi başlatmak istiyorum ve 6 aylık acil durum birikimim var. Ancak ailem ve çevrem kurulu düzeni terk etmemem gerektiğini söylüyor. Karar vermeyi erteledikçe enerjim ve özgüvenim tükeniyor. Yaşam standardımı sıfırlamadan bu geçişi nasıl hatasız planlayabilirim?'
  },
  {
    id: 'burnout_reset',
    title: 'Ağır Tükenmişlik (Burnout) & Borç Baskısından Çıkış',
    category: 'personal_psychology',
    urgency: 'urgent',
    emotionalState: 'Felç olmuş, zihinsel sis',
    highlight: 'Zihinsel felçten 72 saatte çıkıp nakit akışını ve odağı toparlama',
    problemText: 'Son 6 aydır aynı anda 3 farklı işi yetiştirmeye çalışırken iflas eşiğine geldim. Masamın üzerinde ödenmemiş faturalar, ertelenmiş 50 farklı görev var ve sabahları yataktan kalkmakta bile zorlanıyorum. Beynim kilitlenmiş durumda, nereden başlayacağımı bilemiyorum. Beni ilk 72 saatte bu kilitlenmeden çıkaracak tavizsiz, somut bir mikro-adım planına ihtiyacım var.'
  },
  {
    id: 'high_stakes_negotiation',
    title: 'Kritik Sözleşme veya Ücret Müzakeresi',
    category: 'negotiation_conflict',
    urgency: 'medium',
    emotionalState: 'Gergin ve baskı altında',
    highlight: 'Karşı tarafın manipülasyonlarına boyun eğmeden masadan kazançlı çıkma',
    problemText: 'Büyük bir müşteriyle yıllık sözleşme yenileme görüşmesindeyiz. Bütçe kısıtlarını öne sürerek fiyatlarımı %30 düşürmemi talep ediyorlar, aksi takdirde rakiple çalışacaklarını ima ediyorlar. İşin %40 gelirimi oluşturması nedeniyle panik halindeyim ama bu indirimi yaparsam zarar edeceğim. Masada gücümü geri kazanıp fiyatımı nasıl savunabilirim?'
  },
  {
    id: 'relationship_boundaries',
    title: 'Toksik Aile veya Çevre Sınırlarını Yeniden Çizme',
    category: 'personal_psychology',
    urgency: 'medium',
    emotionalState: 'Suçluluk ve öfke',
    highlight: 'Suçluluk hissine teslim olmadan net ve kırılmaz sınırlar inşa etme',
    problemText: 'Yakın çevrem ve aile üyelerim hayatımın her kararına müdahale ediyor, sürekli duygusal baskı kuruyor ve hayır dediğimde beni suçlu hissettiriyorlar. Kendi hayatımın kontrolünü ele almak istiyorum ama kavga etmeden veya tamamen bağları koparmadan bu sınırları nasıl çizeceğimi bilemiyorum.'
  },
  {
    id: 'product_launch_dilemma',
    title: 'Ürünü Çıkarmak mı, Mükemmelleştirmek mi?',
    category: 'crisis_decision',
    urgency: 'urgent',
    emotionalState: 'Mükemmeliyetçilik ve başarısızlık korkusu',
    highlight: 'Erteleme kısırdöngüsünü kırıp ilk satışa ulaşma mimarisi',
    problemText: 'Geliştirdiğim yazılım ürününü 8 aydır piyasaya süremiyorum. Her gün "şu özellik de eksik", "tasarım yeterince iyi değil" diyerek lansmanı erteliyorum. Rakipler basit ürünlerle pazarı kapıyor. Bu mükemmeliyetçilik felcinden çıkıp ürünü gerçek kullanıcılara nasıl güvenle açabilirim?'
  }
];
