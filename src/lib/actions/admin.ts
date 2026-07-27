"use server";

import { revalidatePath } from "next/cache";
import { checkIsAdmin } from "@/lib/auth/is-admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, slugify } from "@/lib/utils";

type SupabaseLikeError = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

async function ensureAuth() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  if (!(await checkIsAdmin(supabase, user))) {
    throw new Error(
      "관리자 권한이 필요합니다. public.admin_users 에 이메일이 등록되어 있는지 확인해 주세요.",
    );
  }
  return supabase;
}

function logSupabaseError(context: string, error: SupabaseLikeError, payload?: unknown) {
  console.error(`[Supabase:${context}]`, {
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    code: error.code ?? null,
    payloadPreview:
      payload && typeof payload === "object"
        ? Object.keys(payload as Record<string, unknown>)
        : undefined,
  });
}

function supabaseErrorMessage(error: SupabaseLikeError, fallback = "저장에 실패했습니다.") {
  const parts = [error.message, error.hint, error.details].filter(
    (v): v is string => Boolean(v && String(v).trim()),
  );
  return parts.length ? parts.join(" / ") : fallback;
}

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/works");
  revalidatePath("/reviews");
  revalidatePath("/admin");
  revalidatePath("/admin/general");
  revalidatePath("/admin/homepage");
  revalidatePath("/admin/seo");
  revalidatePath("/admin/services");
  revalidatePath("/admin/works");
  revalidatePath("/admin/reviews");
}

function revalidateReviews() {
  revalidatePath("/");
  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
}

/** site_settings 테이블에 실제 존재하는 업데이트 가능 칼럼만 허용 */
const SITE_SETTINGS_KEYS = [
  "business_name",
  "english_brand_name",
  "phone",
  "address",
  "hours",
  "closed_days",
  "weekday_hours",
  "saturday_hours",
  "holiday_hours",
  "naver_blog_url",
  "naver_map_url",
  "naver_reservation_url",
  "hero_title",
  "hero_description",
  "hero_image_path",
  "shop_image_path",
  "stat_experience",
  "stat_services",
  "stat_brands",
  "stat_works",
  "why_title",
  "why_content",
  "process_steps",
  "homepage_config",
  "seo_title",
  "seo_description",
  "og_image_path",
] as const;

const OPTIONAL_HOUR_KEYS = ["weekday_hours", "saturday_hours", "holiday_hours"] as const;

function pickSiteSettingsPayload(raw: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const key of SITE_SETTINGS_KEYS) {
    if (!(key in raw)) continue;
    const value = raw[key];
    if (value === undefined) continue;
    clean[key] = value;
  }
  return clean;
}

function isMissingColumnError(error: SupabaseLikeError) {
  const text = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`;
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /column .* does not exist/i.test(text) ||
    /Could not find the '.+' column/i.test(text)
  );
}

function extractMissingColumnName(error: SupabaseLikeError): string | null {
  const text = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`;
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" of relation/i,
    // e.g. column work_cases.service_id does not exist
    /column (?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+) does not exist/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function isSentinelUndefined(value: unknown) {
  return value === undefined || value === "$undefined" || value === "undefined";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveSiteSettings(payload: Record<string, unknown>): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const clean = pickSiteSettingsPayload(payload);

  const { data: existing, error: existingError } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existingError) {
    logSupabaseError("saveSiteSettings.select", existingError);
    return { ok: false, error: supabaseErrorMessage(existingError, "설정 조회에 실패했습니다.") };
  }

  async function write(data: Record<string, unknown>) {
    if (existing?.id) {
      return supabase.from("site_settings").update(data).eq("id", existing.id);
    }
    return supabase.from("site_settings").insert(data);
  }

  let { error } = await write(clean);

  // 마이그레이션 미적용 컬럼이 있으면 제외 후 재시도
  if (error && isMissingColumnError(error)) {
    logSupabaseError("saveSiteSettings.missingColumnRetry", error, clean);
    const fallback: Record<string, unknown> = { ...clean };
    for (const key of OPTIONAL_HOUR_KEYS) {
      delete fallback[key];
    }
    delete fallback.homepage_config;
    const retry = await write(fallback);
    error = retry.error;
  }

  if (error) {
    logSupabaseError("saveSiteSettings.write", error, clean);
    return { ok: false, error: supabaseErrorMessage(error) };
  }

  revalidatePublic();
  return { ok: true };
}

