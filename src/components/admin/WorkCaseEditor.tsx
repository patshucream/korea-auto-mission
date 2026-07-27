"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { ServiceOption, WorkCase, WorkCaseStatus } from "@/lib/types";
import { upsertWorkCase } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { AdminToast } from "@/components/admin/AdminToast";
import { sanitizeEditorHtml } from "@/lib/editor/sanitize";
import {
  WORK_TEMPLATES,
  buildTemplateSeoTitle,
  buildTemplateTitle,
  fillIfEmpty,
  isEditorDocEmpty,
  mergeCommaTags,
  suggestServiceId,
  templateToDoc,
  type WorkTemplateId,
} from "@/lib/editor/work-templates";
import { getPublicImageUrl } from "@/lib/media";
import {
  buildDefaultSeoDescription,
  buildDefaultSeoTitle,
  normalizeWorkSlugInput,
} from "@/lib/works/seo";

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
  related_work_ids: string;
};

type SaveState = "idle" | "saving" | "saved" | "error" | "dirty";

type ChecklistFocus =
  | "title"
  | "service"
  | "image"
  | "manufacturer"
  | "model"
  | "content"
  | "seo_title"
  | "seo_description"
  | "slug";

type ChecklistItem = {
  key: ChecklistFocus;
  label: string;
  ok: boolean;
  blocking: boolean;
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
    related_work_ids: (base?.related_work_ids || []).join(", "),
  };
}

