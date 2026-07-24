-- KOREA AUTO MISSION / 코리아오토미션
-- Initial schema, RLS, storage bucket & policies

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SITE SETTINGS (single row)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT '코리아오토미션',
  english_brand_name TEXT NOT NULL DEFAULT 'KOREA AUTO MISSION',
  phone TEXT NOT NULL DEFAULT '010-5558-0528',
  address TEXT NOT NULL DEFAULT '부산 사상구 삼덕로 95',
  hours TEXT NOT NULL DEFAULT '평일 09:00 - 18:00 토요일 09:00 - 15:00',
  closed_days TEXT NOT NULL DEFAULT '일요일 · 공휴일',
  weekday_hours TEXT NOT NULL DEFAULT '09:00 - 18:00',
  saturday_hours TEXT NOT NULL DEFAULT '09:00 - 15:00',
  holiday_hours TEXT NOT NULL DEFAULT '휴무',
  naver_blog_url TEXT NOT NULL DEFAULT 'https://blog.naver.com/97ga074',
  naver_map_url TEXT NOT NULL DEFAULT 'https://map.naver.com/p/search/%EB%B6%80%EC%82%B0%20%EC%82%AC%EC%83%81%EA%B5%AC%20%EC%82%BC%EB%8D%95%EB%A1%9C%2095',
  naver_reservation_url TEXT NOT NULL DEFAULT '',
  hero_title TEXT NOT NULL DEFAULT '자동변속기,
정확한 진단이
좋은 수리의 시작입니다.',
  hero_description TEXT NOT NULL DEFAULT '수입차·국산차 자동변속기와 구동계를
30년 정비 경험으로 정확하게 점검합니다.',
  hero_image_path TEXT,
  shop_image_path TEXT,
  stat_experience TEXT NOT NULL DEFAULT '30년',
  stat_services TEXT NOT NULL DEFAULT '6가지',
  stat_brands TEXT NOT NULL DEFAULT '8개 이상',
  stat_works TEXT NOT NULL DEFAULT '30년간 축적된 작업 경험',
  why_title TEXT NOT NULL DEFAULT '왜 코리아오토미션인가',
  why_content TEXT NOT NULL DEFAULT '자동변속기와 구동계는 정확한 진단이 핵심입니다. 코리아오토미션은 수입차·국산차 자동변속기 전문 정비소로서, 증상만 보고 성급히 부품을 교체하지 않습니다. 점검부터 수리까지 한 곳에서 책임지고 진행합니다.',
  process_steps JSONB NOT NULL DEFAULT '[
    {"title":"상담 및 예약","description":"증상과 차량 정보를 확인한 뒤 방문 일정을 안내합니다."},
    {"title":"입고 점검","description":"외관·주행·진단기로 이상 여부를 체계적으로 확인합니다."},
    {"title":"정밀 진단","description":"자동변속기·구동계 중심으로 원인을 정확히 파악합니다."},
    {"title":"견적 안내","description":"필요한 작업 범위와 비용을 투명하게 설명합니다."},
    {"title":"수리 진행","description":"합의된 범위에 맞춰 숙련된 기술로 작업을 진행합니다."},
    {"title":"최종 점검·출고","description":"작업 후 재점검하고 주의사항을 안내한 뒤 출고합니다."}
  ]'::jsonb,
  seo_title TEXT NOT NULL DEFAULT '코리아오토미션 | 수입차·국산차 자동변속기 전문 정비',
  seo_description TEXT NOT NULL DEFAULT '부산 사상구 코리아오토미션. 수입차·국산차 자동변속기, 트랜스퍼케이스, 디퍼렌셜, DPF·흡기·인젝터 클리닝 전문. 30년 정비 경험.',
  og_image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  detailed_description TEXT NOT NULL DEFAULT '',
  image_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_sort_order ON public.services (sort_order);

-- ============================================================
-- WORK CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  vehicle_brand TEXT NOT NULL DEFAULT '',
  vehicle_model TEXT NOT NULL DEFAULT '',
  model_year TEXT NOT NULL DEFAULT '',
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_category TEXT NOT NULL DEFAULT '',
  symptoms TEXT NOT NULL DEFAULT '',
  diagnosis TEXT NOT NULL DEFAULT '',
  work_summary TEXT NOT NULL DEFAULT '',
  detailed_content TEXT NOT NULL DEFAULT '',
  representative_image_path TEXT,
  gallery_image_paths TEXT[] NOT NULL DEFAULT '{}',
  naver_blog_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT
);

