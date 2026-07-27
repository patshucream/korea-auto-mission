"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ServiceOption, WorkCase, WorkCaseStatus } from "@/lib/types";
import { upsertWorkCase } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { AdminToast } from "@/components/admin/AdminToast";
import { sanitizeEditorHtml } from "@/lib/editor/sanitize";
import { slugify } from "@/lib/utils";

type Props = {
  initial?: WorkCase | null;
  services: ServiceOption[];
};

type FormState = {
  id?: string;
  title: string;
  subtitle: string;
  slug: string;
  excerpt: string;
  content_json: unknown | null;
  content_html: string;
  status: WorkCaseStatus;
  scheduled_at: string;
  manufacturer: string;
  vehicle_model: string;
  model_year: string;
  mileage: string;
  fuel_type: string;
  transmission_type: string;
  service_id: string;
  service_category: string;
  symptoms: string;
  diagnosis: string;
  cause: string;
  repair_process: string;
  replaced_parts: string;
  repair_duration: string;
  warranty_info: string;
  work_summary: string;
  detailed_content: string;
  representative_image_path: string | null;
  gallery_image_paths: string[];
  before_images: string[];
  after_images: string[];
  symptom_tags: string;
  general_tags: string;
  seo_title: string;
  seo_description: string;
  og_title: string;
  og_description: string;
  canonical_url: string;
  noindex: boolean;
  is_featured: boolean;
  display_order: number;
};

