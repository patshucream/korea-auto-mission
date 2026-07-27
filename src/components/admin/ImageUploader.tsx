"use client";

import { useRef, useState } from "react";
import {
  deleteImageFromStorage,
  uploadImageToStorage,
} from "@/lib/image";
import { getPublicImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Props = {
  folder: string;
  value?: string | null;
  values?: string[];
  multiple?: boolean;
  onChange: (value: string | null | string[]) => void;
  label?: string;
  reorderable?: boolean;
};

export function ImageUploader({
  folder,
  value,
  values,
  multiple = false,
  onChange,
  label = "이미지 업로드",
  reorderable = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const list = multiple ? values || [] : value ? [value] : [];

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadImageToStorage(file, folder, setProgress);
        uploaded.push(result.path);
      }

      if (multiple) {
        onChange([...(values || []), ...uploaded]);
      } else {
        if (value) {
          try {
            await deleteImageFromStorage(value);
          } catch {
            // ignore stale delete
          }
        }
        onChange(uploaded[0] || null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드에 실패했습니다.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeAt(index: number) {
    const path = list[index];
    if (!path) return;
    setError(null);
    try {
      await deleteImageFromStorage(path);
      if (multiple) {
        onChange(list.filter((_, i) => i !== index));
      } else {
        onChange(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  }

  function onDropReorder(toIndex: number) {
    if (!multiple || !reorderable || dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...list];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
    setDragIndex(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="admin-label mb-0">{label}</p>
        <button
          type="button"
          className="btn btn-secondary min-h-11 px-4 text-sm"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
        >
          {progress !== null ? `업로드 중 ${progress}%` : multiple ? "이미지 추가" : "이미지 선택"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error ? <p className="mt-2 text-sm font-medium text-[var(--danger)]">{error}</p> : null}

      {progress !== null ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-light-gray">
          <div className="h-full bg-navy transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      <div className={cn("mt-4 grid gap-3", multiple ? "sm:grid-cols-2 lg:grid-cols-3" : "max-w-md")}>
        {list.map((path, index) => {
          const src = getPublicImageUrl(path);
          return (
            <div
              key={`${path}-${index}`}
              className="overflow-hidden rounded-[12px] border border-border bg-white"
              draggable={multiple && reorderable}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropReorder(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src || ""}
                alt={`업로드 미리보기 ${index + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="flex gap-2 p-2">
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 flex-1 px-2 text-sm"
                  onClick={() => removeAt(index)}
                >
                  삭제
                </button>
                {!multiple ? (
                  <button
                    type="button"
                    className="btn btn-secondary min-h-10 flex-1 px-2 text-sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    교체
                  </button>
                ) : null}
              </div>
              {multiple && reorderable ? (
                <p className="px-2 pb-2 text-xs text-muted">드래그하여 순서 변경</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