export async function upsertService(input: {
  id?: string;
  title: string;
  short_description: string;
  detailed_description: string;
  image_path?: string | null;
  sort_order: number;
  is_published: boolean;
}): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "서비스명을 입력해 주세요." };
  }

  const payload = {
    title,
    short_description: input.short_description ?? "",
    detailed_description: input.detailed_description ?? "",
    image_path: input.image_path ?? null,
    sort_order: input.sort_order,
    is_published: input.is_published,
  };

  if (input.id) {
    let { error } = await supabase.from("services").update(payload).eq("id", input.id);

    if (error && isMissingColumnError(error) && /sort_order/i.test(error.message ?? "")) {
      logSupabaseError("upsertService.sort_orderFallback", error, payload);
      const { sort_order, ...rest } = payload;
      const legacy = { ...rest, display_order: sort_order };
      const retry = await supabase.from("services").update(legacy).eq("id", input.id);
      error = retry.error;
    }

    if (error) {
      logSupabaseError("upsertService.update", error, payload);
      return { ok: false, error: supabaseErrorMessage(error) };
    }

    const { error: syncError } = await supabase
      .from("work_cases")
      .update({ service_category: title })
      .eq("service_id", input.id);
    if (syncError) {
      logSupabaseError("upsertService.syncCategory", syncError);
    }
  } else {
    let { error } = await supabase.from("services").insert(payload);

    if (error && isMissingColumnError(error) && /sort_order/i.test(error.message ?? "")) {
      logSupabaseError("upsertService.insertSortOrderFallback", error, payload);
      const { sort_order, ...rest } = payload;
      const legacy = { ...rest, display_order: sort_order };
      const retry = await supabase.from("services").insert(legacy);
      error = retry.error;
    }

    if (error) {
      logSupabaseError("upsertService.insert", error, payload);
      return { ok: false, error: supabaseErrorMessage(error) };
    }
  }

  revalidatePublic();
  return { ok: true };
}

export async function countWorksForService(serviceId: string) {
  const supabase = await ensureAuth();
  const { count, error } = await supabase
    .from("work_cases")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);
  if (error) {
    logSupabaseError("countWorksForService", error);
    throw new Error(supabaseErrorMessage(error, "연결된 작업사례 수를 확인할 수 없습니다."));
  }
  return count ?? 0;
}

export async function deleteService(id: string) {
  const supabase = await ensureAuth();

  const { count } = await supabase
    .from("work_cases")
    .select("id", { count: "exact", head: true })
    .eq("service_id", id);

  await supabase.from("work_cases").update({ service_id: null }).eq("service_id", id);

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) {
    logSupabaseError("deleteService", error);
    throw new Error(supabaseErrorMessage(error, "서비스 삭제에 실패했습니다."));
  }
  revalidatePublic();
  return { ok: true, linkedWorks: count ?? 0 };
}

export async function reorderServices(orderedIds: string[]) {
  const supabase = await ensureAuth();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("services").update({ sort_order: index + 1 }).eq("id", id),
    ),
  );
  let firstError = results.find((r) => r.error)?.error;

  if (firstError && isMissingColumnError(firstError)) {
    logSupabaseError("reorderServices.sort_orderFallback", firstError);
    const legacyResults = await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("services").update({ display_order: index + 1 }).eq("id", id),
      ),
    );
    firstError = legacyResults.find((r) => r.error)?.error;
  }

  if (firstError) {
    logSupabaseError("reorderServices", firstError);
    throw new Error(supabaseErrorMessage(firstError, "순서 저장에 실패했습니다."));
  }
  revalidatePublic();
  return { ok: true };
}

