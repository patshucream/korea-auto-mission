import type {
  BeforeAfter,
  Faq,
  HomepageConfig,
  HomepageSectionId,
  HomepageWhyPoint,
  ProcessStep,
  Service,
  SiteSettings,
  WorkCase,
} from "@/lib/types";

export const DEFAULT_HOMEPAGE_SECTION_ORDER: HomepageSectionId[] = [
  "hero",
  "trust",
  "symptoms",
  "services",
  "why",
  "works",
  "beforeAfter",
  "process",
  "brands",
  "guides",
  "reviews",
  "faq",
  "location",
  "cta",
];

export const DEFAULT_WHY_POINTS: HomepageWhyPoint[] = [
  {
    id: "why-1",
    title: "무조건 교환보다 원인 진단",
    body: "증상만 보고 부품을 바꾸지 않습니다. 점검으로 작업 범위를 먼저 좁힙니다.",
    image_path: null,
    object_position: "center",
  },
  {
    id: "why-2",
    title: "작업 전후 상태 설명",
    body: "왜 필요한 작업인지, 무엇을 확인했는지 이해할 수 있게 설명합니다.",
    image_path: null,
    object_position: "center",
  },
  {
    id: "why-3",
    title: "정비 과정 기록",
    body: "가능하면 작업 과정을 남겨 이후에도 참고할 수 있게 합니다.",
    image_path: null,
    object_position: "center",
  },
  {
    id: "why-4",
    title: "변속기 전문 경험",
    body: "수입차·국산차 자동변속기와 구동계를 중심으로 30년 현장 경험을 쌓았습니다.",
    image_path: null,
    object_position: "center",
  },
];

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  section_order: DEFAULT_HOMEPAGE_SECTION_ORDER,
  section_visibility: {
    ...Object.fromEntries(
      DEFAULT_HOMEPAGE_SECTION_ORDER.map((id) => [id, true]),
    ),
    guides: false,
  } as Record<HomepageSectionId, boolean>,
  cta_title: "증상이 반복된다면\n부품 교환 전 정확한 진단부터 받아보세요.",
  cta_description:
    "전화 상담 또는 네이버 예약으로 증상과 차량 정보를 알려주시면 점검 방향을 안내해 드립니다.",
  trust_items: [
    {
      title: "30년",
      description: "변속기 정비 경험",
    },
    {
      title: "정밀 진단",
      description: "수입차 중심 원인 확인",
    },
    {
      title: "전후 과정",
      description: "작업 전후 상태 안내",
    },
    {
      title: "부산 사상구",
      description: "삼덕로 95",
    },
  ],
  featured_service_ids: [],
  featured_work_ids: [],
  why_points: DEFAULT_WHY_POINTS,
};

export const PHONE_DISPLAY = "010-5558-0528";
export const PHONE_TEL = "01055580528";
export const BUSINESS_NAME = "코리아오토미션";
export const ENGLISH_BRAND = "KOREA AUTO MISSION";
export const ADDRESS = "부산 사상구 삼덕로 95";
export const NAVER_BLOG_URL = "https://blog.naver.com/97ga074";
export const NAVER_MAP_URL =
  "https://map.naver.com/p/search/%EB%B6%80%EC%82%B0%20%EC%82%AC%EC%83%81%EA%B5%AC%20%EC%82%BC%EB%8D%95%EB%A1%9C%2095";

