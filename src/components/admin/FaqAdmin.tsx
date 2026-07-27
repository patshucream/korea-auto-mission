"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Faq } from "@/lib/types";
import { deleteFaq, upsertFaq } from "@/lib/actions/admin";
import { AdminToast } from "@/components/admin/AdminToast";

type Props = {
  initialFaqs: Faq[];
};

export function FaqAdmin({ initialFaqs }: Props) {
  const router = useRouter();
  const [faqs, setFaqs] = useState(initialFaqs);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [pending, startTransition] = useTransition();

  function showToast(message: string, type: "success" | "error" = "success") {
    setToastType(type);
    setToast(message);
  }

  return (
    <div className="space-y-5">
      <AdminToast message={toast} type={toastType} onClose={() => setToast(null)} />

      <button
        type="button"
        className="btn btn-primary min-h-11"
        onClick={() =>
          setEditing({
            id: "",
            question: "",
            answer: "",
            display_order: faqs.length + 1,
            is_published: true,
          })
        }
      >
        FAQ 추가
      </button>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={faq.id} className="admin-card">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold tracking-[-0.01em] text-charcoal">
                  {index + 1}. {faq.question}
                </p>
                <p className="mt-1 text-sm text-muted">{faq.is_published ? "게시" : "비공개"}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary min-h-11 text-sm"
                  onClick={() => setEditing(faq)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="btn btn-ghost min-h-11 text-sm"
                  onClick={() => {
                    if (!confirm("삭제할까요?")) return;
                    startTransition(async () => {
                      try {
                        await deleteFaq(faq.id);
                        setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
                        showToast("삭제되었습니다.");
                      } catch (error) {
                        showToast(
                          error instanceof Error ? error.message : "삭제에 실패했습니다.",
                          "error",
                        );
                      }
                    });
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <form
          className="admin-card space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              try {
                const result = await upsertFaq({
                  id: editing.id || undefined,
                  question: editing.question,
                  answer: editing.answer,
                  display_order: editing.display_order,
                  is_published: editing.is_published,
                });
                if (!result.ok) {
                  showToast(result.error, "error");
                  return;
                }
                showToast("저장되었습니다.");
                setEditing(null);
                router.refresh();
              } catch (error) {
                showToast(
                  error instanceof Error ? error.message : "저장에 실패했습니다.",
                  "error",
                );
              }
            });
          }}
        >
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-charcoal">
            {editing.id ? "FAQ 수정" : "FAQ 추가"}
          </h2>
          <label className="block">
            <span className="admin-label">질문</span>
            <input
              className="admin-input"
              value={editing.question}
              onChange={(e) => setEditing({ ...editing, question: e.target.value })}
              required
            />
          </label>
          <label className="block">
            <span className="admin-label">답변</span>
            <textarea
              className="admin-textarea min-h-36"
              value={editing.answer}
              onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
              required
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-charcoal">
            <input
              type="checkbox"
              checked={editing.is_published}
              onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
            />
            게시
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary min-h-11" disabled={pending}>
              저장
            </button>
            <button
              type="button"
              className="btn btn-ghost min-h-11"
              onClick={() => setEditing(null)}
            >
              취소
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
