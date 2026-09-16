import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { WorksAdminList } from "@/components/admin/WorksAdminList";
import { DEFAULT_WORKS } from "@/lib/defaults";
import { mapWork } from "@/lib/data/content";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { WorkCase } from "@/lib/types";

export default async function AdminWorksPage() {
  let works: WorkCase[] = DEFAULT_WORKS;
  if (isSupabaseConfigured()) {
    const supabase = await tryCreateClient();
    if (supabase) {
      const { data } = await supabase
        .from("work_cases")
        .select("*")
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false });
      if (data) {
        works = (data as Record<string, unknown>[]).map(mapWork);
      }
    }
  }

  return (
    <AdminShell
      title="작업사례"
      description="검색·필터·일괄 처리가 가능한 CMS로 작업사례를 관리합니다."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-5">
        <p className="text-sm text-muted">블로그 정비 기록 10편을 홈페이지용 초안으로 준비했습니다.</p>
        <Link href="/admin/blog-imports" className="text-sm font-bold text-navy underline underline-offset-4">블로그 작업사례 가져오기 →</Link>
      </div>
      <WorksAdminList initialWorks={works} />
    </AdminShell>
  );
}