/** Supabase 미설정 시 홈/폴백용 샘플. 운영 데이터는 services 테이블을 사용합니다. */
export const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
  {
    title: "상담",
    description: "증상과 차량 정보를 확인하고 방문 일정을 안내합니다.",
  },
  {
    title: "입고 및 진단",
    description: "입고 후 진단기로 원인을 체계적으로 확인합니다.",
  },
  {
    title: "견적 안내",
    description: "필요한 작업 범위와 비용을 투명하게 설명합니다.",
  },
  {
    title: "정비",
    description: "합의된 범위에 맞춰 숙련된 기술로 작업을 진행합니다.",
  },
  {
    title: "시운전 및 출고",
    description: "시운전·재점검 후 주의사항을 안내하고 출고합니다.",
  },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  id: "fallback",
  business_name: BUSINESS_NAME,
  english_brand_name: ENGLISH_BRAND,
  phone: PHONE_DISPLAY,
  address: ADDRESS,
  hours: "평일 09:00 - 18:00 토요일 09:00 - 15:00",
  closed_days: "일요일",
  weekday_hours: "09:00 - 18:00",
  saturday_hours: "09:00 - 15:00",
  holiday_hours: "정상영업",
  naver_blog_url: NAVER_BLOG_URL,
  naver_map_url: NAVER_MAP_URL,
  naver_reservation_url: "",
  hero_title: "수입차 오토미션과 디젤 정비,\n정확한 진단부터 시작합니다",
  hero_description:
    "변속 충격, 미션오일, DPF·흡기·인젝터까지.\n30년 경험으로 원인부터 확인합니다.",
  hero_image_path: null,
  shop_image_path: null,
  stat_experience: "30년",
  stat_services: "6가지",
  stat_brands: "8개 이상",
  stat_works: "30년간 축적된 작업 경험",
  why_title: "왜 코리아오토미션인가",
  why_content:
    "무조건 교환보다 원인 진단이 먼저입니다. 정비 전후 상태를 설명하고, 작업 사진과 과정을 기록합니다. 부산 사상구에서 변속기 전문 경험으로 고객 차량을 책임집니다.",
  process_steps: DEFAULT_PROCESS_STEPS,
  homepage_config: DEFAULT_HOMEPAGE_CONFIG,
  seo_title: "코리아오토미션 | 수입차·국산차 자동변속기 전문 정비",
  seo_description:
    "부산 사상구 코리아오토미션. 수입차·국산차 자동변속기, 트랜스퍼케이스, 디퍼렌셜, DPF·흡기·인젝터 클리닝 전문. 30년 정비 경험.",
  og_image_path: null,
};

export const DEFAULT_SERVICES: Service[] = [
  {
    id: "svc-1",
    title: "자동변속기 수리",
    short_description:
      "변속 충격, 슬립, 경고등 등 자동변속기 이상을 정밀 진단하고 수리합니다.",
    detailed_description:
      "수입차·국산차 자동변속기의 변속감 이상, 충격, 슬립, 오일 누유, 경고등 점등 등 다양한 증상을 점검합니다. 단순 오일 교환으로 끝날 문제인지, 유닛 분해 수리가 필요한지 정확히 구분하여 안내합니다.",
    image_path: null,
    sort_order: 1,
    is_published: true,
  },
  {
    id: "svc-2",
    title: "트랜스퍼케이스",
    short_description:
      "사륜구동 차량의 트랜스퍼케이스 소음·진동·작동 이상을 점검·수리합니다.",
    detailed_description:
      "사륜구동(4WD/AWD) 차량에서 발생하는 트랜스퍼케이스 이상 소음, 진동, 작동 불량을 진단합니다. 오일과 실링 상태부터 내부 기어·체인까지 체계적으로 확인합니다.",
    image_path: null,
    sort_order: 2,
    is_published: true,
  },
  {
    id: "svc-3",
    title: "디퍼렌셜",
    short_description:
      "디퍼렌셜 소음, 진동, 오일 누유를 점검하고 필요한 수리를 진행합니다.",
    detailed_description:
      "주행 중 하체·후방에서 나는 소음과 진동의 원인이 디퍼렌셜인 경우가 많습니다. 오일 상태, 베어링, 기어 마모 여부를 확인하고 상황에 맞는 정비 방안을 제시합니다.",
    image_path: null,
    sort_order: 3,
    is_published: true,
  },
  {
    id: "svc-4",
    title: "DPF 클리닝",
    short_description:
      "매연저감장치(DPF) 막힘과 관련 경고등을 점검하고 클리닝합니다.",
    detailed_description:
      "DPF 막힘으로 인한 출력 저하, 경고등, 강제 재생 반복 등의 증상을 확인합니다. 차량 상태에 맞는 클리닝 방법을 안내하고, 재오염을 줄이기 위한 관리 포인트도 함께 설명합니다.",
    image_path: null,
    sort_order: 4,
    is_published: true,
  },
  {
    id: "svc-5",
    title: "흡기 클리닝",
    short_description:
      "흡기 계통 오염을 제거하고 연소 효율과 주행감을 개선합니다.",
    detailed_description:
      "장기간 주행으로 쌓인 흡기 매니폴드·스로틀·밸브 주변 카본을 점검하고 클리닝합니다. 공회전 불안정, 연비 저하, 가속 응답 저하가 있는 차량에 도움이 될 수 있습니다.",
    image_path: null,
    sort_order: 5,
    is_published: true,
  },
  {
    id: "svc-6",
    title: "인젝터 클리닝",
    short_description:
      "인젝터 분무 상태를 점검하고 클리닝하여 연소 품질을 개선합니다.",
    detailed_description:
      "인젝터 막힘과 분무 불량은 연비·출력·진동에 영향을 줍니다. 클리닝 전후 상태를 비교할 수 있도록 안내하며, 필요 시 추가 점검을 권장합니다.",
    image_path: null,
    sort_order: 6,
    is_published: true,
  },
];

