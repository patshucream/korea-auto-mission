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
    "코리아오토미션 수입차·국산차 자동변속기 및 구동계 작업사례를 확인하세요.",
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
  const result = await getPaginatedWorks({
    q: first(params.q),
    brand: first(params.brand),
    model: first(params.model),
    service: first(params.service),
    category: first(params.category),
    sort: first(params.sort) === "oldest" ? "oldest" : "newest",
    page,
    pageSize: 12,
  });
  const settings = await getSiteSettings();

  const makeHref = (nextPage: number) => {
    const sp = new URLSearchParams();
    const q = first(params.q);
    const brand = first(params.brand);
    const model = first(params.model);
    const service = first(params.service);
    const category = first(params.category);
    const sort = first(params.sort);
    if (q) sp.set("q", q);
    if (brand) sp.set("brand", brand);
    if (model) sp.set("model", model);
    if (service) sp.set("service", service);
    if (category) sp.set("category", category);
    if (sort) sp.set("sort", sort);
    if (nextPage > 1) sp.set("page", String(nextPage));
    const qs = sp.toString();
    return qs ? `/works?${qs}` : "/works";
  };

  return (
    <>
      <Header settings={settings} />
      <main className="pb-mobile-bar">
        <section className="section-pad">
          <div className="container-site">
            <h1 className="section-title">작업사례</h1>
            <p className="section-lead">
              브랜드, 모델, 정비 서비스로 원하는 사례를 찾아보세요.
            </p>

            <div className="mt-8">
              <Suspense fallback={<div className="card-light h-40 animate-pulse" />}>
                <WorkFilters
                  brands={result.brands}
                  models={result.models}
                  services={result.services}
                />
              </Suspense>
            </div>

            {result.items.length === 0 ? (
              <p className="mt-10 rounded-[12px] border border-border bg-white px-5 py-10 text-center text-lg text-muted">
                조건에 맞는 작업사례가 없습니다. 필터를 초기화하거나 다른 키워드로 검색해
                주세요.
              </p>
            ) : (
              <>
                <p className="mt-6 text-sm font-medium text-muted">
                  총 {result.total}건 · {result.page}/{result.totalPages}페이지
                </p>
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {result.items.map((work) => (
                    <WorkCard key={work.id} work={work} />
                  ))}
                </div>
                {result.totalPages > 1 ? (
                  <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="페이지">
                    {result.page > 1 ? (
                      <Link href={makeHref(result.page - 1)} className="btn btn-ghost">
                        이전
                      </Link>
                    ) : null}
                    <span className="px-3 font-bold text-charcoal">
                      {result.page} / {result.totalPages}
                    </span>
                    {result.page < result.totalPages ? (
                      <Link href={makeHref(result.page + 1)} className="btn btn-ghost">
                        다음
                      </Link>
                    ) : null}
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer settings={settings} />
      <MobileBottomBar settings={settings} />
    </>
  );
}
