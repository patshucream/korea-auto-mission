"use client";

import { useState, useTransition } from "react";
import type { Faq } from "@/lib/types";
import { deleteFaq, upsertFaq } from "@/lib/actions/admin";

type Props = {
  initialFaqs: Faq[];
};

export function FaqAdmin({ initialFaqs }: Props) {
  const [faqs, setFaqs] = useState(initialFaqs);
  const [editing, setEditing] = useState<Faq | null>(null);
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
            question: "",
            answer: "",
            display_order: faqs.length + 1,
            is_published: true,
          })
        }
      >
        FAQ 추가
      </button>
      {message ? <p className="font-medium text-navy">{message}</p> : null}

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={faq.id} className="card-light p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-black">
                  {index + 1}. {faq.question}
                </p>
                <p className="text-sm text-muted">{faq.is_published ? "게시" : "비공개"}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary min-h-10 text-sm" onClick={() => setEditing(faq)}>
                  수정
                </button>
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 text-sm"
                  onClick={() => {
                    if (!confirm("삭제할까요?")) return;
                    startTransition(async () => {
                      await deleteFaq(faq.id);
                      setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
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
          className="card-light space-y-4 p-5"
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
                  setMessage(result.error);
                  return;
                }
                setMessage("저장되었습니다.");
                setEditing(null);
                window.location.reload();
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
              }
            });
          }}
        >
          <h2 className="text-xl font-black">{editing.id ? "FAQ 수정" : "FAQ 추가"}</h2>
          <label className="block">
            <span className="admin-label">질문</span>
            <input className="admin-input" value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} required />
          </label>
          <label className="block">
            <span className="admin-label">답변</span>
            <textarea className="admin-textarea min-h-36" value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} required />
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
