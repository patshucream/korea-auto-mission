import type {
  BeforeAfter,
  Faq,
  HomepageData,
  PaginatedWorks,
  ProcessStep,
  Review,
  ReviewStats,
  ReviewStatus,
  Service,
  ServiceOption,
  SiteSettings,
  WorkCase,
  WorksFilterParams,
} from "@/lib/types";
import {
  DEFAULT_BEFORE_AFTER,
  DEFAULT_FAQS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
  DEFAULT_WORKS,
} from "@/lib/defaults";
import { averageRating, mapReview } from "@/lib/reviews";
import { parseHomepageConfig } from "@/lib/homepage";
import { tryCreateClient } from "@/lib/supabase/server";
import {
  isMissingTableError,
  isSupabaseConfigured,
  koreanDbErrorMessage,
} from "@/lib/utils";

function parseProcessSteps(value: unknown): ProcessStep[] {
  if (!Array.isArray(value)) return DEFAULT_SETTINGS.process_steps;
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (typeof row.title !== "string" || typeof row.description !== "string") {
        return null;
      }
      return { title: row.title, description: row.description };
    })
    .filter((v): v is ProcessStep => Boolean(v));
}

/** 003 미적용 DB용: 레거시 hours / closed_days 에서 분리 필드 복원 */
function deriveSplitHours(hours: string, closedDays: string) {
  const weekday =
    hours.match(/평일\s*([0-9]{1,2}:[0-9]{2}\s*[-–~]\s*[0-9]{1,2}:[0-9]{2})/)?.[1]?.trim() ||
    DEFAULT_SETTINGS.weekday_hours;
  const saturday =
    hours.match(/토(?:요일)?\s*([0-9]{1,2}:[0-9]{2}\s*[-–~]\s*[0-9]{1,2}:[0-9]{2})/)?.[1]?.trim() ||
    DEFAULT_SETTINGS.saturday_hours;
  const holiday = (() => {
    const closed = closedDays.trim();
    if (!closed) return DEFAULT_SETTINGS.holiday_hours;
    // 공휴일만 언급되고 휴무로 묶인 레거시 값은 정상영업으로 해석
    if (/공휴일/.test(closed) && /(휴무|휴일|닫)/i.test(closed)) {
      return DEFAULT_SETTINGS.holiday_hours;
    }
    if (/공휴일/.test(closed) && !/일요일/.test(closed)) {
      return closed;
    }
    return DEFAULT_SETTINGS.holiday_hours;
  })();
  return { weekday, saturday, holiday };
}

function mapSettings(row: Record<string, unknown>): SiteSettings {
  const legacyHours =
    typeof row.hours === "string" && row.hours.trim() ? row.hours.trim() : "";
  const legacyClosed =
    typeof row.closed_days === "string" && row.closed_days.trim()
      ? row.closed_days.trim()
      : "";
  const derived = deriveSplitHours(
    legacyHours || DEFAULT_SETTINGS.hours,
    legacyClosed || DEFAULT_SETTINGS.closed_days,
  );

  const weekday =
    (typeof row.weekday_hours === "string" && row.weekday_hours.trim()) || derived.weekday;
  const saturday =
    (typeof row.saturday_hours === "string" && row.saturday_hours.trim()) || derived.saturday;
  const holiday =
    (typeof row.holiday_hours === "string" && row.holiday_hours.trim()) || derived.holiday;

  return {
    ...DEFAULT_SETTINGS,
    ...row,
    phone:
      typeof row.phone === "string" && row.phone.trim()
        ? row.phone.trim()
        : DEFAULT_SETTINGS.phone,
    address:
      typeof row.address === "string" && row.address.trim()
        ? row.address.trim()
        : DEFAULT_SETTINGS.address,
    business_name:
      typeof row.business_name === "string" && row.business_name.trim()
        ? row.business_name.trim()
        : DEFAULT_SETTINGS.business_name,
    weekday_hours: weekday,
    saturday_hours: saturday,
    holiday_hours: holiday,
    hours: legacyHours || `평일 ${weekday} 토요일 ${saturday}`,
    closed_days:
      legacyClosed ||
      (holiday === "휴무" || holiday === "휴일" ? "일요일 · 공휴일" : "일요일"),
    process_steps: parseProcessSteps(row.process_steps),
    homepage_config: parseHomepageConfig(row.homepage_config),
    hero_image_path: (row.hero_image_path as string | null) ?? null,
    shop_image_path: (row.shop_image_path as string | null) ?? null,
    og_image_path: (row.og_image_path as string | null) ?? null,
  } as SiteSettings;
}