function cleanWorkCasePayload(input: Record<string, unknown>) {
  const allowed = [
    "slug",
    "title",
    "subtitle",
    "excerpt",
    "content_json",
    "content_html",
    "status",
    "scheduled_at",
    "deleted_at",
    "vehicle_brand",
    "vehicle_model",
    "model_year",
    "manufacturer",
    "generation",
    "fuel_type",
    "transmission_type",
    "mileage",
    "vehicle_number_masked",
    "service_id",
    "service_category",
    "symptoms",
    "diagnosis",
    "cause",
    "repair_process",
    "replaced_parts",
    "repair_duration",
    "warranty_info",
    "estimated_price_min",
    "estimated_price_max",
    "price_display_enabled",
    "work_summary",
    "detailed_content",
    "representative_image_path",
    "gallery_image_paths",
    "before_images",
    "after_images",
    "video_urls",
    "vehicle_tags",
    "symptom_tags",
    "general_tags",
    "naver_blog_url",
    "published_at",
    "is_published",
    "is_featured",
    "display_order",
    "seo_title",
    "seo_description",
    "og_title",
    "og_description",
    "og_image_path",
    "canonical_url",
    "noindex",
    "related_work_ids",
  ] as const;

  const clean: Record<string, unknown> = {};
  for (const key of allowed) {
    if (!(key in input)) continue;
    const value = input[key];
    // Server Action 직렬화 sentinel / undefined 는 DB 로 보내지 않음
    if (isSentinelUndefined(value)) continue;
    clean[key] = value;
  }

  for (const key of [
    "gallery_image_paths",
    "before_images",
    "after_images",
    "video_urls",
    "vehicle_tags",
    "symptom_tags",
    "general_tags",
    "related_work_ids",
  ] as const) {
    if (key in clean && !Array.isArray(clean[key])) {
      clean[key] = [];
    }
  }

  if (clean.service_id === "" || isSentinelUndefined(clean.service_id)) {
    clean.service_id = null;
  } else if (
    clean.service_id != null &&
    (typeof clean.service_id !== "string" || !UUID_RE.test(clean.service_id))
  ) {
    clean.service_id = null;
  }

  // JSONB 컬럼에 잘못된 문자열이 들어가면 insert 가 실패함
  if ("content_json" in clean) {
    const json = clean.content_json;
    if (isSentinelUndefined(json) || typeof json === "string") {
      try {
        clean.content_json =
          typeof json === "string" && json && !isSentinelUndefined(json)
            ? JSON.parse(json)
            : null;
      } catch {
        clean.content_json = null;
      }
    }
  }

  // status ↔ is_published 동기화 (DB 트리거 미적용 환경 대비)
  if (typeof clean.status === "string") {
    clean.is_published = clean.status === "published";
    if (clean.status === "trash" && !clean.deleted_at) {
      clean.deleted_at = new Date().toISOString();
    }
    if (clean.status !== "trash") {
      clean.deleted_at = null;
    }
  }

  return clean;
}

function resolveWorkCaseId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  // Server Action 직렬화가 undefined 를 "$undefined" 문자열로 보낼 수 있음
  if (!id || id === "undefined" || id === "$undefined") return null;
  return id;
}

