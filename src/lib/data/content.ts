import type {
  BeforeAfter,
  Faq,
  HomepageData,
  PaginatedWorks,
  ProcessStep,
  Review,
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

function mapSettings(row: Record<string, unknown>): SiteSettings {
  const weekday =
    (typeof row.weekday_hours === "string" && row.weekday_hours.trim()) ||
    DEFAULT_SETTINGS.weekday_hours;
  const saturday =
    (typeof row.saturday_hours === "string" && row.saturday_hours.trim()) ||
    DEFAULT_SETTINGS.saturday_hours;
  const holiday =
    (typeof row.holiday_hours === "string" && row.holiday_hours.trim()) ||
    DEFAULT_SETTINGS.holiday_hours;

  return {
    ...DEFAULT_SETTINGS,
    ...row,
    weekday_hours: weekday,
    saturday_hours: saturday,
    holiday_hours: holiday,
    hours:
      (typeof row.hours === "string" && row.hours.trim()) ||
      `평일 ${weekday} 토요일 ${saturday}`,
    closed_days:
      (typeof row.closed_days === "string" && row.closed_days.trim()) ||
      (holiday === "휴무" ? "일요일 · 공휴일" : holiday),
    process_steps: parseProcessSteps(row.process_steps),
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

function mapWork(row: Record<string, unknown>): WorkCase {
  return {
    ...(row as unknown as WorkCase),
    service_id: (row.service_id as string | null) ?? null,
    service_category: String(row.service_category ?? ""),
    gallery_image_paths: Array.isArray(row.gallery_image_paths)
      ? (row.gallery_image_paths as string[])
      : [],
  };
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
          .eq("is_published", true)
          .order("display_order", { ascending: true }),
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

    const firstError =
      settingsRes.error ||
      servicesError ||
      worksRes.error ||
      baRes.error ||
      reviewsRes.error ||
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
      reviews: (reviewsRes.data as Review[]) || [],
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

export async function getWorkBySlug(slug: string): Promise<WorkCase | null> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_WORKS.find((w) => w.slug === slug) ?? null;
  }

  const supabase = await tryCreateClient();
  if (!supabase) {
    return DEFAULT_WORKS.find((w) => w.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("work_cases")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return DEFAULT_WORKS.find((w) => w.slug === slug) ?? null;
    }
    return null;
  }

  return data ? mapWork(data as Record<string, unknown>) : null;
}

export async function getRelatedWorks(
  current: WorkCase,
  limit = 3,
): Promise<WorkCase[]> {
  if (!isSupabaseConfigured()) {
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

  let query = supabase
    .from("work_cases")
    .select("*")
    .eq("is_published", true)
    .neq("id", current.id);

  if (current.service_id) {
    query = query.or(
      `service_id.eq.${current.service_id},vehicle_brand.eq.${current.vehicle_brand}`,
    );
  } else if (current.service_category) {
    query = query.or(
      `service_category.eq.${current.service_category},vehicle_brand.eq.${current.vehicle_brand}`,
    );
  } else {
    query = query.eq("vehicle_brand", current.vehicle_brand);
  }

  const { data, error } = await query
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapWork);
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

export { getPublicImageUrl } from "@/lib/media";
