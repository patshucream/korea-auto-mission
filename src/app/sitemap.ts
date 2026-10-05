import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL, isSupabaseConfigured } from "@/lib/utils";
import { dieselGuides, dieselGuidePath } from "@/lib/diesel-guides";
import { getPublicImageUrl } from "@/lib/media";
import { isIndexableWork } from "@/lib/search-pages";

// Reflect CMS publication and deletion without requiring another deployment.
export const dynamic = "force-dynamic";

/**
 * Next.js Metadata Route — 배열만 반환하면 Next가 sitemap.xml XML을 생성합니다.
 * Response/문자열을 직접 반환하지 않습니다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only final, indexable pages belong here. Omit unknown modification dates;
  // a request time (or a view-count update) is not an editorial change.
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/services/drivetrain`, changeFrequency: "monthly", priority: 0.9 },
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/services/transmission`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/services/diesel-cleaning`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/services/electric-vehicle`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/works`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/reviews`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const workEntries = await getPublishedWorkSitemapEntries();
  return [...entries, ...dieselGuides.map(guide => ({
    url: `${SITE_URL}${dieselGuidePath(guide.slug)}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  })), ...workEntries];
}

async function getPublishedWorkSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  if (!isSupabaseConfigured()) return [];

  try {
    // cookies() 없는 anon 클라이언트로 sitemap 안정 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    let { data, error } = await supabase
      .from("work_cases")
      .select("slug, published_at, status, noindex, canonical_url, representative_image_path")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(1000);

    // status/noindex 컬럼이 없는 환경 폴백
    if (error?.code === "42703" || error?.code === "PGRST204") {
      const fallback = await supabase
        .from("work_cases")
        .select("slug, published_at, representative_image_path")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(1000);
      data =
        fallback.data?.map((row) => ({
          ...row,
          status: null,
          noindex: null,
          canonical_url: null,
        })) ?? null;
      error = fallback.error;
    }

    if (error || !data) return [];

    return data
      .filter((row) => isIndexableWork(row, SITE_URL))
      .map((row) => {
        const image = getPublicImageUrl(row.representative_image_path);
        return {
          url: `${SITE_URL}/works/${encodeURIComponent(row.slug)}`,
          ...(image ? { images: [new URL(image, SITE_URL).href] } : {}),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        };
      });
  } catch {
    return [];
  }
}
