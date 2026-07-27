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

function sectionId(label: string) {
  return `sec-${label.replace(/\s+/g, "-").toLowerCase()}`;
}

function buildToc(work: WorkCase, hasHtml: boolean): TocItem[] {
  const items: TocItem[] = [];
  const push = (label: string, cond: boolean) => {
    if (cond) items.push({ id: sectionId(label), text: label });
  };

  if (hasHtml) {
    const headings = [...(work.content_html || "").matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi)];
    headings.forEach((m, i) => {
      const text = m[2].replace(/<[^>]+>/g, "").trim();
      if (text) items.push({ id: `heading-${i}`, text });
    });
  }

  push("증상", Boolean(work.symptoms));
  push("진단 과정", Boolean(work.diagnosis));
  push("원인", Boolean(work.cause));
  push("작업 과정", Boolean(work.repair_process || work.detailed_content || work.work_summary));
  push("교체 부품", Boolean(work.replaced_parts));
  push("작업 전후", Boolean(work.before_images?.length || work.after_images?.length));
  push("보증 안내", Boolean(work.warranty_info));
  push("갤러리", Boolean(work.gallery_image_paths?.length));
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
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) return { title: "작업사례" };

  const title = work.seo_title || work.og_title || work.title;
  const description =
    work.seo_description ||
    work.og_description ||
    work.excerpt ||
    work.work_summary ||
    work.symptoms ||
    work.title;
  const image =
    getPublicImageUrl(work.og_image_path) ||
    getPublicImageUrl(work.representative_image_path);
  const canonical = work.canonical_url || `${SITE_URL}/works/${work.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: work.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: work.og_title || title,
      description: work.og_description || description,
      images: image ? [{ url: image }] : undefined,
      url: canonical,
    },
  };
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
  const work = await getWorkBySlug(slug);
  if (!work) notFound();

  void incrementWorkViewCount(work.id);

  const [settings, related, sameVehicle, sameSymptom] = await Promise.all([
    getSiteSettings(),
    getRelatedWorks(work),
    getSameVehicleWorks(work),
    getSameSymptomWorks(work),
  ]);

  const brand = work.manufacturer || work.vehicle_brand;
  const rawHtml = work.content_html?.trim() || "";
  const hasHtml = Boolean(rawHtml);
  const safeHtml = hasHtml ? injectHeadingIds(sanitizeEditorHtml(rawHtml)) : "";
  const toc = buildToc(work, hasHtml);
  const shareUrl = `${SITE_URL}/works/${work.slug}`;

  return (
    <>
      <Header settings={settings} />
      <main className="pb-mobile-bar">
        <article className="section-pad">
          <div className="container-site">
            <Link href="/works" className="text-sm font-bold text-navy hover:underline">
              ← 작업사례 목록
            </Link>

            <header className="mt-6">
              <p className="text-sm font-bold text-navy">
                {brand} {work.vehicle_model}
                {work.model_year ? ` · ${work.model_year}` : ""}
                {work.mileage ? ` · ${work.mileage}` : ""}
              </p>
              <h1 className="mt-2 text-[1.9rem] font-black leading-snug tracking-tight text-charcoal md:text-[2.3rem]">
                {work.title}
              </h1>
              {work.subtitle ? (
                <p className="mt-2 text-lg text-muted">{work.subtitle}</p>
              ) : null}
              <p className="mt-3 text-muted">
                {work.service_category}
                {work.published_at || work.created_at
                  ? ` · ${formatDateKo(work.published_at || work.created_at)}`
                  : ""}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <PhoneButton settings={settings} />
                <NaverReserveButton settings={settings} />
                <a href="/#contact" className="btn btn-secondary">
                  상담 문의
                </a>
              </div>
            </header>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.45fr_0.75fr]">
              <div>
                <SmartImage
                  path={work.representative_image_path}
                  alt={work.title}
                  className="aspect-[16/10] w-full rounded-[14px]"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                  fallbackLabel="작업 대표 사진"
                />

                <div className="mt-8">
                  <WorkReadingTools
                    toc={toc}
                    shareUrl={shareUrl}
                    shareTitle={work.title}
                  />
                </div>

                <div className="work-content mt-2 space-y-8">
                  {hasHtml ? (
                    <div
                      className="prose-ko"
                      dangerouslySetInnerHTML={{ __html: safeHtml }}
                    />
                  ) : null}

                  {work.symptoms ? (
                    <ReportBlock id={sectionId("증상")} title="증상">
                      {work.symptoms}
                    </ReportBlock>
                  ) : null}
                  {work.diagnosis ? (
                    <ReportBlock id={sectionId("진단 과정")} title="진단 과정">
                      {work.diagnosis}
                    </ReportBlock>
                  ) : null}
                  {work.cause ? (
                    <ReportBlock id={sectionId("원인")} title="원인">
                      {work.cause}
                    </ReportBlock>
                  ) : null}
                  {(work.repair_process || (!hasHtml && (work.detailed_content || work.work_summary))) ? (
                    <ReportBlock id={sectionId("작업 과정")} title="작업 과정">
                      {work.repair_process || work.detailed_content || work.work_summary}
                    </ReportBlock>
                  ) : null}
                  {work.replaced_parts ? (
                    <ReportBlock id={sectionId("교체 부품")} title="교체 부품">
                      {work.replaced_parts}
                    </ReportBlock>
                  ) : null}

                  {(work.before_images?.length || work.after_images?.length) ? (
                    <section id={sectionId("작업 전후")} className="work-before-after scroll-mt-28">
                      <h2 className="text-xl font-black text-charcoal">작업 전후</h2>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {work.before_images?.length ? (
                          <div>
                            <p className="mb-2 text-sm font-bold text-muted">작업 전</p>
                            <div className="grid gap-2">
                              {work.before_images.map((path) => (
                                <SmartImage
                                  key={path}
                                  path={path}
                                  alt={`${work.title} 작업 전`}
                                  className="aspect-[4/3] w-full rounded-lg"
                                  sizes="(max-width: 640px) 100vw, 30vw"
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {work.after_images?.length ? (
                          <div>
                            <p className="mb-2 text-sm font-bold text-muted">작업 후</p>
                            <div className="grid gap-2">
                              {work.after_images.map((path) => (
                                <SmartImage
                                  key={path}
                                  path={path}
                                  alt={`${work.title} 작업 후`}
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

                  {work.warranty_info ? (
                    <ReportBlock id={sectionId("보증 안내")} title="보증 안내">
                      {work.warranty_info}
                    </ReportBlock>
                  ) : null}

                  {work.repair_duration ? (
                    <p className="rounded-[12px] border border-border bg-gray-50 px-4 py-3 text-sm">
                      <span className="font-bold text-charcoal">작업 시간: </span>
                      <span className="text-muted">{work.repair_duration}</span>
                    </p>
                  ) : null}
                </div>

                {work.gallery_image_paths?.length ? (
                  <section
                    id={sectionId("갤러리")}
                    className="work-gallery mt-10 scroll-mt-28"
                  >
                    <h2 className="text-xl font-black text-charcoal">갤러리</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {work.gallery_image_paths.map((path) => (
                        <SmartImage
                          key={path}
                          path={path}
                          alt={`${work.title} 갤러리`}
                          className="aspect-[4/3] w-full rounded-lg"
                          sizes="(max-width: 640px) 100vw, 30vw"
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>

              <aside className="h-fit rounded-[14px] border border-border bg-white p-5 lg:sticky lg:top-24">
                <h2 className="text-lg font-black text-charcoal">차량 · 정비 요약</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-bold text-charcoal">차량</dt>
                    <dd className="text-muted">
                      {brand} {work.vehicle_model} {work.model_year}
                    </dd>
                  </div>
                  {work.mileage ? (
                    <div>
                      <dt className="font-bold text-charcoal">주행거리</dt>
                      <dd className="text-muted">{work.mileage}</dd>
                    </div>
                  ) : null}
                  {work.fuel_type ? (
                    <div>
                      <dt className="font-bold text-charcoal">연료</dt>
                      <dd className="text-muted">{work.fuel_type}</dd>
                    </div>
                  ) : null}
                  {work.transmission_type ? (
                    <div>
                      <dt className="font-bold text-charcoal">변속기</dt>
                      <dd className="text-muted">{work.transmission_type}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="font-bold text-charcoal">서비스</dt>
                    <dd className="text-muted">{work.service_category}</dd>
                  </div>
                  {(work.symptom_tags?.length || work.general_tags?.length) ? (
                    <div>
                      <dt className="font-bold text-charcoal">태그</dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {[...(work.symptom_tags || []), ...(work.general_tags || [])].map(
                          (tag) => (
                            <span
                              key={tag}
                              className="rounded-md border border-border px-2 py-0.5 text-xs text-muted"
                            >
                              {tag}
                            </span>
                          ),
                        )}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-6 grid gap-3">
                  <PhoneButton settings={settings} fullWidth />
                  <NaverReserveButton settings={settings} fullWidth />
                  <a href="/#contact" className="btn btn-secondary btn-full">
                    상담 문의
                  </a>
                  {work.naver_blog_url ? (
                    <a
                      href={work.naver_blog_url}
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

            {work.service_category ? (
              <section className="mt-14">
                <h2 className="section-title">관련 서비스</h2>
                <p className="mt-3 text-muted">
                  이 작업은 <strong className="text-charcoal">{work.service_category}</strong>{" "}
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
