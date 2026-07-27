import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { WorkCaseEditor } from "@/components/admin/WorkCaseEditor";
import { getAllServiceOptions, mapWork } from "@/lib/data/content";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminWorkEditRoutePage({ params }: Props) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return (
      <AdminShell title="작업사례 수정">
        <p>Supabase 설정이 필요합니다.</p>
      </AdminShell>
    );
  }

  const supabase = await tryCreateClient();
  if (!supabase) notFound();

  const [{ data }, services] = await Promise.all([
    supabase.from("work_cases").select("*").eq("id", id).maybeSingle(),
    getAllServiceOptions(),
  ]);

  if (!data) notFound();

  return (
    <AdminShell title="작업사례 수정" description={String(data.title || "")}>
      <WorkCaseEditor
        initial={mapWork(data as Record<string, unknown>)}
        services={services}
      />
    </AdminShell>
  );
}
