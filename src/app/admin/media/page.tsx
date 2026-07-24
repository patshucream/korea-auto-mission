import { AdminShell } from "@/components/admin/AdminShell";
import { MediaAdmin } from "@/components/admin/MediaAdmin";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

export default async function AdminMediaPage() {
  let media: MediaItem[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await tryCreateClient();
    if (supabase) {
      const { data } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) media = data as MediaItem[];
    }
  }

  return (
    <AdminShell title="사진 관리" description="업로드된 이미지를 확인하고 삭제합니다.">
      <MediaAdmin initialMedia={media} />
    </AdminShell>
  );
}
