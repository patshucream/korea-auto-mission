import { AdminShell } from "@/components/admin/AdminShell";
import { MediaAdmin } from "@/components/admin/MediaAdmin";
import {
  buildMediaUsageMap,
  buildWorkCaseMediaSummaries,
  type MediaUsageInfo,
  type WorkCaseMediaSummary,
} from "@/lib/media-usage";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

const WORK_SELECT_FULL =
  "id, title, vehicle_brand, vehicle_model, service_category, representative_image_path, gallery_image_paths, before_images, after_images, og_image_path, content_html, content_json";

const WORK_SELECT_BASIC =
  "id, title, vehicle_brand, vehicle_model, service_category, representative_image_path, gallery_image_paths, before_images, after_images, og_image_path";

export default async function AdminMediaPage() {
  let media: MediaItem[] = [];
  let initialUsage: [string, MediaUsageInfo][] = [];
  let initialWorks: WorkCaseMediaSummary[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await tryCreateClient();
    if (supabase) {
      const [mediaRes, servicesRes, settingsRes, beforeAfterRes] = await Promise.all([
        supabase.from("media").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("services").select("id, title, image_path"),
        supabase
          .from("site_settings")
          .select("hero_image_path, shop_image_path, og_image_path")
          .limit(1)
          .maybeSingle(),
        supabase.from("before_after").select("category, before_image_path, after_image_path"),
      ]);

      if (mediaRes.data) media = mediaRes.data as MediaItem[];

      let worksRows: Parameters<typeof buildWorkCaseMediaSummaries>[0] = [];
      const worksFull = await supabase
        .from("work_cases")
        .select(WORK_SELECT_FULL)
        .order("created_at", { ascending: false });

      if (!worksFull.error && worksFull.data) {
        worksRows = worksFull.data as Parameters<typeof buildWorkCaseMediaSummaries>[0];
      } else {
        // content_html/json 미적용 환경 대비 — 기본 컬럼만 재조회
        const worksBasic = await supabase
          .from("work_cases")
          .select(WORK_SELECT_BASIC)
          .order("created_at", { ascending: false });
        if (worksBasic.data) {
          worksRows = worksBasic.data as Parameters<typeof buildWorkCaseMediaSummaries>[0];
        }
      }

      initialWorks = buildWorkCaseMediaSummaries(worksRows);

      const usageMap = buildMediaUsageMap({
        works: worksRows,
        servicePaths: (servicesRes.data || []).map((s) => ({
          path: s.image_path as string | null,
          label: `서비스 · ${s.title}`,
        })),
        settingPaths: settingsRes.data
          ? [
              { path: settingsRes.data.hero_image_path, label: "홈 · 히어로" },
              { path: settingsRes.data.shop_image_path, label: "홈 · 매장" },
              { path: settingsRes.data.og_image_path, label: "SEO · OG" },
            ]
          : [],
        beforeAfterPaths: (beforeAfterRes.data || []).flatMap((row) => [
          {
            path: row.before_image_path as string | null,
            label: `전후 · ${row.category} 전`,
          },
          {
            path: row.after_image_path as string | null,
            label: `전후 · ${row.category} 후`,
          },
        ]),
      });

      initialUsage = [...usageMap.entries()];
    }
  }

  return (
    <AdminShell
      title="사진 관리"
      description="작업사례별 그룹·필터·일괄 관리가 가능한 미디어 라이브러리입니다."
    >
      <MediaAdmin
        initialMedia={media}
        initialUsage={initialUsage}
        initialWorks={initialWorks}
      />
    </AdminShell>
  );
}
