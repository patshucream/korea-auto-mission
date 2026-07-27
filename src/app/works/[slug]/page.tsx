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
  getSameSymptomWorks,
  getSameVehicleWorks,
  getSiteSettings,
  getWorkBySlug,
  incrementWorkViewCount,
} from "@/lib/data/content";
import { sanitizeEditorHtml } from "@/lib/editor/sanitize";
import { getPublicImageUrl } from "@/lib/media";
import { SITE_URL, formatDateKo } from "@/lib/utils";
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

  if (hasHtml) {
    const html = asString(work.content_html);
    const headings = [...html.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi)];
    headings.forEach((m, i) => {
      const text = m[2].replace(/<[^>]+>/g, "").trim();
      if (text) items.push({ id: `heading-${i}`, text });
    });
  }

  push("증상", Boolean(asString(work.symptoms).trim()));
  push("진단 과정", Boolean(asString(work.diagnosis).trim()));
  push("원인", Boolean(asString(work.cause).trim()));
  push(
    "작업 과정",
    Boolean(
      asString(work.repair_process).trim() ||
        asString(work.detailed_content).trim() ||
        asString(work.work_summary).trim(),
    ),
  );
  push("교체 부품", Boolean(asString(work.replaced_parts).trim()));
  push(
    "작업 전후",
    Boolean(asStringArray(work.before_images).length || asStringArray(work.after_images).length),
  );
  push("보증 안내", Boolean(asString(work.warranty_info).trim()));
  push("갤러리", Boolean(asStringArray(work.gallery_image_paths).length));
  return items;
}

/** content_html 의 h2/h3에 id를 주입해 목차 앵커와 맞춤 */
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

    const title = asString(work.seo_title) || asString(work.og_title) || asString(work.title) || "작업사례";
    const description =
      asString(work.seo_description) ||
      asString(work.og_description) ||
      asString(work.excerpt) ||
      asString(work.work_summary) ||
      asString(work.symptoms) ||
      asString(work.title) ||
      "코리아오토미션 작업사례";
    const image =
      getPublicImageUrl(work.og_image_path) ||
      getPublicImageUrl(work.representative_image_path);
    const canonical =
      asString(work.canonical_url) || `${SITE_URL}/works/${encodeURIComponent(work.slug)}`;

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
      },
    };
  } catch (error) {
    console.error("[works/[slug] generateMetadata]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { title: "작업사례" };
  }
}