function mapService(row: Record<string, unknown>): Service {
  const sortOrder =
    typeof row.sort_order === "number"
      ? row.sort_order
      : typeof row.display_order === "number"
        ? (row.display_order as number)
        : 0;

  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    short_description: String(row.short_description ?? ""),
    detailed_description: String(row.detailed_description ?? ""),
    image_path: (row.image_path as string | null) ?? null,
    sort_order: sortOrder,
    is_published: Boolean(row.is_published),
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export function mapWork(row: Record<string, unknown>): WorkCase {
  const status =
    row.status === "draft" ||
    row.status === "published" ||
    row.status === "private" ||
    row.status === "scheduled" ||
    row.status === "trash"
      ? row.status
      : row.is_published
        ? "published"
        : "draft";

  const asStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
      : [];

  return {
    ...(row as unknown as WorkCase),
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    service_id: (row.service_id as string | null) ?? null,
    service_category: String(row.service_category ?? ""),
    vehicle_brand: String(row.vehicle_brand ?? ""),
    vehicle_model: String(row.vehicle_model ?? ""),
    manufacturer:
      (typeof row.manufacturer === "string" && row.manufacturer) ||
      String(row.vehicle_brand ?? ""),
    symptoms: typeof row.symptoms === "string" ? row.symptoms : "",
    diagnosis: typeof row.diagnosis === "string" ? row.diagnosis : "",
    cause: typeof row.cause === "string" ? row.cause : "",
    repair_process: typeof row.repair_process === "string" ? row.repair_process : "",
    detailed_content: typeof row.detailed_content === "string" ? row.detailed_content : "",
    work_summary: typeof row.work_summary === "string" ? row.work_summary : "",
    replaced_parts: typeof row.replaced_parts === "string" ? row.replaced_parts : "",
    warranty_info: typeof row.warranty_info === "string" ? row.warranty_info : "",
    excerpt: typeof row.excerpt === "string" ? row.excerpt : "",
    subtitle: typeof row.subtitle === "string" ? row.subtitle : "",
    representative_image_path:
      typeof row.representative_image_path === "string" && row.representative_image_path
        ? row.representative_image_path
        : null,
    gallery_image_paths: asStringArray(row.gallery_image_paths),
    before_images: asStringArray(row.before_images),
    after_images: asStringArray(row.after_images),
    video_urls: asStringArray(row.video_urls),
    vehicle_tags: asStringArray(row.vehicle_tags),
    symptom_tags: asStringArray(row.symptom_tags),
    general_tags: asStringArray(row.general_tags),
    related_work_ids: asStringArray(row.related_work_ids),
    status,
    content_html: typeof row.content_html === "string" ? row.content_html : null,
    content_json: row.content_json ?? null,
    view_count: typeof row.view_count === "number" ? row.view_count : 0,
    is_published: Boolean(row.is_published),
  };
}

/** Next.js params 가 한글 slug 를 %인코딩 상태로 전달하는 경우 정규화 */
export function normalizeWorkSlug(slug: string): string {
  const raw = String(slug ?? "").trim();
  if (!raw) return "";
  try {
    let current = raw;
    // 이중 인코딩(%25XX)까지 최대 2회 디코딩
    for (let i = 0; i < 2; i++) {
      if (!/%[0-9A-Fa-f]{2}/.test(current)) break;
      current = decodeURIComponent(current);
    }
    return current;
  } catch (error) {
    console.error("[normalizeWorkSlug] decode failed", {
      slug: raw,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return raw;
  }
}

function quotePostgrestValue(value: string): string {
  // 특수문자(·, 공백, 쉼표 등)가 포함된 필터 값 보호
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export async function getWorkBySlug(slug: string): Promise<WorkCase | null> {
  const normalizedSlug = normalizeWorkSlug(slug);

  if (!isSupabaseConfigured()) {
    return DEFAULT_WORKS.find((w) => w.slug === normalizedSlug && w.is_published) ?? null;
  }

  const supabase = await tryCreateClient();
  if (!supabase) {
    return DEFAULT_WORKS.find((w) => w.slug === normalizedSlug && w.is_published) ?? null;
  }

  try {
    const { data, error } = await supabase
      .from("work_cases")
      .select("*")
      .eq("slug", normalizedSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      console.error("[getWorkBySlug] supabase error", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        slug: normalizedSlug,
        rawSlug: slug,
      });
      if (isMissingTableError(error)) {
        return DEFAULT_WORKS.find((w) => w.slug === normalizedSlug && w.is_published) ?? null;
      }
      return null;
    }

    if (!data) return null;

    const work = mapWork(data as Record<string, unknown>);

    // 비공개·휴지통·예약발행(아직 미공개) 차단 — RLS와 이중 방어
    if (
      work.status === "draft" ||
      work.status === "private" ||
      work.status === "trash" ||
      work.status === "scheduled" ||
      work.deleted_at
    ) {
      return null;
    }

    return work;
  } catch (error) {
    console.error("[getWorkBySlug] unexpected error", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      slug: normalizedSlug,
      rawSlug: slug,
    });
    return null;
  }
}

function fallbackHomepage(errorMessage?: string): HomepageData {
  return {
    settings: DEFAULT_SETTINGS,
    services: DEFAULT_SERVICES,
    works: DEFAULT_WORKS.slice(0, 6),
    beforeAfter: DEFAULT_BEFORE_AFTER,
    reviews: [],
    faqs: DEFAULT_FAQS,
    source: "fallback",
    errorMessage,
  };
}

/** 관리자용: 전체 서비스 (비공개 포함), sort_order 오름차순 */
export async function getAdminServices(): Promise<Service[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await tryCreateClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    // 마이그레이션 전 display_order 호환
    const legacy = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });
    if (legacy.error || !legacy.data) return [];
    return (legacy.data as Record<string, unknown>[]).map(mapService);
  }

  return (data as Record<string, unknown>[]).map(mapService);
}

