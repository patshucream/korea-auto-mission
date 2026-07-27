import { AdminShell } from "@/components/admin/AdminShell";
import { HomepageSettingsForm } from "@/components/admin/HomepageSettingsForm";
import {
  getAllServiceOptions,
  getHomepageData,
} from "@/lib/data/content";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

export default async function AdminHomepagePage() {
  const [data, services] = await Promise.all([
    getHomepageData(),
    getAllServiceOptions(),
  ]);

  let workOptions = data.works.map((w) => ({ id: w.id, title: w.title }));
  let mediaItems: MediaItem[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await tryCreateClient();
    if (supabase) {
      const [{ data: rows }, { data: mediaRows }] = await Promise.all([
        supabase
          .from("work_cases")
          .select("id, title")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(40),
        supabase
          .from("media")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(300),
      ]);
      if (rows?.length) {
        workOptions = rows.map((w) => ({
          id: String(w.id),
          title: String(w.title),
        }));
      }
      if (mediaRows) mediaItems = mediaRows as MediaItem[];
    }
  }

  return (
    <AdminShell
      title="홈페이지 콘텐츠"
      description="히어로, 전문성 이미지, 섹션 표시를 관리합니다."
    >
      <HomepageSettingsForm
        settings={data.settings}
        serviceOptions={services}
        workOptions={workOptions}
        mediaItems={mediaItems}
      />
    </AdminShell>
  );
}