export async function upsertWorkCase(
  input: Record<string, unknown> & { id?: string },
): Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }> {
  const supabase = await ensureAuth();
  const existingId = resolveWorkCaseId(input.id);

  const payload = cleanWorkCasePayload({
    ...input,
    slug:
      (typeof input.slug === "string" && input.slug.trim()) ||
      slugify(String(input.title || `work-${Date.now()}`)),
  });
  // insert payload 에 id 가 섞이지 않도록 제거
  delete payload.id;

  const slug = String(payload.slug || "");
  if (slug) {
    let dupQuery = supabase
      .from("work_cases")
      .select("id")
      .eq("slug", slug)
      .limit(1);
    if (existingId) dupQuery = dupQuery.neq("id", existingId);
    const { data: dup } = await dupQuery.maybeSingle();
    if (dup?.id) {
      return { ok: false, error: "이미 사용 중인 슬러그입니다. 다른 주소를 입력해 주세요." };
    }
  }

  if (payload.is_published && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }

  function toLegacyPayload(full: Record<string, unknown>) {
    const {
      subtitle: _a,
      excerpt: _b,
      content_json: _c,
      content_html: _d,
      status: _e,
      scheduled_at: _f,
      deleted_at: _g,
      manufacturer: _h,
      generation: _i,
      fuel_type: _j,
      transmission_type: _k,
      mileage: _l,
      vehicle_number_masked: _m,
      cause: _n,
      repair_process: _o,
      replaced_parts: _p,
      repair_duration: _q,
      warranty_info: _r,
      estimated_price_min: _s,
      estimated_price_max: _t,
      price_display_enabled: _u,
      before_images: _v,
      after_images: _w,
      video_urls: _x,
      vehicle_tags: _y,
      symptom_tags: _z,
      general_tags: _aa,
      og_title: _ab,
      og_description: _ac,
      og_image_path: _ad,
      canonical_url: _ae,
      noindex: _af,
      related_work_ids: _ag,
      ...legacy
    } = full;
    void _a;
    void _b;
    void _c;
    void _d;
    void _e;
    void _f;
    void _g;
    void _h;
    void _i;
    void _j;
    void _k;
    void _l;
    void _m;
    void _n;
    void _o;
    void _p;
    void _q;
    void _r;
    void _s;
    void _t;
    void _u;
    void _v;
    void _w;
    void _x;
    void _y;
    void _z;
    void _aa;
    void _ab;
    void _ac;
    void _ad;
    void _ae;
    void _af;
    void _ag;
    return legacy;
  }

  async function writeWithColumnFallback(
    mode: "update" | "insert",
    basePayload: Record<string, unknown>,
  ) {
    let current: Record<string, unknown> = { ...basePayload };
    let lastError: SupabaseLikeError | null = null;
    let lastData: { id?: string; slug?: string } | null = null;

    for (let attempt = 0; attempt < 40; attempt++) {
      const result =
        mode === "update"
          ? await supabase.from("work_cases").update(current).eq("id", existingId as string)
          : await supabase.from("work_cases").insert(current).select("id, slug").single();

      const error = result.error as SupabaseLikeError | null;
      const data =
        mode === "insert"
          ? ((result as { data: { id?: string; slug?: string } | null }).data ?? null)
          : null;

      if (!error) {
        return { data, error: null as SupabaseLikeError | null };
      }

      console.error(error);
      lastError = error;
      lastData = data;

      // insert 는 됐는데 RLS 때문에 RETURNING/select 가 0건인 경우
      if (
        mode === "insert" &&
        (error.code === "PGRST116" || /0 rows|multiple \(or no\) rows/i.test(error.message ?? ""))
      ) {
        const { data: row } = await supabase
          .from("work_cases")
          .select("id, slug")
          .eq("slug", String(current.slug))
          .maybeSingle();
        if (row?.id) {
          return { data: row, error: null };
        }
      }

      if (!isMissingColumnError(error)) {
        break;
      }

      const missing = extractMissingColumnName(error);
      if (missing && missing in current) {
        logSupabaseError(`upsertWorkCase.${mode}.dropColumn:${missing}`, error, current);
        delete current[missing];
        continue;
      }

      // 컬럼명을 못 뽑으면 레거시 축소 페이로드로 한 번 더 시도
      const legacy = toLegacyPayload(current);
      if (Object.keys(legacy).length >= Object.keys(current).length) {
        break;
      }
      logSupabaseError(`upsertWorkCase.${mode}.legacyFallback`, error, current);
      current = legacy;
    }

    return { data: lastData, error: lastError };
  }

  if (existingId) {
    const { error } = await writeWithColumnFallback("update", payload);
    if (error) {
      logSupabaseError("upsertWorkCase.update", error, payload);
      return { ok: false, error: error.message || "작업사례 저장에 실패했습니다." };
    }
    revalidatePublic();
    revalidatePath(`/works/${String(payload.slug)}`);
    return { ok: true, id: existingId, slug: String(payload.slug) };
  }

  const { data, error } = await writeWithColumnFallback("insert", payload);

  if (error || !data?.id) {
    logSupabaseError("upsertWorkCase.insert", error ?? { message: "no data" }, payload);
    return {
      ok: false,
      error: error?.message || "작업사례 저장에 실패했습니다.",
    };
  }

  revalidatePublic();
  return { ok: true, id: data.id as string, slug: String(data.slug || payload.slug) };
}

export async function duplicateWorkCase(id: string) {
  const supabase = await ensureAuth();
  const { data, error } = await supabase.from("work_cases").select("*").eq("id", id).single();
  if (error || !data) {
    if (error) logSupabaseError("duplicateWorkCase.select", error);
    throw new Error(error?.message || "작업사례를 찾을 수 없습니다.");
  }

  const copy = { ...data } as Record<string, unknown>;
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  copy.title = `${data.title} (복제)`;
  copy.slug = `${data.slug}-copy-${Date.now().toString().slice(-6)}`;
  copy.is_published = false;
  copy.published_at = null;
  copy.status = "draft";
  copy.deleted_at = null;
  copy.scheduled_at = null;
  copy.view_count = 0;

  const { data: created, error: insertError } = await supabase
    .from("work_cases")
    .insert(copy)
    .select("id")
    .single();
  if (insertError) {
    logSupabaseError("duplicateWorkCase.insert", insertError, copy);
    throw new Error(supabaseErrorMessage(insertError));
  }
  revalidatePublic();
  return { ok: true, id: created.id as string };
}

