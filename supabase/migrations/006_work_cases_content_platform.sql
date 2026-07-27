-- Phase 1: 작업사례 콘텐츠 플랫폼 확장
-- + admin_users allowlist 기반 관리자 판별 / work_cases RLS
-- 기존 컬럼·데이터 유지 — ADD COLUMN IF NOT EXISTS 만 사용
-- DROP TABLE / DROP COLUMN / TRUNCATE 사용 금지

-- ============================================================
-- ADMIN ALLOWLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  CONSTRAINT admin_users_email_unique UNIQUE (email)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_lower
  ON public.admin_users (lower(email));

COMMENT ON TABLE public.admin_users IS '관리자 이메일 allowlist. 로그인 자체는 Auth, 권한은 이 테이블.';

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users select own row" ON public.admin_users;
CREATE POLICY "Admin users select own row" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- INSERT/UPDATE/DELETE 는 Dashboard SQL(서비스 롤)로만 수행.
-- 일반 authenticated 쓰기 정책은 두지 않음.

-- 관리자 이메일 등록 (실행 전 이메일을 실제 관리자 주소로 바꾸세요)
-- INSERT INTO public.admin_users (email)
-- VALUES ('YOUR_ADMIN_EMAIL@example.com')
-- ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- ADMIN HELPER (admin_users 기반)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_site_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

REVOKE ALL ON FUNCTION public.is_site_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_site_admin() TO anon, authenticated;

COMMENT ON FUNCTION public.is_site_admin() IS
  'JWT email 이 public.admin_users 에 있으면 true. app_metadata.role 미사용.';

-- ============================================================
-- LEGACY COLUMNS (트리거·공개 조건 — 없을 때만 추가)
-- ============================================================
ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS vehicle_brand TEXT NOT NULL DEFAULT '';

-- ============================================================
-- CONTENT / PUBLISHING
-- ============================================================
ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS subtitle TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS excerpt TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS content_json JSONB;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS content_html TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE public.work_cases
SET status = CASE
  WHEN deleted_at IS NOT NULL THEN 'trash'
  WHEN is_published = true THEN 'published'
  ELSE COALESCE(NULLIF(TRIM(status), ''), 'draft')
END
WHERE TRUE;

ALTER TABLE public.work_cases
  DROP CONSTRAINT IF EXISTS work_cases_status_check;

ALTER TABLE public.work_cases
  ADD CONSTRAINT work_cases_status_check
  CHECK (status IN ('draft', 'published', 'private', 'scheduled', 'trash'));

-- ============================================================
-- VEHICLE
-- ============================================================
ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS manufacturer TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS generation TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS fuel_type TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS transmission_type TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS mileage TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS vehicle_number_masked TEXT;

UPDATE public.work_cases
SET manufacturer = COALESCE(NULLIF(TRIM(manufacturer), ''), NULLIF(TRIM(vehicle_brand), ''))
WHERE manufacturer IS NULL OR TRIM(manufacturer) = '';

-- ============================================================
-- REPAIR DETAIL
-- ============================================================
ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS cause TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS repair_process TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS replaced_parts TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS repair_duration TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS warranty_info TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS estimated_price_min INT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS estimated_price_max INT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS price_display_enabled BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- TAXONOMY / MEDIA
-- ============================================================
ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS vehicle_tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS symptom_tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS general_tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS before_images TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS after_images TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS video_urls TEXT[] NOT NULL DEFAULT '{}';

-- ============================================================
-- SEO / STATS / RELATIONS
-- ============================================================
ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS og_title TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS og_description TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS og_image_path TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS canonical_url TEXT;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS noindex BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS inquiry_click_count INT NOT NULL DEFAULT 0;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS phone_click_count INT NOT NULL DEFAULT 0;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS reservation_click_count INT NOT NULL DEFAULT 0;

ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS related_work_ids UUID[] NOT NULL DEFAULT '{}';

-- ============================================================
-- status / is_published 동기화 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_work_cases_publish_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();

  IF NEW.status IS NULL OR NEW.status NOT IN ('draft', 'published', 'private', 'scheduled', 'trash') THEN
    NEW.status := CASE WHEN COALESCE(NEW.is_published, false) THEN 'published' ELSE 'draft' END;
  END IF;

  IF NEW.status = 'published' THEN
    NEW.is_published := true;
    NEW.published_at := COALESCE(NEW.published_at, now());
    NEW.deleted_at := NULL;
  ELSIF NEW.status = 'trash' THEN
    NEW.is_published := false;
    NEW.deleted_at := COALESCE(NEW.deleted_at, now());
  ELSIF NEW.status = 'scheduled' THEN
    NEW.is_published := false;
  ELSE
    NEW.is_published := false;
    IF NEW.status <> 'trash' THEN
      NEW.deleted_at := NULL;
    END IF;
  END IF;

  IF (NEW.manufacturer IS NULL OR TRIM(NEW.manufacturer) = '') AND NEW.vehicle_brand IS NOT NULL THEN
    NEW.manufacturer := NEW.vehicle_brand;
  END IF;
  IF NEW.manufacturer IS NOT NULL AND TRIM(NEW.manufacturer) <> '' THEN
    NEW.vehicle_brand := NEW.manufacturer;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_cases_publish_status ON public.work_cases;
CREATE TRIGGER trg_work_cases_publish_status
  BEFORE INSERT OR UPDATE ON public.work_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_work_cases_publish_status();

CREATE INDEX IF NOT EXISTS idx_work_cases_status ON public.work_cases (status);
CREATE INDEX IF NOT EXISTS idx_work_cases_deleted ON public.work_cases (deleted_at);
CREATE INDEX IF NOT EXISTS idx_work_cases_scheduled ON public.work_cases (scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_work_cases_manufacturer ON public.work_cases (manufacturer);
CREATE INDEX IF NOT EXISTS idx_work_cases_view_count ON public.work_cases (view_count DESC);

-- ============================================================
-- work_cases RLS
-- ============================================================
ALTER TABLE public.work_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published work_cases" ON public.work_cases;
DROP POLICY IF EXISTS "Admin all work_cases" ON public.work_cases;

-- 1) anon + 일반 authenticated: 공개글만
CREATE POLICY "Public read published work_cases" ON public.work_cases
  FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND is_published = true
    AND status = 'published'
  );

-- 2) admin_users 등록 관리자: 전체 CRUD (draft/private/scheduled/trash 포함)
CREATE POLICY "Admin all work_cases" ON public.work_cases
  FOR ALL
  TO authenticated
  USING (public.is_site_admin())
  WITH CHECK (public.is_site_admin());

COMMENT ON COLUMN public.work_cases.content_json IS 'TipTap JSON document';
COMMENT ON COLUMN public.work_cases.content_html IS 'Rendered HTML cache from editor';
COMMENT ON COLUMN public.work_cases.status IS 'draft | published | private | scheduled | trash';
COMMENT ON COLUMN public.work_cases.scheduled_at IS '예약발행 시각(컬럼만). 자동 발행 cron/job 미구현';
