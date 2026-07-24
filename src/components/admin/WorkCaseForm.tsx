"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ServiceOption, WorkCase } from "@/lib/types";
import { upsertWorkCase } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { slugify } from "@/lib/utils";

type Props = {
  initial?: WorkCase | null;
  services: ServiceOption[];
};

const empty: Omit<WorkCase, "id" | "created_at"> & { id?: string } = {
  slug: "",
  title: "",
  vehicle_brand: "",
  vehicle_model: "",
  model_year: "",
  service_id: null,
  service_category: "",
  symptoms: "",
  diagnosis: "",
  work_summary: "",
  detailed_content: "",
  representative_image_path: null,
  gallery_image_paths: [],
  naver_blog_url: "",
  published_at: null,
  is_published: false,
  is_featured: false,
  display_order: 0,
  seo_title: "",
  seo_description: "",
};

export function WorkCaseForm({ initial, services }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(() => {
    const base = { ...empty, ...initial };
    if (!base.service_id && base.service_category) {
      const match = services.find((s) => s.title === base.service_category);
      if (match) base.service_id = match.id;
    }
    return base;
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectService(serviceId: string) {
    const selected = services.find((s) => s.id === serviceId);
    setForm((prev) => ({
      ...prev,
      service_id: serviceId || null,
      service_category: selected?.title ?? "",
    }));
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        setMessage(null);

        if (!form.title.trim()) {
          setMessage("제목을 입력해 주세요.");
          return;
        }
        if (!form.service_id) {
          setMessage("정비 서비스를 선택해 주세요.");
          return;
        }

        startTransition(async () => {
          try {
            const selected = services.find((s) => s.id === form.service_id);
            const payload = {
              id: form.id,
              slug: form.slug || slugify(form.title),
              title: form.title.trim(),
              vehicle_brand: form.vehicle_brand,
              vehicle_model: form.vehicle_model,
              model_year: form.model_year,
              service_id: form.service_id,
              service_category: selected?.title || form.service_category || "",
              symptoms: form.symptoms,
              diagnosis: form.diagnosis,
              work_summary: form.work_summary,
              detailed_content: form.detailed_content,
              representative_image_path: form.representative_image_path,
              gallery_image_paths: form.gallery_image_paths || [],
              naver_blog_url: form.naver_blog_url || null,
              is_published: form.is_published,
              is_featured: form.is_featured,
              display_order: form.display_order || 0,
              seo_title: form.seo_title || null,
              seo_description: form.seo_description || null,
              published_at: form.is_published
                ? form.published_at || new Date().toISOString()
                : form.published_at,
            };
            const result = await upsertWorkCase(payload);
            setMessage("저장되었습니다.");
            router.push(`/admin/works/${result.id}`);
            router.refresh();
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="admin-label">제목</span>
          <input
            className="admin-input"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            disabled={pending}
          />
        </label>
        <label className="block">
          <span className="admin-label">슬러그</span>
          <input
            className="admin-input"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            placeholder="비워두면 자동 생성"
            disabled={pending}
          />
        </label>
        <label className="block">
          <span className="admin-label">정비 서비스</span>
          <select
            className="admin-select"
            value={form.service_id || ""}
            onChange={(e) => selectService(e.target.value)}
            required
            disabled={pending || services.length === 0}
          >
            <option value="">서비스를 선택하세요</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          {services.length === 0 ? (
            <span className="mt-1 block text-sm text-red-700">
              등록된 정비 서비스가 없습니다. 먼저 &quot;정비 서비스&quot; 메뉴에서 추가해
              주세요.
            </span>
          ) : null}
        </label>
        <label className="block">
          <span className="admin-label">차량 브랜드</span>
          <input
            className="admin-input"
            value={form.vehicle_brand}
            onChange={(e) => update("vehicle_brand", e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="block">
          <span className="admin-label">차량 모델</span>
          <input
            className="admin-input"
            value={form.vehicle_model}
            onChange={(e) => update("vehicle_model", e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="block">
          <span className="admin-label">연식</span>
          <input
            className="admin-input"
            value={form.model_year}
            onChange={(e) => update("model_year", e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="block">
          <span className="admin-label">네이버 블로그 URL</span>
          <input
            className="admin-input"
            value={form.naver_blog_url || ""}
            onChange={(e) => update("naver_blog_url", e.target.value)}
            disabled={pending}
          />
        </label>
      </div>

      <label className="block">
        <span className="admin-label">증상</span>
        <textarea
          className="admin-textarea"
          value={form.symptoms}
          onChange={(e) => update("symptoms", e.target.value)}
          disabled={pending}
        />
      </label>
      <label className="block">
        <span className="admin-label">진단</span>
        <textarea
          className="admin-textarea"
          value={form.diagnosis}
          onChange={(e) => update("diagnosis", e.target.value)}
          disabled={pending}
        />
      </label>
      <label className="block">
        <span className="admin-label">작업 요약</span>
        <textarea
          className="admin-textarea"
          value={form.work_summary}
          onChange={(e) => update("work_summary", e.target.value)}
          disabled={pending}
        />
      </label>
      <label className="block">
        <span className="admin-label">상세 내용</span>
        <textarea
          className="admin-textarea min-h-48"
          value={form.detailed_content}
          onChange={(e) => update("detailed_content", e.target.value)}
          disabled={pending}
        />
      </label>

      <ImageUploader
        folder={form.id ? `works/${form.id}` : "works/temp"}
        label="대표 이미지"
        value={form.representative_image_path}
        onChange={(v) =>
          update("representative_image_path", typeof v === "string" ? v : null)
        }
      />

      <ImageUploader
        folder={form.id ? `works/${form.id}` : "works/temp"}
        label="갤러리 이미지"
        multiple
        reorderable
        values={form.gallery_image_paths || []}
        onChange={(v) => update("gallery_image_paths", Array.isArray(v) ? v : [])}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="admin-label">SEO 제목</span>
          <input
            className="admin-input"
            value={form.seo_title || ""}
            onChange={(e) => update("seo_title", e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="block">
          <span className="admin-label">SEO 설명</span>
          <input
            className="admin-input"
            value={form.seo_description || ""}
            onChange={(e) => update("seo_description", e.target.value)}
            disabled={pending}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 font-bold">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => update("is_published", e.target.checked)}
            disabled={pending}
          />
          게시
        </label>
        <label className="flex items-center gap-2 font-bold">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => update("is_featured", e.target.checked)}
            disabled={pending}
          />
          추천 사례
        </label>
      </div>

      {message ? <p className="font-medium text-navy">{message}</p> : null}

      <button type="submit" className="btn btn-primary" disabled={pending || services.length === 0}>
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