CREATE INDEX IF NOT EXISTS idx_work_cases_published ON public.work_cases (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_cases_brand ON public.work_cases (vehicle_brand);
CREATE INDEX IF NOT EXISTS idx_work_cases_model ON public.work_cases (vehicle_model);
CREATE INDEX IF NOT EXISTS idx_work_cases_category ON public.work_cases (service_category);
CREATE INDEX IF NOT EXISTS idx_work_cases_service_id ON public.work_cases (service_id);
CREATE INDEX IF NOT EXISTS idx_work_cases_order ON public.work_cases (display_order);
CREATE INDEX IF NOT EXISTS idx_work_cases_search ON public.work_cases USING gin (
  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(vehicle_brand,'') || ' ' || coalesce(vehicle_model,'') || ' ' || coalesce(symptoms,'') || ' ' || coalesce(work_summary,''))
);

-- ============================================================
-- BEFORE / AFTER (fixed two categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.before_after (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE CHECK (category IN ('injector', 'intake')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  before_image_path TEXT,
  after_image_path TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL DEFAULT '',
  vehicle_info TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  rating INT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  display_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_sample BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.reviews (display_order);

-- ============================================================
-- FAQ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_order ON public.faqs (display_order);

-- ============================================================
-- MEDIA REGISTRY (tracks uploaded files)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL UNIQUE,
  folder TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT,
  size_bytes BIGINT,
  alt_text TEXT NOT NULL DEFAULT '',
  used_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_media_folder ON public.media (folder);
CREATE INDEX IF NOT EXISTS idx_media_created ON public.media (created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_settings_updated ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated ON public.services;
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_work_cases_updated ON public.work_cases;
CREATE TRIGGER trg_work_cases_updated BEFORE UPDATE ON public.work_cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_before_after_updated ON public.before_after;
CREATE TRIGGER trg_before_after_updated BEFORE UPDATE ON public.before_after
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reviews_updated ON public.reviews;
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_faqs_updated ON public.faqs;
CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.before_after ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Public read (published only where applicable)
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read published services" ON public.services;
CREATE POLICY "Public read published services" ON public.services
  FOR SELECT TO anon USING (is_published = true);

DROP POLICY IF EXISTS "Authenticated read all services" ON public.services;
CREATE POLICY "Authenticated read all services" ON public.services
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read published work_cases" ON public.work_cases;
CREATE POLICY "Public read published work_cases" ON public.work_cases
  FOR SELECT TO anon, authenticated USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read published before_after" ON public.before_after;
CREATE POLICY "Public read published before_after" ON public.before_after
  FOR SELECT TO anon, authenticated USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read published reviews" ON public.reviews;
CREATE POLICY "Public read published reviews" ON public.reviews
  FOR SELECT TO anon, authenticated USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read published faqs" ON public.faqs;
CREATE POLICY "Public read published faqs" ON public.faqs
  FOR SELECT TO anon, authenticated USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read media" ON public.media;
CREATE POLICY "Public read media" ON public.media
  FOR SELECT TO anon, authenticated USING (true);

-- Authenticated admin write
DROP POLICY IF EXISTS "Admin all site_settings" ON public.site_settings;
CREATE POLICY "Admin all site_settings" ON public.site_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin all services" ON public.services;
CREATE POLICY "Admin all services" ON public.services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin all work_cases" ON public.work_cases;
CREATE POLICY "Admin all work_cases" ON public.work_cases
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin all before_after" ON public.before_after;
CREATE POLICY "Admin all before_after" ON public.before_after
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin all reviews" ON public.reviews;
CREATE POLICY "Admin all reviews" ON public.reviews
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin all faqs" ON public.faqs;
CREATE POLICY "Admin all faqs" ON public.faqs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin all media" ON public.media;
CREATE POLICY "Admin all media" ON public.media
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- STORAGE: images bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public can read images
DROP POLICY IF EXISTS "Public read images" ON storage.objects;
CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'images');

-- Authenticated can upload
DROP POLICY IF EXISTS "Admin upload images" ON storage.objects;
CREATE POLICY "Admin upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Authenticated can update
DROP POLICY IF EXISTS "Admin update images" ON storage.objects;
CREATE POLICY "Admin update images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

-- Authenticated can delete
DROP POLICY IF EXISTS "Admin delete images" ON storage.objects;
CREATE POLICY "Admin delete images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'images');
