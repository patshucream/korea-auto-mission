-- 공휴일: 휴무 → 정상영업 (일요일 휴무는 앱 표시에서 유지)
-- 기존 site_settings 행의 기본/레거시 값만 안전하게 갱신

UPDATE public.site_settings
SET
  holiday_hours = '정상영업',
  closed_days = CASE
    WHEN COALESCE(TRIM(closed_days), '') IN ('일요일 · 공휴일', '일요일·공휴일', '공휴일')
      THEN '일요일'
    ELSE closed_days
  END,
  updated_at = now()
WHERE
  COALESCE(TRIM(holiday_hours), '') IN ('', '휴무')
  OR COALESCE(TRIM(closed_days), '') IN ('일요일 · 공휴일', '일요일·공휴일');

-- 신규 행 기본값
ALTER TABLE public.site_settings
  ALTER COLUMN holiday_hours SET DEFAULT '정상영업';

ALTER TABLE public.site_settings
  ALTER COLUMN closed_days SET DEFAULT '일요일';

COMMENT ON COLUMN public.site_settings.holiday_hours IS '공휴일 안내 (예: 정상영업)';
