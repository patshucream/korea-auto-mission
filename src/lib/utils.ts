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

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
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

export function getMapUrl(settings: { naver_map_url?: string | null }): string {
  return (
    settings.naver_map_url?.trim() ||
    "https://map.naver.com/p/search/%EB%B6%80%EC%82%B0%20%EC%82%AC%EC%83%81%EA%B5%AC%20%EC%82%BC%EB%8D%95%EB%A1%9C%2095"
  );
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
