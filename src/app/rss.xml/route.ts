import { getPaginatedWorks } from "@/lib/data/content";
import { escapeXml, SITE_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CHANNEL_TITLE = "코리아오토미션";
const CHANNEL_DESCRIPTION =
  "부산 수입차 정비 · 오토미션 수리 · 디젤클리닝 작업사례";

function toRfc822(date: Date): string {
  return date.toUTCString();
}

export async function GET() {
  const siteUrl = SITE_URL;
  const works = await getPaginatedWorks({ page: 1, pageSize: 30, sort: "newest" });
  const buildDate = toRfc822(new Date());

  const itemsXml = works.items
    .map((work) => {
      const link = `${siteUrl}/works/${work.slug}`;
      const pubDate = toRfc822(
        new Date(work.published_at || work.created_at || Date.now()),
      );
      const description =
        work.work_summary?.trim() ||
        work.symptoms?.trim() ||
        work.seo_description?.trim() ||
        `${work.vehicle_brand} ${work.vehicle_model} 작업사례`.trim();

      return `    <item>
      <title>${escapeXml(work.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(CHANNEL_TITLE)}</title>
    <link>${escapeXml(siteUrl)}</link>
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
