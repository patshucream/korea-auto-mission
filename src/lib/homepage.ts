import { DEFAULT_HOMEPAGE_CONFIG, DEFAULT_HOMEPAGE_SECTION_ORDER } from "@/lib/defaults";
import type {
  HomepageConfig,
  HomepageSectionId,
  SiteSettings,
} from "@/lib/types";

export function parseHomepageConfig(raw: unknown): HomepageConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_HOMEPAGE_CONFIG;
  const data = raw as Partial<HomepageConfig>;
  const order =
    Array.isArray(data.section_order) && data.section_order.length
      ? (data.section_order as HomepageSectionId[])
      : DEFAULT_HOMEPAGE_SECTION_ORDER;

  return {
    ...DEFAULT_HOMEPAGE_CONFIG,
    ...data,
    section_order: order,
    section_visibility: {
      ...DEFAULT_HOMEPAGE_CONFIG.section_visibility,
      ...(data.section_visibility || {}),
    },
    trust_items:
      Array.isArray(data.trust_items) && data.trust_items.length
        ? data.trust_items
        : DEFAULT_HOMEPAGE_CONFIG.trust_items,
    featured_service_ids: Array.isArray(data.featured_service_ids)
      ? data.featured_service_ids
      : [],
    featured_work_ids: Array.isArray(data.featured_work_ids) ? data.featured_work_ids : [],
    cta_title: data.cta_title || DEFAULT_HOMEPAGE_CONFIG.cta_title,
    cta_description: data.cta_description || DEFAULT_HOMEPAGE_CONFIG.cta_description,
  };
}

export function getHomepageConfig(settings: SiteSettings): HomepageConfig {
  return parseHomepageConfig(settings.homepage_config);
}

export function isSectionVisible(
  config: HomepageConfig,
  id: HomepageSectionId,
): boolean {
  return config.section_visibility[id] !== false;
}

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionId, string> = {
  hero: "히어로",
  trust: "핵심 신뢰 정보",
  symptoms: "증상별 빠른 찾기",
  services: "주요 서비스",
  why: "왜 코리아오토미션인가",
  works: "최근 작업사례",
  process: "작업 진행 과정",
  brands: "차량 브랜드",
  guides: "정비 정보",
  reviews: "고객 후기",
  faq: "자주 묻는 질문",
  location: "위치 및 영업시간",
  cta: "마지막 CTA",
};

export const HOME_SYMPTOM_CARDS = [
  { label: "변속 충격", href: "/works?q=변속%20충격" },
  { label: "주행 중 소음", href: "/works?q=소음" },
  { label: "미션오일 누유", href: "/works?q=미션오일" },
  { label: "출력 저하", href: "/works?q=출력" },
  { label: "DPF 경고등", href: "/works?q=DPF" },
  { label: "매연 증가", href: "/works?q=매연" },
] as const;

export const HOME_BRANDS = [
  "BMW",
  "벤츠",
  "아우디",
  "폭스바겐",
  "미니",
  "랜드로버",
  "포르쉐",
  "볼보",
] as const;

export const HOME_GUIDE_TOPICS = [
  {
    title: "미션오일 교환 주기",
    description: "주행 환경에 따른 교환 시점과 점검 포인트",
    href: "/works?q=미션오일",
  },
  {
    title: "변속 충격 원인",
    description: "충격·슬립이 느껴질 때 확인하는 진단 항목",
    href: "/works?q=변속%20충격",
  },
  {
    title: "DPF 재생 원리",
    description: "경고등과 매연 증가 시 점검 방향",
    href: "/works?q=DPF",
  },
  {
    title: "인젝터 불량 증상",
    description: "출력 저하·진동과 관련된 클리닝·점검",
    href: "/works?q=인젝터",
  },
] as const;
