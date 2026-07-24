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
