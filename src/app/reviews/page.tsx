import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { getApprovedReviews, getSiteSettings } from "@/lib/data/content";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function ReviewsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const [settings, data] = await Promise.all([
    getSiteSettings(),
    getApprovedReviews({ page, pageSize: 12 }),
  ]);

  return (
    <>
      <Header settings={settings} />
      <main className="pb-mobile-bar">
        <section className="section-pad bg-dark-section text-white">
          <div className="container-site">
            <p className="text-sm font-semibold tracking-wide text-white/45">REVIEWS</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">고객 후기</h1>
            <p className="mt-3 max-w-2xl text-white/60">
              코리아오토미션을 이용하신 고객님의 실제 후기입니다.
            </p>
            {data.total > 0 ? (
              <p className="mt-4 text-sm text-white/55">
                평균 {data.averageRating.toFixed(1)} · 공개 후기 {data.total}개
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/reviews/write" className="btn btn-light min-h-11">
                후기 작성하기
              </Link>
              <Link href="/#reviews" className="btn btn-on-dark min-h-11">
                홈으로
              </Link>
            </div>

            {data.items.length === 0 ? (
              <div className="mt-12 rounded-[12px] border border-white/10 bg-white/[0.03] px-5 py-12 text-center text-white/65">
                아직 공개된 후기가 없습니다.
              </div>
            ) : (
              <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {data.items.map((review) => (
                  <ReviewCard key={review.id} review={review} variant="dark" />
                ))}
              </div>
            )}

            {data.totalPages > 1 ? (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {page > 1 ? (
                  <Link
                    href={`/reviews?page=${page - 1}`}
                    className="btn btn-on-dark min-h-11"
                  >
                    이전
                  </Link>
                ) : null}
                <span className="text-sm text-white/50">
                  {page} / {data.totalPages}
                </span>
                {page < data.totalPages ? (
                  <Link
                    href={`/reviews?page=${page + 1}`}
                    className="btn btn-on-dark min-h-11"
                  >
                    더보기
                  </Link>
                ) : null}
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
