"use client";

import { useMemo, useState } from "react";
import type { MediaItem } from "@/lib/types";
import { getPublicImageUrl } from "@/lib/media";

type Props = {
  open: boolean;
  media: MediaItem[];
  title?: string;
  /** path → 사용처 라벨들 */
  usageLabels?: Record<string, string[]>;
  onClose: () => void;
  onSelect: (path: string) => void;
};

export function MediaPickerModal({
  open,
  media,
  title = "미디어에서 선택",
  usageLabels = {},
  onClose,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return media;
    return media.filter(
      (m) =>
        m.file_name.toLowerCase().includes(q) ||
        m.path.toLowerCase().includes(q) ||
        m.folder.toLowerCase().includes(q),
    );
  }, [media, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[16px] bg-white shadow-xl sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h3 className="text-base font-black text-charcoal">{title}</h3>
          <button type="button" className="btn btn-ghost min-h-10 px-3 text-sm" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="border-b border-border px-4 py-3">
          <input
            className="admin-input"
            type="search"
            placeholder="파일명·폴더 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-muted">미디어가 없습니다.</p>
          ) : (
            filtered.map((item) => {
              const src = getPublicImageUrl(item.path);
              const labels = usageLabels[item.path] || [];
              return (
                <button
                  key={item.id}
                  type="button"
                  className="overflow-hidden rounded-[10px] border border-border text-left hover:border-navy"
                  onClick={() => {
                    onSelect(item.path);
                    onClose();
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src || ""}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full object-cover bg-[var(--warm-white)]"
                  />
                  <div className="space-y-1 p-2">
                    <p className="truncate text-xs font-semibold text-charcoal">
                      {item.file_name || item.path.split("/").pop()}
                    </p>
                    {labels.length > 0 ? (
                      <p className="line-clamp-2 text-[10px] font-medium text-navy">
                        {labels.join(" · ")}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted">미사용</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
