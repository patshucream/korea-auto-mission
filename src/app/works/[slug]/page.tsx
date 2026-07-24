import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { WorkCard } from "@/components/works/WorkCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { NaverReserveButton, PhoneButton } from "@/components/ui/ContactButtons";
import {
  getRelatedWorks,
  getSiteSettings,
  getWorkBySlug,
} from "@/lib/data/content";
import { getPublicImageUrl } from "@/lib/media";
import { formatDateKo, getSiteUrl } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) return { title: "작업사례" };

  const title = work.seo_title || work.title;
  const description =
    work.seo_description || work.work_summary || work.symptoms || work.title;
  const image = getPublicImageUrl(work.representative_image_path);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function WorkDetailPage({ params }: Props) {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) notFound();

  const [settings, related] = await Promise.all([
    getSiteSettings(),
    getRelatedWorks(work),
  ]);

  return (
    <>
      <Header settings={settings} />
      <main className="pb-mobile-bar">
        <article className="section-pad">
          <div className="container-site">
            <Link href="/works" className="text-sm font-bold text-navy hover:underline">
              ← 작업사례 목록
            </Link>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
              <div>
                <p className="text-sm font-bold text-navy">
                  {work.vehicle_brand} {work.vehicle_model}
                  {work.model_year ? ` · ${work.model_year}` : ""}
                </p>
                <h1 className="mt-2 text-[1.9rem] font-black leading-snug tracking-tight text-charcoal md:text-[2.3rem]">
                  {work.title}
                </h1>
                <p className="mt-3 text-muted">
                  {work.service_category}
                  {work.published_at || work.created_at
                    ? ` · ${formatDateKo(work.published_at || work.created_at)}`
                    : ""}
                </p>

                <SmartImage
                  path={work.representative_image_path}
                  alt={work.title}
                  className="mt-6 aspect-[16/10] w-full rounded-[14px]"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                  fallbackLabel="작업 대표 사진"
                />

                <div className="mt-8 space-y-6">
                  <section>
                    <h2 className="text-xl font-black text-charcoal">증상</h2>
                    <p className="mt-2 whitespace-pre-line leading-relaxed text-charcoal-soft">
                      {work.symptoms || "등록된 내용이 없습니다."}
                    </p>
                  </section>
                  <section>
                    <h2 className="text-xl font-black text-charcoal">진단</h2>
                    <p className="mt-2 whitespace-pre-line leading-relaxed text-charcoal-soft">
                      {work.diagnosis || "등록된 내용이 없습니다."}
                    </p>
                  </section>
                  <section>
                    <h2 className="text-xl font-black text-charcoal">작업 내용</h2>
                    <p className="mt-2 whitespace-pre-line leading-relaxed text-charcoal-soft">
                      {work.detailed_content || work.work_summary || "등록된 내용이 없습니다."}
                    </p>
                  </section>
                </div>

                {work.gallery_image_paths?.length ? (
                  <section className="mt-10">
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
                <h2 className="text-lg font-black text-charcoal">상담 안내</h2>
                <p className="mt-2 text-[1.02rem] leading-relaxed text-muted">
                  비슷한 증상이 있다면 전화 또는 네이버 예약으로 문의해 주세요.
                </p>
                <div className="mt-5 grid gap-3">
                  <PhoneButton settings={settings} fullWidth />
                  <NaverReserveButton settings={settings} fullWidth />
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
                <dl className="mt-6 space-y-3 text-sm">
                  <div>
                    <dt className="font-bold text-charcoal">차량</dt>
                    <dd className="text-muted">
                      {work.vehicle_brand} {work.vehicle_model} {work.model_year}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-charcoal">서비스</dt>
                    <dd className="text-muted">{work.service_category}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-charcoal">페이지 주소</dt>
                    <dd className="break-all text-muted">
                      {getSiteUrl()}/works/{work.slug}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>

            {related.length ? (
              <section className="mt-14">
                <h2 className="section-title">관련 작업사례</h2>
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {related.map((item) => (
                    <WorkCard key={item.id} work={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </article>
      </main>
      <Footer settings={settings} />
      <MobileBottomBar settings={settings} />
    </>
  );
}