function hasEditorContent(form: FormState): boolean {
  const htmlText = (form.content_html || "").replace(/<[^>]+>/g, " ").trim();
  if (htmlText) return true;
  return !isEditorDocEmpty(form.content_json);
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function saveStatusLabel(saveState: SaveState): string {
  switch (saveState) {
    case "saving":
      return "저장 중";
    case "saved":
      return "저장됨";
    case "error":
      return "저장 실패";
    case "dirty":
      return "수정됨";
    default:
      return "준비됨";
  }
}

export function WorkCaseEditor({ initial, services }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(() => toForm(initial, services));
  const [editorKey, setEditorKey] = useState(0);
  const [preview, setPreview] = useState<"desktop" | "mobile" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [beforeAfterOpen, setBeforeAfterOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"write" | "settings">("write");
  const [bodyImageUrls, setBodyImageUrls] = useState<string[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    publish: true,
  });

  const titleRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLElement>(null);
  const manufacturerRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);
  const editorSectionRef = useRef<HTMLElement>(null);
  const serviceRef = useRef<HTMLSelectElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const seoTitleRef = useRef<HTMLInputElement>(null);
  const seoDescRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef(form);
  formRef.current = form;

  function showToast(message: string, type: "success" | "error" = "success") {
    setToastType(type);
    setToast(message);
  }

  const storageKey = useMemo(
    () => `kam-work-draft-${initial?.id || "new"}`,
    [initial?.id],
  );

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setDirty(true);
    setSaveState("dirty");
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const persistLocalDraft = useCallback(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ form: formRef.current, at: Date.now() }),
      );
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { form: FormState; at: number };
      if (!parsed?.form || Date.now() - parsed.at >= 1000 * 60 * 60 * 24) return;
      window.setTimeout(() => {
        const ok = window.confirm("이전에 임시 저장된 작성 내용이 있습니다. 복구할까요?");
        if (!ok) return;
        setForm(parsed.form);
        setEditorKey((k) => k + 1);
        setDirty(true);
        setSaveState("dirty");
      }, 0);
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (!dirty) return;
    const t = window.setInterval(() => {
      persistLocalDraft();
    }, 30000);
    return () => window.clearInterval(t);
  }, [dirty, persistLocalDraft]);

  useEffect(() => {
    if (!dirty) return;
    const t = window.setTimeout(() => {
      persistLocalDraft();
    }, 2500);
    return () => window.clearTimeout(t);
  }, [dirty, form, persistLocalDraft]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const vehicleSummary = [form.manufacturer, form.vehicle_model, form.model_year, form.mileage]
    .filter(Boolean)
    .join(" · ");

  const reportSummary = [form.symptoms, form.diagnosis, form.cause].some(Boolean)
    ? "요약 입력됨"
    : "추가 정보 없음";

  const checklistItems = useMemo((): ChecklistItem[] => {
    return [
      { key: "title", label: "제목", ok: Boolean(form.title.trim()), blocking: true },
      {
        key: "service",
        label: "정비 서비스",
        ok: Boolean(form.service_id),
        blocking: true,
      },
      {
        key: "image",
        label: "대표 이미지",
        ok: Boolean(form.representative_image_path),
        blocking: false,
      },
      {
        key: "manufacturer",
        label: "제조사",
        ok: Boolean(form.manufacturer.trim()),
        blocking: false,
      },
      {
        key: "model",
        label: "차량 모델",
        ok: Boolean(form.vehicle_model.trim()),
        blocking: false,
      },
      {
        key: "content",
        label: "본문",
        ok: hasEditorContent(form),
        blocking: false,
      },
      {
        key: "seo_title",
        label: "SEO 제목",
        ok: Boolean(form.seo_title.trim()),
        blocking: false,
      },
      {
        key: "seo_description",
        label: "메타 설명",
        ok: Boolean(form.seo_description.trim()),
        blocking: false,
      },
      {
        key: "slug",
        label: "슬러그",
        ok: Boolean(form.slug.trim()),
        blocking: false,
      },
    ];
  }, [form]);

  const hasBlockers = checklistItems.some((item) => item.blocking && !item.ok);

  function applyTemplate(id: WorkTemplateId) {
    const template = WORK_TEMPLATES.find((t) => t.id === id);
    if (!template) return;

    const bodyEmpty = isEditorDocEmpty(form.content_json);
    const doc = bodyEmpty ? templateToDoc(template) : null;

    setDirty(true);
    setSaveState("dirty");
    setForm((prev) => {
      const nextServiceId = suggestServiceId(template, services, prev.service_id);
      const selected = services.find((s) => s.id === nextServiceId);
      return {
        ...prev,
        ...(doc ? { content_json: doc, content_html: "" } : {}),
        title: fillIfEmpty(
          prev.title,
          buildTemplateTitle(template, prev.manufacturer, prev.vehicle_model),
        ),
        excerpt: fillIfEmpty(prev.excerpt, template.excerptHint),
        seo_title: fillIfEmpty(
          prev.seo_title,
          buildTemplateSeoTitle(template, prev.manufacturer, prev.vehicle_model),
        ),
        seo_description: fillIfEmpty(prev.seo_description, template.seoDescriptionHint),
        symptoms: fillIfEmpty(prev.symptoms, template.reportDefaults.symptoms || ""),
        diagnosis: fillIfEmpty(prev.diagnosis, template.reportDefaults.diagnosis || ""),
        cause: fillIfEmpty(prev.cause, template.reportDefaults.cause || ""),
        repair_process: fillIfEmpty(
          prev.repair_process,
          template.reportDefaults.repair_process || "",
        ),
        replaced_parts: fillIfEmpty(
          prev.replaced_parts,
          template.reportDefaults.replaced_parts || "",
        ),
        warranty_info: fillIfEmpty(
          prev.warranty_info,
          template.reportDefaults.warranty_info || "",
        ),
        symptom_tags: mergeCommaTags(prev.symptom_tags, template.symptomTags),
        general_tags: mergeCommaTags(prev.general_tags, template.generalTags),
        service_id: nextServiceId,
        service_category: selected?.title || prev.service_category,
      };
    });

    if (bodyEmpty) {
      setEditorKey((k) => k + 1);
      showToast(`${template.label} 템플릿을 적용했습니다.`);
    } else {
      showToast("본문은 유지하고 빈 항목만 채웠습니다");
    }
  }

  function autofillSeoDefaults() {
    setDirty(true);
    setSaveState("dirty");
    setForm((prev) => ({
      ...prev,
      slug: fillIfEmpty(prev.slug, normalizeWorkSlugInput("", prev.title)),
      seo_title: fillIfEmpty(
        prev.seo_title,
        buildDefaultSeoTitle({
          title: prev.title,
          manufacturer: prev.manufacturer,
          vehicle_model: prev.vehicle_model,
        }),
      ),
      seo_description: fillIfEmpty(
        prev.seo_description,
        buildDefaultSeoDescription({
          excerpt: prev.excerpt,
          work_summary: prev.work_summary,
          symptoms: prev.symptoms,
          diagnosis: prev.diagnosis,
          title: prev.title,
        }),
      ),
    }));
    showToast("SEO 기본값을 채웠습니다.");
  }

  function buildPayload(statusOverride?: WorkCaseStatus) {
    const status = statusOverride || form.status;
    const selected = services.find((s) => s.id === form.service_id);
    const slug = normalizeWorkSlugInput(form.slug, form.title || `work-${Date.now()}`);
    const html = sanitizeEditorHtml(form.content_html || "");
    const seoTitle = form.seo_title.trim()
      ? form.seo_title.trim()
      : buildDefaultSeoTitle({
          title: form.title,
          manufacturer: form.manufacturer,
          vehicle_model: form.vehicle_model,
        });
    const seoDescription =
      form.seo_description.trim() ||
      buildDefaultSeoDescription({
        excerpt: form.excerpt,
        work_summary: form.work_summary,
        symptoms: form.symptoms,
        diagnosis: form.diagnosis,
        title: form.title,
      });

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      slug,
      excerpt: form.excerpt.trim() || null,
      content_json: form.content_json,
      content_html: html || null,
      status,
      scheduled_at:
        status === "scheduled" && form.scheduled_at
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
      symptom_tags: splitCsv(form.symptom_tags),
      general_tags: splitCsv(form.general_tags),
      related_work_ids: splitCsv(form.related_work_ids),
      seo_title: seoTitle,
      seo_description: seoDescription || null,
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

    const existingId = typeof form.id === "string" ? form.id.trim() : "";
    if (existingId && existingId !== "$undefined") {
      payload.id = existingId;
    }

    return payload;
  }

  function save(statusOverride?: WorkCaseStatus) {
    if (pending) return;
    if (!form.title.trim()) {
      showToast("제목을 입력해 주세요.", "error");
      setMobileTab("write");
      titleRef.current?.focus();
      return;
    }
    if (!form.service_id) {
      showToast("정비 서비스를 선택해 주세요. (설정 패널)", "error");
      setMobileTab("settings");
      setPanelOpen(true);
      setOpenSections((s) => ({ ...s, publish: true }));
      return;
    }

    setSaveState("saving");
    startTransition(async () => {
      const payload = buildPayload(statusOverride);
      const result = await upsertWorkCase(payload);
      if (!result.ok) {
        setSaveState("error");
        showToast(result.error, "error");
        return;
      }
      setSaveState("saved");
      setDirty(false);
      setPublishOpen(false);
      showToast(statusOverride === "draft" ? "임시저장되었습니다." : "공개 저장되었습니다.");
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      if (!form.id) {
        setForm((prev) => ({ ...prev, id: result.id, slug: result.slug }));
        router.replace(`/admin/works/${result.id}/edit`);
      }
      router.refresh();
    });
  }

  function focusChecklistItem(key: ChecklistFocus) {
    setPublishOpen(false);

    const scrollFocus = (el: HTMLElement | null) => {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el && "focus" in el) {
        window.setTimeout(() => {
          (el as HTMLInputElement).focus?.();
        }, 150);
      }
    };

    switch (key) {
      case "title":
        setMobileTab("write");
        scrollFocus(titleRef.current);
        break;
      case "service":
        setMobileTab("settings");
        setPanelOpen(true);
        setOpenSections((s) => ({ ...s, publish: true }));
        window.setTimeout(() => scrollFocus(serviceRef.current), 50);
        break;
      case "image":
        setMobileTab("write");
        scrollFocus(imageRef.current);
        break;
      case "manufacturer":
        setMobileTab("write");
        setVehicleOpen(true);
        window.setTimeout(() => scrollFocus(manufacturerRef.current), 50);
        break;
      case "model":
        setMobileTab("write");
        setVehicleOpen(true);
        window.setTimeout(() => scrollFocus(modelRef.current), 50);
        break;
      case "content":
        setMobileTab("write");
        scrollFocus(editorSectionRef.current);
        break;
      case "seo_title":
        setMobileTab("settings");
        setPanelOpen(true);
        setOpenSections((s) => ({ ...s, seo: true }));
        window.setTimeout(() => scrollFocus(seoTitleRef.current), 50);
        break;
      case "seo_description":
        setMobileTab("settings");
        setPanelOpen(true);
        setOpenSections((s) => ({ ...s, seo: true }));
        window.setTimeout(() => scrollFocus(seoDescRef.current), 50);
        break;
      case "slug":
        setMobileTab("settings");
        setPanelOpen(true);
        setOpenSections((s) => ({ ...s, seo: true }));
        window.setTimeout(() => scrollFocus(slugRef.current), 50);
        break;
      default:
        break;
    }
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const folder = form.id ? `works/${form.id}` : "works/temp";

  const settingsPanel = (
    <div className="space-y-3">
      <Fold
        title="공개 상태"
        summary={
          form.status === "published"
            ? "공개"
            : form.status === "draft"
              ? "임시저장"
              : form.status === "scheduled"
                ? "예약발행"
                : form.status
        }
        open={!!openSections.publish}
        onToggle={() => toggleSection("publish")}
      >
        <select
          className="admin-select"
          value={form.status}
          onChange={(e) => update("status", e.target.value as WorkCaseStatus)}
        >
          <option value="draft">임시저장</option>
          <option value="published">공개</option>
          <option value="private">비공개</option>
          <option value="scheduled">예약발행</option>
        </select>
        {form.status === "scheduled" ? (
          <input
            type="datetime-local"
            className="admin-input mt-2"
            value={form.scheduled_at}
            onChange={(e) => update("scheduled_at", e.target.value)}
          />
        ) : null}
        <label className="mt-3 block">
          <span className="admin-label">정비 서비스 *</span>
          <select
            ref={serviceRef}
            className="admin-select"
            value={form.service_id}
            onChange={(e) => {
              const selected = services.find((s) => s.id === e.target.value);
              setDirty(true);
              setSaveState("dirty");
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
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => update("is_featured", e.target.checked)}
          />
          추천 사례
        </label>
      </Fold>

      <Fold
        title="차량 상세"
        summary={
          [form.fuel_type, form.transmission_type].filter(Boolean).join(" · ") ||
          "추가 정보 없음"
        }
        open={!!openSections.vehicleDetail}
        onToggle={() => toggleSection("vehicleDetail")}
      >
        <Field label="연료">
          <input
            className="admin-input"
            value={form.fuel_type}
            onChange={(e) => update("fuel_type", e.target.value)}
          />
        </Field>
        <Field label="변속기">
          <input
            className="admin-input"
            value={form.transmission_type}
            onChange={(e) => update("transmission_type", e.target.value)}
          />
        </Field>
      </Fold>

      <Fold
        title="태그"
        summary={form.symptom_tags || form.general_tags || "추가 정보 없음"}
        open={!!openSections.tags}
        onToggle={() => toggleSection("tags")}
      >
        <Field label="증상 태그">
          <input
            className="admin-input"
            value={form.symptom_tags}
            onChange={(e) => update("symptom_tags", e.target.value)}
            placeholder="쉼표로 구분"
          />
        </Field>
        <Field label="일반 태그">
          <input
            className="admin-input"
            value={form.general_tags}
            onChange={(e) => update("general_tags", e.target.value)}
            placeholder="쉼표로 구분"
          />
        </Field>
      </Fold>

      <Fold
        title="SEO"
        summary={form.seo_title || form.slug || "추가 정보 없음"}
        open={!!openSections.seo}
        onToggle={() => toggleSection("seo")}
      >
        <Field label="슬러그">
          <input
            ref={slugRef}
            className="admin-input"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            placeholder={normalizeWorkSlugInput("", form.title || "work")}
          />
        </Field>
        <Field label="SEO 제목">
          <input
            ref={seoTitleRef}
            className="admin-input"
            value={form.seo_title}
            onChange={(e) => update("seo_title", e.target.value)}
          />
        </Field>
        <Field label="메타 설명">
          <textarea
            ref={seoDescRef}
            className="admin-textarea min-h-20"
            value={form.seo_description}
            onChange={(e) => update("seo_description", e.target.value)}
          />
        </Field>
        <label className="mt-2 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.noindex}
            onChange={(e) => update("noindex", e.target.checked)}
          />
          검색 노출 제외
        </label>
        <button
          type="button"
          className="btn btn-secondary mt-3 min-h-10 w-full text-sm"
          onClick={autofillSeoDefaults}
        >
          SEO 기본값 채우기
        </button>
      </Fold>

      <Fold
        title="관련 작업사례"
        summary={
          splitCsv(form.related_work_ids).length
            ? `${splitCsv(form.related_work_ids).length}개 연결`
            : "추가 정보 없음"
        }
        open={!!openSections.related}
        onToggle={() => toggleSection("related")}
      >
        <Field label="관련 작업사례 ID">
          <input
            className="admin-input"
            value={form.related_work_ids}
            onChange={(e) => update("related_work_ids", e.target.value)}
            placeholder="UUID를 쉼표로 구분"
          />
        </Field>
        <p className="mt-1 text-xs text-muted">
          관련 작업사례 UUID를 쉼표로 구분해 입력하세요.
        </p>
      </Fold>
    </div>
  );

  return (
    <div className="pb-24 xl:pb-8">
      <div className="sticky top-[4.5rem] z-30 -mx-1 mb-4 border-b border-border bg-[var(--admin-bg,#f7f7f5)]/95 px-1 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/works" className="btn btn-ghost min-h-10 text-sm">
            ← 목록
          </Link>
          <h1 className="mr-auto text-base font-black text-navy sm:text-lg">작업사례 작성</h1>
          <span className="text-xs text-muted sm:text-sm">{saveStatusLabel(saveState)}</span>
          <button
            type="button"
            className="btn btn-ghost min-h-10 text-sm"
            onClick={() => setPreview("desktop")}
          >
            미리보기
          </button>
          <button
            type="button"
            className="btn btn-secondary min-h-10 text-sm"
            disabled={pending}
            onClick={() => save("draft")}
          >
            임시저장
          </button>
          <button
            type="button"
            className="btn btn-primary min-h-10 text-sm"
            disabled={pending}
            onClick={() => setPublishOpen(true)}
          >
            {pending ? "저장 중…" : "공개"}
          </button>
          <button
            type="button"
            className="btn btn-ghost hidden min-h-10 text-sm xl:inline-flex"
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
          >
            {panelOpen ? "설정 닫기" : "설정 열기"}
          </button>
        </div>
      </div>

      <div className="mb-3 flex gap-2 xl:hidden">
        <button
          type="button"
          className={`btn min-h-10 flex-1 text-sm ${mobileTab === "write" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMobileTab("write")}
        >
          본문
        </button>
        <button
          type="button"
          className={`btn min-h-10 flex-1 text-sm ${mobileTab === "settings" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMobileTab("settings")}
        >
          설정
        </button>
      </div>

      <div
        className={`grid gap-6 ${
          panelOpen ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "xl:grid-cols-1"
        }`}
      >
        <div
          className={`mx-auto w-full max-w-[920px] space-y-4 ${
            mobileTab === "settings" ? "hidden xl:block" : ""
          }`}
        >
          {!initial?.id ? (
            <section className="rounded-[12px] border border-border bg-white p-4">
              <p className="text-sm font-black text-navy">빠른 글쓰기 템플릿</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {WORK_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-charcoal hover:border-navy"
                    onClick={() => applyTemplate(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3 rounded-[12px] border border-border bg-white p-4 sm:p-5">
            <input
              ref={titleRef}
              className="w-full border-0 bg-transparent text-2xl font-black text-charcoal outline-none placeholder:text-muted/50"
              placeholder="제목을 입력하세요"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
            <input
              className="w-full border-0 bg-transparent text-base font-semibold text-charcoal/80 outline-none placeholder:text-muted/50"
              placeholder="부제목"
              value={form.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
            />
            <input
              className="w-full border-0 bg-transparent text-base text-muted outline-none"
              placeholder="한 줄 요약"
              value={form.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
            />
          </section>

          <section
            ref={imageRef}
            className="rounded-[12px] border border-border bg-white p-4"
          >
            <p className="admin-label">대표 이미지</p>
            <ImageUploader
              folder={folder}
              value={form.representative_image_path}
              onChange={(v) =>
                update("representative_image_path", typeof v === "string" ? v : null)
              }
            />
            {bodyImageUrls.length ? (
              <div className="mt-3">
                <p className="text-xs font-bold text-muted">본문 이미지에서 선택</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {bodyImageUrls.map((url) => (
                    <button
                      key={url}
                      type="button"
                      className="h-14 w-20 overflow-hidden rounded-md border border-border bg-cover bg-center"
                      style={{ backgroundImage: `url(${url})` }}
                      title="대표 이미지로 설정"
                      onClick={() => {
                        const match = url.match(
                          /\/storage\/v1\/object\/public\/images\/(.+)$/,
                        );
                        update("representative_image_path", match ? match[1] : url);
                        showToast("대표 이미지를 본문 사진으로 설정했습니다.");
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-[12px] border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="admin-label mb-0">차량 정보</p>
                <p className="mt-1 text-sm text-muted">{vehicleSummary || "추가 정보 없음"}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost min-h-11 text-sm"
                onClick={() => setVehicleOpen((v) => !v)}
              >
                {vehicleOpen ? "접기" : "차량정보 추가"}
              </button>
            </div>
            {vehicleOpen ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <input
                  ref={manufacturerRef}
                  className="admin-input"
                  placeholder="제조사"
                  value={form.manufacturer}
                  onChange={(e) => update("manufacturer", e.target.value)}
                />
                <input
                  ref={modelRef}
                  className="admin-input"
                  placeholder="모델"
                  value={form.vehicle_model}
                  onChange={(e) => update("vehicle_model", e.target.value)}
                />
                <input
                  className="admin-input"
                  placeholder="연식"
                  value={form.model_year}
                  onChange={(e) => update("model_year", e.target.value)}
                />
                <input
                  className="admin-input"
                  placeholder="주행거리"
                  value={form.mileage}
                  onChange={(e) => update("mileage", e.target.value)}
                />
              </div>
            ) : null}
          </section>

          <section ref={editorSectionRef}>
            <RichTextEditor
              key={editorKey}
              valueJson={form.content_json}
              folder={folder}
              onImagesChange={setBodyImageUrls}
              onChange={(json, html) => {
                setDirty(true);
                setSaveState("dirty");
                setForm((prev) => ({
                  ...prev,
                  content_json: json,
                  content_html: html,
                  detailed_content:
                    prev.detailed_content || html.replace(/<[^>]+>/g, " ").trim(),
                }));
              }}
            />
          </section>

          <section className="rounded-[12px] border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="admin-label mb-0">작업 요약</p>
                <p className="mt-1 text-sm text-muted">{reportSummary}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost min-h-11 text-sm"
                onClick={() => setReportOpen((v) => !v)}
              >
                {reportOpen ? "접기" : "펼치기"}
              </button>
            </div>
            {reportOpen ? (
              <div className="mt-3 space-y-3">
                <Field label="증상">
                  <textarea
                    className="admin-textarea min-h-20"
                    value={form.symptoms}
                    onChange={(e) => update("symptoms", e.target.value)}
                  />
                </Field>
                <Field label="진단 결과">
                  <textarea
                    className="admin-textarea min-h-20"
                    value={form.diagnosis}
                    onChange={(e) => update("diagnosis", e.target.value)}
                  />
                </Field>
                <Field label="원인">
                  <textarea
                    className="admin-textarea min-h-20"
                    value={form.cause}
                    onChange={(e) => update("cause", e.target.value)}
                  />
                </Field>
                <Field label="작업 과정">
                  <textarea
                    className="admin-textarea min-h-20"
                    value={form.repair_process}
                    onChange={(e) => update("repair_process", e.target.value)}
                  />
                </Field>
                <Field label="교체 부품">
                  <textarea
                    className="admin-textarea min-h-20"
                    value={form.replaced_parts}
                    onChange={(e) => update("replaced_parts", e.target.value)}
                  />
                </Field>
                <Field label="작업 시간">
                  <input
                    className="admin-input"
                    value={form.repair_duration}
                    onChange={(e) => update("repair_duration", e.target.value)}
                  />
                </Field>
                <Field label="보증 안내">
                  <input
                    className="admin-input"
                    value={form.warranty_info}
                    onChange={(e) => update("warranty_info", e.target.value)}
                  />
                </Field>
              </div>
            ) : null}
          </section>

          <section className="rounded-[12px] border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="admin-label mb-0">작업 전후 사진</p>
                <p className="mt-1 text-sm text-muted">
                  {form.before_images.length || form.after_images.length
                    ? `전 ${form.before_images.length} · 후 ${form.after_images.length}`
                    : "추가 정보 없음"}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost min-h-11 text-sm"
                onClick={() => setBeforeAfterOpen((v) => !v)}
              >
                {beforeAfterOpen ? "접기" : "펼치기"}
              </button>
            </div>
            {beforeAfterOpen ? (
              <div className="mt-3 space-y-4">
                <ImageUploader
                  folder={folder}
                  label="작업 전"
                  multiple
                  reorderable
                  values={form.before_images}
                  onChange={(v) => update("before_images", Array.isArray(v) ? v : [])}
                />
                <ImageUploader
                  folder={folder}
                  label="작업 후"
                  multiple
                  reorderable
                  values={form.after_images}
                  onChange={(v) => update("after_images", Array.isArray(v) ? v : [])}
                />
              </div>
            ) : null}
          </section>
        </div>

        <aside
          className={`${
            mobileTab === "write" ? "hidden xl:block" : "block"
          } ${panelOpen ? "" : "xl:hidden"} xl:sticky xl:top-36 xl:self-start xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto`}
        >
          {settingsPanel}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white p-3 xl:hidden">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn btn-secondary min-h-12"
            disabled={pending}
            onClick={() => save("draft")}
          >
            임시저장
          </button>
          <button
            type="button"
            className="btn btn-primary min-h-12"
            disabled={pending}
            onClick={() => setPublishOpen(true)}
          >
            공개
          </button>
        </div>
      </div>

      {publishOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-[14px] bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-black text-navy">공개 체크리스트</h2>
              <button
                type="button"
                className="btn btn-ghost min-h-10 text-sm"
                onClick={() => setPublishOpen(false)}
              >
                닫기
              </button>
            </div>
            <ul className="space-y-2">
              {checklistItems.map((item) => (
                <li
                  key={item.key}
                  className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-bold text-charcoal">
                      {item.ok ? "✓" : item.blocking ? "✕" : "!"} {item.label}
                      {item.blocking ? (
                        <span className="ml-1 text-xs font-semibold text-red-600">필수</span>
                      ) : !item.ok ? (
                        <span className="ml-1 text-xs font-semibold text-amber-600">권장</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.ok
                        ? "완료"
                        : item.blocking
                          ? "공개 전 입력이 필요합니다"
                          : "없어도 공개할 수 있습니다"}
                    </p>
                  </div>
                  {!item.ok ? (
                    <button
                      type="button"
                      className="btn btn-ghost shrink-0 min-h-9 text-xs"
                      onClick={() => focusChecklistItem(item.key)}
                    >
                      해당 위치로 이동
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost min-h-11 text-sm"
                onClick={() => setPublishOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary min-h-11 text-sm"
                disabled={pending || hasBlockers}
                onClick={() => save("published")}
              >
                {hasBlockers
                  ? "필수 항목을 채워 주세요"
                  : checklistItems.some((i) => !i.ok)
                    ? "그래도 공개"
                    : "공개"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div
            className={`max-h-[90vh] overflow-y-auto rounded-[14px] bg-white p-5 ${
              preview === "mobile" ? "w-full max-w-sm" : "w-full max-w-3xl"
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 text-sm"
                  onClick={() => setPreview("desktop")}
                >
                  데스크톱
                </button>
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 text-sm"
                  onClick={() => setPreview("mobile")}
                >
                  모바일
                </button>
              </div>
              <button
                type="button"
                className="btn btn-secondary min-h-10 text-sm"
                onClick={() => setPreview(null)}
              >
                닫기
              </button>
            </div>
            {form.representative_image_path ? (
              <div
                className="mb-4 aspect-[16/10] rounded-[12px] bg-cover bg-center"
                style={{
                  backgroundImage: `url(${getPublicImageUrl(form.representative_image_path) || ""})`,
                }}
              />
            ) : null}
            <h1 className="text-2xl font-black">{form.title || "제목 없음"}</h1>
            {form.subtitle ? (
              <p className="mt-1 text-base font-semibold text-charcoal/80">{form.subtitle}</p>
            ) : null}
            {form.excerpt ? <p className="mt-2 text-muted">{form.excerpt}</p> : null}
            <div
              className="prose-ko mt-6"
              dangerouslySetInnerHTML={{ __html: sanitizeEditorHtml(form.content_html) }}
            />
          </div>
        </div>
      ) : null}

      <AdminToast message={toast} type={toastType} onClose={() => setToast(null)} />
    </div>
  );
}

function Fold({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-border bg-white">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        onClick={onToggle}
      >
        <span>
          <span className="block text-sm font-black text-navy">{title}</span>
          <span className="mt-0.5 block text-xs text-muted line-clamp-2">{summary}</span>
        </span>
        <span className="text-sm font-bold text-muted">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="space-y-3 border-t border-border px-4 py-3">{children}</div> : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      {children}
    </label>
  );
}
