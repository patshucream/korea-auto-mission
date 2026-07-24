import { AdminShell } from "@/components/admin/AdminShell";
import { WorksAdminList } from "@/components/admin/WorksAdminList";
import { DEFAULT_WORKS } from "@/lib/defaults";
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
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (data) works = data as WorkCase[];
    }
  }

  return (
    <AdminShell title="작업사례" description="건수 제한 없이 작업사례를 관리합니다.">
      <WorksAdminList initialWorks={works} />
    </AdminShell>
  );
}
