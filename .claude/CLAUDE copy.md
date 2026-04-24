# RedditLeads — CLAUDE.md

## Proje Özeti

Reddit lead bulma ve takip aracı. Kullanıcı web sitesini girer, AI siteyi analiz eder, ilgili subredditler ve yaklaşım rehberi üretir. Kullanıcı kendi sesiyle yorum yazar, lead'leri takip eder.

**Tagline:** "Reddit'te doğru kişiyi bul, kurallara uygun yaklaş, müşteriye dönüştür."

**Kritik karar:** Hazır kopyala-yapıştır metin üretilmez. Yaklaşım rehberi verilir. Kullanıcı kendi sesiyle yazar.

***

## Tech Stack

- **Frontend:** Next.js (App Router) + Tailwind CSS
- **State:** Zustand veya React Query
- **Backend:** Node.js + TypeScript + Express veya Fastify
- **Database:** Supabase (PostgreSQL + JSONB)
- **AI:** OpenAI API (gpt-4o-mini)
- **Ödeme:** Lemon Squeezy (Merchant of Record)
- **Hosting:** Vercel
- **Reddit veri:** Reddit JSON API (API key gerektirmez)
- **Subreddit kuralları:** reddit.com/r/{sub}/about/rules.json
- **Queue (V2):** Redis + BullMQ — MVP'de basit async/await yeterli

***

## Sistem Akışı

```
1. Kullanıcı URL girer
2. analyze_site çalışır → DB'ye kaydeder
3. fetch_posts tetiklenir → postlar kaydedilir
4. score_posts çalışır → dashboard'a yansır
5. Approach guide talep üzerine üretilir
```

MVP'de queue sistemi olmadan basit async fonksiyonlarla yap.
Redis + BullMQ V2'ye bırak.

***

## Sayfa Yapısı

### 1. Onboarding — URL Gir

- Tek ekran, tek input
- Kullanıcı web sitesi URL'si girer
- "Analiz Et" butonu → loading animasyonu
- AI siteyi fetch eder: sektör, problem, hedef kitle çıkarır
- 8-10 subreddit önerisi + arama kelimeleri üretir
- Kayıt yok, kredi kartı yok bu adımda

### 2. Amaç Anketi (Onboarding devamı)

6 soru, ilerleme çubuğu, her soru tek ekranda:

1. Ne yapmak istiyorsun? (müşteri bul / rakip takip / içerik tanıt / topluluk büyüt)
2. Hedef kitlen kim? (B2B / B2C / ikisi)
3. Şu an nasıl yapıyorsun? (manuel / başka araç / hiç yapmıyorum)
4. Kaç kişiye ulaşmak istiyorsun? (1-10 / 10-50 / 50+)
5. Beklediğin tepki ne? (denesin / takip etsin / iletişime geçsin / satın alsın)
6. Sektörün ne? (SaaS / e-ticaret / içerik / danışmanlık / diğer)

### 3. Dashboard

- Sol sidebar navigasyon (tüm sayfalarda sabit)
- 4 metrik kartı: taranan post, ulaşılan kişi, bekleyen lead, dönüşüm
- Aktif kampanyalar listesi (subredditler + durum)
- Son aktivite akışı
- "Yeni Tarama Başlat" butonu

### 4. Feed

- Sol filtreler: subreddit, tarih, AI skoru, durum
- Post kartları:
  - Başlık, subreddit, upvote, tarih
  - Subreddit kural badge'i: Yeşil (serbest) / Sarı (dikkatli) / Kırmızı (yasak)
  - AI intent skoru (1-10)
  - "Yaklaşım Al" butonu → yaklaşım rehberi açılır (hazır metin değil)
  - "Reddit'te Aç" butonu
  - "Gönderildi" butonu → kart grileşir, tekrar önermez
- Gönderilmiş postlar soluk/gri görünür

### 5. Lead Takibi

- Kanban görünümü
- Kolonlar: Yeni Lead / Mesaj Gönderildi / Yanıt Bekleniyor / Dönüşüm / İlgisiz
- Her kart: Reddit kullanıcı adı, kaynak post, tarih, not alanı
- Üstte özet: "Bu ay X lead, X dönüşüm"

### 6. Ayarlar

- İkinci seviye navigasyon (Ürün bilgileri / Subredditler / Bildirimler / Amaç anketi / Plan / Hesap sil)
- Ürün bilgileri: URL, açıklama, hedef kitle (düzenlenebilir)
- Subredditler: chip formatında ekle/çıkar
- Bildirimler: toggle (yeni post, lead takip hatırlatması)
- Tehlikeli bölge: kırmızı, hesap sil

***

## AI Pipeline'ları

### 1. Site Analizi (Onboarding)

**Input:** URL + onboarding anket cevapları
**Output:**

```json
{
  "product_description": "",
  "target_audience": "",
  "pain_points": [],
  "keywords": [],
  "subreddit_suggestions": []
}
```

**Prompt:**

