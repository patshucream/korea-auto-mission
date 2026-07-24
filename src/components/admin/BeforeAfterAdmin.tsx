"use client";

import { useState, useTransition } from "react";
import type { BeforeAfter } from "@/lib/types";
import { updateBeforeAfter } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Props = {
  items: BeforeAfter[];
};

export function BeforeAfterAdmin({ items }: Props) {
  const [rows, setRows] = useState(items);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <p className="text-muted">
        카테고리는 인젝터 클리닝 전후 / 흡기 클리닝 전후 두 가지만 제공됩니다. 추가할 수
        없습니다.
      </p>
      {message ? <p className="font-medium text-navy">{message}</p> : null}

      {rows.map((item, index) => (
        <form
          key={item.id}
          className="card-light space-y-4 p-5"
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
                  setMessage(result.error);
                  return;
                }
                setMessage("저장되었습니다.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
              }
            });
          }}
        >
          <h2 className="text-xl font-black">
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
          <label className="flex items-center gap-2 font-bold">
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
          <button type="submit" className="btn btn-primary" disabled={pending}>
            저장
          </button>
        </form>
      ))}
    </div>
  );
}
