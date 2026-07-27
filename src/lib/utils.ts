export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(
    url &&
      key &&
      url !== "your-project-url" &&
      !url.includes("placeholder") &&
      key !== "your-publishable-key" &&
      key.length > 20,
  );
}

/** 공식 사이트 URL — sitemap / robots / RSS / metadata / JSON-LD 공통 */
export const SITE_URL = "https://koreauto.co.kr";

/**
 * 공개 URL 기준 도메인.
 * 프로덕션에서는 항상 SITE_URL(koreauto.co.kr)을 사용하며,
 * vercel.app / VERCEL_* 기본 도메인은 절대 사용하지 않습니다.
 * 로컬 개발만 NEXT_PUBLIC_SITE_URL(localhost)을 허용합니다.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  const isLocal =
    fromEnv.startsWith("http://localhost") ||
    fromEnv.startsWith("https://localhost") ||
    fromEnv.startsWith("http://127.0.0.1") ||
    fromEnv.startsWith("https://127.0.0.1");

  if (process.env.NODE_ENV !== "production" && isLocal) {
    return fromEnv;
  }

  return SITE_URL;
}

/** XML 텍스트 이스케이프 (RSS/Sitemap) */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function telHref(phone: string): string {
  const digits = phone.replace(/[^0-9+]/g, "");
  return `tel:${digits}`;
}

/** 공개 페이지용 외부 링크 (관리자 설정값 우선, 없으면 안전한 기본값) */
export function getReservationUrl(settings: {
  naver_reservation_url?: string | null;
  naver_blog_url?: string | null;
}): string {
  return (
    settings.naver_reservation_url?.trim() ||
    settings.naver_blog_url?.trim() ||
    "https://blog.naver.com/97ga074"
  );
}

export function getBlogUrl(settings: { naver_blog_url?: string | null }): string {
  return settings.naver_blog_url?.trim() || "https://blog.naver.com/97ga074";
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || `work-${Date.now()}`;
}

export function formatDateKo(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  return (
    e.code === "PGRST205" ||
    e.code === "42P01" ||
    Boolean(e.message?.includes("schema cache")) ||
    Boolean(e.message?.includes("does not exist"))
  );
}

export function koreanDbErrorMessage(error: unknown): string {
  if (isMissingTableError(error)) {
    return "데이터베이스 테이블이 없습니다. Supabase SQL Editor에서 supabase/migrations/001_initial_schema.sql 과 supabase/seed.sql 을 실행해 주세요.";
  }
  if (error && typeof error === "object" && "message" in error) {
    return `데이터베이스 오류: ${String((error as { message: string }).message)}`;
  }
  return "데이터를 불러오는 중 문제가 발생했습니다.";
}