function ReportBlock({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-black text-charcoal">{title}</h2>
      <div className="mt-2 whitespace-pre-line leading-relaxed text-charcoal-soft">
        {children}
      </div>
    </section>
  );
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
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }

  if (!work) notFound();

  void incrementWorkViewCount(work.id);

  const [settings, related, sameVehicle, sameSymptom] = await Promise.all([
    getSiteSettings().catch((error) => {
      console.error("[works/[slug] getSiteSettings]", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }),
    getRelatedWorks(work).catch((error) => {
      console.error("[works/[slug] getRelatedWorks]", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [] as WorkCase[];
    }),
    getSameVehicleWorks(work).catch((error) => {
      console.error("[works/[slug] getSameVehicleWorks]", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [] as WorkCase[];
    }),
    getSameSymptomWorks(work).catch((error) => {
      console.error("[works/[slug] getSameSymptomWorks]", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [] as WorkCase[];
    }),
  ]);

  const brand = asString(work.manufacturer) || asString(work.vehicle_brand);
  const rawHtml = asString(work.content_html).trim();
  let safeHtml = "";
  try {
    safeHtml = rawHtml ? injectHeadingIds(sanitizeEditorHtml(rawHtml)) : "";
  } catch (error) {
    console.error("[works/[slug] sanitizeEditorHtml]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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
  const detailedContent = asString(work.detailed_content).trim();
  const workSummary = asString(work.work_summary).trim();
  const replacedParts = asString(work.replaced_parts).trim();
  const warrantyInfo = asString(work.warranty_info).trim();
  const repairDuration = asString(work.repair_duration).trim();
  const serviceCategory = asString(work.service_category).trim();
  const subtitle = asString(work.subtitle).trim() || asString(work.excerpt).trim();

  return (
    <>
      <Header settings={settings} />
      <main className="pb-mobile-bar">
        <article className="section-pad">
          <div className="container-site">
            <Link href="/works" className="text-sm font-bold text-navy hover:underline">
              ← 작업사례 목록
            </Link>

            <header className="mx-auto mt-6 max-w-[840px]">
              <p className="text-sm font-bold text-navy">
                {brand} {asString(work.vehicle_model)}
                {work.model_year ? ` · ${work.model_year}` : ""}
              </p>
              <h1 className="mt-3 text-[1.9rem] font-black leading-snug tracking-tight text-charcoal md:text-[2.4rem]">
                {asString(work.title) || "작업사례"}
              </h1>
              {subtitle ? (
                <p className="mt-3 text-lg leading-relaxed text-muted">{subtitle}</p>
              ) : null}
              <p className="mt-4 text-sm text-muted">
                {serviceCategory}
                {work.published_at || work.created_at
                  ? ` · ${formatDateKo(work.published_at || work.created_at)}`
                  : ""}
                {` · 조회 ${work.view_count ?? 0}`}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <PhoneButton settings={settings} />
                <NaverReserveButton settings={settings} />
              </div>
            </header>

            {hasRepresentativeImage ? (
              <SmartImage
                path={work.representative_image_path}
                alt={asString(work.title) || "작업 대표 사진"}
                className="mt-8 aspect-[16/9] w-full rounded-[10px]"
                sizes="100vw"
                priority
                fallbackLabel="작업 대표 사진"
              />
            ) : null}

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,840px)_280px] lg:justify-between">
              <div className="min-w-0">
                <WorkReadingTools
                  toc={toc}
                  shareUrl={shareUrl}
                  shareTitle={asString(work.title) || "작업사례"}
                />

                <div className="work-content mt-6 max-w-[840px] space-y-8">
                  {hasHtml ? (
                    <div
                      className="prose-ko"
                      dangerouslySetInnerHTML={{ __html: safeHtml }}
                    />
                  ) : null}

                  {symptoms ? (
                    <ReportBlock id={sectionId("증상")} title="증상">
                      {symptoms}
                    </ReportBlock>
                  ) : null}
                  {diagnosis ? (
                    <ReportBlock id={sectionId("진단 과정")} title="진단 과정">
                      {diagnosis}
                    </ReportBlock>
                  ) : null}
                  {cause ? (
                    <ReportBlock id={sectionId("원인")} title="원인">
                      {cause}
                    </ReportBlock>
                  ) : null}
                  {repairProcess || (!hasHtml && (detailedContent || workSummary)) ? (
                    <ReportBlock id={sectionId("작업 과정")} title="작업 과정">
                      {repairProcess || detailedContent || workSummary}
                    </ReportBlock>
                  ) : null}
                  {replacedParts ? (
                    <ReportBlock id={sectionId("교체 부품")} title="교체 부품">
                      {replacedParts}
                    </ReportBlock>
                  ) : null}

                  {beforeImages.length || afterImages.length ? (
                    <section id={sectionId("작업 전후")} className="work-before-after scroll-mt-28">
                      <h2 className="text-xl font-black text-charcoal">작업 전후</h2>
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

                  {warrantyInfo ? (
                    <ReportBlock id={sectionId("보증 안내")} title="보증 안내">
                      {warrantyInfo}
                    </ReportBlock>
                  ) : null}

                  {repairDuration ? (
                    <p className="rounded-[12px] border border-border bg-gray-50 px-4 py-3 text-sm">
                      <span className="font-bold text-charcoal">작업 시간: </span>
                      <span className="text-muted">{repairDuration}</span>
                    </p>
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
              </div>

              <aside className="h-fit border border-border bg-gray-100 p-5 lg:sticky lg:top-24">
                <h2 className="text-lg font-black text-charcoal">차량 정보</h2>
                <dl className="mt-4 space-y-3 text-sm">
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
                  {asString(work.mileage) ? (
                    <div>
                      <dt className="font-bold text-charcoal">주행거리</dt>
                      <dd className="text-muted">{asString(work.mileage)}</dd>
                    </div>
                  ) : null}
                  {asString(work.fuel_type) ? (
                    <div>
                      <dt className="font-bold text-charcoal">연료</dt>
                      <dd className="text-muted">{asString(work.fuel_type)}</dd>
                    </div>
                  ) : null}
                  {asString(work.transmission_type) ? (
                    <div>
                      <dt className="font-bold text-charcoal">변속기</dt>
                      <dd className="text-muted">{asString(work.transmission_type)}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="font-bold text-charcoal">서비스</dt>
                    <dd className="text-muted">{serviceCategory || "—"}</dd>
                  </div>
                  {symptomTags.length || generalTags.length ? (
                    <div>
                      <dt className="font-bold text-charcoal">태그</dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {[...symptomTags, ...generalTags].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-border px-2 py-0.5 text-xs text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-6 grid gap-3">
                  <PhoneButton settings={settings} fullWidth />
                  <NaverReserveButton settings={settings} fullWidth />
                  <Link href="/#contact" className="btn btn-secondary btn-full">
                    상담 문의
                  </Link>
                  {asString(work.naver_blog_url) ? (
                    <a
                      href={asString(work.naver_blog_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-full"
                    >
                      네이버 블로그 글 보기
                    </a>
                  ) : null}
                </div>
              </aside>
            </div>

            <section className="mt-14 rounded-[14px] border border-border bg-navy px-6 py-8 text-white md:px-10">
              <h2 className="text-2xl font-black">비슷한 증상이라면 상담받아 보세요</h2>
              <p className="mt-2 max-w-2xl text-white/80">
                차량 모델과 증상을 알려주시면 점검 방향과 예상 일정을 안내해 드립니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <PhoneButton settings={settings} variant="secondary" className="!bg-white !text-navy" />
                <NaverReserveButton settings={settings} />
              </div>
            </section>

            {related.length ? (
              <RelatedSection title="관련 작업사례" items={related} />
            ) : null}
            {sameVehicle.length ? (
              <RelatedSection title="같은 차량 작업사례" items={sameVehicle} />
            ) : null}
            {sameSymptom.length ? (
              <RelatedSection title="같은 증상 작업사례" items={sameSymptom} />
            ) : null}

            {serviceCategory ? (
              <section className="mt-14">
                <h2 className="section-title">관련 서비스</h2>
                <p className="mt-3 text-muted">
                  이 작업은 <strong className="text-charcoal">{serviceCategory}</strong>{" "}
                  서비스와 연관되어 있습니다.
                </p>
                <Link href="/#services" className="btn btn-secondary mt-4 inline-flex">
                  서비스 안내 보기
                </Link>
              </section>
            ) : null}
          </div>
        </article>
      </main>
      <Footer settings={settings} />
      <WorkMobileCtaBar settings={settings} />
    </>
  );
}

function RelatedSection({ title, items }: { title: string; items: WorkCase[] }) {
  return (
    <section className="mt-14">
      <h2 className="section-title">{title}</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <WorkCard key={item.id} work={item} />
        ))}
      </div>
    </section>
  );
}