function toForm(initial?: WorkCase | null, services: ServiceOption[] = []): FormState {
  const base = initial;
  let serviceId = base?.service_id || "";
  if (!serviceId && base?.service_category) {
    serviceId = services.find((s) => s.title === base.service_category)?.id || "";
  }
  return {
    id: base?.id,
    title: base?.title || "",
    subtitle: base?.subtitle || "",
    slug: base?.slug || "",
    excerpt: base?.excerpt || "",
    content_json: base?.content_json ?? null,
    content_html: base?.content_html || "",
    status: (base?.status as WorkCaseStatus) || (base?.is_published ? "published" : "draft"),
    scheduled_at: base?.scheduled_at ? base.scheduled_at.slice(0, 16) : "",
    manufacturer: base?.manufacturer || base?.vehicle_brand || "",
    vehicle_model: base?.vehicle_model || "",
    model_year: base?.model_year || "",
    mileage: base?.mileage || "",
    fuel_type: base?.fuel_type || "",
    transmission_type: base?.transmission_type || "",
    service_id: serviceId,
    service_category: base?.service_category || "",
    symptoms: base?.symptoms || "",
    diagnosis: base?.diagnosis || "",
    cause: base?.cause || "",
    repair_process: base?.repair_process || "",
    replaced_parts: base?.replaced_parts || "",
    repair_duration: base?.repair_duration || "",
    warranty_info: base?.warranty_info || "",
    work_summary: base?.work_summary || "",
    detailed_content: base?.detailed_content || "",
    representative_image_path: base?.representative_image_path || null,
    gallery_image_paths: base?.gallery_image_paths || [],
    before_images: base?.before_images || [],
    after_images: base?.after_images || [],
    symptom_tags: (base?.symptom_tags || []).join(", "),
    general_tags: (base?.general_tags || []).join(", "),
    seo_title: base?.seo_title || "",
    seo_description: base?.seo_description || "",
    og_title: base?.og_title || "",
    og_description: base?.og_description || "",
    canonical_url: base?.canonical_url || "",
    noindex: Boolean(base?.noindex),
    is_featured: Boolean(base?.is_featured),
    display_order: base?.display_order || 0,
  };
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function WorkCaseEditor({ initial, services }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(() => toForm(initial, services));
  const [preview, setPreview] = useState<"desktop" | "mobile" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  const storageKey = useMemo(
    () => `kam-work-draft-${initial?.id || "new"}`,
    [initial?.id],
  );

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Restore local draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { form: FormState; at: number };
      if (parsed?.form && Date.now() - parsed.at < 1000 * 60 * 60 * 24) {
        const ok = window.confirm("이전에 임시 저장된 작성 내용이 있습니다. 복구할까요?");
        if (ok) setForm(parsed.form);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Autosave local every 20s
  useEffect(() => {
    if (!dirty) return;
    const t = window.setInterval(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ form, at: Date.now() }));
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 20000);
    return () => window.clearInterval(t);
  }, [dirty, form, storageKey]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function buildPayload(statusOverride?: WorkCaseStatus) {
    const status = statusOverride || form.status;
    const selected = services.find((s) => s.id === form.service_id);
    const slug = form.slug.trim() || slugify(form.title || `work-${Date.now()}`);
    const html = sanitizeEditorHtml(form.content_html || "");
    const tags = (value: string) =>
      value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

    return {
      id: form.id,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      slug,
      excerpt: form.excerpt.trim() || null,
      content_json: form.content_json,
      content_html: html || null,
      status,
      scheduled_at: status === "scheduled" && form.scheduled_at
        ? new Date(form.scheduled_at).toISOString()
        : null,
      manufacturer: form.manufacturer.trim(),
      vehicle_brand: form.manufacturer.trim(),
      vehicle_model: form.vehicle_model.trim(),
      model_year: form.model_year.trim(),
      mileage: form.mileage.trim() || null,
      fuel_type: form.fuel_type.trim() || null,
      transmission_type: form.transmission_type.trim() || null,
      service_id: form.service_id || null,
      service_category: selected?.title || form.service_category || "",
      symptoms: form.symptoms,
      diagnosis: form.diagnosis,
      cause: form.cause.trim() || null,
      repair_process: form.repair_process.trim() || null,
      replaced_parts: form.replaced_parts.trim() || null,
      repair_duration: form.repair_duration.trim() || null,
      warranty_info: form.warranty_info.trim() || null,
      work_summary: form.work_summary || form.excerpt || form.symptoms.slice(0, 160),
      detailed_content: form.detailed_content || html.replace(/<[^>]+>/g, " ").trim(),
      representative_image_path: form.representative_image_path,
      gallery_image_paths: form.gallery_image_paths,
      before_images: form.before_images,
      after_images: form.after_images,
      symptom_tags: tags(form.symptom_tags),
      general_tags: tags(form.general_tags),
      seo_title: form.seo_title.trim() || form.title.trim(),
      seo_description:
        form.seo_description.trim() ||
        form.excerpt.trim() ||
        form.work_summary.trim() ||
        null,
      og_title: form.og_title.trim() || null,
      og_description: form.og_description.trim() || null,
      canonical_url: form.canonical_url.trim() || null,
      noindex: form.noindex,
      is_published: status === "published",
      is_featured: form.is_featured,
      display_order: form.display_order,
      published_at:
        status === "published"
          ? initial?.published_at || new Date().toISOString()
          : initial?.published_at || null,
    };
  }

  function save(statusOverride?: WorkCaseStatus, stay = true) {
    if (pending) return;
    if (!form.title.trim()) {
      setToast("제목을 입력해 주세요.");
      return;
    }
    if (!form.service_id) {
      setToast("정비 서비스를 선택해 주세요.");
      return;
    }

    setSaveState("saving");
    startTransition(async () => {
      const payload = buildPayload(statusOverride);
      const result = await upsertWorkCase(payload);
      if (!result.ok) {
        setSaveState("error");
        setToast(result.error);
        return;
      }
      setSaveState("saved");
      setDirty(false);
      setToast(statusOverride === "draft" ? "임시저장되었습니다." : "저장되었습니다.");
      localStorage.removeItem(storageKey);
      if (!form.id) {
        setForm((prev) => ({ ...prev, id: result.id, slug: result.slug }));
      }
      if (!stay) {
        router.push(`/admin/works/${result.id}/edit`);
        router.refresh();
      } else if (statusOverride === "published") {
        router.refresh();
      }
    });
  }

  const folder = form.id ? `works/${form.id}` : "works/temp";
  const autoSeoTitle = form.seo_title || form.title;
  const autoSeoDesc =
    form.seo_description || form.excerpt || form.work_summary || form.symptoms.slice(0, 120);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sticky top-[4.5rem] z-10 rounded-[12px] border border-border bg-white/95 p-3 backdrop-blur">
        <div className="text-sm text-muted">
          {saveState === "saving"
            ? "저장 중…"
            : saveState === "saved"
              ? "저장됨"
              : saveState === "error"
                ? "저장 실패"
                : dirty
                  ? "수정됨"
                  : "준비됨"}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost min-h-11 text-sm" onClick={() => setPreview("desktop")}>
            미리보기
          </button>
          <button
            type="button"
            className="btn btn-secondary min-h-11 text-sm"
            disabled={pending}
            onClick={() => save("draft")}
          >
            임시저장
          </button>
          <button
            type="button"
            className="btn btn-primary min-h-11 text-sm"
            disabled={pending}
            onClick={() => save(form.status === "scheduled" ? "scheduled" : "published")}
          >
            {pending ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4">
          <section className="admin-card space-y-3">
            <label className="block">
              <span className="admin-label">제목 *</span>
              <input
                className="admin-input text-lg font-bold"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="admin-label">부제목</span>
              <input
                className="admin-input"
                value={form.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="admin-label">요약 (발췌)</span>
              <textarea
                className="admin-textarea min-h-20"
                value={form.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
              />
            </label>
          </section>

          <section className="admin-card space-y-3">
            <h2 className="text-lg font-black text-navy">본문 에디터</h2>
            <RichTextEditor
              valueJson={form.content_json}
              folder={folder}
              onChange={(json, html) => {
                setDirty(true);
                setForm((prev) => ({
                  ...prev,
                  content_json: json,
                  content_html: html,
                  detailed_content: prev.detailed_content || html.replace(/<[^>]+>/g, " ").trim(),
                }));
              }}
            />
          </section>

          <section className="admin-card space-y-3">
            <h2 className="text-lg font-black text-navy">정비 리포트 요약</h2>
            <Field label="증상">
              <textarea className="admin-textarea" value={form.symptoms} onChange={(e) => update("symptoms", e.target.value)} />
            </Field>
            <Field label="진단">
              <textarea className="admin-textarea" value={form.diagnosis} onChange={(e) => update("diagnosis", e.target.value)} />
            </Field>
            <Field label="원인">
              <textarea className="admin-textarea" value={form.cause} onChange={(e) => update("cause", e.target.value)} />
            </Field>
            <Field label="작업 과정">
              <textarea className="admin-textarea" value={form.repair_process} onChange={(e) => update("repair_process", e.target.value)} />
            </Field>
            <Field label="교체 부품">
              <textarea className="admin-textarea" value={form.replaced_parts} onChange={(e) => update("replaced_parts", e.target.value)} />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="작업 시간">
                <input className="admin-input" value={form.repair_duration} onChange={(e) => update("repair_duration", e.target.value)} placeholder="예: 2일" />
              </Field>
              <Field label="보증 안내">
                <input className="admin-input" value={form.warranty_info} onChange={(e) => update("warranty_info", e.target.value)} />
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <section className="admin-card space-y-3">
            <h2 className="font-black text-navy">공개 상태</h2>
            <select
              className="admin-select"
              value={form.status}
              onChange={(e) => update("status", e.target.value as WorkCaseStatus)}
            >
              <option value="draft">임시저장</option>
              <option value="published">공개</option>
              <option value="private">비공개</option>
              <option value="scheduled">예약발행</option>
              <option value="trash">휴지통</option>
            </select>
            {form.status === "scheduled" ? (
              <input
                type="datetime-local"
                className="admin-input"
                value={form.scheduled_at}
                onChange={(e) => update("scheduled_at", e.target.value)}
              />
            ) : null}
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => update("is_featured", e.target.checked)}
              />
              추천 사례
            </label>
          </section>

          <section className="admin-card space-y-3">
            <h2 className="font-black text-navy">차량 · 서비스</h2>
            <Field label="제조사">
              <input className="admin-input" value={form.manufacturer} onChange={(e) => update("manufacturer", e.target.value)} />
            </Field>
            <Field label="모델">
              <input className="admin-input" value={form.vehicle_model} onChange={(e) => update("vehicle_model", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="연식">
                <input className="admin-input" value={form.model_year} onChange={(e) => update("model_year", e.target.value)} />
              </Field>
              <Field label="주행거리">
                <input className="admin-input" value={form.mileage} onChange={(e) => update("mileage", e.target.value)} />
              </Field>
            </div>
            <Field label="정비 서비스 *">
              <select
                className="admin-select"
                value={form.service_id}
                onChange={(e) => {
                  const selected = services.find((s) => s.id === e.target.value);
                  setDirty(true);
                  setForm((prev) => ({
                    ...prev,
                    service_id: e.target.value,
                    service_category: selected?.title || "",
                  }));
                }}
              >
                <option value="">선택</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="증상 태그 (쉼표 구분)">
              <input className="admin-input" value={form.symptom_tags} onChange={(e) => update("symptom_tags", e.target.value)} />
            </Field>
            <Field label="일반 태그 (쉼표 구분)">
              <input className="admin-input" value={form.general_tags} onChange={(e) => update("general_tags", e.target.value)} />
            </Field>
          </section>

          <section className="admin-card space-y-3">
            <h2 className="font-black text-navy">대표 · 갤러리</h2>
            <ImageUploader
              folder={folder}
              label="대표 이미지"
              value={form.representative_image_path}
              onChange={(v) => update("representative_image_path", typeof v === "string" ? v : null)}
            />
            <ImageUploader
              folder={folder}
              label="갤러리"
              multiple
              reorderable
              values={form.gallery_image_paths}
              onChange={(v) => update("gallery_image_paths", Array.isArray(v) ? v : [])}
            />
            <ImageUploader
              folder={folder}
              label="작업 전 이미지"
              multiple
              reorderable
              values={form.before_images}
              onChange={(v) => update("before_images", Array.isArray(v) ? v : [])}
            />
            <ImageUploader
              folder={folder}
              label="작업 후 이미지"
              multiple
              reorderable
              values={form.after_images}
              onChange={(v) => update("after_images", Array.isArray(v) ? v : [])}
            />
          </section>

          <section className="admin-card space-y-3">
            <h2 className="font-black text-navy">SEO</h2>
            <Field label="슬러그">
              <input
                className="admin-input"
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder={slugify(form.title || "work")}
              />
            </Field>
            <Field label="SEO 제목">
              <input
                className="admin-input"
                value={form.seo_title}
                onChange={(e) => update("seo_title", e.target.value)}
                placeholder={autoSeoTitle}
              />
            </Field>
            <Field label="메타 설명">
              <textarea
                className="admin-textarea min-h-20"
                value={form.seo_description}
                onChange={(e) => update("seo_description", e.target.value)}
                placeholder={autoSeoDesc}
              />
            </Field>
            <Field label="OG 제목">
              <input className="admin-input" value={form.og_title} onChange={(e) => update("og_title", e.target.value)} />
            </Field>
            <Field label="OG 설명">
              <textarea className="admin-textarea min-h-16" value={form.og_description} onChange={(e) => update("og_description", e.target.value)} />
            </Field>
            <Field label="Canonical URL">
              <input className="admin-input" value={form.canonical_url} onChange={(e) => update("canonical_url", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.noindex} onChange={(e) => update("noindex", e.target.checked)} />
              검색 노출 제외 (noindex)
            </label>
          </section>
        </aside>
      </div>

      {preview ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div
            className={`max-h-[90vh] overflow-y-auto rounded-[14px] bg-white p-5 ${
              preview === "mobile" ? "w-full max-w-sm" : "w-full max-w-3xl"
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={() => setPreview("desktop")}>
                  데스크톱
                </button>
                <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={() => setPreview("mobile")}>
                  모바일
                </button>
              </div>
              <button type="button" className="btn btn-secondary min-h-10 text-sm" onClick={() => setPreview(null)}>
                닫기
              </button>
            </div>
            <h1 className="text-2xl font-black">{form.title || "제목 없음"}</h1>
            {form.subtitle ? <p className="mt-2 text-muted">{form.subtitle}</p> : null}
            <div
              className="prose-ko mt-6"
              dangerouslySetInnerHTML={{ __html: sanitizeEditorHtml(form.content_html) }}
            />
          </div>
        </div>
      ) : null}

      <AdminToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      {children}
    </label>
  );
}
