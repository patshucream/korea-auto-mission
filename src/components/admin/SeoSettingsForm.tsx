"use client";

import { useState, useTransition } from "react";
import type { SiteSettings } from "@/lib/types";
import { saveSiteSettings } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Props = {
  settings: SiteSettings;
};

export function SeoSettingsForm({ settings }: Props) {
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="card-light space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            await saveSiteSettings({
              seo_title: form.seo_title,
              seo_description: form.seo_description,
              og_image_path: form.og_image_path,
            });
            setMessage("검색 노출 설정이 저장되었습니다.");
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
          }
        });
      }}
    >
      <label className="block">
        <span className="admin-label">사이트 제목</span>
        <input
          className="admin-input"
          value={form.seo_title}
          onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="admin-label">사이트 설명</span>
        <textarea
          className="admin-textarea"
          value={form.seo_description}
          onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
        />
      </label>
      <ImageUploader
        folder="shop"
        label="OpenGraph 이미지"
        value={form.og_image_path}
        onChange={(v) => setForm({ ...form, og_image_path: typeof v === "string" ? v : null })}
      />
      <p className="text-sm text-muted">
        robots.txt와 sitemap.xml은 자동 생성됩니다. LocalBusiness JSON-LD는 홈페이지에
        포함됩니다.
      </p>
      {message ? <p className="font-medium text-navy">{message}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
