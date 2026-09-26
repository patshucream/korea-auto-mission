"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getJournalRevisions, matchesRevisionFields } from "@/lib/works/journal-revisions";

/** Reviewable, fixed revisions only; never overwrites a subsequently edited case. */
export async function applyJournalRevisions() {
  const {user,supabase}=await requireAdmin();
  if(!user||!supabase)return {error:"관리자 로그인이 필요합니다.",results:[]};
  const results:{title:string;message:string}[]=[];
  for(const revision of getJournalRevisions()) {
    const {data:row,error}=await supabase.from("work_cases").select("*").eq("id",revision.id).single();
    if(error||!row||row.naver_blog_url!==revision.sourceUrl||row.deleted_at||row.status!=="published"||!row.is_published) {
      results.push({title:revision.title,message:"공개된 원본을 확인하지 못해 변경하지 않았습니다."}); continue;
    }
    if(matchesRevisionFields(row,revision.after)) {
      results.push({title:revision.title,message:"이미 상세 설명을 반영했습니다."});continue;
    }
    if(!matchesRevisionFields(row,revision.before)) {
      results.push({title:revision.title,message:"이후 편집된 내용이 있어 유지했습니다. 개별 확인이 필요합니다."});continue;
    }
    let update=supabase.from("work_cases").update(revision.after).eq("id",revision.id).eq("naver_blog_url",revision.sourceUrl).eq("status","published").eq("is_published",true).is("deleted_at",null);
    update=row.updated_at?update.eq("updated_at",row.updated_at):update.is("updated_at",null);
    const saved=await update.select("id").maybeSingle();
    results.push({title:revision.title,message:saved.error||!saved.data?"저장되지 않았습니다. 기존 글을 유지했습니다.":"상세 설명과 사진 캡션 반영 완료"});
    if(saved.data)revalidatePath(`/works/${row.slug}`);
  }
  for(const path of ["/","/works","/admin/works","/admin/journal-revisions","/sitemap.xml","/rss.xml"])revalidatePath(path);
  return {results,error:""};
}
