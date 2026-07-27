export type ProcessStep = {
  title: string;
  description: string;
};

export type HomepageSectionId =
  | "hero"
  | "trust"
  | "symptoms"
  | "services"
  | "why"
  | "works"
  | "beforeAfter"
  | "process"
  | "brands"
  | "guides"
  | "reviews"
  | "faq"
  | "location"
  | "cta";

export type HomepageTrustItem = {
  title: string;
  description: string;
};

/** 왜 코리아오토미션인가 — 항목별 독립 이미지 */
export type HomepageWhyPoint = {
  id: string;
  title: string;
  body: string;
  image_path: string | null;
  /** CSS object-position 값 (예: center, top, 50% 30%) */
  object_position?: string;
};

export type HomepageConfig = {
  section_order: HomepageSectionId[];
  section_visibility: Partial<Record<HomepageSectionId, boolean>>;
  cta_title: string;
  cta_description: string;
  trust_items: HomepageTrustItem[];
  featured_service_ids: string[];
  featured_work_ids: string[];
  /** 항목별 이미지·문구. 없으면 기본 POINTS + 이미지 없음 */
  why_points?: HomepageWhyPoint[];
};

export type SiteSettings = {
  id: string;
  business_name: string;
  english_brand_name: string;
  phone: string;
  address: string;
  /** @deprecated 레거시 한 줄 표시용 — weekday/saturday/holiday_hours 사용 */
  hours: string;
  /** @deprecated 레거시 — holiday_hours 사용 */
  closed_days: string;
  weekday_hours: string;
  saturday_hours: string;
  /** 공휴일 안내 (예: 정상영업). 일요일 휴무는 표시 레이어에서 별도 유지 */
  holiday_hours: string;
  naver_blog_url: string;
  naver_map_url: string;
  naver_reservation_url: string;
  hero_title: string;
  hero_description: string;
  hero_image_path: string | null;
  shop_image_path: string | null;
  stat_experience: string;
  stat_services: string;
  stat_brands: string;
  stat_works: string;
  why_title: string;
  why_content: string;
  process_steps: ProcessStep[];
  /** 홈페이지 섹션·CTA·신뢰문구 등 (007 migration) */
  homepage_config?: HomepageConfig | null;
  seo_title: string;
  seo_description: string;
  og_image_path: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Service = {
  id: string;
  title: string;
  short_description: string;
  detailed_description: string;
  image_path: string | null;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type WorkCaseStatus =
  | "draft"
  | "published"
  | "private"
  | "scheduled"
  | "trash";

export type WorkCase = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  content_json?: unknown | null;
  content_html?: string | null;
  status?: WorkCaseStatus;
  scheduled_at?: string | null;
  deleted_at?: string | null;
  vehicle_brand: string;
  vehicle_model: string;
  model_year: string;
  manufacturer?: string | null;
  generation?: string | null;
  fuel_type?: string | null;
  transmission_type?: string | null;
  mileage?: string | null;
  vehicle_number_masked?: string | null;
  /** FK to services.id — 서비스명 변경에도 연결 유지 */
  service_id: string | null;
  /** 표시용 서비스명 캐시 (service_id 기준 동기화) */
  service_category: string;
  symptoms: string;
  diagnosis: string;
  cause?: string | null;
  repair_process?: string | null;
  replaced_parts?: string | null;
  repair_duration?: string | null;
  warranty_info?: string | null;
  estimated_price_min?: number | null;
  estimated_price_max?: number | null;
  price_display_enabled?: boolean;
  work_summary: string;
  detailed_content: string;
  representative_image_path: string | null;
  gallery_image_paths: string[];
  before_images?: string[];
  after_images?: string[];
  video_urls?: string[];
  vehicle_tags?: string[];
  symptom_tags?: string[];
  general_tags?: string[];
  naver_blog_url: string | null;
  created_at: string;
  updated_at?: string;
  published_at: string | null;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
  seo_title: string | null;
  seo_description: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_path?: string | null;
  canonical_url?: string | null;
  noindex?: boolean;
  view_count?: number;
  inquiry_click_count?: number;
  phone_click_count?: number;
  reservation_click_count?: number;
  related_work_ids?: string[];
};

export type ServiceOption = {
  id: string;
  title: string;
};

export type BeforeAfterCategory = "injector" | "intake";

export type BeforeAfter = {
  id: string;
  category: BeforeAfterCategory;
  title: string;
  description: string;
  before_image_path: string | null;
  after_image_path: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ReviewStatus = "pending" | "approved" | "hidden" | "rejected";

export type Review = {
  id: string;
  /** 작성자 표시명 (신규 표준) */
  author_name: string;
  /** 차량명 (선택) */
  vehicle_name: string | null;
  /** @deprecated author_name 과 동기화 */
  customer_name: string;
  /** @deprecated vehicle_name 과 동기화 */
  vehicle_info: string;
  content: string;
  rating: number;
  status: ReviewStatus;
  admin_reply: string | null;
  password_hash?: string | null;
  display_order: number;
  is_published: boolean;
  is_sample: boolean;
  created_at?: string;
  updated_at?: string;
  approved_at: string | null;
};

export type ReviewStats = {
  total: number;
  pending: number;
  approved: number;
  hidden: number;
  rejected: number;
  averageRating: number;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MediaItem = {
  id: string;
  path: string;
  folder: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  alt_text: string;
  used_by: string | null;
  created_at: string;
  created_by: string | null;
};

export type HomepageData = {
  settings: SiteSettings;
  services: Service[];
  works: WorkCase[];
  beforeAfter: BeforeAfter[];
  reviews: Review[];
  faqs: Faq[];
  source: "database" | "fallback";
  errorMessage?: string;
};

export type WorksFilterParams = {
  q?: string;
  brand?: string;
  model?: string;
  /** 서비스 UUID (권장) */
  service?: string;
  /** 레거시: 서비스명 문자열 필터 */
  category?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
};

export type PaginatedWorks = {
  items: WorkCase[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  brands: string[];
  models: string[];
  /** 필터용 서비스 목록 (services 테이블) */
  services: ServiceOption[];
  /** @deprecated services 사용 — 하위 호환 */
  categories: string[];
};
