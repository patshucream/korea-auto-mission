import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WorkCard } from "@/components/works/WorkCard";
import { WorkMobileCtaBar } from "@/components/works/WorkMobileCtaBar";
import { WorkReadingTools, type TocItem } from "@/components/works/WorkReadingTools";
import { SmartImage } from "@/components/ui/SmartImage";
import { NaverReserveButton, PhoneButton } from "@/components/ui/ContactButtons";
import {
  getRelatedWorks,
  getSiteSettings,
  getWorkBySlug,
  incrementWorkViewCount,
} from "@/lib/data/content";
import { sanitizeEditorHtml } from "@/lib/editor/sanitize";
import { getPublicImageUrl } from "@/lib/media";
import { SITE_URL, formatDateKo, getMapUrl } from "@/lib/utils";
import {
  buildDefaultSeoDescription,
  buildDefaultSeoTitle,
  estimateReadingMinutes,
} from "@/lib/works/seo";
import type { WorkCase } from "@/lib/types";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

function sectionId(label: string) {
  return `sec-${label.replace(/\s+/g, "-").toLowerCase()}`;
}

function buildToc(work: WorkCase, hasHtml: boolean): TocItem[] {
  const items: TocItem[] = [];
  const push = (label: string, cond: boolean) => {
    if (cond) items.push({ id: sectionId(label), text: label });
  };

  push(
    "빠른 요약",
    Boolean(
      asString(work.symptoms).trim() ||
        asString(work.diagnosis).trim() ||
        asString(work.repair_process).trim() ||
        asString(work.replaced_parts).trim() ||
        asString(work.repair_duration).trim() ||
        asString(work.warranty_info).trim(),
    ),
  );

  if (hasHtml) {
    const html = asString(work.content_html);
    const headings = [...html.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi)];
    headings.forEach((m, i) => {
      const text = m[2].replace(/<[^>]+>/g, "").trim();
      if (text) items.push({ id: `heading-${i}`, text });
    });
  }

  push(
    "작업 전후",
    Boolean(asStringArray(work.before_images).length || asStringArray(work.after_images).length),
  );
  push(
    "정비 결과",
    Boolean(asString(work.cause).trim() || asString(work.warranty_info).trim()),
  );
  push("갤러리", Boolean(asStringArray(work.gallery_image_paths).length));
  push("관련 작업사례", true);
  return items;
}

