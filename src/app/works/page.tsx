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
            <header className={s.libraryHeading}><p>코리아오토미션 정비사례</p><h1>한 대씩, 쌓아온 정비 기록.</h1><span>차량의 증상부터 점검, 작업 과정까지.<br />현장에서 남긴 사진과 함께 살펴보세요.</span></header>

            <div>
              <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100" />}>
                <WorkFilters key={JSON.stringify(params)}
                  brands={result.brands}
                  models={result.models}
                  services={result.services}
                />
              </Suspense>
            </div>

            <div className={s.resultCount}>
              <p className="text-sm font-bold text-muted">
                {hasFilter ? "검색 결과" : "최근 작업사례"}{" "}
                <span className="text-charcoal">{result.total}</span>건
              </p>
            </div>

            {result.items.length === 0 ? (
              <div className="mt-8 border border-border px-6 py-14 text-center">
                <p className="text-lg font-black text-charcoal">
                  조건에 맞는 작업사례가 없습니다
                </p>
                <p className="mt-3 text-muted">필터를 초기화하거나 다른 서비스 사례를 확인해 보세요.</p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
            </nav>
            {result.totalPages > 1 ? (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={makeHref(p)}
                    className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-3 text-sm font-bold ${
                      p === result.page
                        ? "border-navy bg-navy text-white"
                        : "border-border text-charcoal"
                    }`}
                    aria-current={p === result.page ? "page" : undefined}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <Footer settings={settings} />
      <MobileBottomBar settings={settings} />
    </>
  );
}
