import {
  DEFAULT_HOMEPAGE_CONFIG,
  DEFAULT_HOMEPAGE_SECTION_ORDER,
  DEFAULT_WHY_POINTS,
} from "@/lib/defaults";
import type {
  HomepageConfig,
  HomepageSectionId,
  HomepageWhyPoint,
  SiteSettings,
} from "@/lib/types";

function mergeWhyPoints(raw: unknown): HomepageWhyPoint[] {
  const defaults = DEFAULT_WHY_POINTS;
  if (!Array.isArray(raw) || raw.length === 0) return defaults.map((p) => ({ ...p }));

  return defaults.map((fallback, index) => {
    const row = raw[index] as Partial<HomepageWhyPoint> | undefined;
    if (!row || typeof row !== "object") return { ...fallback };
    return {
      id: typeof row.id === "string" && row.id ? row.id : fallback.id,
      title: typeof row.title === "string" && row.title.trim() ? row.title : fallback.title,
      body: typeof row.body === "string" && row.body.trim() ? row.body : fallback.body,
      image_path:
        row.image_path === null || typeof row.image_path === "string"
          ? row.image_path
          : fallback.image_path,
      object_position:
        typeof row.object_position === "string" && row.object_position.trim()
          ? row.object_position
          : fallback.object_position || "center",
    };
  });
}

export function parseHomepageConfig(raw: unknown): HomepageConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_HOMEPAGE_CONFIG;
  const data = raw as Partial<HomepageConfig>;
  const known = new Set<HomepageSectionId>(DEFAULT_HOMEPAGE_SECTION_ORDER);
  const rawOrder =
    Array.isArray(data.section_order) && data.section_order.length
      ? (data.section_order as HomepageSectionId[]).filter((id) => known.has(id))
      : [...DEFAULT_HOMEPAGE_SECTION_ORDER];

  const order = [...rawOrder];
  for (const id of DEFAULT_HOMEPAGE_SECTION_ORDER) {
    if (!order.includes(id)) {
      const afterWorks = order.indexOf("works");
      if (id === "beforeAfter" && afterWorks >= 0) {
        order.splice(afterWorks + 1, 0, id);
      } else {
        order.push(id);
      }
    }
  }

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
    why_points: mergeWhyPoints(data.why_points),
  };
}

export function getHomepageConfig(settings: SiteSettings): HomepageConfig {
  return parseHomepageConfig(settings.homepage_config);
}

export function getWhyPoints(settings: SiteSettings): HomepageWhyPoint[] {
  return getHomepageConfig(settings).why_points || DEFAULT_WHY_POINTS;
}

/** 동일 image_path 를 쓰는 why 항목 id 목록 */
export function findDuplicateWhyImageIds(points: HomepageWhyPoint[]): string[] {
  const counts = new Map<string, string[]>();
  for (const p of points) {
    if (!p.image_path) continue;
    const list = counts.get(p.image_path) || [];
    list.push(p.id);
    counts.set(p.image_path, list);
  }
  return [...counts.values()].filter((ids) => ids.length > 1).flat();
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
  symptoms: "증상으로 찾기",
  services: "주요 서비스",
  why: "왜 코리아오토미션인가",
  works: "실제 작업사례",
  beforeAfter: "작업 전후",
  process: "작업 진행 과정",
  brands: "브랜드별 탐색",
  guides: "정비정보",
  reviews: "고객후기",
  faq: "FAQ",
  location: "위치와 영업시간",
  cta: "마지막 CTA",
};

export const HOME_SYMPTOM_CARDS = [
  { label: "변속 충격", href: "/works?q=변속%20충격" },
  { label: "RPM 상승", href: "/works?q=RPM" },
  { label: "주행 중 소음", href: "/works?q=소음" },
  { label: "미션오일 누유", href: "/works?q=미션오일" },
  { label: "DPF 경고등", href: "/works?q=DPF" },
  { label: "출력 저하", href: "/works?q=출력" },
  { label: "매연 증가", href: "/works?q=매연" },
  { label: "시동 불안정", href: "/works?q=시동" },
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
  "국산차",
] as const;

export const WORKS_QUICK_FILTERS = [
  { label: "미션수리", q: "미션" },
  { label: "미션오일", q: "미션오일" },
  { label: "DPF", q: "DPF" },
  { label: "흡기", q: "흡기" },
  { label: "인젝터", q: "인젝터" },
  { label: "정밀진단", q: "진단" },
] as const;

export const WORKS_POPULAR_QUERIES = [
  "변속 충격",
  "미션오일",
  "DPF",
  "BMW",
  "벤츠",
  "인젝터",
] as const;
