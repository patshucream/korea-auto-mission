"use client";

import { useState, useTransition } from "react";
import { submitPublicReview } from "@/lib/actions/reviews";

type Props = {
  onSuccess?: () => void;
  embedded?: boolean;
};

export function ReviewWriteForm({ onSuccess, embedded }: Props) {
  const [authorName, setAuthorName] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={embedded ? "space-y-5" : "card-light space-y-5 p-5 sm:p-6"}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await submitPublicReview({
            author_name: authorName,
            vehicle_name: vehicleName,
            rating,
            content,
            website,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setMessage(result.message);
          setAuthorName("");
          setVehicleName("");
          setRating(5);
          setContent("");
          onSuccess?.();
        });
      }}
    >
      <div>
        <label className="admin-label" htmlFor="review-author">
          작성자 이름 <span className="text-danger">*</span>
        </label>
        <input
          id="review-author"
          className="admin-input"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={20}
          required
          disabled={pending}
          autoComplete="name"
        />
      </div>

      <div>
        <label className="admin-label" htmlFor="review-vehicle">
          차량명
        </label>
        <input
          id="review-vehicle"
          className="admin-input"
          value={vehicleName}
          onChange={(e) => setVehicleName(e.target.value)}
          maxLength={50}
          placeholder="예: 벤츠 E클래스, 제네시스 G80"
          disabled={pending}
        />
      </div>

      <fieldset>
        <legend className="admin-label">별점 <span className="text-danger">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`min-h-11 min-w-11 rounded-[10px] border px-3 text-lg font-bold ${
                rating >= n
                  ? "border-charcoal bg-charcoal text-white"
                  : "border-border bg-white text-gray-300"
              }`}
              onClick={() => setRating(n)}
              disabled={pending}
              aria-label={`${n}점`}
              aria-pressed={rating === n}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="admin-label" htmlFor="review-content">
          후기 내용 <span className="text-danger">*</span>
        </label>
        <textarea
          id="review-content"
          className="admin-textarea min-h-36"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          required
          disabled={pending}
          placeholder="이용 경험을 10자 이상 작성해 주세요."
        />
        <p className="mt-1 text-right text-xs text-muted">{content.length}/500</p>
      </div>

      {/* 허니팟 */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="review-website">Website</label>
        <input
          id="review-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <p className="rounded-[10px] bg-gray-100 px-3 py-3 text-sm text-muted">
        개인정보(전화번호·이메일)나 차량번호는 작성하지 말아 주세요. 후기는 관리자 확인 후
        공개됩니다.
      </p>

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-success">{message}</p> : null}

      <button type="submit" className="btn btn-primary min-h-11 w-full sm:w-auto" disabled={pending}>
        {pending ? "등록 중…" : "후기 제출"}
      </button>
    </form>
  );
}
