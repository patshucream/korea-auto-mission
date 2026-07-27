import { AdminShell } from "@/components/admin/AdminShell";
import { HomepageSettingsForm } from "@/components/admin/HomepageSettingsForm";
import {
  getAllServiceOptions,
  getHomepageData,
} from "@/lib/data/content";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export default async function AdminHomepagePage() {
  const [data, services] = await Promise.all([
    getHomepageData(),
    getAllServiceOptions(),
  ]);

  let workOptions = data.works.map((w) => ({ id: w.id, title: w.title }));
  if (isSupabaseConfigured()) {
    const supabase = await tryCreateClient();
    if (supabase) {
      const { data: rows } = await supabase
        .from("work_cases")
        .select("id, title")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(40);
      if (rows?.length) {
        workOptions = rows.map((w) => ({
          id: String(w.id),
          title: String(w.title),
        }));
      }
    }
  }

  return (
    <AdminShell
      title="홈페이지 콘텐츠"
      description="히어로, 섹션 표시, 메인 노출 항목을 관리합니다."
    >
      <HomepageSettingsForm
        settings={data.settings}
        serviceOptions={services}
        workOptions={workOptions}
      />
    </AdminShell>
  );
}
