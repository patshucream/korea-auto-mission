-- ============================================================
-- 008: 코드·원격 스키마 비교 후 누락 컬럼 동기화
--
-- 실제 Supabase 점검 결과 (2026-07-27):
--   - work_cases: service_id 누락 (그 외 코드 사용 컬럼은 존재)
--   - services:   sort_order 누락 (display_order 는 존재)
--
-- 안전 규칙:
--   - DROP TABLE / DROP COLUMN / TRUNCATE 사용 금지
--   - 기존 컬럼·데이터 유지 (display_order 유지)
--   - ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS 만 사용
--   - 002 와 목적은 겹치지만, RENAME/DROP POLICY 없이 재실행 가능
-- ============================================================

-- ------------------------------------------------------------
-- 1) services.sort_order
--    코드는 sort_order 를 사용. 기존 display_order 는 삭제하지 않음.
-- ------------------------------------------------------------
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- display_order 값이 있으면 sort_order 로 복사 (기존 순서 유지)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services'
      AND column_name = 'display_order'
  ) THEN
    EXECUTE 'UPDATE public.services SET sort_order = display_order';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_services_sort_order
  ON public.services (sort_order);

COMMENT ON COLUMN public.services.sort_order IS
  '홈페이지·관리자 표시 순서 (오름차순). display_order 와 병행 유지.';

-- ------------------------------------------------------------
-- 2) work_cases.service_id
--    public.services(id) FK, 서비스명 변경에도 연결 유지
-- ------------------------------------------------------------
ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS service_id UUID
    REFERENCES public.services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_work_cases_service_id
  ON public.work_cases (service_id);

COMMENT ON COLUMN public.work_cases.service_id IS
  '정비 서비스 FK (services.id). service_category 는 표시용 캐시.';

-- 기존 service_category(서비스명)로 service_id 백필
-- 이미 service_id 가 있는 행은 건드리지 않음
UPDATE public.work_cases wc
SET service_id = s.id
FROM public.services s
WHERE wc.service_id IS NULL
  AND NULLIF(TRIM(wc.service_category), '') IS NOT NULL
  AND wc.service_category = s.title;
