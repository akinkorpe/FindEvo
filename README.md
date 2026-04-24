# FindEvo (RedditLeads MVP)

FindEvo, bir web sitesini analiz edip doğru subreddit'leri öneren, Reddit gönderilerini toplayıp niyet/risk skorlayan ve potansiyel lead'leri takip etmeyi kolaylaştıran bir Next.js uygulamasıdır.

## Ne Yapar?

- Website URL'sinden ürün/niche/anahtar kelime ve hedef subreddit önerileri üretir.
- Hedef subreddit'lerden gönderi toplar.
- Gönderileri AI ile `intentScore` (0-100) ve `riskLevel` (`safe`, `review`, `high_risk`) olarak skorlar.
- Lead havuzu ve durum takibi (`new`, `engaged`, `active_pipeline`, `converted`, `dismissed`) sunar.
- Subreddit kurallarını çekip cache'ler ve tanıtım toleransına göre badge (`green`, `yellow`, `red`) sınıflandırır.

## Teknoloji Yığını

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS
- Supabase (Postgres + SDK)
- OpenRouter (OpenAI-compatible API)
- Zustand

## Proje Yapısı (Özet)

- `src/app` - Sayfalar ve API route'ları
- `src/services` - İş kuralları ve orchestration katmanı
- `src/repositories` - Veritabanı erişim katmanı
- `src/lib` - Dış servis istemcileri (OpenRouter, Reddit, Supabase)
- `supabase/migrations` - SQL migration dosyaları

## Gereksinimler

- Node.js 20+
- npm
- Supabase projesi
- OpenRouter API anahtarı (AI özellikleri için)

## Kurulum

```bash
npm install
cp .env.example .env.local
```

`.env.local` içine aşağıdaki değişkenleri doldurun:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# OpenRouter (OpenAI-compatible API)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Reddit (script app)
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=redditleads/0.1
```

Notlar:
- `OPENROUTER_API_KEY` yoksa analiz/skorlama çağrıları hata verir.
- Reddit istemcisi, bu MVP'de public JSON fallback ile çalışacak şekilde tasarlandığı için OAuth zorunlu değildir.

## Veritabanı Kurulumu (Supabase)

Migration dosyalarını sırasıyla Supabase SQL Editor'da çalıştırın:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_mvp_extensions.sql`
3. `supabase/migrations/0003_scored_posts_ttl.sql`

Bu adımlar temel tabloları, enum'ları, trigger'ları ve `scored_posts` cleanup fonksiyonunu oluşturur.

## Geliştirme

```bash
npm run dev
```

Uygulama varsayılan olarak:
- `http://localhost:3000` üzerinde açılır.
- Kök sayfada Supabase konfigürasyonuna göre onboarding veya dashboard'a yönlendirir.

## Script'ler

```bash
npm run dev        # local geliştirme
npm run build      # production build
npm run start      # production server
npm run lint       # Next.js lint
npm run typecheck  # TypeScript type check
```

## API Route'ları (Özet)

- `POST /api/analyze-site` - Site analizi ve ürün context'i çıkarımı
- `GET /api/subreddits` - Hedef subreddit listesi
- `GET /api/feed` - Toplanan/skorlanan gönderi akışı
- `POST /api/score-posts` - Gönderi skorlama
- `GET/POST /api/leads` - Lead listeleme/ekleme
- `PATCH /api/leads/[id]` - Lead güncelleme
- `GET /api/approach-guide` - Yaklaşım önerileri
- `GET/POST /api/settings` - Workspace ayarları

## Durum ve Limit Notları

- `ai_credits` tablosu kullanım muhasebesi ve rate-limit kontrolü için kullanılır.
- `scored_posts` kayıtları varsayılan olarak 24 saat TTL ile tutulur, lead'e bağlı olanlar kalıcı tutulur.

## Lisans

MIT