function injectHeadingIds(html: string): string {
  let i = 0;
  return html.replace(/<h([23])([^>]*)>/gi, (_m, level, attrs) => {
    const id = `heading-${i++}`;
    if (/\sid=/.test(attrs)) return `<h${level}${attrs}>`;
    return `<h${level}${attrs} id="${id}">`;
  });
}

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
      title,
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

  let work: WorkCase | null = null;
  try {
    work = await getWorkBySlug(slug);
  } catch (error) {
    console.error("[works/[slug] getWorkBySlug]", {
      slug,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  if (!work) notFound();

  void incrementWorkViewCount(work.id);

  const [settings, related] = await Promise.all([
    getSiteSettings().catch((error) => {
      console.error("[works/[slug] getSiteSettings]", error);
      throw error;
    }),
    getRelatedWorks(work, 4).catch((error) => {
      console.error("[works/[slug] getRelatedWorks]", error);
      return [] as WorkCase[];
    }),
  ]);

  const brand = asString(work.manufacturer) || asString(work.vehicle_brand);
  const rawHtml = asString(work.content_html).trim();
  let safeHtml = "";
  try {
    safeHtml = rawHtml ? injectHeadingIds(sanitizeEditorHtml(rawHtml)) : "";
  } catch {
    safeHtml = "";
  }
  const hasHtml = Boolean(safeHtml);
  const toc = buildToc(work, hasHtml);
  const shareUrl = `${SITE_URL}/works/${encodeURIComponent(work.slug)}`;
  const beforeImages = asStringArray(work.before_images);
  const afterImages = asStringArray(work.after_images);
  const galleryImages = asStringArray(work.gallery_image_paths);
  const symptomTags = asStringArray(work.symptom_tags);
  const generalTags = asStringArray(work.general_tags);
  const hasRepresentativeImage = Boolean(getPublicImageUrl(work.representative_image_path));
  const symptoms = asString(work.symptoms).trim();
  const diagnosis = asString(work.diagnosis).trim();
  const cause = asString(work.cause).trim();
  const repairProcess = asString(work.repair_process).trim();
  const replacedParts = asString(work.replaced_parts).trim();
  const warrantyInfo = asString(work.warranty_info).trim();
  const repairDuration = asString(work.repair_duration).trim();
  const serviceCategory = asString(work.service_category).trim();
  const subtitle = asString(work.subtitle).trim() || asString(work.excerpt).trim();
  const hasSummary = Boolean(
    symptoms || diagnosis || repairProcess || replacedParts || repairDuration || warrantyInfo,
  );
  const imageUrl =
    getPublicImageUrl(work.og_image_path) ||
    getPublicImageUrl(work.representative_image_path);
  const canonical =
    asString(work.canonical_url) ||
    `${SITE_URL}/works/${encodeURIComponent(work.slug)}`;
  const minutes = estimateReadingMinutes(work);
  const mapUrl = getMapUrl(settings);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: buildDefaultSeoTitle(work),
    description: buildDefaultSeoDescription(work),
    datePublished: work.published_at || work.created_at || undefined,
    dateModified: work.updated_at || work.published_at || undefined,
    image: imageUrl || undefined,
    author: {
      "@type": "Organization",
      name: settings.business_name || "코리아오토미션",
    },
    publisher: {
      "@type": "Organization",
      name: settings.business_name || "코리아오토미션",
      url: SITE_URL,
    },
    mainEntityOfPage: canonical,
    url: canonical,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "작업사례",
        item: `${SITE_URL}/works`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: asString(work.title) || "작업사례",
        item: canonical,
      },
    ],
  };

  return (
    <>
      <Header settings={settings} />
      <main className="pb-mobile-bar">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <article className="section-pad">
          <div className="container-site">
            <nav className="text-sm text-muted">
              <Link href="/" className="hover:text-navy">
                홈
              </Link>
              <span className="mx-2">/</span>
              <Link href="/works" className="hover:text-navy">
                작업사례
              </Link>
            </nav>

            <header className="mx-auto mt-6 max-w-[820px]">
              <p className="text-sm font-bold text-navy">
                {[brand, asString(work.vehicle_model), work.model_year, asString(work.mileage)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <h1 className="mt-3 text-[1.85rem] font-black leading-snug tracking-tight text-charcoal md:text-[2.35rem]">
                {asString(work.title) || "작업사례"}
              </h1>
              {subtitle ? (
                <p className="mt-3 text-lg leading-relaxed text-muted">{subtitle}</p>
              ) : null}
              <p className="mt-4 text-sm text-muted">
                {[
                  serviceCategory,
                  work.published_at || work.created_at
                    ? formatDateKo(work.published_at || work.created_at)
                    : "",
                  `조회 ${work.view_count ?? 0}`,
                  `약 ${minutes}분`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </header>

            {hasRepresentativeImage ? (
              <SmartImage
                path={work.representative_image_path}
                alt={asString(work.title) || "작업 대표 사진"}
                className="mx-auto mt-8 aspect-[16/9] w-full max-w-[980px] rounded-[10px]"
                sizes="(max-width: 980px) 100vw, 980px"
                priority
                fallbackLabel="작업 대표 사진"
              />
            ) : null}

            <div className="mx-auto mt-10 max-w-[820px]">
              <WorkReadingTools
                toc={toc}
                shareUrl={shareUrl}
                shareTitle={asString(work.title) || "작업사례"}
              />

              {hasSummary ? (
                  <section
                    id={sectionId("빠른 요약")}
                    className="scroll-mt-28 rounded-[14px] border border-border bg-gray-50 p-5 sm:p-6"
                  >
                    <h2 className="text-lg font-black text-charcoal">빠른 요약</h2>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      {symptoms ? (
                        <div>
                          <dt className="text-sm font-bold text-navy">입고 증상</dt>
                          <dd className="mt-1 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal-soft">
                            {symptoms}
                          </dd>
                        </div>
                      ) : null}
                      {diagnosis ? (
                        <div>
                          <dt className="text-sm font-bold text-navy">진단 결과</dt>
                          <dd className="mt-1 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal-soft">
                            {diagnosis}
                          </dd>
                        </div>
                      ) : null}
                      {repairProcess ? (
                        <div>
                          <dt className="text-sm font-bold text-navy">작업 내용</dt>
                          <dd className="mt-1 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal-soft">
                            {repairProcess}
                          </dd>
                        </div>
                      ) : null}
                      {repairDuration ? (
                        <div>
                          <dt className="text-sm font-bold text-navy">작업 시간</dt>
                          <dd className="mt-1 text-[0.98rem] text-charcoal-soft">
                            {repairDuration}
                          </dd>
                        </div>
                      ) : null}
                      {replacedParts ? (
                        <div>
                          <dt className="text-sm font-bold text-navy">교체 부품</dt>
                          <dd className="mt-1 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal-soft">
                            {replacedParts}
                          </dd>
                        </div>
                      ) : null}
                      {warrantyInfo ? (
                        <div>
                          <dt className="text-sm font-bold text-navy">보증 안내</dt>
                          <dd className="mt-1 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal-soft">
                            {warrantyInfo}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </section>
                ) : null}

                <div className="work-content mt-8 max-w-[820px] space-y-8">
                  {hasHtml ? (
                    <div
                      className="prose-ko work-prose"
                      dangerouslySetInnerHTML={{ __html: safeHtml }}
                    />
                  ) : null}

                  {beforeImages.length || afterImages.length ? (
                    <section
                      id={sectionId("작업 전후")}
                      className="work-before-after scroll-mt-28"
                    >
                      <h2 className="text-xl font-black text-charcoal">전후 비교</h2>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {beforeImages.length ? (
                          <div>
                            <p className="mb-2 text-sm font-bold text-muted">작업 전</p>
                            <div className="grid gap-2">
                              {beforeImages.map((path) => (
                                <SmartImage
                                  key={path}
                                  path={path}
                                  alt={`${asString(work.title)} 작업 전`}
                                  className="aspect-[4/3] w-full rounded-lg"
                                  sizes="(max-width: 640px) 100vw, 30vw"
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {afterImages.length ? (
                          <div>
                            <p className="mb-2 text-sm font-bold text-muted">작업 후</p>
                            <div className="grid gap-2">
                              {afterImages.map((path) => (
                                <SmartImage
                                  key={path}
                                  path={path}
                                  alt={`${asString(work.title)} 작업 후`}
                                  className="aspect-[4/3] w-full rounded-lg"
                                  sizes="(max-width: 640px) 100vw, 30vw"
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  {cause || warrantyInfo ? (
                    <section
                      id={sectionId("정비 결과")}
                      className="scroll-mt-28 rounded-[14px] border border-border p-5"
                    >
                      <h2 className="text-xl font-black text-charcoal">정비 결과</h2>
                      {cause ? (
                        <div className="mt-4">
                          <h3 className="text-sm font-bold text-navy">증상 개선 / 원인</h3>
                          <p className="mt-2 whitespace-pre-line leading-relaxed text-charcoal-soft">
                            {cause}
                          </p>
                        </div>
                      ) : null}
                      {warrantyInfo ? (
                        <div className="mt-4">
                          <h3 className="text-sm font-bold text-navy">고객 주의사항 · 보증</h3>
                          <p className="mt-2 whitespace-pre-line leading-relaxed text-charcoal-soft">
                            {warrantyInfo}
                          </p>
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                </div>

                {galleryImages.length ? (
                  <section
                    id={sectionId("갤러리")}
                    className="work-gallery mt-10 scroll-mt-28"
                  >
                    <h2 className="text-xl font-black text-charcoal">갤러리</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {galleryImages.map((path) => (
                        <SmartImage
                          key={path}
                          path={path}
                          alt={`${asString(work.title)} 갤러리`}
                          className="aspect-[4/3] w-full rounded-lg"
                          sizes="(max-width: 640px) 100vw, 30vw"
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                <aside className="mt-10 rounded-[14px] border border-border bg-gray-50 p-5 lg:hidden">
                  <h2 className="text-lg font-black text-charcoal">차량 정보</h2>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="font-bold text-charcoal">제조사</dt>
                      <dd className="text-muted">{brand || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-charcoal">모델</dt>
                      <dd className="text-muted">{asString(work.vehicle_model) || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-charcoal">연식</dt>
                      <dd className="text-muted">{work.model_year || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-charcoal">서비스</dt>
                      <dd className="text-muted">{serviceCategory || "—"}</dd>
                    </div>
                  </dl>
                  {symptomTags.length || generalTags.length ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {[...symptomTags, ...generalTags].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-border px-2 py-0.5 text-xs text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </aside>

                <section className="mt-12 rounded-[14px] border border-border bg-navy px-6 py-8 text-white md:px-10">
                  <h2 className="text-2xl font-black">내 차량도 비슷한 증상이 있나요?</h2>
                  <p className="mt-2 max-w-2xl text-white/80">
                    증상과 차종을 알려주시면 점검 방향을 안내드립니다.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <PhoneButton
                      settings={settings}
                      variant="secondary"
                      className="!bg-white !text-navy"
                    />
                    <NaverReserveButton settings={settings} />
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost !border-white/30 !text-white"
                    >
                      오시는 길
                    </a>
                  </div>
                </section>

              <section id={sectionId("관련 작업사례")} className="mt-14 scroll-mt-28">
                  <h2 className="section-title">관련 작업사례</h2>
                  {related.length ? (
                    <div className="mt-6 grid gap-8 sm:grid-cols-2">
                      {related.map((item) => (
                        <WorkCard key={item.id} work={item} />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-muted">관련 사례를 준비 중입니다.</p>
                  )}
                </section>
            </div>
          </div>
        </article>
      </main>
      <Footer settings={settings} />
      <WorkMobileCtaBar settings={settings} />
    </>
  );
}
