"use client";

import { useState } from "react";
import Link from "next/link";
import type { Review } from "@/lib/types";
import { averageRating } from "@/lib/reviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewWriteModal } from "@/components/reviews/ReviewWriteModal";

type Props = {
  reviews: Review[];
  totalApproved?: number;
  average?: number;
};

export function Reviews({ reviews, totalApproved, average }: Props) {
  const [open, setOpen] = useState(false);
  const avg = average ?? averageRating(reviews);
  const total = totalApproved ?? reviews.length;

  return (
    <section id="reviews" className="section-pad bg-dark-section text-white">
      <div className="container-site">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="section-title text-white">고객 후기</h2>
            <p className="section-lead text-white/60">
              코리아오토미션을 이용하신 고객님의 실제 후기를 확인해보세요.
            </p>
            {total > 0 ? (
              <p className="mt-4 text-sm text-white/55">
                평균 <span className="font-semibold text-white">{avg.toFixed(1)}</span> · 공개 후기{" "}
                <span className="font-semibold text-white">{total}</span>개
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-light min-h-11" onClick={() => setOpen(true)}>
              후기 작성하기
            </button>
            <Link href="/reviews" className="btn btn-on-dark min-h-11">
              전체 후기 보기
            </Link>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="mt-10 rounded-[12px] border border-white/10 bg-white/[0.03] px-5 py-12 text-center">
            <p className="text-white/70">아직 공개된 고객 후기가 없습니다.</p>
            <p className="mt-2 text-sm text-white/45">
              첫 후기를 남겨 주시면 다른 고객에게 큰 도움이 됩니다.
            </p>
            <button
              type="button"
              className="btn btn-light mt-6 min-h-11"
              onClick={() => setOpen(true)}
            >
              후기 작성하기
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} variant="dark" />
            ))}
          </div>
        )}
      </div>

      <ReviewWriteModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
