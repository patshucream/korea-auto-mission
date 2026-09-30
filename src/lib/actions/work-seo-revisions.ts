"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getWorkSeoManifest, runSeoRevisions, type SeoCurrentRow, type SeoReviewResult } from "@/lib/works/seo-revisions";

const columns = "id,slug,naver_blog_url,title,seo_title,seo_description,status,is_published,deleted_at,published_at,updated_at,manufacturer,vehicle_brand,vehicle_model,symptoms,diagnosis,repair_process,work_summary";

async function execute(mode: "preview" | "apply", selectedSlugs: unknown) {
  const { user, supabase } = await requireAdmin();
  if (!user || !supabase) return { error: "관리자 로그인이 필요합니다.", results: [] as SeoReviewResult[] };
  const manifest = getWorkSeoManifest();
  const known = new Set(manifest.entries.map(entry => entry.slug));
  if (!Array.isArray(selectedSlugs) || selectedSlugs.length > manifest.entries.length || selectedSlugs.some(slug => typeof slug !== "string" || !known.has(slug))) {
    return { error: "검토 목록에 있는 사례만 선택해 주세요.", results: [] as SeoReviewResult[] };
  }
  const results = await runSeoRevisions(manifest.entries, mode, selectedSlugs, {
    async readBySlug(slug: string) {
      const { data, error } = await supabase.from("work_cases").select(columns).eq("slug", slug).maybeSingle();
      if (error) throw new Error("read_failed");
      return data as SeoCurrentRow | null;
    },
    async saveDescription(row: SeoCurrentRow, description: string) {
      // The database ID comes from the fresh slug lookup, not client input or the snapshot.
      let update = supabase.from("work_cases").update({ seo_description: description })
        .eq("id", String(row.id)).eq("slug", String(row.slug)).eq("naver_blog_url", String(row.naver_blog_url))
        .eq("status", "published").eq("is_published", true).is("deleted_at", null).eq("updated_at", String(row.updated_at));
      update = row.seo_description == null ? update.is("seo_description", null) : update.eq("seo_description", String(row.seo_description));
      const { data, error } = await update.select("id").maybeSingle();
      if (error) throw new Error("write_failed");
      return Boolean(data);
    },
  }, manifest.applyEnabled);
  if (mode === "apply") {
    const saved = results.filter(result => result.status === "saved");
    for (const result of saved) revalidatePath(`/works/${result.slug}`);
    if (saved.length) for (const path of ["/works", "/rss.xml", "/admin/work-seo-revisions"]) revalidatePath(path);
  }
  return { error: "", results };
}

export async function previewWorkSeoRevisions() { return execute("preview", []); }
export async function applyWorkSeoRevisions(selectedSlugs: string[]) { return execute("apply", selectedSlugs); }