/** 휴지통 이동 (소프트 삭제). 영구 삭제는 purgeWorkCase */
export async function deleteWorkCase(id: string): Promise<SaveResult> {
  const supabase = await ensureAuth();
  let { error } = await supabase
    .from("work_cases")
    .update({
      status: "trash",
      is_published: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error && isMissingColumnError(error)) {
    logSupabaseError("deleteWorkCase.legacyHardDelete", error);
    const hard = await supabase.from("work_cases").delete().eq("id", id);
    error = hard.error;
  }

  if (error) {
    logSupabaseError("deleteWorkCase", error);
    return { ok: false, error: "작업사례 삭제에 실패했습니다." };
  }
  revalidatePublic();
  return { ok: true };
}

export async function restoreWorkCase(id: string): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const { error } = await supabase
    .from("work_cases")
    .update({ status: "draft", is_published: false, deleted_at: null })
    .eq("id", id);
  if (error) {
    logSupabaseError("restoreWorkCase", error);
    return { ok: false, error: "복구에 실패했습니다." };
  }
  revalidatePublic();
  return { ok: true };
}

export async function bulkUpdateWorkStatus(
  ids: string[],
  status: "published" | "private" | "trash",
): Promise<SaveResult> {
  if (!ids.length) return { ok: false, error: "선택된 항목이 없습니다." };
  const supabase = await ensureAuth();
  const payload: Record<string, unknown> = {
    status,
    is_published: status === "published",
    deleted_at: status === "trash" ? new Date().toISOString() : null,
  };
  if (status === "published") {
    payload.published_at = new Date().toISOString();
  }
  const { error } = await supabase.from("work_cases").update(payload).in("id", ids);
  if (error) {
    logSupabaseError("bulkUpdateWorkStatus", error, payload);
    return { ok: false, error: "일괄 변경에 실패했습니다." };
  }
  revalidatePublic();
  return { ok: true };
}

export async function updateBeforeAfter(input: {
  id: string;
  title: string;
  description: string;
  before_image_path?: string | null;
  after_image_path?: string | null;
  is_published: boolean;
}): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const payload = {
    title: input.title,
    description: input.description,
    before_image_path: input.before_image_path ?? null,
    after_image_path: input.after_image_path ?? null,
    is_published: input.is_published,
  };
  const { error } = await supabase.from("before_after").update(payload).eq("id", input.id);
  if (error) {
    logSupabaseError("updateBeforeAfter", error, payload);
    return { ok: false, error: supabaseErrorMessage(error) };
  }
  revalidatePublic();
  return { ok: true };
}

export async function updateReviewStatus(
  id: string,
  status: "pending" | "approved" | "hidden" | "rejected",
): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const payload: Record<string, unknown> = {
    status,
    is_published: status === "approved",
  };
  if (status === "approved") {
    payload.approved_at = new Date().toISOString();
  }
  let { error } = await supabase.from("reviews").update(payload).eq("id", id);
  if (error && isMissingColumnError(error)) {
    logSupabaseError("updateReviewStatus.legacy", error, payload);
    const retry = await supabase
      .from("reviews")
      .update({ is_published: status === "approved" })
      .eq("id", id);
    error = retry.error;
  }
  if (error) {
    logSupabaseError("updateReviewStatus", error, payload);
    return { ok: false, error: "상태 변경에 실패했습니다." };
  }
  revalidateReviews();
  return { ok: true };
}

export async function bulkUpdateReviewStatus(
  ids: string[],
  status: "approved" | "hidden",
): Promise<SaveResult> {
  if (!ids.length) return { ok: false, error: "선택된 리뷰가 없습니다." };
  const supabase = await ensureAuth();
  const payload: Record<string, unknown> = {
    status,
    is_published: status === "approved",
  };
  if (status === "approved") {
    payload.approved_at = new Date().toISOString();
  }
  let { error } = await supabase.from("reviews").update(payload).in("id", ids);
  if (error && isMissingColumnError(error)) {
    logSupabaseError("bulkUpdateReviewStatus.legacy", error, payload);
    const retry = await supabase
      .from("reviews")
      .update({ is_published: status === "approved" })
      .in("id", ids);
    error = retry.error;
  }
  if (error) {
    logSupabaseError("bulkUpdateReviewStatus", error, payload);
    return { ok: false, error: "일괄 변경에 실패했습니다." };
  }
  revalidateReviews();
  return { ok: true };
}

export async function saveReviewReply(id: string, admin_reply: string): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const reply = admin_reply.trim() || null;
  const { error } = await supabase
    .from("reviews")
    .update({ admin_reply: reply })
    .eq("id", id);
  if (error && isMissingColumnError(error)) {
    logSupabaseError("saveReviewReply.missingColumn", error);
    return {
      ok: false,
      error: "관리자 답변 기능을 사용하려면 마이그레이션 004를 적용해 주세요.",
    };
  }
  if (error) {
    logSupabaseError("saveReviewReply", error);
    return { ok: false, error: "답변 저장에 실패했습니다." };
  }
  revalidateReviews();
  return { ok: true };
}

