import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { WorkCaseForm } from "@/components/admin/WorkCaseForm";
import { getAllServiceOptions } from "@/lib/data/content";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { WorkCase } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminWorkEditPage({ params }: Props) {
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
    <AdminShell title="작업사례 수정" description={data.title}>
      <WorkCaseForm initial={data as WorkCase} services={services} />
    </AdminShell>
  );
}
