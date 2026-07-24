import { AdminShell } from "@/components/admin/AdminShell";
import { GeneralSettingsForm } from "@/components/admin/GeneralSettingsForm";
import { getSiteSettings } from "@/lib/data/content";
import { tryCreateClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { isSupabaseConfigured } from "@/lib/utils";

export default async function AdminGeneralPage() {
  let settings = DEFAULT_SETTINGS;
  if (isSupabaseConfigured()) {
    const supabase = await tryCreateClient();
    if (supabase) {
      const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      if (data) settings = { ...DEFAULT_SETTINGS, ...data, process_steps: data.process_steps || DEFAULT_SETTINGS.process_steps };
    } else {
      settings = await getSiteSettings();
    }
  }

  return (
    <AdminShell title="기본 설정" description="연락처, 히어로, 주요 수치를 관리합니다.">
      <GeneralSettingsForm settings={settings} />
    </AdminShell>
  );
}
