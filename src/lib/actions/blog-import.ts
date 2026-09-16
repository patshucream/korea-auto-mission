"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getPreparedBlogImports, naverPostKey } from "@/lib/works/blog-imports";

export type BlogImportResult = {
  postId: string;
  title: string;
  status: "saved" | "skipped" | "error";
  id?: string;
  message: string;
};

async function importPreparedBlogCases(status: "draft" | "published"): Promise<{ results: BlogImportResult[]; error?: string }> {
  const { user, supabase } = await requireAdmin();
  if (!user || !supabase) return { results: [], error: "관리자 로그인이 필요합니다." };
  const { data: services, error: serviceError } = await supabase.from("services").select("id, title");
  if (serviceError || !services) return { results: [], error: "정비 서비스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };

  const results: BlogImportResult[] = [];
  for (const { source, work } of getPreparedBlogImports()) {
    const result = { postId: source.postId, title: work.title };
    const { data: existing, error: lookupError } = await supabase
      .from("work_cases")
      .select("id, slug, naver_blog_url, published_at, general_tags")
      .or(`id.eq.${work.id},slug.eq.${work.slug},naver_blog_url.like.%${source.postId}%`);
    if (lookupError) {
      results.push({ ...result, status: "error", message: "기존 글을 확인하지 못해 저장하지 않았습니다." });
      continue;
    }
    const match = existing?.find((row) => row.id === work.id || row.slug === work.slug || naverPostKey(row.naver_blog_url) === naverPostKey(source.url));
    if (match && status === "draft") {
      results.push({ ...result, status: "skipped", id: match.id, message: "이미 등록된 글입니다. 기존 내용을 유지했습니다." });
      continue;
    }
    const service = services.find((item) => item.id === work.service_id) || services.find((item) => item.title === work.service_category);
    if (!service) {
      results.push({ ...result, status: "error", message: `연결할 서비스가 없습니다: ${work.service_category}` });
      continue;
    }
    const publication = {
      status,
      is_published: status === "published",
      published_at: status === "published" ? (match?.published_at || source.publishedAt) : null,
      deleted_at: null,
      noindex: false,
    };
    // Re-running preserves edited titles, images and bodies. Only classification/publication changes.
    const response = match
      ? await supabase.from("work_cases").update({
          ...publication,
          general_tags: [...new Set([...(Array.isArray(match.general_tags) ? match.general_tags : []), ...work.general_tags])],
        }).eq("id", match.id).select("id").single()
      : await supabase.from("work_cases").insert({
          ...work,
          service_id: service.id,
          service_category: service.title,
          created_at: new Date().toISOString(),
          ...publication,
        }).select("id").single();
    if (response.error || !response.data) {
      console.error("[blog-import] save failed", { postId: source.postId, code: response.error?.code });
      results.push({ ...result, status: "error", message: response.error?.code === "23505" ? "같은 글이 이미 저장됐을 수 있습니다. 다시 실행하면 중복 여부를 확인합니다." : "저장에 실패했습니다. 관리자 권한과 작업사례 데이터 구성을 확인해 주세요." });
    } else {
      results.push({ ...result, status: "saved", id: response.data.id, message: status === "published" ? "공개 완료" : "임시저장 완료" });
      revalidatePath(`/works/${match?.slug || work.slug}`);
    }
  }
  for (const route of ["/", "/works", "/admin/works", "/admin/blog-imports", "/sitemap.xml", "/rss.xml"]) revalidatePath(route);
  return { results };
}

export async function savePreparedBlogDrafts() {
  return importPreparedBlogCases("draft");
}

/** Explicit admin publication action, restricted to the prepared, source-attributed batch. */
export async function publishPreparedBlogCases() {
  return importPreparedBlogCases("published");
}
