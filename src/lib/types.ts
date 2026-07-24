export type ProcessStep = {
  title: string;
  description: string;
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

export type WorkCase = {
  id: string;
  slug: string;
  title: string;
  vehicle_brand: string;
  vehicle_model: string;
  model_year: string;
  /** FK to services.id — 서비스명 변경에도 연결 유지 */
  service_id: string | null;
  /** 표시용 서비스명 캐시 (service_id 기준 동기화) */
  service_category: string;
  symptoms: string;
  diagnosis: string;
  work_summary: string;
  detailed_content: string;
  representative_image_path: string | null;
  gallery_image_paths: string[];
  naver_blog_url: string | null;
  created_at: string;
  updated_at?: string;
  published_at: string | null;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
  seo_title: string | null;
  seo_description: string | null;
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

export type Review = {
  id: string;
  customer_name: string;
  vehicle_info: string;
  content: string;
  rating: number;
  display_order: number;
  is_published: boolean;
  is_sample: boolean;
  created_at?: string;
  updated_at?: string;
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
