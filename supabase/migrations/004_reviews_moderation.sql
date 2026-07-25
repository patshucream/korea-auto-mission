-- 리뷰 모더레이션: status / 관리자 답변 / 작성자 필드 확장
-- 기존 customer_name, vehicle_info, is_published, is_sample 데이터는 삭제하지 않고 이전·동기화합니다.

-- ============================================================
-- COLUMNS
-- ============================================================
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS author_name TEXT;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS vehicle_name TEXT;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS admin_reply TEXT;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 기존 데이터 백필 (한 번만 의미 있게 적용)
UPDATE public.reviews
SET
  author_name = COALESCE(NULLIF(TRIM(author_name), ''), NULLIF(TRIM(customer_name), ''), '고객'),
  vehicle_name = COALESCE(NULLIF(TRIM(vehicle_name), ''), NULLIF(TRIM(vehicle_info), '')),
  status = CASE
    WHEN status IN ('pending', 'approved', 'hidden', 'rejected') AND status IS NOT NULL THEN status
    WHEN is_published = true THEN 'approved'
    ELSE 'pending'
  END,
  approved_at = CASE
    WHEN is_published = true THEN COALESCE(approved_at, created_at, now())
    ELSE approved_at
  END
WHERE TRUE;

-- author_name NOT NULL 보장
UPDATE public.reviews
SET author_name = COALESCE(NULLIF(TRIM(author_name), ''), '고객')
WHERE author_name IS NULL OR TRIM(author_name) = '';

ALTER TABLE public.reviews
  ALTER COLUMN author_name SET DEFAULT '';

ALTER TABLE public.reviews
  ALTER COLUMN author_name SET NOT NULL;

-- status 제약
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_status_check;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_status_check
  CHECK (status IN ('pending', 'approved', 'hidden', 'rejected'));

-- 레거시 칼럼과 새 칼럼 동기화 + updated_at
CREATE OR REPLACE FUNCTION public.sync_reviews_legacy_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();

  IF NEW.author_name IS NULL OR TRIM(NEW.author_name) = '' THEN
    NEW.author_name := COALESCE(NULLIF(TRIM(NEW.customer_name), ''), '고객');
  END IF;

  NEW.customer_name := COALESCE(NULLIF(TRIM(NEW.author_name), ''), COALESCE(NEW.customer_name, ''));

  IF NEW.vehicle_name IS NULL AND NEW.vehicle_info IS NOT NULL THEN
    NEW.vehicle_name := NULLIF(TRIM(NEW.vehicle_info), '');
  END IF;
  NEW.vehicle_info := COALESCE(NEW.vehicle_name, '');

  IF NEW.status IS NULL OR NEW.status NOT IN ('pending', 'approved', 'hidden', 'rejected') THEN
    NEW.status := CASE WHEN COALESCE(NEW.is_published, false) THEN 'approved' ELSE 'pending' END;
  END IF;

  NEW.is_published := (NEW.status = 'approved');

  IF NEW.status = 'approved' THEN
    NEW.approved_at := COALESCE(NEW.approved_at, now());
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status <> 'approved' THEN
    -- 공개 해제 시 approved_at 유지 (이력)
    NEW.approved_at := OLD.approved_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_sync_legacy ON public.reviews;
CREATE TRIGGER trg_reviews_sync_legacy
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_reviews_legacy_fields();

-- 익명 삽입 시 상태·답변 강제 (RLS와 이중 방어)
CREATE OR REPLACE FUNCTION public.reviews_force_public_insert_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' THEN
    NEW.status := 'pending';
    NEW.is_published := false;
    NEW.admin_reply := NULL;
    NEW.approved_at := NULL;
    NEW.is_sample := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_public_insert ON public.reviews;
CREATE TRIGGER trg_reviews_public_insert
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.reviews_force_public_insert_defaults();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_reviews_status_created
  ON public.reviews (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_approved_created
  ON public.reviews (created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_reviews_rating
  ON public.reviews (rating);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public insert pending reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin all reviews" ON public.reviews;

-- 방문자: 승인된 리뷰만 조회
CREATE POLICY "Public read approved reviews" ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    OR auth.role() = 'authenticated'
  );

-- 방문자: pending 리뷰만 작성 (관리자 필드는 비움)
CREATE POLICY "Public insert pending reviews" ON public.reviews
  FOR INSERT
  TO anon
  WITH CHECK (
    status = 'pending'
    AND COALESCE(is_published, false) = false
    AND admin_reply IS NULL
    AND approved_at IS NULL
  );

-- 관리자: 전체 CRUD
CREATE POLICY "Admin all reviews" ON public.reviews
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON COLUMN public.reviews.author_name IS '작성자 표시명 (마스킹은 앱에서 처리)';
COMMENT ON COLUMN public.reviews.vehicle_name IS '차량명 (선택)';
COMMENT ON COLUMN public.reviews.status IS 'pending | approved | hidden | rejected';
COMMENT ON COLUMN public.reviews.admin_reply IS '관리자 답변';
COMMENT ON COLUMN public.reviews.password_hash IS '선택적 수정/삭제용 해시 (평문 금지)';
COMMENT ON COLUMN public.reviews.approved_at IS '승인 시각';
