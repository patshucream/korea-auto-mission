"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, slugify } from "@/lib/utils";
import type { ProcessStep } from "@/lib/types";

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

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/works");
  revalidatePath("/admin");
}

export async function saveSiteSettings(payload: Record<string, unknown>) {
  const supabase = await ensureAuth();
  const { data: existing } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("site_settings")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("site_settings").insert(payload);
    if (error) throw new Error(error.message);
  }
  revalidatePublic();
  return { ok: true };
}

export async function saveProcessSteps(steps: ProcessStep[]) {
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
}) {
  const supabase = await ensureAuth();
  const title = input.title.trim();
  if (!title) {
    throw new Error("서비스명을 입력해 주세요.");
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
    const { error } = await supabase
      .from("services")
      .update(payload)
      .eq("id", input.id);
    if (error) throw new Error(error.message);

    // 연결된 작업사례의 표시용 서비스명 동기화 (연결은 service_id로 유지)
    const { error: syncError } = await supabase
      .from("work_cases")
      .update({ service_category: title })
      .eq("service_id", input.id);
    if (syncError) {
      // 칼럼/권한 문제로 실패해도 서비스 저장은 유지
      console.error("service_category sync failed:", syncError.message);
    }
  } else {
    const { error } = await supabase.from("services").insert(payload);
    if (error) throw new Error(error.message);
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
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function deleteService(id: string) {
  const supabase = await ensureAuth();

  const { count } = await supabase
    .from("work_cases")
    .select("id", { count: "exact", head: true })
    .eq("service_id", id);

  // 작업사례는 삭제하지 않고 연결만 해제 (ON DELETE SET NULL 보완)
  await supabase
    .from("work_cases")
    .update({ service_id: null })
    .eq("service_id", id);

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
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
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw new Error(firstError.message);
  revalidatePublic();
  return { ok: true };
}

export async function upsertWorkCase(input: Record<string, unknown> & { id?: string }) {
  const supabase = await ensureAuth();
  const payload: Record<string, unknown> = {
    ...input,
    slug:
      (typeof input.slug === "string" && input.slug.trim()) ||
      slugify(String(input.title || `work-${Date.now()}`)),
    gallery_image_paths: (input.gallery_image_paths as string[]) || [],
  };

  if (payload.is_published && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }

  if (input.id) {
    const { id, ...rest } = payload;
    void id;
    const { error } = await supabase.from("work_cases").update(rest).eq("id", input.id);
    if (error) throw new Error(error.message);
    revalidatePublic();
    revalidatePath(`/works/${String(rest.slug)}`);
    return { ok: true, id: input.id, slug: String(rest.slug) };
  }

  const { data, error } = await supabase
    .from("work_cases")
    .insert(payload)
    .select("id, slug")
    .single();
  if (error) throw new Error(error.message);
  revalidatePublic();
  return { ok: true, id: data.id as string, slug: data.slug as string };
}

export async function duplicateWorkCase(id: string) {
  const supabase = await ensureAuth();
  const { data, error } = await supabase
    .from("work_cases")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error(error?.message || "작업사례를 찾을 수 없습니다.");

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
  if (insertError) throw new Error(insertError.message);
  revalidatePublic();
  return { ok: true, id: created.id as string };
}

export async function deleteWorkCase(id: string) {
  const supabase = await ensureAuth();
  const { error } = await supabase.from("work_cases").delete().eq("id", id);
  if (error) throw new Error(error.message);
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
}) {
  const supabase = await ensureAuth();
  const { error } = await supabase
    .from("before_after")
    .update({
      title: input.title,
      description: input.description,
      before_image_path: input.before_image_path,
      after_image_path: input.after_image_path,
      is_published: input.is_published,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePublic();
  return { ok: true };
}

export async function upsertReview(input: {
  id?: string;
  customer_name: string;
  vehicle_info: string;
  content: string;
  rating: number;
  display_order: number;
  is_published: boolean;
  is_sample?: boolean;
}) {
  const supabase = await ensureAuth();
  if (input.id) {
    const { error } = await supabase.from("reviews").update(input).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("reviews").insert({
      ...input,
      is_sample: input.is_sample ?? false,
    });
    if (error) throw new Error(error.message);
  }
  revalidatePublic();
  return { ok: true };
}

export async function deleteReview(id: string) {
  const supabase = await ensureAuth();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePublic();
  return { ok: true };
}

export async function upsertFaq(input: {
  id?: string;
  question: string;
  answer: string;
  display_order: number;
  is_published: boolean;
}) {
  const supabase = await ensureAuth();
  if (input.id) {
    const { error } = await supabase.from("faqs").update(input).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("faqs").insert(input);
    if (error) throw new Error(error.message);
  }
  revalidatePublic();
  return { ok: true };
}

export async function deleteFaq(id: string) {
  const supabase = await ensureAuth();
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePublic();
  return { ok: true };
}

export async function deleteMediaRecord(path: string) {
  const supabase = await ensureAuth();
  const { error: storageError } = await supabase.storage.from("images").remove([path]);
  if (storageError) throw new Error(storageError.message);
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
  const { error } = await supabase.from("media").upsert(input, { onConflict: "path" });
  if (error) throw new Error(error.message);
  return { ok: true };
}
