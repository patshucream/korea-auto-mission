import { AdminShell } from "@/components/admin/AdminShell";
import { BeforeAfterAdmin } from "@/components/admin/BeforeAfterAdmin";
import { DEFAULT_BEFORE_AFTER } from "@/lib/defaults";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { BeforeAfter } from "@/lib/types";

export default async function AdminBeforeAfterPage() {
  let items: BeforeAfter[] = DEFAULT_BEFORE_AFTER;
  if (isSupabaseConfigured()) {
    const supabase = await tryCreateClient();
    if (supabase) {
      const { data } = await supabase.from("before_after").select("*").order("category");
      if (data?.length) items = data as BeforeAfter[];
    }
  }

  return (
    <AdminShell title="작업 전후" description="인젝터·흡기 클리닝 전후만 관리합니다.">
      <BeforeAfterAdmin items={items} />
    </AdminShell>
  );
}