```
Analyze this website and return JSON only:
{
  "product_description": "one sentence",
  "target_audience": "who this is for",
  "pain_points": ["pain1", "pain2"],
  "keywords": ["kw1", "kw2", "kw3"],
  "subreddit_suggestions": ["SaaS", "entrepreneur"]
}

Website content: {html_content}
Onboarding answers: {survey_answers}
Return only valid JSON, no explanation.
```

### 2. Post Skorlama

**Input:** Post içeriği + ürün bağlamı
**Output:**

```json
{
  "intent_score": 8,
  "pain_level": "high",
  "buying_signal": true,
  "reasoning": "kısa açıklama"
}
```

**Prompt:**

```
Score this Reddit post for product relevance.

Product: {product_description}
Target audience: {target_audience}

Post title: {post_title}
Post content: {post_content}

Return JSON only:
{
  "intent_score": 1-10,
  "pain_level": "low|medium|high",
  "buying_signal": true|false,
  "reasoning": "one sentence"
}
```

### 3. Yaklaşım Rehberi (Approach Guide)

**⚠️ KRİTİK:** Hazır metin üretme. Strateji ve çerçeve ver.
Kullanıcı kendi sesiyle yazsın. AI metni Reddit'te spam olarak algılanır ve kaldırılır.

**Input:** Post + ürün bağlamı + subreddit kuralları + anket cevapları
**Output:**

```json
{
  "real_problem": "Bu kişinin asıl sorunu",
  "recommended_tone": "samimi|teknik|meraklı|destekleyici",
  "how_to_start": "Yoruma nasıl başlamalı",
  "product_mention_strategy": "Ürünü ne zaman, nasıl dahil et",
  "what_to_avoid": "Kaçınılacaklar"
}
```

**Prompt:**

```
You help founders engage authentically on Reddit without spamming.
IMPORTANT: Do NOT write a ready-to-copy message. Give strategic guidance only.

Product: {product_description}
Target audience: {target_audience}
Survey answers: {survey_answers}
Subreddit: r/{subreddit}
Subreddit rules: {rules}
Post title: {post_title}
Post content: {post_content}

Return JSON only:
{
  "real_problem": "what this person actually needs",
  "recommended_tone": "samimi|teknik|meraklı|destekleyici",
  "how_to_start": "how to open the comment naturally",
  "product_mention_strategy": "when and how to mention product (if rules allow)",
  "what_to_avoid": "specific things NOT to do"
}

User will write in their own voice. You provide the strategy.
Match language to post language.
```

***

## Subreddit Intelligence

Her subreddit için tablo:

```sql
CREATE TABLE subreddits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  allows_promotion BOOLEAN,
  allows_dm BOOLEAN,
  tone TEXT, -- formal / casual / technical
  rule_badge TEXT, -- green / yellow / red
  rules_cache TEXT,
  notes TEXT,
  rules_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Badge sistemi:

- **Yeşil:** Tanıtım serbest — normal yaklaşım
- **Sarı:** Kısıtlı — değer önce, ürün arka planda
- **Kırmızı:** Tanıtım yasak — sadece yardımcı ol, ürün bahsetme

Kuralları cache'le. Her sorguda fetch etme:

```
rules_updated_at > 7 gün önce ise yeniden çek
```

***

## Supabase Şema

```sql
-- Ürün profili
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  url TEXT,
  description TEXT,
  target_audience TEXT,
  pain_points JSONB,
  industry TEXT,
  survey_answers JSONB,
  keywords JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subredditler
CREATE TABLE subreddits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  allows_promotion BOOLEAN,
  allows_dm BOOLEAN,
  tone TEXT,
  rule_badge TEXT,
  rules_cache TEXT,
  notes TEXT,
  rules_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reddit postları
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  reddit_id TEXT UNIQUE,
  subreddit TEXT,
  title TEXT,
  content TEXT,
  url TEXT,
  author TEXT,
  upvotes INTEGER,
  intent_score INTEGER,
  pain_level TEXT,
  buying_signal BOOLEAN,
  score_reasoning TEXT,
  approach_guide JSONB,
  status TEXT DEFAULT 'new', -- new / sent / ignored
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Leadler
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  reddit_username TEXT,
  post_id UUID REFERENCES posts(id),
  post_title TEXT,
  post_url TEXT,
  subreddit TEXT,
  status TEXT DEFAULT 'new', -- new / messaged / waiting / converted / irrelevant
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gönderilen postlar
CREATE TABLE sent_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  reddit_post_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, reddit_post_id)
);
```

***

## Reddit API Kullanımı

```javascript
// Post tarama
const fetchPosts = async (subreddit, keywords) => {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${keywords}&sort=new&limit=25`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RedditLeads/1.0' }
  });
  // Rate limit: istekler arasında 1-2sn bekle
  await sleep(1500);
  return res.json();
};

// Subreddit kuralları
const fetchRules = async (subreddit) => {
  const url = `https://www.reddit.com/r/${subreddit}/about/rules.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RedditLeads/1.0' }
  });
  return res.json();
};
```

***

## Dosya Yapısı

```
/src
  /app (Next.js App Router)
    /onboarding
      page.tsx
    /dashboard
      page.tsx
    /feed
      page.tsx
    /leads
      page.tsx
    /settings
      page.tsx
    /api
      /analyze-site/route.ts
      /fetch-posts/route.ts
      /score-posts/route.ts
      /approach-guide/route.ts
      /subreddit-rules/route.ts
  /components
    /layout
      Sidebar.tsx
      Header.tsx
    /onboarding
      UrlInput.tsx
      SurveyStep.tsx
      SubredditSelector.tsx
    /dashboard
      MetricCard.tsx
      CampaignList.tsx
      ActivityFeed.tsx
    /feed
      PostCard.tsx
      ApproachGuide.tsx
      FilterPanel.tsx
      RuleBadge.tsx
    /leads
      KanbanBoard.tsx
      LeadCard.tsx
    /settings
      ProductInfo.tsx
      SubredditManager.tsx
  /lib
    supabase.ts
    openai.ts
    lemonsqueezy.ts
    redditApi.ts
  /store
    useProductStore.ts
    useFeedStore.ts
    useLeadsStore.ts
  /types
    index.ts