/** 공개 서비스 옵션 (필터·선택용) */
export async function getPublishedServiceOptions(): Promise<ServiceOption[]> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_SERVICES.map((s) => ({ id: s.id, title: s.title }));
  }
  const supabase = await tryCreateClient();
  if (!supabase) {
    return DEFAULT_SERVICES.map((s) => ({ id: s.id, title: s.title }));
  }

  const { data, error } = await supabase
    .from("services")
    .select("id, title, sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    const legacy = await supabase
      .from("services")
      .select("id, title, display_order")
      .eq("is_published", true)
      .order("display_order", { ascending: true });
    if (legacy.error || !legacy.data) return [];
    return (legacy.data as ServiceOption[]).map((s) => ({
      id: s.id,
      title: s.title,
    }));
  }

  return (data as ServiceOption[]).map((s) => ({ id: s.id, title: s.title }));
}

/** 관리자 작업사례 폼용: 전체 서비스 */
export async function getAllServiceOptions(): Promise<ServiceOption[]> {
  const services = await getAdminServices();
  return services.map((s) => ({ id: s.id, title: s.title }));
}

export async function getHomepageData(): Promise<HomepageData> {
  if (!isSupabaseConfigured()) {
    return fallbackHomepage();
  }

  const supabase = await tryCreateClient();
  if (!supabase) {
    return fallbackHomepage();
  }

  try {
    const servicesQuery = supabase
      .from("services")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    const [settingsRes, servicesRes, worksRes, baRes, reviewsRes, faqsRes] =
      await Promise.all([
        supabase.from("site_settings").select("*").limit(1).maybeSingle(),
        servicesQuery,
        supabase
          .from("work_cases")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(6),
        supabase
          .from("before_after")
          .select("*")
          .eq("is_published", true)
          .order("category", { ascending: true }),
        supabase
          .from("reviews")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("faqs")
          .select("*")
          .eq("is_published", true)
          .order("display_order", { ascending: true }),
      ]);

    let servicesData = servicesRes.data as Record<string, unknown>[] | null;
    let servicesError = servicesRes.error;

    // sort_order 칼럼이 아직 없으면 display_order로 재시도
    if (servicesError) {
      const legacy = await supabase
        .from("services")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      if (!legacy.error) {
        servicesData = legacy.data as Record<string, unknown>[] | null;
        servicesError = null;
      }
    }

    let reviewsData = reviewsRes.data as Record<string, unknown>[] | null;
    let reviewsError = reviewsRes.error;
    // status 칼럼 없으면 is_published 로 재시도
    if (reviewsError) {
      const legacy = await supabase
        .from("reviews")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (!legacy.error) {
        reviewsData = legacy.data as Record<string, unknown>[] | null;
        reviewsError = null;
      }
    }

    const firstError =
      settingsRes.error ||
      servicesError ||
      worksRes.error ||
      baRes.error ||
      reviewsError ||
      faqsRes.error;

    if (firstError) {
      return fallbackHomepage(koreanDbErrorMessage(firstError));
    }

    // DB에서 성공적으로 조회했으면 빈 배열도 그대로 사용 (하드코드 폴백 금지)
    return {
      settings: settingsRes.data
        ? mapSettings(settingsRes.data as Record<string, unknown>)
        : DEFAULT_SETTINGS,
      services: (servicesData || []).map(mapService),
      works: ((worksRes.data as Record<string, unknown>[]) || []).map(mapWork),
      beforeAfter: (baRes.data as BeforeAfter[])?.length
        ? (baRes.data as BeforeAfter[])
        : DEFAULT_BEFORE_AFTER,
      reviews: (reviewsData || []).map(mapReview),
      faqs: (faqsRes.data as Faq[])?.length
        ? (faqsRes.data as Faq[])
        : DEFAULT_FAQS,
      source: "database",
    };
  } catch (error) {
    return fallbackHomepage(koreanDbErrorMessage(error));
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const data = await getHomepageData();
  return data.settings;
}

/** 조회수 +1 (실패해도 상세 노출에는 영향 없음) */
export async function incrementWorkViewCount(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await tryCreateClient();
  if (!supabase) return;
  try {
    const { data } = await supabase
      .from("work_cases")
      .select("view_count")
      .eq("id", id)
      .maybeSingle();
    const next = (typeof data?.view_count === "number" ? data.view_count : 0) + 1;
    await supabase.from("work_cases").update({ view_count: next }).eq("id", id);
  } catch {
    // ignore
  }
}

export async function getRelatedWorks(
  current: WorkCase,
  limit = 3,
): Promise<WorkCase[]> {
  try {
    const relatedIds = Array.isArray(current.related_work_ids)
      ? current.related_work_ids.filter(Boolean).slice(0, limit)
      : [];

    if (!isSupabaseConfigured()) {
      if (relatedIds.length) {
        return DEFAULT_WORKS.filter((w) => relatedIds.includes(w.id)).slice(0, limit);
      }
      return DEFAULT_WORKS.filter(
        (w) =>
          w.id !== current.id &&
          (w.service_id === current.service_id ||
            w.service_category === current.service_category ||
            w.vehicle_brand === current.vehicle_brand),
      ).slice(0, limit);
    }

    const supabase = await tryCreateClient();
    if (!supabase) return [];

    if (relatedIds.length) {
      const { data, error } = await supabase
        .from("work_cases")
        .select("*")
        .eq("is_published", true)
        .in("id", relatedIds)
        .limit(limit);
      if (error) {
        console.error("[getRelatedWorks] related_work_ids error", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      } else if (data?.length) {
        return (data as Record<string, unknown>[]).map(mapWork);
      }
    }

    let query = supabase
      .from("work_cases")
      .select("*")
      .eq("is_published", true)
      .neq("id", current.id);

    const brand = (current.manufacturer || current.vehicle_brand || "").trim();
    if (current.service_id && brand) {
      query = query.or(
        `service_id.eq.${quotePostgrestValue(current.service_id)},vehicle_brand.eq.${quotePostgrestValue(brand)}`,
      );
    } else if (current.service_id) {
      query = query.eq("service_id", current.service_id);
    } else if (current.service_category && brand) {
      query = query.or(
        `service_category.eq.${quotePostgrestValue(current.service_category)},vehicle_brand.eq.${quotePostgrestValue(brand)}`,
      );
    } else if (current.service_category) {
      query = query.eq("service_category", current.service_category);
    } else if (brand) {
      query = query.eq("vehicle_brand", brand);
    } else {
      return [];
    }

    const { data, error } = await query
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getRelatedWorks] supabase error", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return [];
    }
    return ((data as Record<string, unknown>[]) || []).map(mapWork);
  } catch (error) {
    console.error("[getRelatedWorks] unexpected error", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

export async function getSameVehicleWorks(
  current: WorkCase,
  limit = 3,
): Promise<WorkCase[]> {
  try {
    const brand = (current.manufacturer || current.vehicle_brand || "").trim();
    const model = (current.vehicle_model || "").trim();
    if (!brand || !model) return [];

    if (!isSupabaseConfigured()) {
      return DEFAULT_WORKS.filter(
        (w) =>
          w.id !== current.id &&
          w.is_published &&
          (w.manufacturer || w.vehicle_brand) === brand &&
          w.vehicle_model === model,
      ).slice(0, limit);
    }

    const supabase = await tryCreateClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("work_cases")
      .select("*")
      .eq("is_published", true)
      .neq("id", current.id)
      .eq("vehicle_brand", brand)
      .eq("vehicle_model", model)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getSameVehicleWorks] supabase error", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return [];
    }
    return ((data as Record<string, unknown>[]) || []).map(mapWork);
  } catch (error) {
    console.error("[getSameVehicleWorks] unexpected error", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

export async function getSameSymptomWorks(
  current: WorkCase,
  limit = 3,
): Promise<WorkCase[]> {
  try {
    const tags = Array.isArray(current.symptom_tags) ? current.symptom_tags : [];
    const tag = tags[0];
    const keyword = (tag || current.service_category || "").trim();
    if (!keyword) return [];

    if (!isSupabaseConfigured()) {
      return DEFAULT_WORKS.filter(
        (w) =>
          w.id !== current.id &&
          w.is_published &&
          (w.symptom_tags?.includes(keyword) ||
            w.service_category === current.service_category ||
            w.symptoms?.includes(keyword)),
      ).slice(0, limit);
    }

    const supabase = await tryCreateClient();
    if (!supabase) return [];

    let query = supabase
      .from("work_cases")
      .select("*")
      .eq("is_published", true)
      .neq("id", current.id);

    if (tag) {
      query = query.contains("symptom_tags", [tag]);
    } else {
      query = query.ilike("symptoms", `%${keyword.slice(0, 40)}%`);
    }

    const { data, error } = await query
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      if (error) {
        console.error("[getSameSymptomWorks] supabase error", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      }
      // symptom_tags 컬럼 없을 때 서비스 기준 폴백
      if (!current.service_category) return [];
      const fallback = await supabase
        .from("work_cases")
        .select("*")
        .eq("is_published", true)
        .neq("id", current.id)
        .eq("service_category", current.service_category)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (fallback.error || !fallback.data) return [];
      return (fallback.data as Record<string, unknown>[]).map(mapWork);
    }

    return (data as Record<string, unknown>[]).map(mapWork);
  } catch (error) {
    console.error("[getSameSymptomWorks] unexpected error", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

export async function getPaginatedWorks(
  params: WorksFilterParams,
): Promise<PaginatedWorks> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, params.pageSize ?? 12));
  const sort = params.sort === "oldest" ? "oldest" : "newest";

  const emptyMeta = {
    brands: [] as string[],
    models: [] as string[],
    services: [] as ServiceOption[],
    categories: [] as string[],
  };

  if (!isSupabaseConfigured()) {
    let items = [...DEFAULT_WORKS];
    if (params.q) {
      const q = params.q.toLowerCase();
      items = items.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.vehicle_brand.toLowerCase().includes(q) ||
          w.vehicle_model.toLowerCase().includes(q) ||
          w.symptoms.toLowerCase().includes(q),
      );
    }
    if (params.brand) items = items.filter((w) => w.vehicle_brand === params.brand);
    if (params.model) items = items.filter((w) => w.vehicle_model === params.model);
    if (params.service) {
      items = items.filter((w) => w.service_id === params.service);
    } else if (params.category) {
      items = items.filter((w) => w.service_category === params.category);
    }
    items.sort((a, b) => {
      const da = new Date(a.published_at || a.created_at).getTime();
      const db = new Date(b.published_at || b.created_at).getTime();
      return sort === "oldest" ? da - db : db - da;
    });
    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    const serviceOptions = DEFAULT_SERVICES.map((s) => ({
      id: s.id,
      title: s.title,
    }));
    return {
      items: pageItems,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      brands: [...new Set(DEFAULT_WORKS.map((w) => w.vehicle_brand))],
      models: [...new Set(DEFAULT_WORKS.map((w) => w.vehicle_model))],
      services: serviceOptions,
      categories: serviceOptions.map((s) => s.title),
    };
  }

  const supabase = await tryCreateClient();
  if (!supabase) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
      ...emptyMeta,
    };
  }

  let query = supabase
    .from("work_cases")
    .select("*", { count: "exact" })
    .eq("is_published", true);

  if (params.brand) query = query.eq("vehicle_brand", params.brand);
  if (params.model) query = query.eq("vehicle_model", params.model);
  if (params.service) {
    query = query.eq("service_id", params.service);
  } else if (params.category) {
    query = query.eq("service_category", params.category);
  }
  if (params.q) {
    const q = params.q.replace(/[%_]/g, "");
    query = query.or(
      `title.ilike.%${q}%,vehicle_brand.ilike.%${q}%,vehicle_model.ilike.%${q}%,symptoms.ilike.%${q}%,work_summary.ilike.%${q}%`,
    );
  }

  query = query.order("published_at", {
    ascending: sort === "oldest",
    nullsFirst: false,
  });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);

  const [metaRes, serviceOptions] = await Promise.all([
    supabase
      .from("work_cases")
      .select("vehicle_brand, vehicle_model")
      .eq("is_published", true),
    getPublishedServiceOptions(),
  ]);

  if (error) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
      ...emptyMeta,
    };
  }

  const metaRows = (metaRes.data || []) as Array<{
    vehicle_brand: string;
    vehicle_model: string;
  }>;

  const total = count ?? 0;

  return {
    items: ((data as Record<string, unknown>[]) || []).map(mapWork),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    brands: [...new Set(metaRows.map((r) => r.vehicle_brand).filter(Boolean))].sort(),
    models: [...new Set(metaRows.map((r) => r.vehicle_model).filter(Boolean))].sort(),
    services: serviceOptions,
    categories: serviceOptions.map((s) => s.title),
  };
}

