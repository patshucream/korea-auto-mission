"use client";

import { useState, useTransition } from "react";
import type { Review } from "@/lib/types";
import { deleteReview, upsertReview } from "@/lib/actions/admin";

type Props = {
  initialReviews: Review[];
};

export function ReviewsAdmin({ initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [editing, setEditing] = useState<Review | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() =>
          setEditing({
            id: "",
            customer_name: "",
            vehicle_info: "",
            content: "",
            rating: 5,
            display_order: reviews.length + 1,
            is_published: false,
            is_sample: false,
          })
        }
      >
        후기 추가
      </button>
      {message ? <p className="font-medium text-navy">{message}</p> : null}

      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="card-light flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black">{review.customer_name}</p>
              <p className="text-sm text-muted">
                {review.is_published ? "게시" : "비공개"}
                {review.is_sample ? " · 샘플" : ""} · {review.content.slice(0, 60)}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary min-h-10 text-sm" onClick={() => setEditing(review)}>
                수정
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-10 text-sm"
                onClick={() => {
                  if (!confirm("삭제할까요?")) return;
                  startTransition(async () => {
                    await deleteReview(review.id);
                    setReviews((prev) => prev.filter((r) => r.id !== review.id));
                  });
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <form
          className="card-light space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await upsertReview({
                id: editing.id || undefined,
                customer_name: editing.customer_name,
                vehicle_info: editing.vehicle_info,
                content: editing.content,
                rating: editing.rating,
                display_order: editing.display_order,
                is_published: editing.is_published,
                is_sample: editing.is_sample,
              });
              setMessage("저장되었습니다.");
              setEditing(null);
              window.location.reload();
            });
          }}
        >
          <h2 className="text-xl font-black">{editing.id ? "후기 수정" : "후기 추가"}</h2>
          <label className="block">
            <span className="admin-label">고객명</span>
            <input className="admin-input" value={editing.customer_name} onChange={(e) => setEditing({ ...editing, customer_name: e.target.value })} required />
          </label>
          <label className="block">
            <span className="admin-label">차량 정보</span>
            <input className="admin-input" value={editing.vehicle_info} onChange={(e) => setEditing({ ...editing, vehicle_info: e.target.value })} />
          </label>
          <label className="block">
            <span className="admin-label">내용</span>
            <textarea className="admin-textarea" value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} required />
          </label>
          <label className="block">
            <span className="admin-label">별점 (1-5)</span>
            <input
              type="number"
              min={1}
              max={5}
              className="admin-input"
              value={editing.rating}
              onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center gap-2 font-bold">
            <input type="checkbox" checked={editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} />
            게시
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              저장
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              취소
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
