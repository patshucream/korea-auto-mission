"use client";

import { useState, useTransition } from "react";
import type { MediaItem } from "@/lib/types";
import { deleteMediaRecord } from "@/lib/actions/admin";
import { getPublicImageUrl } from "@/lib/media";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Props = {
  initialMedia: MediaItem[];
};

export function MediaAdmin({ initialMedia }: Props) {
  const [media, setMedia] = useState(initialMedia);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [folder, setFolder] = useState("shop");

  return (
    <div className="space-y-6">
      <div className="card-light space-y-4 p-5">
        <h2 className="text-xl font-black">새 이미지 업로드</h2>
        <label className="block max-w-sm">
          <span className="admin-label">저장 폴더</span>
          <select className="admin-select" value={folder} onChange={(e) => setFolder(e.target.value)}>
            <option value="hero">히어로</option>
            <option value="shop">매장·정비</option>
            <option value="services">정비 서비스</option>
            <option value="works">작업사례</option>
            <option value="before-after/injector">작업 전후 · 인젝터</option>
            <option value="before-after/intake">작업 전후 · 흡기</option>
            <option value="reviews">고객 후기</option>
            <option value="brands">브랜드</option>
          </select>
        </label>
        <ImageUploader
          folder={folder}
          multiple
          values={[]}
          onChange={() => {
            setMessage("업로드되었습니다. 목록을 새로고침합니다.");
            window.location.reload();
          }}
          label="여러 장 업로드"
        />
      </div>

      {message ? <p className="font-medium text-navy">{message}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {media.map((item) => {
          const src = getPublicImageUrl(item.path);
          return (
            <article key={item.id} className="card-light overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src || ""} alt={item.alt_text || item.file_name} className="aspect-[4/3] w-full object-cover" />
              <div className="space-y-2 p-3">
                <p className="break-all text-sm font-medium text-charcoal">{item.path}</p>
                <p className="text-xs text-muted">{item.folder}</p>
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 w-full text-sm"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("이 파일을 삭제할까요? 사용 중인 경로인지 확인하세요.")) return;
                    startTransition(async () => {
                      await deleteMediaRecord(item.path);
                      setMedia((prev) => prev.filter((m) => m.id !== item.id));
                      setMessage("삭제되었습니다.");
                    });
                  }}
                >
                  삭제
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {media.length === 0 ? (
        <p className="rounded-[12px] border border-border bg-white px-5 py-8 text-center text-muted">
          등록된 미디어가 없습니다. 위에서 이미지를 업로드해 주세요.
        </p>
      ) : null}
    </div>
  );
}
