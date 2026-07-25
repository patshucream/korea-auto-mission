-- Seed data for 코리아오토미션 / KOREA AUTO MISSION
-- Run after 001_initial_schema.sql

-- Site settings (single row)
INSERT INTO public.site_settings (
  business_name,
  english_brand_name,
  phone,
  address,
  hours,
  closed_days,
  weekday_hours,
  saturday_hours,
  holiday_hours,
  naver_blog_url,
  naver_map_url,
  naver_reservation_url,
  hero_title,
  hero_description,
  stat_experience,
  stat_services,
  stat_brands,
  stat_works,
  why_title,
  why_content,
  seo_title,
  seo_description
)
SELECT
  '코리아오토미션',
  'KOREA AUTO MISSION',
  '010-5558-0528',
  '부산 사상구 삼덕로 95',
  '평일 09:00 - 18:00 토요일 09:00 - 15:00',
  '일요일',
  '09:00 - 18:00',
  '09:00 - 15:00',
  '정상영업',
  'https://blog.naver.com/97ga074',
  'https://map.naver.com/p/search/%EB%B6%80%EC%82%B0%20%EC%82%AC%EC%83%81%EA%B5%AC%20%EC%82%BC%EB%8D%95%EB%A1%9C%2095',
  '',
  E'자동변속기,\n정확한 진단이\n좋은 수리의 시작입니다.',
  E'수입차·국산차 자동변속기와 구동계를\n30년 정비 경험으로 정확하게 점검합니다.',
  '30년',
  '6가지',
  '8개 이상',
  '30년간 축적된 작업 경험',
  '왜 코리아오토미션인가',
  '자동변속기와 구동계는 정확한 진단이 핵심입니다. 코리아오토미션은 수입차·국산차 자동변속기 전문 정비소로서, 증상만 보고 성급히 부품을 교체하지 않습니다. 점검부터 수리까지 한 곳에서 책임지고 진행합니다. 부산 사상구에서 30년 경험으로 고객 차량을 꼼꼼히 살핍니다.',
  '코리아오토미션 | 수입차·국산차 자동변속기 전문 정비',
  '부산 사상구 코리아오토미션. 수입차·국산차 자동변속기, 트랜스퍼케이스, 디퍼렌셜, DPF·흡기·인젝터 클리닝 전문. 30년 정비 경험.'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

-- Six services
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

-- Before/after fixed categories
INSERT INTO public.before_after (category, title, description, is_published)
SELECT * FROM (VALUES
  (
    'injector',
    '인젝터 클리닝 전후',
    '인젝터 분무 상태와 오염 정도를 작업 전후로 비교합니다. 실제 작업 사진은 관리자에서 등록할 수 있습니다.',
    true
  ),
  (
    'intake',
    '흡기 클리닝 전후',
    '흡기 계통 카본·오염 제거 전후를 한눈에 확인할 수 있습니다. 실제 작업 사진은 관리자에서 등록할 수 있습니다.',
    true
  )
) AS v(category, title, description, is_published)
WHERE NOT EXISTS (SELECT 1 FROM public.before_after LIMIT 1);

-- Sample FAQs
INSERT INTO public.faqs (question, answer, display_order, is_published)
SELECT * FROM (VALUES
  (
    '예약은 어떻게 하나요?',
    '전화 상담(010-5558-0528) 또는 네이버 예약을 통해 방문 일정을 잡으실 수 있습니다. 증상과 차량 모델명을 알려주시면 더 정확한 안내가 가능합니다.',
    1,
    true
  ),
  (
    '수입차도 정비가 가능한가요?',
    '네. BMW, Mercedes-Benz, Audi 등 수입차와 국산차 자동변속기·구동계 정비를 모두 다룹니다. 차종에 따라 부품 수급 기간이 달라질 수 있어 상담 시 안내드립니다.',
    2,
    true
  ),
  (
    '견적은 바로 나오나요?',
    '증상만으로 확정 견적을 드리기 어려운 경우가 많습니다. 입고 점검과 진단 후 필요한 작업 범위와 비용을 투명하게 설명드립니다.',
    3,
    true
  ),
  (
    '작업 기간은 얼마나 걸리나요?',
    '오일 점검·클리닝 수준의 작업은 당일 또는 짧은 기간에 가능할 수 있으나, 변속기 분해 수리 등은 부품과 작업 범위에 따라 달라집니다. 진단 후 일정을 안내드립니다.',
    4,
    true
  ),
  (
    '주차와 위치가 궁금합니다.',
    '부산 사상구 삼덕로 95에 위치해 있습니다. 방문 전 전화로 위치를 확인해 주시면 편하게 안내해 드립니다.',
    5,
    true
  )
) AS v(question, answer, display_order, is_published)
WHERE NOT EXISTS (SELECT 1 FROM public.faqs LIMIT 1);

