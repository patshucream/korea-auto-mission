"use client";

import { useMemo, useState, useTransition } from "react";
import type { HomepageConfig, HomepageSectionId, HomepageWhyPoint, MediaItem, SiteSettings } from "@/lib/types";
import { saveSiteSettings } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { AdminToast } from "@/components/admin/AdminToast";
import { getPublicImageUrl } from "@/lib/media";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  DEFAULT_HOMEPAGE_SECTION_ORDER,
  DEFAULT_WHY_POINTS,
} from "@/lib/defaults";
import {
  findDuplicateWhyImageIds,
  HOMEPAGE_SECTION_LABELS,
  parseHomepageConfig,
} from "@/lib/homepage";

type Props = {
  settings: SiteSettings;
  serviceOptions: { id: string; title: string }[];
  workOptions: { id: string; title: string }[];
  mediaItems?: MediaItem[];
};

export function HomepageSettingsForm({
  settings,
  serviceOptions,
  workOptions,
  mediaItems = [],
}: Props) {
  const [heroTitle, setHeroTitle] = useState(settings.hero_title);
  const [heroDescription, setHeroDescription] = useState(settings.hero_description);
  const [heroImage, setHeroImage] = useState(settings.hero_image_path);
  const [shopImage, setShopImage] = useState(settings.shop_image_path);
  const [whyTitle, setWhyTitle] = useState(settings.why_title);
  const [whyContent, setWhyContent] = useState(settings.why_content);
  const [config, setConfig] = useState<HomepageConfig>(() =>
    parseHomepageConfig(settings.homepage_config),
  );
  const [pickerFor, setPickerFor] = useState<null | "hero" | "shop" | string>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [pending, startTransition] = useTransition();

  const whyPoints = config.why_points?.length ? config.why_points : DEFAULT_WHY_POINTS;
  const duplicateWhyIds = useMemo(() => new Set(findDuplicateWhyImageIds(whyPoints)), [whyPoints]);

  const usageLabels = useMemo(() => {
    const map: Record<string, string[]> = {};
    const add = (path: string | null | undefined, label: string) => {
      if (!path) return;
      const list = map[path] || [];
      if (!list.includes(label)) list.push(label);
      map[path] = list;
    };
    add(heroImage, "홈페이지 Hero");
    add(shopImage, "작업장 사진");
    whyPoints.forEach((p, i) => add(p.image_path, `전문성 0${i + 1}`));
    return map;
  }, [heroImage, shopImage, whyPoints]);

  function updateWhyPoint(index: number, patch: Partial<HomepageWhyPoint>) {
    setConfig((c) => {
      const points = [...(c.why_points?.length ? c.why_points : DEFAULT_WHY_POINTS)];
      points[index] = { ...points[index], ...patch };
      return { ...c, why_points: points };
    });
  }

  function moveSection(index: number, dir: -1 | 1) {
    const next = [...config.section_order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setConfig((c) => ({ ...c, section_order: next }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveSiteSettings({
        hero_title: heroTitle,
        hero_description: heroDescription,
        hero_image_path: heroImage,
        shop_image_path: shopImage,
        why_title: whyTitle,
        why_content: whyContent,
        homepage_config: {
          ...config,
          why_points: whyPoints,
        },
      });
      if (!result.ok) {
        setToastType("error");
        setToast(result.error);
        return;
      }
      setToastType("success");
      setToast("홈페이지 설정을 저장했습니다.");
    });
  }

  function applyPickedPath(path: string) {
    if (pickerFor === "hero") setHeroImage(path);
    else if (pickerFor === "shop") setShopImage(path);
    else if (pickerFor?.startsWith("why:")) {
      const index = Number(pickerFor.slice(4));
      if (!Number.isNaN(index)) {
        const other = whyPoints.find((p, i) => i !== index && p.image_path === path);
        if (other) {
          setToastType("error");
          setToast(
            `이 이미지는 이미 "${other.title}"에 사용 중입니다. 저장은 가능하지만 다른 이미지를 권장합니다.`,
          );
        }
        updateWhyPoint(index, { image_path: path });
      }
    }
  }

  return (
    <div className="space-y-6">
      <section className="admin-card space-y-3">
        <h2 className="text-lg font-black text-navy">히어로</h2>
        <label className="block">
          <span className="admin-label">히어로 제목</span>
          <textarea
            className="admin-textarea min-h-24"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="admin-label">히어로 설명</span>
          <textarea
            className="admin-textarea min-h-24"
            value={heroDescription}
            onChange={(e) => setHeroDescription(e.target.value)}
          />
        </label>
        <SiteImageField
          label="히어로 이미지"
          path={heroImage}
          folder="hero"
          recommended="권장 비율 16:9 · 1600×900 이상"
          usage={usageLabels[heroImage || ""] || []}
          onUpload={(v) => setHeroImage(v)}
          onPick={() => setPickerFor("hero")}
          onRemove={() => setHeroImage(null)}
        />
        <SiteImageField
          label="작업장·매장 이미지"
          path={shopImage}
          folder="shop"
          recommended="권장 비율 4:3 · 1200×900 이상"
          usage={usageLabels[shopImage || ""] || []}
          onUpload={(v) => setShopImage(v)}
          onPick={() => setPickerFor("shop")}
          onRemove={() => setShopImage(null)}
        />
      </section>

      <section className="admin-card space-y-3">
        <h2 className="text-lg font-black text-navy">신뢰 정보</h2>
        {config.trust_items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-[10px] border border-border p-3">
            <input
              className="admin-input"
              value={item.title}
              onChange={(e) => {
                const trust_items = [...config.trust_items];
                trust_items[index] = { ...item, title: e.target.value };
                setConfig((c) => ({ ...c, trust_items }));
              }}
            />
            <textarea
              className="admin-textarea min-h-16"
              value={item.description}
              onChange={(e) => {
                const trust_items = [...config.trust_items];
                trust_items[index] = { ...item, description: e.target.value };
                setConfig((c) => ({ ...c, trust_items }));
              }}
            />
          </div>
        ))}
      </section>

      <section className="admin-card space-y-4">
        <div>
          <h2 className="text-lg font-black text-navy">왜 코리아오토미션인가</h2>
          <p className="mt-1 text-sm text-muted">
            각 항목은 서로 다른 이미지를 사용하세요. 이미지가 없으면 텍스트만 표시됩니다.
          </p>
        </div>
        <input className="admin-input" value={whyTitle} onChange={(e) => setWhyTitle(e.target.value)} />
        <textarea
          className="admin-textarea min-h-28"
          value={whyContent}
          onChange={(e) => setWhyContent(e.target.value)}
        />

        {whyPoints.map((point, index) => {
          const isDup = point.image_path ? duplicateWhyIds.has(point.id) : false;
          return (
            <div
              key={point.id}
              className={`space-y-3 rounded-[12px] border p-4 ${
                isDup ? "border-amber-400 bg-amber-50/40" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-navy">
                  0{index + 1}. {point.title}
                </p>
                {isDup ? (
                  <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900">
                    중복 이미지 경고
                  </span>
                ) : null}
              </div>
              <input
                className="admin-input"
                value={point.title}
                onChange={(e) => updateWhyPoint(index, { title: e.target.value })}
              />
              <textarea
                className="admin-textarea min-h-20"
                value={point.body}
                onChange={(e) => updateWhyPoint(index, { body: e.target.value })}
              />
              <label className="block max-w-xs">
                <span className="admin-label">이미지 위치 (object-position)</span>
                <select
                  className="admin-select"
                  value={point.object_position || "center"}
                  onChange={(e) => updateWhyPoint(index, { object_position: e.target.value })}
                >
                  <option value="center">가운데</option>
                  <option value="top">위쪽</option>
                  <option value="bottom">아래쪽</option>
                  <option value="left">왼쪽</option>
                  <option value="right">오른쪽</option>
                </select>
              </label>
              <SiteImageField
                label={`항목 0${index + 1} 이미지`}
                path={point.image_path}
                folder="shop"
                recommended="권장 비율 16:10 · 1400×875 이상 · 항목마다 다른 사진"
                usage={usageLabels[point.image_path || ""] || []}
                duplicate={isDup}
                onUpload={(v) => updateWhyPoint(index, { image_path: v })}
                onPick={() => setPickerFor(`why:${index}`)}
                onRemove={() => updateWhyPoint(index, { image_path: null })}
              />
              {point.image_path ? (
                <p className="break-all text-xs text-muted">경로: {point.image_path}</p>
              ) : (
                <p className="text-xs text-muted">이미지 없음 — 홈에서는 텍스트만 표시됩니다.</p>
              )}
            </div>
          );
        })}
      </section>

      <section className="admin-card space-y-3">
        <h2 className="text-lg font-black text-navy">마지막 CTA</h2>
        <textarea
          className="admin-textarea min-h-20"
          value={config.cta_title}
          onChange={(e) => setConfig((c) => ({ ...c, cta_title: e.target.value }))}
        />
        <textarea
          className="admin-textarea min-h-20"
          value={config.cta_description}
          onChange={(e) => setConfig((c) => ({ ...c, cta_description: e.target.value }))}
        />
      </section>

      <section className="admin-card space-y-3">
        <h2 className="text-lg font-black text-navy">메인 노출 서비스</h2>
        <p className="text-sm text-muted">비워 두면 공개 서비스 전체를 표시합니다.</p>
        <div className="space-y-2">
          {serviceOptions.map((s) => {
            const checked = config.featured_service_ids.includes(s.id);
            return (
              <label key={s.id} className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setConfig((c) => ({
                      ...c,
                      featured_service_ids: e.target.checked
                        ? [...c.featured_service_ids, s.id]
                        : c.featured_service_ids.filter((id) => id !== s.id),
                    }));
                  }}
                />
                {s.title}
              </label>
            );
          })}
        </div>
      </section>

      <section className="admin-card space-y-3">
        <h2 className="text-lg font-black text-navy">메인 노출 작업사례</h2>
        <p className="text-sm text-muted">비워 두면 최근 공개 사례를 표시합니다.</p>
        <div className="max-h-56 space-y-2 overflow-y-auto">
          {workOptions.map((w) => {
            const checked = config.featured_work_ids.includes(w.id);
            return (
              <label key={w.id} className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setConfig((c) => ({
                      ...c,
                      featured_work_ids: e.target.checked
                        ? [...c.featured_work_ids, w.id]
                        : c.featured_work_ids.filter((id) => id !== w.id),
                    }));
                  }}
                />
                {w.title}
              </label>
            );
          })}
        </div>
      </section>

      <section className="admin-card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-black text-navy">섹션 표시 · 순서</h2>
          <button
            type="button"
            className="text-sm font-bold text-muted"
            onClick={() =>
              setConfig((c) => ({
                ...c,
                section_order: [...DEFAULT_HOMEPAGE_SECTION_ORDER],
                section_visibility: { ...DEFAULT_HOMEPAGE_CONFIG.section_visibility },
              }))
            }
          >
            기본값 복원
          </button>
        </div>
        <ul className="space-y-2">
          {config.section_order.map((id, index) => (
            <li
              key={id}
              className="flex flex-wrap items-center gap-2 rounded-[10px] border border-border px-3 py-2"
            >
              <label className="mr-auto flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={config.section_visibility[id] !== false}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      section_visibility: {
                        ...c.section_visibility,
                        [id]: e.target.checked,
                      },
                    }))
                  }
                />
                {HOMEPAGE_SECTION_LABELS[id as HomepageSectionId] || id}
              </label>
              <button type="button" className="btn btn-ghost min-h-11 text-sm" onClick={() => moveSection(index, -1)}>
                위
              </button>
              <button type="button" className="btn btn-ghost min-h-11 text-sm" onClick={() => moveSection(index, 1)}>
                아래
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" className="btn btn-primary min-h-11" disabled={pending} onClick={save}>
        {pending ? "저장 중…" : "홈페이지 설정 저장"}
      </button>

      <MediaPickerModal
        open={pickerFor !== null}
        media={mediaItems}
        usageLabels={usageLabels}
        title="홈페이지에 쓸 이미지 선택"
        onClose={() => setPickerFor(null)}
        onSelect={applyPickedPath}
      />
      <AdminToast message={toast} type={toastType} onClose={() => setToast(null)} />
    </div>
  );
}

function SiteImageField({
  label,
  path,
  folder,
  recommended,
  usage,
  duplicate,
  onUpload,
  onPick,
  onRemove,
}: {
  label: string;
  path: string | null;
  folder: string;
  recommended: string;
  usage: string[];
  duplicate?: boolean;
  onUpload: (path: string | null) => void;
  onPick: () => void;
  onRemove: () => void;
}) {
  const src = getPublicImageUrl(path);
  return (
    <div className="space-y-2.5 rounded-xl border border-black/[0.06] bg-[#fafafa]/60 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold tracking-[-0.01em] text-charcoal">{label}</p>
        <p className="text-[11px] text-slate-400">{recommended}</p>
      </div>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="aspect-[16/10] w-full rounded-xl object-cover" />
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center rounded-xl border border-dashed border-black/[0.08] bg-white text-[13px] text-slate-400">
          이미지 없음
        </div>
      )}
      {usage.length > 0 ? (
        <p className={`text-xs font-medium ${duplicate ? "text-amber-800" : "text-navy"}`}>
          사용처: {usage.join(" · ")}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="media-action-btn" onClick={onPick}>
          라이브러리에서 선택
        </button>
        <button type="button" className="media-action-btn" onClick={onRemove} disabled={!path}>
          제거
        </button>
      </div>
      <ImageUploader
        folder={folder}
        label="새 파일 업로드·교체"
        value={path}
        onChange={(v) => onUpload(typeof v === "string" ? v : null)}
      />
    </div>
  );
}
