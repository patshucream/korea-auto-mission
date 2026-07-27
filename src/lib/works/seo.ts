import type { WorkCase } from "@/lib/types";

/** 본문 기준 예상 읽기 시간(분). 최소 1분 */
export function estimateReadingMinutes(work: Pick<
  WorkCase,
  "content_html" | "detailed_content" | "work_summary" | "symptoms" | "diagnosis" | "repair_process"
>): number {
  const html = work.content_html || "";
  const text = [
    html.replace(/<[^>]+>/g, " "),
    work.detailed_content,
    work.work_summary,
    work.symptoms,
    work.diagnosis,
    work.repair_process,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const chars = text.length;
  if (!chars) return 1;
  // 한국어 기준 약 500자/분
  return Math.max(1, Math.ceil(chars / 500));
}

export function buildDefaultSeoTitle(work: {
  title?: string | null;
  manufacturer?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  seo_title?: string | null;
}): string {
  if (work.seo_title?.trim()) return work.seo_title.trim();
  const vehicle = [
    work.manufacturer || work.vehicle_brand,
    work.vehicle_model,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const title = (work.title || "").trim() || "작업사례";
  if (vehicle && !title.includes(vehicle)) {
    return `${vehicle} ${title} | 코리아오토미션`;
  }
  if (title.includes("코리아오토미션")) return title;
  return `${title} | 코리아오토미션`;
}

export function buildDefaultSeoDescription(work: {
  seo_description?: string | null;
  og_description?: string | null;
  excerpt?: string | null;
  work_summary?: string | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  title?: string | null;
}): string {
  const direct =
    work.seo_description?.trim() ||
    work.og_description?.trim() ||
    work.excerpt?.trim() ||
    work.work_summary?.trim();
  if (direct) return direct.slice(0, 160);

  const parts = [work.symptoms?.trim(), work.diagnosis?.trim(), work.title?.trim()].filter(
    Boolean,
  );
  if (parts.length) return parts.join(" · ").slice(0, 160);
  return "코리아오토미션 수입차·국산차 정비 작업사례입니다.";
}

export function normalizeWorkSlugInput(raw: string, fallbackTitle: string): string {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  if (cleaned) return cleaned;
  return fallbackTitle
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || `work-${Date.now()}`;
}
