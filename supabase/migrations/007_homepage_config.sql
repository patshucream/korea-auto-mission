-- Homepage CMS: site_settings.homepage_config (JSONB)
-- 자동 실행하지 마세요. Supabase SQL Editor에서 수동 실행.
-- 기존 데이터 삭제/DROP COLUMN 없음.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS homepage_config JSONB;

COMMENT ON COLUMN public.site_settings.homepage_config IS
  '홈페이지 섹션 순서/표시, CTA, 신뢰 문구, 메인 노출 서비스·작업사례 ID';

-- 기존 행에 빈 객체만 채워 두면 앱 DEFAULT_HOMEPAGE_CONFIG 와 병합됨
UPDATE public.site_settings
SET homepage_config = COALESCE(homepage_config, '{}'::jsonb)
WHERE homepage_config IS NULL;
