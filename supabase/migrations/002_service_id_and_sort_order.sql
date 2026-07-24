-- 정비 서비스 관리 고도화
-- 1) services.display_order → sort_order 정리
-- 2) work_cases.service_id FK 추가 (이름 대신 ID로 연결)
-- 3) 기존 service_category 값으로 service_id 백필
-- 4) RLS 재확인 (anon: 공개 조회, authenticated: CRUD)

-- ============================================================
-- services: display_order → sort_order
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services'
      AND column_name = 'display_order'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services'
      AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE public.services RENAME COLUMN display_order TO sort_order;
  END IF;
END $$;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS idx_services_order;
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON public.services (sort_order);

COMMENT ON COLUMN public.services.sort_order IS '홈페이지·관리자 표시 순서 (오름차순)';
COMMENT ON COLUMN public.services.detailed_description IS '상세 설명 (description 역할)';

-- ============================================================
-- work_cases.service_id (서비스명 변경에도 연결 유지)
-- ============================================================
ALTER TABLE public.work_cases
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_work_cases_service_id ON public.work_cases (service_id);

-- 기존 문자열 분류(service_category)로 service_id 백필 (중복 INSERT 없음)
UPDATE public.work_cases wc
SET service_id = s.id
FROM public.services s
WHERE wc.service_id IS NULL
  AND NULLIF(TRIM(wc.service_category), '') IS NOT NULL
  AND wc.service_category = s.title;

-- ============================================================
-- RLS: services
-- anon → 공개(is_published) 조회만
-- authenticated → 전체 조회 + 추가/수정/삭제
-- ============================================================
DROP POLICY IF EXISTS "Public read published services" ON public.services;
CREATE POLICY "Public read published services" ON public.services
  FOR SELECT TO anon
  USING (is_published = true);

DROP POLICY IF EXISTS "Authenticated read all services" ON public.services;
CREATE POLICY "Authenticated read all services" ON public.services
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin all services" ON public.services;
CREATE POLICY "Admin all services" ON public.services
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 기본 6개 서비스가 없을 때만 seed (중복 방지)
INSERT INTO public.services (title, short_description, detailed_description, sort_order, is_published)
SELECT * FROM (VALUES
  (
    '자동변속기 수리',
    '변속 충격, 슬립, 경고등 등 자동변속기 이상을 정밀 진단하고 수리합니다.',
    '수입차·국산차 자동변속기의 변속감 이상, 충격, 슬립, 오일 누유, 경고등 점등 등 다양한 증상을 점검합니다. 단순 오일 교환으로 끝날 문제인지, 유닛 분해 수리가 필요한지 정확히 구분하여 안내합니다.',
    1,
    true
  ),
  (
    '트랜스퍼케이스',
    '사륜구동 차량의 트랜스퍼케이스 소음·진동·작동 이상을 점검·수리합니다.',
    '사륜구동(4WD/AWD) 차량에서 발생하는 트랜스퍼케이스 이상 소음, 진동, 작동 불량을 진단합니다. 오일과 실링 상태부터 내부 기어·체인까지 체계적으로 확인합니다.',
    2,
    true
  ),
  (
    '디퍼렌셜',
    '디퍼렌셜 소음, 진동, 오일 누유를 점검하고 필요한 수리를 진행합니다.',
    '주행 중 하체·후방에서 나는 소음과 진동의 원인이 디퍼렌셜인 경우가 많습니다. 오일 상태, 베어링, 기어 마모 여부를 확인하고 상황에 맞는 정비 방안을 제시합니다.',
    3,
    true
  ),
  (
    'DPF 클리닝',
    '매연저감장치(DPF) 막힘과 관련 경고등을 점검하고 클리닝합니다.',
    'DPF 막힘으로 인한 출력 저하, 경고등, 강제 재생 반복 등의 증상을 확인합니다. 차량 상태에 맞는 클리닝 방법을 안내하고, 재오염을 줄이기 위한 관리 포인트도 함께 설명합니다.',
    4,
    true
  ),
  (
    '흡기 클리닝',
    '흡기 계통 오염을 제거하고 연소 효율과 주행감을 개선합니다.',
    '장기간 주행으로 쌓인 흡기 매니폴드·스로틀·밸브 주변 카본을 점검하고 클리닝합니다. 공회전 불안정, 연비 저하, 가속 응답 저하가 있는 차량에 도움이 될 수 있습니다.',
    5,
    true
  ),
  (
    '인젝터 클리닝',
    '인젝터 분무 상태를 점검하고 클리닝하여 연소 품질을 개선합니다.',
    '인젝터 막힘과 분무 불량은 연비·출력·진동에 영향을 줍니다. 클리닝 전후 상태를 비교할 수 있도록 안내하며, 필요 시 추가 점검을 권장합니다.',
    6,
    true
  )
) AS v(title, short_description, detailed_description, sort_order, is_published)
WHERE NOT EXISTS (SELECT 1 FROM public.services LIMIT 1);
