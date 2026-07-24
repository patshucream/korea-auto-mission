import type { Review } from "@/lib/types";

type Props = {
  reviews: Review[];
};

export function Reviews({ reviews }: Props) {
  return (
    <section className="section-pad bg-warm-white">
      <div className="container-site">
        <h2 className="section-title">고객 후기</h2>
        <p className="section-lead">
          등록된 고객 후기를 확인하세요. 샘플 문구는 관리자에서 수정·게시할 수 있습니다.
        </p>

        {reviews.length === 0 ? (
          <p className="mt-10 rounded-[12px] border border-border bg-white px-5 py-8 text-center text-muted">
            아직 게시된 고객 후기가 없습니다. 방문 후 남겨 주신 소중한 의견을 이곳에
            안내할 예정입니다.
          </p>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.id} className="card-light p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-charcoal">{review.customer_name}</p>
                  <p className="text-sm font-bold text-navy" aria-label={`별점 ${review.rating}점`}>
                    {"★".repeat(review.rating)}
                    <span className="text-border">{"★".repeat(5 - review.rating)}</span>
                  </p>
                </div>
                {review.vehicle_info ? (
                  <p className="mt-1 text-sm font-medium text-muted">{review.vehicle_info}</p>
                ) : null}
                <p className="mt-4 text-[1.02rem] leading-relaxed text-charcoal-soft">
                  {review.content}
                </p>
                {review.is_sample ? (
                  <p className="mt-3 text-xs font-bold text-muted">샘플 콘텐츠</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