export async function deleteReview(id: string): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) {
    logSupabaseError("deleteReview", error);
    return { ok: false, error: "리뷰 삭제에 실패했습니다." };
  }
  revalidateReviews();
  return { ok: true };
}

export async function upsertFaq(input: {
  id?: string;
  question: string;
  answer: string;
  display_order: number;
  is_published: boolean;
}): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const { id, ...rest } = input;
  const payload = {
    question: rest.question ?? "",
    answer: rest.answer ?? "",
    display_order: rest.display_order,
    is_published: rest.is_published,
  };

  if (id) {
    const { error } = await supabase.from("faqs").update(payload).eq("id", id);
    if (error) {
      logSupabaseError("upsertFaq.update", error, payload);
      return { ok: false, error: supabaseErrorMessage(error) };
    }
  } else {
    const { error } = await supabase.from("faqs").insert(payload);
    if (error) {
      logSupabaseError("upsertFaq.insert", error, payload);
      return { ok: false, error: supabaseErrorMessage(error) };
    }
  }
  revalidatePublic();
  return { ok: true };
}

export async function deleteFaq(id: string) {
  const supabase = await ensureAuth();
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) {
    logSupabaseError("deleteFaq", error);
    throw new Error(supabaseErrorMessage(error));
  }
  revalidatePublic();
  return { ok: true };
}

export async function deleteMediaRecords(
  paths: string[],
  options?: { allowUsed?: boolean },
): Promise<
  | { ok: true; deleted: number }
  | { ok: false; error: string; blocked?: string[] }
