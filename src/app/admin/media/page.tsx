import { AdminShell } from "@/components/admin/AdminShell";
import { MediaAdmin } from "@/components/admin/MediaAdmin";
import {
  buildMediaUsageMap,
  buildWorkCaseMediaSummaries,
  type MediaUsageInfo,
  type WorkCaseMediaSummary,
} from "@/lib/media-usage";
import { parseHomepageConfig } from "@/lib/homepage";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

export default async function AdminMediaPage() {
  let media: MediaItem[] = [];
  let initialUsage: [string, MediaUsageInfo][] = [];
  let initialWorks: WorkCaseMediaSummary[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await tryCreateClient();
    if (supabase) {
      try {
        const [mediaRes, servicesRes, settingsRes, beforeAfterRes] = await Promise.all([
          supabase.from("media").select("*").order("created_at", { ascending: false }).limit(500),
          supabase.from("services").select("id, title, image_path"),
          supabase
            .from("site_settings")
            .select("hero_image_path, shop_image_path, og_image_path, homepage_config")
            .limit(1)
            .maybeSingle(),
          supabase.from("before_after").select("category, before_image_path, after_image_path"),
        ]);

        if (mediaRes.data) media = mediaRes.data as MediaItem[];

        const WORK_SELECT_FULL =
          "id, title, vehicle_brand, vehicle_model, service_category, status, is_published, updated_at, representative_image_path, gallery_image_paths, before_images, after_images, og_image_path, content_html, content_json";
        const WORK_SELECT_BASIC =
          "id, title, vehicle_brand, vehicle_model, service_category, status, is_published, updated_at, representative_image_path, gallery_image_paths, before_images, after_images, og_image_path";

        let worksRows: Parameters<typeof buildWorkCaseMediaSummaries>[0] = [];
        const worksFull = await supabase
          .from("work_cases")
          .select(WORK_SELECT_FULL)
          .order("updated_at", { ascending: false });
        if (!worksFull.error && worksFull.data) {
          worksRows = worksFull.data as typeof worksRows;
        } else {
          const worksBasic = await supabase
            .from("work_cases")
            .select(WORK_SELECT_BASIC)
            .order("created_at", { ascending: false });
          if (worksBasic.data) worksRows = worksBasic.data as typeof worksRows;
        }

        initialWorks = buildWorkCaseMediaSummaries(worksRows);

        const homepage = parseHomepageConfig(settingsRes.data?.homepage_config);
        const whyPaths = (homepage.why_points || []).map((p, i) => ({
          path: p.image_path,
          label: `홈페이지 전문성 0${i + 1}`,
        }));

        const usageMap = buildMediaUsageMap({
          works: worksRows,
          servicePaths: (servicesRes.data || []).map((s) => ({
            path: s.image_path as string | null,
            label: `서비스 · ${s.title}`,
          })),
          settingPaths: [
            ...(settingsRes.data
              ? [
                  { path: settingsRes.data.hero_image_path, label: "홈페이지 Hero" },
                  { path: settingsRes.data.shop_image_path, label: "작업장 사진" },
                  { path: settingsRes.data.og_image_path, label: "SEO · OG" },
                ]
              : []),
            ...whyPaths,
          ],
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
      } catch {
        // 사용처 분석 실패해도 미디어 목록은 표시
        const { data } = await supabase
          .from("media")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        if (data) media = data as MediaItem[];
      }
    }
  }

  return (
    <AdminShell
      title="사진 관리"
      description="작업사례별로 사진을 찾고, 사용처를 확인한 뒤 관리합니다."
    >
      <MediaAdmin
        initialMedia={media}
        initialUsage={initialUsage}
        initialWorks={initialWorks}
      />
    </AdminShell>
  );
}
