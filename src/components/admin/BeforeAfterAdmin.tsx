"use client";

import { useState, useTransition } from "react";
import type { BeforeAfter } from "@/lib/types";
import { updateBeforeAfter } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AdminToast } from "@/components/admin/AdminToast";

type Props = {
  items: BeforeAfter[];
};

export function BeforeAfterAdmin({ items }: Props) {
  const [rows, setRows] = useState(items);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [pending, startTransition] = useTransition();

  function showToast(message: string, type: "success" | "error" = "success") {
    setToastType(type);
    setToast(message);
  }

  return (
    <div className="space-y-6">
      <AdminToast message={toast} type={toastType} onClose={() => setToast(null)} />

      <p className="text-muted">
        카테고리는 인젝터 클리닝 전후 / 흡기 클리닝 전후 두 가지만 제공됩니다. 추가할 수
        없습니다.
      </p>

      {rows.map((item, index) => (
        <form
          key={item.id}
          className="admin-card space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              try {
                const result = await updateBeforeAfter({
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  before_image_path: item.before_image_path,
                  after_image_path: item.after_image_path,
                  is_published: item.is_published,
                });
                if (!result.ok) {
                  showToast(result.error, "error");
                  return;
                }
                showToast("저장되었습니다.");
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
            {item.category === "injector" ? "인젝터 클리닝 전후" : "흡기 클리닝 전후"}
          </h2>
          <label className="block">
            <span className="admin-label">제목</span>
            <input
              className="admin-input"
              value={item.title}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...item, title: e.target.value };
                setRows(next);
              }}
            />
          </label>
          <label className="block">
            <span className="admin-label">설명</span>
            <textarea
              className="admin-textarea"
              value={item.description}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...item, description: e.target.value };
                setRows(next);
              }}
            />
          </label>
          <ImageUploader
            folder={item.category === "injector" ? "before-after/injector" : "before-after/intake"}
            label="작업 전 이미지"
            value={item.before_image_path}
            onChange={(v) => {
              const next = [...rows];
              next[index] = { ...item, before_image_path: typeof v === "string" ? v : null };
              setRows(next);
            }}
          />
          <ImageUploader
            folder={item.category === "injector" ? "before-after/injector" : "before-after/intake"}
            label="작업 후 이미지"
            value={item.after_image_path}
            onChange={(v) => {
              const next = [...rows];
              next[index] = { ...item, after_image_path: typeof v === "string" ? v : null };
              setRows(next);
            }}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-charcoal">
            <input
              type="checkbox"
              checked={item.is_published}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...item, is_published: e.target.checked };
                setRows(next);
              }}
            />
            게시
          </label>
          <button type="submit" className="btn btn-primary min-h-11" disabled={pending}>
            저장
          </button>
        </form>
      ))}
    </div>
  );
}