> {
  const supabase = await ensureAuth();
  const unique = [...new Set(paths.map((p) => p.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { ok: false, error: "삭제할 파일을 선택해 주세요." };
  }

  if (!options?.allowUsed) {
    const blocked: string[] = [];
    const { data: works } = await supabase
      .from("work_cases")
      .select(
        "title, representative_image_path, gallery_image_paths, before_images, after_images, og_image_path",
      );
    const used = new Set<string>();
    for (const w of works || []) {
      if (w.representative_image_path) used.add(w.representative_image_path);
      if (w.og_image_path) used.add(w.og_image_path);
      for (const key of ["gallery_image_paths", "before_images", "after_images"] as const) {
        const arr = w[key];
        if (Array.isArray(arr)) for (const p of arr) used.add(p);
      }
    }
    const { data: services } = await supabase.from("services").select("image_path");
    for (const s of services || []) if (s.image_path) used.add(s.image_path as string);
    const { data: settings } = await supabase
      .from("site_settings")
      .select("hero_image_path, shop_image_path, og_image_path, homepage_config")
      .limit(1)
      .maybeSingle();
    if (settings) {
      if (settings.hero_image_path) used.add(settings.hero_image_path);
      if (settings.shop_image_path) used.add(settings.shop_image_path);
      if (settings.og_image_path) used.add(settings.og_image_path);
      const cfg = settings.homepage_config as { why_points?: { image_path?: string | null }[] } | null;
      for (const p of cfg?.why_points || []) {
        if (p.image_path) used.add(p.image_path);
      }
    }
    for (const path of unique) {
      if (used.has(path)) blocked.push(path);
    }
    if (blocked.length > 0) {
      return {
        ok: false,
        error: `사용 중인 이미지 ${blocked.length}장은 삭제할 수 없습니다. 사용처에서 먼저 제거하거나 교체해 주세요.`,
        blocked,
      };
    }
  }

  const { error: storageError } = await supabase.storage.from("images").remove(unique);
  if (storageError) {
    logSupabaseError("deleteMediaRecords.storage", storageError);
    return { ok: false, error: storageError.message || "스토리지 삭제에 실패했습니다." };
  }

  const { error } = await supabase.from("media").delete().in("path", unique);
  if (error) {
    logSupabaseError("deleteMediaRecords.db", error);
    return { ok: false, error: error.message || "미디어 기록 삭제에 실패했습니다." };
  }

  revalidatePath("/admin/media");
  return { ok: true, deleted: unique.length };
}

async function rewriteImagePathReferences(
  supabase: Awaited<ReturnType<typeof ensureAuth>>,
  oldPath: string,
  newPath: string,
) {
  const { data: works } = await supabase
    .from("work_cases")
    .select(
      "id, representative_image_path, gallery_image_paths, before_images, after_images, og_image_path",
    );

  for (const row of works || []) {
    const patch: Record<string, unknown> = {};
    if (row.representative_image_path === oldPath) {
      patch.representative_image_path = newPath;
    }
    if (row.og_image_path === oldPath) {
      patch.og_image_path = newPath;
    }
    for (const key of ["gallery_image_paths", "before_images", "after_images"] as const) {
      const arr = row[key];
      if (Array.isArray(arr) && arr.includes(oldPath)) {
        patch[key] = arr.map((p: string) => (p === oldPath ? newPath : p));
      }
    }
    if (Object.keys(patch).length > 0) {
      await supabase.from("work_cases").update(patch).eq("id", row.id);
    }
  }

  await supabase.from("services").update({ image_path: newPath }).eq("image_path", oldPath);
  await supabase
    .from("before_after")
    .update({ before_image_path: newPath })
    .eq("before_image_path", oldPath);
  await supabase
    .from("before_after")
    .update({ after_image_path: newPath })
    .eq("after_image_path", oldPath);

  const { data: settings } = await supabase
    .from("site_settings")
    .select("id, hero_image_path, shop_image_path, og_image_path")
    .limit(1)
    .maybeSingle();

  if (settings?.id) {
    const patch: Record<string, unknown> = {};
    if (settings.hero_image_path === oldPath) patch.hero_image_path = newPath;
    if (settings.shop_image_path === oldPath) patch.shop_image_path = newPath;
    if (settings.og_image_path === oldPath) patch.og_image_path = newPath;
    if (Object.keys(patch).length > 0) {
      await supabase.from("site_settings").update(patch).eq("id", settings.id);
    }
  }
}

export async function moveMediaRecords(
  paths: string[],
  targetFolder: string,
): Promise<{ ok: true; moved: number } | { ok: false; error: string }> {
  const supabase = await ensureAuth();
  const folder = targetFolder.trim().replace(/^\/+|\/+$/g, "");
  if (!folder) {
    return { ok: false, error: "이동할 폴더를 선택해 주세요." };
  }

  const unique = [...new Set(paths.map((p) => p.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { ok: false, error: "이동할 파일을 선택해 주세요." };
  }

  let moved = 0;
  for (const oldPath of unique) {
    const fileName = oldPath.split("/").pop() || oldPath;
    const newPath = `${folder}/${fileName}`;
    if (oldPath === newPath) {
      moved += 1;
      continue;
    }

    const { error: moveError } = await supabase.storage.from("images").move(oldPath, newPath);
    if (moveError) {
      logSupabaseError("moveMediaRecords.storage", moveError, { oldPath, newPath });
      return {
        ok: false,
        error: moveError.message || `"${fileName}" 이동에 실패했습니다.`,
      };
    }

    const { error: dbError } = await supabase
      .from("media")
      .update({ path: newPath, folder })
      .eq("path", oldPath);

    if (dbError) {
      // 스토리지는 이미 이동됨 — 경로 복구 시도 후 실패 반환
      await supabase.storage.from("images").move(newPath, oldPath);
      logSupabaseError("moveMediaRecords.db", dbError, { oldPath, newPath });
      return { ok: false, error: dbError.message || "미디어 경로 갱신에 실패했습니다." };
    }

    await rewriteImagePathReferences(supabase, oldPath, newPath);
    moved += 1;
  }

  revalidatePath("/admin/media");
  revalidatePublic();
  return { ok: true, moved };
}

/** 작업사례 대표사진 지정 (선택한 경로 1개) */
export async function setWorkCaseRepresentative(
  workId: string,
  imagePath: string,
): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const id = workId.trim();
  const path = imagePath.trim();
  if (!id || !path) {
    return { ok: false, error: "작업사례와 이미지를 확인해 주세요." };
  }

  const { error } = await supabase
    .from("work_cases")
    .update({ representative_image_path: path })
    .eq("id", id);

  if (error) {
    logSupabaseError("setWorkCaseRepresentative", error, { workId: id, path });
    return { ok: false, error: error.message || "대표사진 변경에 실패했습니다." };
  }

  revalidatePath("/admin/media");
  revalidatePath("/admin/works");
  revalidatePublic();
  return { ok: true };
}

/**
 * 선택한 이미지를 다른 작업사례로 이동:
 * - storage 폴더를 works/{id} 로 이동
 * - 대상 gallery_image_paths 에 추가
 * - 다른 작업사례 배열에서 제거
 */
export async function moveMediaToWorkCase(
  paths: string[],
  targetWorkId: string,
): Promise<{ ok: true; moved: number } | { ok: false; error: string }> {
  const supabase = await ensureAuth();
  const workId = targetWorkId.trim();
  if (!workId) return { ok: false, error: "대상 작업사례를 선택해 주세요." };

  const unique = [...new Set(paths.map((p) => p.trim()).filter(Boolean))];
  if (unique.length === 0) return { ok: false, error: "이동할 파일을 선택해 주세요." };

  const { data: target, error: targetError } = await supabase
    .from("work_cases")
    .select("id, gallery_image_paths")
    .eq("id", workId)
    .maybeSingle();

  if (targetError || !target) {
    return { ok: false, error: targetError?.message || "대상 작업사례를 찾을 수 없습니다." };
  }

  const folder = `works/${workId}`;
  const movedPaths: string[] = [];

  for (const oldPath of unique) {
    const fileName = oldPath.split("/").pop() || oldPath;
    const newPath = `${folder}/${fileName}`;

    if (oldPath !== newPath) {
      const { error: moveError } = await supabase.storage.from("images").move(oldPath, newPath);
      if (moveError) {
        logSupabaseError("moveMediaToWorkCase.storage", moveError, { oldPath, newPath });
        return { ok: false, error: moveError.message || "파일 이동에 실패했습니다." };
      }
      const { error: dbError } = await supabase
        .from("media")
        .update({ path: newPath, folder })
        .eq("path", oldPath);
      if (dbError) {
        await supabase.storage.from("images").move(newPath, oldPath);
        logSupabaseError("moveMediaToWorkCase.db", dbError, { oldPath, newPath });
        return { ok: false, error: dbError.message || "미디어 경로 갱신에 실패했습니다." };
      }
      await rewriteImagePathReferences(supabase, oldPath, newPath);
      movedPaths.push(newPath);
    } else {
      movedPaths.push(oldPath);
    }
  }

  // 다른 작업사례의 배열/대표에서 제거 후 대상 갤러리에 추가
  const { data: works } = await supabase
    .from("work_cases")
    .select(
      "id, representative_image_path, gallery_image_paths, before_images, after_images, og_image_path",
    );

  const pathSet = new Set(movedPaths);
  for (const row of works || []) {
    if (row.id === workId) continue;
    const patch: Record<string, unknown> = {};
    if (row.representative_image_path && pathSet.has(row.representative_image_path)) {
      patch.representative_image_path = null;
    }
    if (row.og_image_path && pathSet.has(row.og_image_path)) {
      patch.og_image_path = null;
    }
    for (const key of ["gallery_image_paths", "before_images", "after_images"] as const) {
      const arr = Array.isArray(row[key]) ? (row[key] as string[]) : [];
      const next = arr.filter((p) => !pathSet.has(p));
      if (next.length !== arr.length) patch[key] = next;
    }
    if (Object.keys(patch).length > 0) {
      await supabase.from("work_cases").update(patch).eq("id", row.id);
    }
  }

  const currentGallery = Array.isArray(target.gallery_image_paths)
    ? (target.gallery_image_paths as string[])
    : [];
  const merged = [...currentGallery];
  for (const p of movedPaths) {
    if (!merged.includes(p)) merged.push(p);
  }
  const { error: galleryError } = await supabase
    .from("work_cases")
    .update({ gallery_image_paths: merged })
    .eq("id", workId);

  if (galleryError) {
    logSupabaseError("moveMediaToWorkCase.gallery", galleryError);
    return { ok: false, error: galleryError.message || "갤러리 연결에 실패했습니다." };
  }

  revalidatePath("/admin/media");
  revalidatePath("/admin/works");
  revalidatePublic();
  return { ok: true, moved: movedPaths.length };
}

/** 작업사례 갤러리(본문 사진) 순서 변경 — gallery_image_paths만 갱신 */
export async function reorderWorkCaseGallery(
  workId: string,
  orderedPaths: string[],
): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const id = workId.trim();
  if (!id) return { ok: false, error: "작업사례를 확인해 주세요." };

  const paths = orderedPaths.map((p) => p.trim()).filter(Boolean);
  const { error } = await supabase
    .from("work_cases")
    .update({ gallery_image_paths: paths })
    .eq("id", id);

  if (error) {
    logSupabaseError("reorderWorkCaseGallery", error, { workId: id });
    return { ok: false, error: error.message || "사진 순서 저장에 실패했습니다." };
  }

  revalidatePath("/admin/media");
  revalidatePath(`/admin/works/${id}/edit`);
  revalidatePublic();
  return { ok: true };
}
