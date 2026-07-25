"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, slugify } from "@/lib/utils";
import type { ProcessStep } from "@/lib/types";

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

  // 003 마이그레이션 미적용 등으로 신규 영업시간 칼럼이 없으면 제외 후 재시도
  if (error && isMissingColumnError(error)) {
    logSupabaseError("saveSiteSettings.missingColumnRetry", error, clean);
    const fallback: Record<string, unknown> = { ...clean };
    for (const key of OPTIONAL_HOUR_KEYS) {
      delete fallback[key];
    }
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

export async function saveProcessSteps(steps: ProcessStep[]): Promise<SaveResult> {
  return saveSiteSettings({ process_steps: steps });
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
    "vehicle_brand",
    "vehicle_model",
    "model_year",
    "service_id",
    "service_category",
    "symptoms",
    "diagnosis",
    "work_summary",
    "detailed_content",
    "representative_image_path",
    "gallery_image_paths",
    "naver_blog_url",
    "published_at",
    "is_published",
    "is_featured",
    "display_order",
    "seo_title",
    "seo_description",
  ] as const;

  const clean: Record<string, unknown> = {};
  for (const key of allowed) {
    if (!(key in input)) continue;
    const value = input[key];
    if (value === undefined) continue;
    clean[key] = value;
  }

  if (!Array.isArray(clean.gallery_image_paths)) {
    clean.gallery_image_paths = [];
  }

  if (clean.service_id === "") {
    clean.service_id = null;
  }

  return clean;
}

export async function upsertWorkCase(
  input: Record<string, unknown> & { id?: string },
): Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }> {
  const supabase = await ensureAuth();
  const payload = cleanWorkCasePayload({
    ...input,
    slug:
      (typeof input.slug === "string" && input.slug.trim()) ||
      slugify(String(input.title || `work-${Date.now()}`)),
  });

  if (payload.is_published && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }

  if (input.id) {
    let { error } = await supabase.from("work_cases").update(payload).eq("id", input.id);

    if (error && isMissingColumnError(error) && /service_id/i.test(error.message ?? "")) {
      logSupabaseError("upsertWorkCase.serviceIdFallback", error, payload);
      const { service_id: _serviceId, ...withoutServiceId } = payload;
      void _serviceId;
      const retry = await supabase
        .from("work_cases")
        .update(withoutServiceId)
        .eq("id", input.id);
      error = retry.error;
    }

    if (error) {
      logSupabaseError("upsertWorkCase.update", error, payload);
      return { ok: false, error: supabaseErrorMessage(error) };
    }
    revalidatePublic();
    revalidatePath(`/works/${String(payload.slug)}`);
    return { ok: true, id: input.id, slug: String(payload.slug) };
  }

  let { data, error } = await supabase
    .from("work_cases")
    .insert(payload)
    .select("id, slug")
    .single();

  if (error && isMissingColumnError(error) && /service_id/i.test(error.message ?? "")) {
    logSupabaseError("upsertWorkCase.insertServiceIdFallback", error, payload);
    const { service_id: _serviceId, ...withoutServiceId } = payload;
    void _serviceId;
    const retry = await supabase
      .from("work_cases")
      .insert(withoutServiceId)
      .select("id, slug")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    logSupabaseError("upsertWorkCase.insert", error ?? { message: "no data" }, payload);
    return { ok: false, error: supabaseErrorMessage(error ?? {}, "작업사례 저장에 실패했습니다.") };
  }

  revalidatePublic();
  return { ok: true, id: data.id as string, slug: data.slug as string };
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

export async function deleteWorkCase(id: string) {
  const supabase = await ensureAuth();
  const { error } = await supabase.from("work_cases").delete().eq("id", id);
  if (error) {
    logSupabaseError("deleteWorkCase", error);
    throw new Error(supabaseErrorMessage(error));
  }
  revalidatePublic();
  return { ok: true };
}

export async function reorderWorkCases(orderedIds: string[]) {
  const supabase = await ensureAuth();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("work_cases").update({ display_order: index + 1 }).eq("id", id),
    ),
  );
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

