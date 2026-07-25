"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import { maskAuthorName } from "@/lib/reviews";
import { formatDateKo } from "@/lib/utils";
import { ReviewStars } from "@/components/reviews/ReviewStars";

type Props = {
  review: Review;
  variant?: "dark" | "light";
};

const PREVIEW_LEN = 140;

export function ReviewCard({ review, variant = "dark" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const long = review.content.length > PREVIEW_LEN;
  const text =
    !long || expanded ? review.content : `${review.content.slice(0, PREVIEW_LEN).trim()}…`;
  const isDark = variant === "dark";

  return (
    <article
      className={
        isDark
          ? "flex h-full flex-col rounded-[12px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
          : "flex h-full flex-col rounded-[12px] border border-border bg-white p-5"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={isDark ? "font-semibold text-white" : "font-semibold text-charcoal"}>
            {maskAuthorName(review.author_name)}
          </p>
          {review.vehicle_name ? (
            <p className={isDark ? "mt-0.5 text-sm text-white/50" : "mt-0.5 text-sm text-muted"}>
              {review.vehicle_name}
            </p>
          ) : null}
        </div>
        {isDark ? (
          <ReviewStars rating={review.rating} size="sm" />
        ) : (
          <p className="text-sm font-medium text-charcoal" aria-label={`별점 ${review.rating}점`}>
            <span>{"★".repeat(review.rating)}</span>
            <span className="text-gray-300">{"★".repeat(5 - review.rating)}</span>
          </p>
        )}
      </div>

      <p
        className={
          isDark
            ? "mt-4 flex-1 text-[0.98rem] leading-relaxed text-white/75"
            : "mt-4 flex-1 text-[0.98rem] leading-relaxed text-charcoal-soft"
        }
      >
        {text}
      </p>
      {long ? (
        <button
          type="button"
          className={
            isDark
              ? "mt-2 self-start text-sm font-semibold text-white/70 underline-offset-2 hover:underline"
              : "mt-2 self-start text-sm font-semibold text-navy underline-offset-2 hover:underline"
          }
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "접기" : "더보기"}
        </button>
      ) : null}

      {review.admin_reply ? (
        <div
          className={
            isDark
              ? "mt-4 rounded-[10px] border border-white/10 bg-black/30 px-3 py-3"
              : "mt-4 rounded-[10px] border border-border bg-gray-100 px-3 py-3"
          }
        >
          <p className={isDark ? "text-xs font-bold text-white/50" : "text-xs font-bold text-muted"}>
            관리자 답변
          </p>
          <p
            className={
              isDark
                ? "mt-1 text-sm leading-relaxed text-white/80"
                : "mt-1 text-sm leading-relaxed text-charcoal-soft"
            }
          >
            {review.admin_reply}
          </p>
        </div>
      ) : null}

      <p className={isDark ? "mt-4 text-xs text-white/40" : "mt-4 text-xs text-muted"}>
        {formatDateKo(review.created_at)}
      </p>
    </article>
  );
}
