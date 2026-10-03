"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import revisions from "@/lib/data/cover-revisions.json";
import { naverPostKey } from "@/lib/works/blog-imports";

/** Fixed, source-checked vehicle photos; never publishes or edits article content. */
export async function applyCoverRevisions() {
  const { user, supabase } = await requireAdmin();
  if (!user || !supabase) return { error: "관리자 로그인이 필요합니다.", results: [] };
  const results: { title: string; message: string }[] = [];
  for (const revision of revisions) {
    const { data: row, error } = await supabase.from("work_cases")
      .select("id,slug,naver_blog_url,representative_image_path,status,is_published,deleted_at")
      .eq("slug", revision.slug).single();
    if (error || !row || row.deleted_at || row.status !== "published" || !row.is_published || naverPostKey(row.naver_blog_url) !== naverPostKey(revision.sourceUrl)) {
      results.push({ title: revision.title, message: "공개된 원본을 확인하지 못해 유지했습니다." });
      continue;
    }
    if (row.representative_image_path === revision.after) {
      results.push({ title: revision.title, message: "이미 차량 사진이 적용되어 있습니다." });
      continue;
    }
    if (row.representative_image_path !== revision.before) {
      results.push({ title: revision.title, message: "대표사진이 이후 변경되어 유지했습니다." });
      continue;
    }
    const saved = await supabase.from("work_cases")
      .update({ representative_image_path: revision.after })
      .eq("id", row.id).eq("representative_image_path", revision.before)
      .eq("naver_blog_url", row.naver_blog_url).eq("status", "published")
      .eq("is_published", true).is("deleted_at", null).select("id").maybeSingle();
    results.push({ title: revision.title, message: saved.error || !saved.data ? "저장되지 않아 기존 사진을 유지했습니다." : "차량 대표사진 교체 완료" });
    if (saved.data) revalidatePath(`/works/${row.slug}`);
  }
  for (const route of ["/", "/works", "/admin/works", "/admin/cover-revisions", "/sitemap.xml", "/rss.xml"]) revalidatePath(route);
  return { error: "", results };
}