export const DEFAULT_BEFORE_AFTER: BeforeAfter[] = [
  {
    id: "ba-injector",
    category: "injector",
    title: "인젝터 클리닝 전후",
    description:
      "인젝터 분무 상태와 오염 정도를 작업 전후로 비교합니다. 실제 작업 사진은 관리자에서 등록할 수 있습니다.",
    before_image_path: null,
    after_image_path: null,
    is_published: true,
  },
  {
    id: "ba-intake",
    category: "intake",
    title: "흡기 클리닝 전후",
    description:
      "흡기 계통 카본·오염 제거 전후를 한눈에 확인할 수 있습니다. 실제 작업 사진은 관리자에서 등록할 수 있습니다.",
    before_image_path: null,
    after_image_path: null,
    is_published: true,
  },
];

export const DEFAULT_FAQS: Faq[] = [
  {
    id: "faq-1",
    question: "예약은 어떻게 하나요?",
    answer:
      "전화 상담(010-5558-0528) 또는 네이버 예약을 통해 방문 일정을 잡으실 수 있습니다. 증상과 차량 모델명을 알려주시면 더 정확한 안내가 가능합니다.",
    display_order: 1,
    is_published: true,
  },
  {
    id: "faq-2",
    question: "수입차도 정비가 가능한가요?",
    answer:
      "네. BMW, Mercedes-Benz, Audi 등 수입차와 국산차 자동변속기·구동계 정비를 모두 다룹니다. 차종에 따라 부품 수급 기간이 달라질 수 있어 상담 시 안내드립니다.",
    display_order: 2,
    is_published: true,
  },
  {
    id: "faq-3",
    question: "견적은 바로 나오나요?",
    answer:
      "증상만으로 확정 견적을 드리기 어려운 경우가 많습니다. 입고 점검과 진단 후 필요한 작업 범위와 비용을 투명하게 설명드립니다.",
    display_order: 3,
    is_published: true,
  },
  {
    id: "faq-4",
    question: "작업 기간은 얼마나 걸리나요?",
    answer:
      "오일 점검·클리닝 수준의 작업은 당일 또는 짧은 기간에 가능할 수 있으나, 변속기 분해 수리 등은 부품과 작업 범위에 따라 달라집니다. 진단 후 일정을 안내드립니다.",
    display_order: 4,
    is_published: true,
  },
  {
    id: "faq-5",
    question: "주차와 위치가 궁금합니다.",
    answer:
      "부산 사상구 삼덕로 95에 위치해 있습니다. 방문 전 전화로 위치를 확인해 주시면 편하게 안내해 드립니다.",
    display_order: 5,
    is_published: true,
  },
];