export async function getApprovedReviews(options?: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: Review[]; total: number; averageRating: number; page: number; pageSize: number; totalPages: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 12;
  const empty = {
    items: [] as Review[],
    total: 0,
    averageRating: 0,
    page,
    pageSize,
    totalPages: 1,
  };

  if (!isSupabaseConfigured()) return empty;
  const supabase = await tryCreateClient();
  if (!supabase) return empty;

  const query = supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let { data, error, count } = await query.range(from, to);

  if (error) {
    const legacy = await supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(from, to);
    data = legacy.data;
    error = legacy.error;
    count = legacy.count;
  }

  if (error || !data) return empty;

  const items = (data as Record<string, unknown>[]).map(mapReview);
  const total = count ?? items.length;

  // 평균은 전체 승인 리뷰 기준 (현재 페이지만이 아님)
  let avgQuery = await supabase
    .from("reviews")
    .select("rating")
    .eq("status", "approved");
  if (avgQuery.error) {
    avgQuery = await supabase.from("reviews").select("rating").eq("is_published", true);
  }
  const ratings = ((avgQuery.data || []) as Array<{ rating: number }>).map((r) => ({
    rating: r.rating,
  }));

  return {
    items,
    total,
    averageRating: averageRating(ratings.length ? ratings : items),
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminReviews(filters?: {
  status?: ReviewStatus | "all";
  rating?: number | "all";
  q?: string;
  sort?: "newest" | "oldest";
}): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await tryCreateClient();
  if (!supabase) return [];

  let query = supabase.from("reviews").select("*");
  const status = filters?.status ?? "all";
  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (filters?.rating && filters.rating !== "all") {
    query = query.eq("rating", filters.rating);
  }
  if (filters?.q?.trim()) {
    const q = filters.q.trim().replace(/[%_,]/g, "");
    query = query.or(
      `author_name.ilike.%${q}%,customer_name.ilike.%${q}%,content.ilike.%${q}%,vehicle_name.ilike.%${q}%,vehicle_info.ilike.%${q}%`,
    );
  }
  query = query.order("created_at", {
    ascending: filters?.sort === "oldest",
  });

  const { data, error } = await query;
  if (error) {
    // status/author_name 검색 실패 시 단순 조회
    const legacy = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: filters?.sort === "oldest" });
    if (legacy.error || !legacy.data) return [];
    let items = (legacy.data as Record<string, unknown>[]).map(mapReview);
    if (status !== "all") {
      items = items.filter((r) => r.status === status);
    }
    if (filters?.rating && filters.rating !== "all") {
      items = items.filter((r) => r.rating === filters.rating);
    }
    if (filters?.q?.trim()) {
      const q = filters.q.trim().toLowerCase();
      items = items.filter(
        (r) =>
          r.author_name.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          (r.vehicle_name || "").toLowerCase().includes(q),
      );
    }
    return items;
  }

  return ((data as Record<string, unknown>[]) || []).map(mapReview);
}

