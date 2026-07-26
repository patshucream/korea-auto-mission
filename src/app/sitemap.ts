import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL, isSupabaseConfigured } from "@/lib/utils";

/**
 * Next.js Metadata Route — 배열만 반환하면 Next가 sitemap.xml XML을 생성합니다.
 * Response/문자열을 직접 반환하지 않습니다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/work`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/works`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/reviews`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const workEntries = await getPublishedWorkSitemapEntries();
  return [...entries, ...workEntries];
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

    const { data, error } = await supabase
      .from("work_cases")
      .select("slug, published_at, created_at, updated_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(1000);

    if (error || !data) return [];

    return data
      .filter((row) => typeof row.slug === "string" && row.slug.length > 0)
      .map((row) => ({
        url: `${SITE_URL}/works/${row.slug}`,
        lastModified: new Date(
          row.updated_at || row.published_at || row.created_at || Date.now(),
        ),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
  } catch {
    return [];
  }
}
