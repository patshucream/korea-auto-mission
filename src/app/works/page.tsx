import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { WorkCard } from "@/components/works/WorkCard";
import { WorkFilters } from "@/components/works/WorkFilters";
import { getPaginatedWorks, getSiteSettings } from "@/lib/data/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "작업사례",
  description:
    "코리아오토미션 수입차·국산차 자동변속기 및 디젤 정비 작업사례를 확인하세요.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function WorksPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(first(params.page) || "1") || 1;
  const q = first(params.q);
  const brand = first(params.brand);
  const model = first(params.model);
  const service = first(params.service);
  const hasFilter = Boolean(q || brand || model || service);

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
      <Header settings={settings} />
      <main className="bg-white pb-mobile-bar">
        <section className="section-pad">
          <div className="container-site">
            <h1 className="section-title">작업사례</h1>
            <p className="section-lead">
              브랜드, 증상, 정비 서비스로 실제 진단·정비 사례를 찾아보세요.
            </p>
            <p className="mt-4 text-sm font-bold text-muted">
              전체 작업{" "}
              <span className="text-charcoal">{result.total}</span>건
              {hasFilter ? " · 현재 필터 결과" : ""}
            </p>

            <div className="mt-10">
              <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100" />}>
                <WorkFilters
                  brands={result.brands}
                  models={result.models}
                  services={result.services}
                />
              </Suspense>
            </div>

            <div className="mt-12 flex items-end justify-between gap-4">
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
              <div className="mt-8 grid gap-10 md:grid-cols-2 xl:grid-cols-3">
                {result.items.map((work) => (
                  <WorkCard key={work.id} work={work} />
                ))}
              </div>
            )}

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
