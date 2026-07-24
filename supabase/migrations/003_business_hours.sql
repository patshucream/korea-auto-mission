-- 영업시간 분리: weekday / saturday / holiday
-- 기존 hours, closed_days 값은 유지하면서 새 칼럼으로 안전하게 이전

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS weekday_hours TEXT NOT NULL DEFAULT '09:00 - 18:00';

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS saturday_hours TEXT NOT NULL DEFAULT '09:00 - 15:00';

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS holiday_hours TEXT NOT NULL DEFAULT '휴무';

-- 기존 hours에서 평일·토요일 시간 추출 (실패 시 기본값 유지)
UPDATE public.site_settings
SET
  weekday_hours = COALESCE(
    NULLIF(
      TRIM(
        (regexp_match(COALESCE(hours, ''), '평일\s*([0-9]{1,2}:[0-9]{2}\s*[-–~]\s*[0-9]{1,2}:[0-9]{2})'))[1]
      ),
      ''
    ),
    NULLIF(
      TRIM(
        regexp_replace(
          COALESCE(hours, ''),
          '.*(토|일|공휴).*',
          '',
          'g'
        )
      ),
      ''
    ),
    CASE
      WHEN COALESCE(hours, '') ~ '^[0-9]{1,2}:[0-9]{2}' THEN TRIM(hours)
      WHEN COALESCE(hours, '') ~ '평일' THEN TRIM(regexp_replace(hours, '^평일\s*', ''))
      ELSE weekday_hours
    END
  ),
  saturday_hours = COALESCE(
    NULLIF(
      TRIM(
        (regexp_match(COALESCE(hours, ''), '토(?:요일)?\s*([0-9]{1,2}:[0-9]{2}\s*[-–~]\s*[0-9]{1,2}:[0-9]{2})'))[1]
      ),
      ''
    ),
    saturday_hours
  ),
  holiday_hours = CASE
    WHEN COALESCE(TRIM(closed_days), '') = '' THEN holiday_hours
    WHEN closed_days ~* '(휴무|휴일|닫)' THEN '휴무'
    WHEN closed_days ~* '(일요일|공휴일)' THEN '휴무'
    ELSE TRIM(closed_days)
  END
WHERE TRUE;

-- 레거시 hours / closed_days 를 새 값 기준으로 동기화 (표시용·SEO 호환)
UPDATE public.site_settings
SET
  hours = '평일 ' || weekday_hours || ' 토요일 ' || saturday_hours,
  closed_days = CASE
    WHEN holiday_hours = '휴무' THEN '일요일 · 공휴일'
    ELSE holiday_hours
  END
WHERE TRUE;

COMMENT ON COLUMN public.site_settings.weekday_hours IS '평일 영업시간';
COMMENT ON COLUMN public.site_settings.saturday_hours IS '토요일 영업시간';
COMMENT ON COLUMN public.site_settings.holiday_hours IS '일요일/공휴일 안내';
