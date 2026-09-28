import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RepairJournal } from "@/components/works/RepairJournal";
import { getWorkBySlug, getSiteSettings, getRelatedWorks, incrementWorkViewCount } from "@/lib/data/content";
import { getPublicImageUrl } from "@/lib/media";
import { SITE_URL } from "@/lib/utils";
import { buildDefaultSeoDescription, buildDefaultSeoTitle } from "@/lib/works/seo";
export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };
function asString(value: unknown): string { return typeof value === "string" ? value : ""; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const work = await getWorkBySlug(slug);
    if (!work) return { title: "작업사례" };

    const title = buildDefaultSeoTitle(work);
    const description = buildDefaultSeoDescription(work);
    const image =
      getPublicImageUrl(work.og_image_path) ||
      getPublicImageUrl(work.representative_image_path);
    const canonical =
      asString(work.canonical_url) ||
      `${SITE_URL}/works/${encodeURIComponent(work.slug)}`;

    return {
      title: title.includes("코리아오토미션") ? { absolute: title } : title,
      description,
      alternates: { canonical },
      robots: work.noindex ? { index: false, follow: false } : undefined,
      openGraph: {
        title: asString(work.og_title) || title,
        description: asString(work.og_description) || description,
        images: image ? [{ url: image }] : undefined,
        url: canonical,
        type: "article",
      },
      twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
    };
  } catch (error) {
    console.error("[works/[slug] generateMetadata]", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { title: "작업사례" };
  }
}

export default async function WorkDetailPage({ params }: Props) {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) notFound();
  void incrementWorkViewCount(work.id);
  const [settings, related] = await Promise.all([getSiteSettings(), getRelatedWorks(work, 4)]);
  const canonical = work.canonical_url || `${SITE_URL}/works/${encodeURIComponent(work.slug)}`;
  const jsonLd = {
    "@context":"https://schema.org", "@type":"Article",
    headline:buildDefaultSeoTitle(work), description:buildDefaultSeoDescription(work),
    datePublished:work.published_at || work.created_at, dateModified:work.updated_at || work.published_at || undefined,
    image:getPublicImageUrl(work.og_image_path || work.representative_image_path) || undefined,
    author:{"@type":"Organization",name:settings.business_name},
    publisher:{"@type":"Organization",name:settings.business_name,url:SITE_URL},mainEntityOfPage:canonical,url:canonical,
  };
  const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[
    {"@type":"ListItem",position:1,name:"홈",item:SITE_URL},
    {"@type":"ListItem",position:2,name:"작업사례",item:`${SITE_URL}/works`},
    {"@type":"ListItem",position:3,name:work.title,item:canonical},
  ]};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify([jsonLd,breadcrumb]).replace(/</g,"\\u003c")}}/><RepairJournal work={work} settings={settings} related={related}/></>;
}
