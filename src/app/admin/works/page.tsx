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
      <WorksAdminList initialWorks={works} />
    </AdminShell>
  );
}