export async function getReviewStats(): Promise<ReviewStats> {
  const empty: ReviewStats = {
    total: 0,
    pending: 0,
    approved: 0,
    hidden: 0,
    rejected: 0,
    averageRating: 0,
  };
  if (!isSupabaseConfigured()) return empty;
  const supabase = await tryCreateClient();
  if (!supabase) return empty;

  const { data, error } = await supabase
    .from("reviews")
    .select("rating, status, is_published");

  if (error || !data) {
    const legacy = await supabase.from("reviews").select("rating, is_published");
    if (legacy.error || !legacy.data) return empty;
    const rows = legacy.data as Array<{ rating: number; is_published: boolean }>;
    const approved = rows.filter((r) => r.is_published);
    return {
      total: rows.length,
      pending: rows.filter((r) => !r.is_published).length,
      approved: approved.length,
      hidden: 0,
      rejected: 0,
      averageRating: averageRating(approved),
    };
  }

  const rows = (data as Record<string, unknown>[]).map(mapReview);
  const approved = rows.filter((r) => r.status === "approved");
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    approved: approved.length,
    hidden: rows.filter((r) => r.status === "hidden").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    averageRating: averageRating(approved),
  };
}

export async function getAdminDashboardStats() {
  const empty = {
    services: 0,
    works: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    recentWorks: [] as WorkCase[],
    recentReviews: [] as Review[],
  };
  if (!isSupabaseConfigured()) return empty;
  const supabase = await tryCreateClient();
  if (!supabase) return empty;

  const [servicesRes, worksRes, reviewsRes, recentWorksRes] = await Promise.all([
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("work_cases").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(5),
    supabase
      .from("work_cases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const reviews = ((reviewsRes.data as Record<string, unknown>[]) || []).map(mapReview);
  const stats = await getReviewStats();

  return {
    services: servicesRes.count ?? 0,
    works: worksRes.count ?? 0,
    pendingReviews: stats.pending,
    approvedReviews: stats.approved,
    recentWorks: ((recentWorksRes.data as Record<string, unknown>[]) || []).map(mapWork),
    recentReviews: reviews,
  };
}

export { getPublicImageUrl } from "@/lib/media";
