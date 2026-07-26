import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { escapeXml, SITE_URL, isSupabaseConfigured } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CHANNEL_TITLE = "코리아오토미션";
const CHANNEL_DESCRIPTION =
  "부산 수입차 정비 · 오토미션 수리 · 디젤클리닝 작업사례";

type RssItem = {
  title: string;
  link: string;
  guid: string;
  pubDate: Date;
  description: string;
};

function toRfc822(date: Date): string {
  return date.toUTCString();
}

function renderItem(item: RssItem): string {
  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <pubDate>${toRfc822(item.pubDate)}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`;
}

function fallbackHomeItem(): RssItem {
  const description =
    DEFAULT_SETTINGS.seo_description?.trim() ||
    DEFAULT_SETTINGS.hero_description.replace(/\n/g, " ").trim() ||
    CHANNEL_DESCRIPTION;

  return {
    title: CHANNEL_TITLE,
    link: SITE_URL,
    guid: SITE_URL,
    pubDate: new Date(),
    description,
  };
}

async function getWorkRssItems(): Promise<RssItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
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
      .select(
        "slug, title, work_summary, symptoms, seo_description, vehicle_brand, vehicle_model, published_at, created_at",
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(30);

    if (error || !data?.length) return [];

    return data
      .filter((row) => typeof row.slug === "string" && row.slug.length > 0)
      .map((row) => {
        const link = `${SITE_URL}/works/${row.slug}`;
        const description =
          (typeof row.work_summary === "string" && row.work_summary.trim()) ||
          (typeof row.symptoms === "string" && row.symptoms.trim()) ||
          (typeof row.seo_description === "string" && row.seo_description.trim()) ||
          `${row.vehicle_brand || ""} ${row.vehicle_model || ""} 작업사례`.trim() ||
          CHANNEL_DESCRIPTION;

        return {
          title: (typeof row.title === "string" && row.title.trim()) || "작업사례",
          link,
          guid: link,
          pubDate: new Date(row.published_at || row.created_at || Date.now()),
          description,
        };
      });
  } catch {
    return [];
  }
}

export async function GET() {
  const workItems = await getWorkRssItems();
  const items = workItems.length > 0 ? workItems : [fallbackHomeItem()];
  const buildDate = toRfc822(new Date());
  const itemsXml = items.map(renderItem).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(CHANNEL_TITLE)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(CHANNEL_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