export const DEFAULT_WORKS: WorkCase[] = [
  {
    id: "work-1",
    slug: "bmw-520d-transmission-diagnosis",
    title: "BMW 520d 변속 충격 진단 및 점검",
    vehicle_brand: "BMW",
    vehicle_model: "520d",
    model_year: "2015",
    service_id: "svc-1",
    service_category: "자동변속기 수리",
    symptoms:
      "저속 구간에서 변속 충격과 간헐적인 슬립감이 느껴진다는 증상으로 입고되었습니다.",
    diagnosis:
      "진단기 데이터와 시운전으로 변속 패턴·오일 상태·관련 센서 값을 확인했습니다.",
    work_summary:
      "오일 상태 점검 및 변속기 관련 항목을 중심으로 원인을 좁혀 고객에게 설명했습니다.",
    detailed_content:
      "입고 후 기본 외관 점검과 진단기 스캔을 진행했습니다. 시운전에서 특정 변속 구간 충격을 재현하고, 오일 레벨·오염도·관련 고장 코드를 확인했습니다. 고객에게 현재 상태와 권장 정비 범위를 구분해 안내했습니다.",
    representative_image_path: null,
    gallery_image_paths: [],
    naver_blog_url: null,
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    is_published: true,
    is_featured: false,
    display_order: 1,
    seo_title: "BMW 520d 변속 충격 진단 | 코리아오토미션",
    seo_description:
      "부산 사상구 코리아오토미션에서 진행한 BMW 520d 자동변속기 변속 충격 진단 사례입니다.",
  },
  {
    id: "work-2",
    slug: "mercedes-e220d-transfer-noise",
    title: "Mercedes-Benz E220d 트랜스퍼 소음 점검",
    vehicle_brand: "Mercedes-Benz",
    vehicle_model: "E220d",
    model_year: "2017",
    service_id: "svc-2",
    service_category: "트랜스퍼케이스",
    symptoms: "사륜 전환 및 저속 선회 시 이음이 난다는 증상으로 방문하셨습니다.",
    diagnosis:
      "트랜스퍼케이스 주변 이음 재현 여부와 오일 상태를 중심으로 점검했습니다.",
    work_summary:
      "트랜스퍼케이스 오일 및 작동 상태를 확인하고 정비 방향을 안내했습니다.",
    detailed_content:
      "사륜구동 관련 이음은 원인 부위가 여러 곳일 수 있어, 리프트 점검과 시운전을 함께 진행했습니다. 고객께 점검 결과와 우선 조치 항목을 설명드렸습니다.",
    representative_image_path: null,
    gallery_image_paths: [],
    naver_blog_url: null,
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    is_published: true,
    is_featured: false,
    display_order: 2,
    seo_title: "Mercedes-Benz E220d 트랜스퍼 소음 | 코리아오토미션",
    seo_description:
      "Mercedes-Benz E220d 트랜스퍼케이스 소음 점검 사례 — 코리아오토미션.",
  },
  {
    id: "work-3",
    slug: "audi-a6-differential-check",
    title: "Audi A6 디퍼렌셜 이음 점검",
    vehicle_brand: "Audi",
    vehicle_model: "A6",
    model_year: "2016",
    service_id: "svc-3",
    service_category: "디퍼렌셜",
    symptoms:
      "주행 중 후방 하체에서 웅웅거리는 소음이 점점 커진다는 증상이었습니다.",
    diagnosis: "디퍼렌셜 오일 상태와 베어링 관련 이음 가능성을 점검했습니다.",
    work_summary: "디퍼렌셜 점검 후 상태에 맞는 정비 방안을 안내했습니다.",
    detailed_content:
      "하체 소음은 휠베어링 등 다른 원인과 구분이 필요합니다. 리프트 점검과 도로 조건별 소음 재현을 통해 디퍼렌셜 쪽 이상 가능성을 확인했습니다.",
    representative_image_path: null,
    gallery_image_paths: [],
    naver_blog_url: null,
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    is_published: true,
    is_featured: false,
    display_order: 3,
    seo_title: "Audi A6 디퍼렌셜 점검 | 코리아오토미션",
    seo_description: "Audi A6 디퍼렌셜 이음 점검 사례 — 부산 코리아오토미션.",
  },
  {
    id: "work-4",
    slug: "genesis-g80-dpf-cleaning",
    title: "Genesis G80 DPF 클리닝",
    vehicle_brand: "Genesis",
    vehicle_model: "G80",
    model_year: "2018",
    service_id: "svc-4",
    service_category: "DPF 클리닝",
    symptoms: "DPF 관련 경고등과 출력 저하가 반복되어 입고되었습니다.",
    diagnosis: "DPF 차압 및 관련 데이터를 확인하고 클리닝 필요 여부를 판단했습니다.",
    work_summary: "DPF 클리닝을 진행하고 이후 관리 방법을 안내했습니다.",
    detailed_content:
      "경고등 이력과 주행 패턴을 확인한 뒤 DPF 상태를 점검했습니다. 클리닝 작업 후 재측정을 통해 상태를 확인하고, 재오염을 줄이기 위한 운전·관리 포인트를 설명했습니다.",
    representative_image_path: null,
    gallery_image_paths: [],
    naver_blog_url: null,
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    is_published: true,
    is_featured: false,
    display_order: 4,
    seo_title: "Genesis G80 DPF 클리닝 | 코리아오토미션",
    seo_description: "Genesis G80 DPF 클리닝 작업 사례 — 코리아오토미션.",
  },
  {
    id: "work-5",
    slug: "hyundai-santafe-intake-cleaning",
    title: "현대 싼타페 흡기 클리닝",
    vehicle_brand: "현대",
    vehicle_model: "싼타페",
    model_year: "2019",
    service_id: "svc-5",
    service_category: "흡기 클리닝",
    symptoms: "공회전이 불안정하고 가속 응답이 둔해졌다는 증상이었습니다.",
    diagnosis: "흡기 계통 오염 상태를 확인하고 클리닝을 권장했습니다.",
    work_summary: "흡기 클리닝 후 공회전과 응답성을 재확인했습니다.",
    detailed_content:
      "스로틀 및 흡기 경로 오염을 점검한 뒤 클리닝을 진행했습니다. 작업 후 공회전 안정성과 가속 응답을 점검하고 결과를 안내했습니다.",
    representative_image_path: null,
    gallery_image_paths: [],
    naver_blog_url: null,
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    is_published: true,
    is_featured: false,
    display_order: 5,
    seo_title: "현대 싼타페 흡기 클리닝 | 코리아오토미션",
    seo_description:
      "현대 싼타페 흡기 클리닝 사례 — 부산 사상 코리아오토미션.",
  },
  {
    id: "work-6",
    slug: "kia-sorento-injector-cleaning",
    title: "기아 쏘렌토 인젝터 클리닝",
    vehicle_brand: "기아",
    vehicle_model: "쏘렌토",
    model_year: "2020",
    service_id: "svc-6",
    service_category: "인젝터 클리닝",
    symptoms: "연비 저하와 미세한 진동이 느껴진다는 상담 후 점검했습니다.",
    diagnosis: "인젝터 분무·오염 가능성을 확인하고 클리닝을 진행했습니다.",
    work_summary: "인젝터 클리닝 전후 상태를 비교하며 안내했습니다.",
    detailed_content:
      "기본 진단 후 인젝터 클리닝을 진행했습니다. 작업 전후 상태를 고객께 설명하고, 필요 시 추가 점검을 안내했습니다.",
    representative_image_path: null,
    gallery_image_paths: [],
    naver_blog_url: null,
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    is_published: true,
    is_featured: false,
    display_order: 6,
    seo_title: "기아 쏘렌토 인젝터 클리닝 | 코리아오토미션",
    seo_description: "기아 쏘렌토 인젝터 클리닝 사례 — 코리아오토미션.",
  },
];

export const NAV_ITEMS = [
  { href: "/#why", label: "전문성" },
  { href: "/#services", label: "정비 서비스" },
  { href: "/works", label: "작업사례" },
  { href: "/#guides", label: "정비정보" },
  { href: "/reviews", label: "고객후기" },
  { href: "/#contact", label: "상담·예약" },
] as const;

/** 주요 관리자 메뉴 */
export const ADMIN_NAV = [
  { href: "/admin/general", label: "기본 정보" },
  { href: "/admin/homepage", label: "홈페이지" },
  { href: "/admin/services", label: "서비스 관리" },
  { href: "/admin/works", label: "작업 사례" },
  { href: "/admin/reviews", label: "리뷰 관리" },
  { href: "/admin/general#hours", label: "영업시간" },
  { href: "/admin/media", label: "사진 관리" },
] as const;

/** 부가 설정 (사이드바 하단) */
export const ADMIN_NAV_SECONDARY = [
  { href: "/admin/before-after", label: "작업 전후" },
  { href: "/admin/faq", label: "자주 묻는 질문" },
  { href: "/admin/seo", label: "검색 노출 설정" },
  { href: "/admin/general#stats", label: "홈페이지 주요 수치" },
] as const;