```

***

## MVP Scope — Sadece Bunlar

**Yap:**

- URL analizi
- Amaç anketi
- Subreddit önerisi + kural okuma
- Post tarama + skorlama
- Yaklaşım rehberi
- Gönderildi takibi
- Temel lead kanban

**Yapma (sonraya bırak):**

- Redis + BullMQ queue sistemi
- Playwright scraping
- Email bildirimleri
- Çoklu proje desteği
- Analytics dashboard

***

## İş Modeli

- **Fiyat:** $19/ay
- **Deneme:** 7 gün ücretsiz, kredi kartı gerekmez
- **Ödeme:** Lemon Squeezy (Merchant of Record)
- **İptal:** İstediğin zaman

***

## Kritik Kurallar

1. **Yaklaşım rehberi — hazır metin değil.** AI metin üretirse Reddit kaldırır, kullanıcı ban yer, ürünü bırakır.
2. **Subreddit kurallarını her zaman oku.** Ban riski var, bu adım atlanamaz.
3. **Gönderildi takibi zorunlu.** Aynı posta iki kez mesaj gönderilmemeli.
4. **AI çağrılarını bloke etme.** Async yap, loading state göster.
5. **Reddit rate limit'e saygı.** İstekler arası 1-2sn bekle.
6. **Subreddit kurallarını cache'le.** Her sorguda fetch etme, 7 günde bir güncelle.
7. **gpt-4o-mini kullan.** Maliyet düşük tut, her kullanıcı başına \~$0.20/ay.

***

## Lemon Squeezy Entegrasyonu

**Neden Lemon Squeezy?**
Türkiye'den şirket kurmadan kullanılabiliyor. Merchant of Record olarak tüm vergi ve uyumu kendileri hallediyor.

**Ücret:** %5 + $0.50 per transaction. Aylık sabit ücret yok.

**Kurulum Adımları:**

1. lemonsqueezy.com → ücretsiz kayıt
2. Store oluştur → RedditLeads
3. Product ekle → Subscription → $19/ay → 7 gün trial
4. API key al: Settings → API → Create API key
5. Webhook kur: Settings → Webhooks → Add webhook

**Environment Variables:**

```env
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_VARIANT_ID=your_variant_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

**Webhook Events (dinlenecekler):**

- `subscription_created` → kullanıcı aktif et
- `subscription_cancelled` → kullanıcı pasif et
- `subscription_payment_success` → ödeme kaydı
- `subscription_payment_failed` → kullanıcıyı uyar

**Temel Kullanım:**

```typescript
import LemonSqueezy from '@lemonsqueezy/lemonsqueezy-js'

// Checkout URL üret
const getCheckoutUrl = async (userId: string) => {
  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/checkouts`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              custom: { user_id: userId }
            }
          },
          relationships: {
            store: { data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID }},
            variant: { data: { type: 'variants', id: process.env.LEMONSQUEEZY_VARIANT_ID }}
          }
        }
      })
    }
  )
  const data = await response.json()
  return data.data.attributes.url
}

// Webhook doğrula
import crypto from 'crypto'

const verifyWebhook = (payload: string, signature: string) => {
  const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET!)
  const digest = hmac.update(payload).digest('hex')
  return digest === signature
}
```

**Supabase'de subscription takibi:**

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  lemonsqueezy_id TEXT UNIQUE,
  status TEXT, -- active / cancelled / expired
  trial_ends_at TIMESTAMP,
  renews_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Kullanıcı aktiflik kontrolü:**

```typescript
const isUserActive = async (userId: string) => {
  const { data } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at, renews_at')
    .eq('user_id', userId)
    .single()

  if (!data) return false
  if (data.status === 'active') return true
  if (data.trial_ends_at && new Date(data.trial_ends_at) > new Date()) return true
  return false
}
```

**AI Limit Kontrolü (OpenRouter):**

- Günlük post skoru: max 100
- Günlük yaklaşım rehberi: max 20
- Aylık site analizi: max 5
- OpenRouter dashboard'unda: günlük $2, aylık $30 spend limit