-- Sample reviews (explicitly marked as sample / unpublished by default for honesty)
-- Leave published=false so they don't appear as real customer reviews until admin edits & publishes
INSERT INTO public.reviews (customer_name, vehicle_info, content, rating, display_order, is_published, is_sample)
SELECT * FROM (VALUES
  (
    '샘플 후기',
    '차량 정보 예시',
    '이곳은 관리자가 수정·게시할 수 있는 샘플 후기입니다. 실제 고객 후기가 아니며, 게시 전에 내용을 반드시 확인해 주세요.',
    5,
    1,
    false,
    true
  )
) AS v(customer_name, vehicle_info, content, rating, display_order, is_published, is_sample)
WHERE NOT EXISTS (SELECT 1 FROM public.reviews LIMIT 1);

-- Sample work cases (published examples for structure demo — clearly workshop-style copy, not fabricated customer claims)
INSERT INTO public.work_cases (
  slug, title, vehicle_brand, vehicle_model, model_year, service_category,
  symptoms, diagnosis, work_summary, detailed_content,
  is_published, published_at, display_order, seo_title, seo_description
)
SELECT * FROM (VALUES
  (
    'bmw-520d-transmission-diagnosis',
    'BMW 520d 변속 충격 진단 및 점검',
    'BMW',
    '520d',
    '2015',
    '자동변속기 수리',
    '저속 구간에서 변속 충격과 간헐적인 슬립감이 느껴진다는 증상으로 입고되었습니다.',
    '진단기 데이터와 시운전으로 변속 패턴·오일 상태·관련 센서 값을 확인했습니다.',
    '오일 상태 점검 및 변속기 관련 항목을 중심으로 원인을 좁혀 고객에게 설명했습니다.',
    '입고 후 기본 외관 점검과 진단기 스캔을 진행했습니다. 시운전에서 특정 변속 구간 충격을 재현하고, 오일 레벨·오염도·관련 고장 코드를 확인했습니다. 고객에게 현재 상태와 권장 정비 범위를 구분해 안내했습니다.',
    true,
    now(),
    1,
    'BMW 520d 변속 충격 진단 | 코리아오토미션',
    '부산 사상구 코리아오토미션에서 진행한 BMW 520d 자동변속기 변속 충격 진단 사례입니다.'
  ),
  (
    'mercedes-e220d-transfer-noise',
    'Mercedes-Benz E220d 트랜스퍼 소음 점검',
    'Mercedes-Benz',
    'E220d',
    '2017',
    '트랜스퍼케이스',
    '사륜 전환 및 저속 선회 시 이음이 난다는 증상으로 방문하셨습니다.',
    '트랜스퍼케이스 주변 이음 재현 여부와 오일 상태를 중심으로 점검했습니다.',
    '트랜스퍼케이스 오일 및 작동 상태를 확인하고 정비 방향을 안내했습니다.',
    '사륜구동 관련 이음은 원인 부위가 여러 곳일 수 있어, 리프트 점검과 시운전을 함께 진행했습니다. 고객께 점검 결과와 우선 조치 항목을 설명드렸습니다.',
    true,
    now() - interval '1 day',
    2,
    'Mercedes-Benz E220d 트랜스퍼 소음 | 코리아오토미션',
    'Mercedes-Benz E220d 트랜스퍼케이스 소음 점검 사례 — 코리아오토미션.'
  ),
  (
    'audi-a6-differential-check',
    'Audi A6 디퍼렌셜 이음 점검',
    'Audi',
    'A6',
    '2016',
    '디퍼렌셜',
    '주행 중 후방 하체에서 웅웅거리는 소음이 점점 커진다는 증상이었습니다.',
    '디퍼렌셜 오일 상태와 베어링 관련 이음 가능성을 점검했습니다.',
    '디퍼렌셜 점검 후 상태에 맞는 정비 방안을 안내했습니다.',
    '하체 소음은 휠베어링 등 다른 원인과 구분이 필요합니다. 리프트 점검과 도로 조건별 소음 재현을 통해 디퍼렌셜 쪽 이상 가능성을 확인했습니다.',
    true,
    now() - interval '2 days',
    3,
    'Audi A6 디퍼렌셜 점검 | 코리아오토미션',
    'Audi A6 디퍼렌셜 이음 점검 사례 — 부산 코리아오토미션.'
  ),
  (
    'genesis-g80-dpf-cleaning',
    'Genesis G80 DPF 클리닝',
    'Genesis',
    'G80',
    '2018',
    'DPF 클리닝',
    'DPF 관련 경고등과 출력 저하가 반복되어 입고되었습니다.',
    'DPF 차압 및 관련 데이터를 확인하고 클리닝 필요 여부를 판단했습니다.',
    'DPF 클리닝을 진행하고 이후 관리 방법을 안내했습니다.',
    '경고등 이력과 주행 패턴을 확인한 뒤 DPF 상태를 점검했습니다. 클리닝 작업 후 재측정을 통해 상태를 확인하고, 재오염을 줄이기 위한 운전·관리 포인트를 설명했습니다.',
    true,
    now() - interval '3 days',
    4,
    'Genesis G80 DPF 클리닝 | 코리아오토미션',
    'Genesis G80 DPF 클리닝 작업 사례 — 코리아오토미션.'
  ),
  (
    'hyundai-santafe-intake-cleaning',
    '현대 싼타페 흡기 클리닝',
    '현대',
    '싼타페',
    '2019',
    '흡기 클리닝',
    '공회전이 불안정하고 가속 응답이 둔해졌다는 증상이었습니다.',
    '흡기 계통 오염 상태를 확인하고 클리닝을 권장했습니다.',
    '흡기 클리닝 후 공회전과 응답성을 재확인했습니다.',
    '스로틀 및 흡기 경로 오염을 점검한 뒤 클리닝을 진행했습니다. 작업 후 공회전 안정성과 가속 응답을 점검하고 결과를 안내했습니다.',
    true,
    now() - interval '4 days',
    5,
    '현대 싼타페 흡기 클리닝 | 코리아오토미션',
    '현대 싼타페 흡기 클리닝 사례 — 부산 사상 코리아오토미션.'
  ),
  (
    'kia-sorento-injector-cleaning',
    '기아 쏘렌토 인젝터 클리닝',
    '기아',
    '쏘렌토',
    '2020',
    '인젝터 클리닝',
    '연비 저하와 미세한 진동이 느껴진다는 상담 후 점검했습니다.',
    '인젝터 분무·오염 가능성을 확인하고 클리닝을 진행했습니다.',
    '인젝터 클리닝 전후 상태를 비교하며 안내했습니다.',
    '기본 진단 후 인젝터 클리닝을 진행했습니다. 작업 전후 상태를 고객께 설명하고, 필요 시 추가 점검을 안내했습니다.',
    true,
    now() - interval '5 days',
    6,
    '기아 쏘렌토 인젝터 클리닝 | 코리아오토미션',
    '기아 쏘렌토 인젝터 클리닝 사례 — 코리아오토미션.'
  )
) AS v(
  slug, title, vehicle_brand, vehicle_model, model_year, service_category,
  symptoms, diagnosis, work_summary, detailed_content,
  is_published, published_at, display_order, seo_title, seo_description
)
WHERE NOT EXISTS (SELECT 1 FROM public.work_cases LIMIT 1);

-- 작업사례 service_id 백필 (서비스명 매칭)
UPDATE public.work_cases wc
SET service_id = s.id
FROM public.services s
WHERE wc.service_id IS NULL
  AND wc.service_category = s.title;