export async function upsertReview(input: {
  id?: string;
  author_name?: string;
  customer_name?: string;
  vehicle_name?: string | null;
  vehicle_info?: string;
  content: string;
  rating: number;
  display_order?: number;
  status?: "pending" | "approved" | "hidden" | "rejected";
  is_published?: boolean;
  is_sample?: boolean;
  admin_reply?: string | null;
}): Promise<SaveResult> {
  const supabase = await ensureAuth();
  const author =
    (input.author_name ?? input.customer_name ?? "").trim() || "고객";
  const vehicle = (input.vehicle_name ?? input.vehicle_info ?? "").trim();
  const status =
    input.status ??
    (input.is_published ? "approved" : "pending");

  const payload: Record<string, unknown> = {
    author_name: author,
    customer_name: author,
    vehicle_name: vehicle || null,
    vehicle_info: vehicle,
    content: input.content ?? "",
    rating: input.rating,
    display_order: input.display_order ?? 0,
    status,
    is_published: status === "approved",
    is_sample: input.is_sample ?? false,
    admin_reply: input.admin_reply ?? null,
  };
  if (status === "approved") {
    payload.approved_at = new Date().toISOString();
  }

  if (input.id) {
    let { error } = await supabase.from("reviews").update(payload).eq("id", input.id);
    if (error && isMissingColumnError(error)) {
      logSupabaseError("upsertReview.legacyUpdate", error, payload);
      const legacy = {
        customer_name: author,
        vehicle_info: vehicle,
        content: payload.content,
        rating: payload.rating,
        display_order: payload.display_order,
        is_published: status === "approved",
        is_sample: payload.is_sample,
      };
      const retry = await supabase.from("reviews").update(legacy).eq("id", input.id);
      error = retry.error;
    }
    if (error) {
      logSupabaseError("upsertReview.update", error, payload);
      return { ok: false, error: "리뷰 저장에 실패했습니다." };
    }
  } else {
    let { error } = await supabase.from("reviews").insert(payload);
    if (error && isMissingColumnError(error)) {
      logSupabaseError("upsertReview.legacyInsert", error, payload);
      const legacy = {
        customer_name: author,
        vehicle_info: vehicle,
        content: payload.content,
        rating: payload.rating,
        display_order: payload.display_order,
        is_published: status === "approved",
        is_sample: payload.is_sample,
      };
      const retry = await supabase.from("reviews").insert(legacy);
      error = retry.error;
    }
    if (error) {
      logSupabaseError("upsertReview.insert", error, payload);
      return { ok: false, error: "리뷰 저장에 실패했습니다." };
    }
  }
  revalidateReviews();
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
  let { error } = await supabase
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

export async function deleteReviews(ids: string[]): Promise<SaveResult> {
  if (!ids.length) return { ok: false, error: "선택된 리뷰가 없습니다." };
  const supabase = await ensureAuth();
  const { error } = await supabase.from("reviews").delete().in("id", ids);
  if (error) {
    logSupabaseError("deleteReviews", error);
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

export async function deleteMediaRecord(path: string) {
  const supabase = await ensureAuth();
  const { error: storageError } = await supabase.storage.from("images").remove([path]);
  if (storageError) {
    logSupabaseError("deleteMediaRecord.storage", storageError);
    throw new Error(supabaseErrorMessage(storageError));
  }
  await supabase.from("media").delete().eq("path", path);
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function registerMediaPath(input: {
  path: string;
  folder: string;
  file_name: string;
  mime_type?: string;
  size_bytes?: number;
  alt_text?: string;
}) {
  const supabase = await ensureAuth();
  const payload = {
    path: input.path,
    folder: input.folder,
    file_name: input.file_name,
    mime_type: input.mime_type ?? null,
    size_bytes: input.size_bytes ?? null,
    alt_text: input.alt_text ?? "",
  };
  const { error } = await supabase.from("media").upsert(payload, { onConflict: "path" });
  if (error) {
    logSupabaseError("registerMediaPath", error, payload);
    throw new Error(supabaseErrorMessage(error));
  }
  return { ok: true };
}
