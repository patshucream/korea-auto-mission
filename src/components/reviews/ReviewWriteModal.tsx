"use client";

import { useEffect } from "react";
import { ReviewWriteForm } from "@/components/reviews/ReviewWriteForm";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ReviewWriteModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="모달 닫기"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-write-title"
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[14px] bg-white p-5 shadow-xl sm:rounded-[14px] sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="review-write-title" className="text-xl font-black text-charcoal">
              후기 작성하기
            </h2>
            <p className="mt-1 text-sm text-muted">소중한 이용 경험을 남겨 주세요.</p>
          </div>
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-[10px] border border-border text-lg"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <ReviewWriteForm embedded onSuccess={() => {}} />
      </div>
    </div>
  );
}
