import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { WorkCard } from "@/components/works/WorkCard";
import { WorkFilters } from "@/components/works/WorkFilters";
import { getPaginatedWorks, getSiteSettings } from "@/lib/data/content";
import s from "@/components/works/WorkLibrary.module.css";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/social-image";
import { listingSearchPage } from "@/lib/search-pages";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, filtered, canonicalPath } = listingSearchPage("/works", await searchParams);
  const title = `부산 정비사례 · 미션수리·디젤클리닝·전기차${page > 1 && !filtered ? ` · ${page}페이지` : ""}`;
  const description = "부산 사상구 코리아오토미션의 실제 정비 기록. 차종과 증상으로 미션수리, 흡기·인젝터·DPF 클리닝, 전기차 작업 사진과 점검 과정을 찾아보고 전화·문자로 상담하세요.";
  const url = `${SITE_URL}${canonicalPath}`;
  return {
    title, description, alternates: { canonical: url },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, type: "website", images: [DEFAULT_SOCIAL_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_SOCIAL_IMAGE.url] },
  };
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function WorksPage({ searchParams }: Props) {
  const params = await searchParams;
  const { page } = listingSearchPage("/works", params);
  const q = first(params.q);
  const brand = first(params.brand);
  const model = first(params.model);
  const service = first(params.service);
  const hasFilter = Boolean(q || brand || model || service || first(params.category));

  const result = await getPaginatedWorks({
    q,
    brand,
    model,
    service,
    category: first(params.category),
    sort: first(params.sort) === "oldest" ? "oldest" : "newest",
    page,
    pageSize: 12,
  });
  const settings = await getSiteSettings();

  const makeHref = (nextPage: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (brand) sp.set("brand", brand);
    if (model) sp.set("model", model);
    if (service) sp.set("service", service);
    const category = first(params.category);
    const sort = first(params.sort);
    if (category) sp.set("category", category);
    if (sort) sp.set("sort", sort);
    if (nextPage > 1) sp.set("page", String(nextPage));
    const qs = sp.toString();
    return qs ? `/works?${qs}` : "/works";
  };

  return (
    <>
      <Header settings={settings} dark />
      <main className={s.library}>
        <section className={s.librarySection}>
          <div>
            <header className={s.libraryHeading}><div><p className={s.eyebrow}>KOREA AUTO MISSION · WORKSHOP JOURNAL</p><h1>내 차와 닮은<br />정비 기록을 찾아보세요.</h1><p className={s.intro}>차종과 증상으로 찾아보는 실제 작업사례.</p></div><div className={s.archiveMark} aria-hidden="true"><span>정비 기록</span><strong>JOURNAL</strong><span>차량을 살피고, 과정을 남깁니다.</span></div></header>

            <div>
              <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100" />}>
                <WorkFilters key={JSON.stringify(params)}
                  brands={result.brands}
                  models={result.models}
                  services={result.services}
                />
              </Suspense>
            </div>

            <div className={s.resultCount} id="work-results" aria-live="polite">
              <p className={s.resultTitle}>
                {hasFilter ? "검색 결과" : "최근 작업사례"}{" "}
                <span>{result.total}</span><small>건</small>
              </p><span className={s.pageNote}>{result.page} / {result.totalPages} 페이지</span>
            </div>

            {result.items.length === 0 ? (
              <div className="mt-8 border border-border px-6 py-14 text-center">
                <p className="text-lg font-black text-charcoal">
                  조건에 맞는 작업사례가 없습니다
                </p>
                <p className="mt-3 text-muted">등록된 사례 중 일치하는 기록이 없다는 뜻이며, 정비 가능 여부는 상담으로 확인할 수 있습니다.</p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  {q && (brand || model) && <Link className="btn btn-secondary" href={`/works?${new URLSearchParams({...(brand?{brand}:{}),...(model?{model}:{})})}`}>이 차종의 다른 증상 보기</Link>}
                  {q && (brand || model) && <Link className="btn btn-secondary" href={`/works?${new URLSearchParams({q})}`}>다른 차종의 비슷한 증상 보기</Link>}
                  <Link href="/works" className="btn btn-primary">
                    필터 초기화
                  </Link>
                  <Link href="/#services" className="btn btn-secondary">
                    다른 서비스 보기
                  </Link>
                  <Link href="/#contact" className="btn btn-ghost">
                    상담하기
                  </Link>
                </div>
              </div>
            ) : (
              <div className={s.cardGrid}>
                {result.items.map((work) => (
                  <WorkCard key={work.id} work={work} />
                ))}
              </div>
            )}

            <nav className={s.serviceGuides} aria-label="정비 분야별 상담 안내">
              <Link href="/services/transmission">미션수리 안내 <span aria-hidden="true">↗</span></Link>
              <Link href="/services/diesel-cleaning">디젤클리닝 안내 <span aria-hidden="true">↗</span></Link>
              <Link href="/services/electric-vehicle">전기차 수리 안내 <span aria-hidden="true">↗</span></Link>
              <Link href="/services/drivetrain">4륜·구동계 안내 <span aria-hidden="true">↗</span></Link>
            </nav>
            {result.totalPages > 1 ? (
              <nav className={s.pagination} aria-label="작업사례 페이지">
                {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={makeHref(p)}
                    className={s.pageLink}
                    aria-current={p === result.page ? "page" : undefined}
                  >
                    {p}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
        </section>
      </main>
      <Footer settings={settings} />
      <MobileBottomBar settings={settings} />
    </>
  );
}
