"use client";

import { useState, useTransition } from "react";
import type { HomepageConfig, HomepageSectionId, SiteSettings } from "@/lib/types";
import { saveSiteSettings } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AdminToast } from "@/components/admin/AdminToast";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  DEFAULT_HOMEPAGE_SECTION_ORDER,
} from "@/lib/defaults";
import { HOMEPAGE_SECTION_LABELS, parseHomepageConfig } from "@/lib/homepage";

type Props = {
  settings: SiteSettings;
  serviceOptions: { id: string; title: string }[];
  workOptions: { id: string; title: string }[];
};

export function HomepageSettingsForm({ settings, serviceOptions, workOptions }: Props) {
  const [heroTitle, setHeroTitle] = useState(settings.hero_title);
  const [heroDescription, setHeroDescription] = useState(settings.hero_description);
  const [heroImage, setHeroImage] = useState(settings.hero_image_path);
  const [whyTitle, setWhyTitle] = useState(settings.why_title);
  const [whyContent, setWhyContent] = useState(settings.why_content);
  const [config, setConfig] = useState<HomepageConfig>(() =>
    parseHomepageConfig(settings.homepage_config),
  );
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        why_title: whyTitle,
        why_content: whyContent,
        homepage_config: config,
      });
      if (!result.ok) {
        setToast(result.error);
        return;
      }
      setToast("홈페이지 설정을 저장했습니다.");
    });
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
        <ImageUploader
          folder="hero"
          label="히어로 이미지"
          value={heroImage}
          onChange={(v) => setHeroImage(typeof v === "string" ? v : null)}
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

      <section className="admin-card space-y-3">
        <h2 className="text-lg font-black text-navy">왜 코리아오토미션인가</h2>
        <input className="admin-input" value={whyTitle} onChange={(e) => setWhyTitle(e.target.value)} />
        <textarea
          className="admin-textarea min-h-28"
          value={whyContent}
          onChange={(e) => setWhyContent(e.target.value)}
        />
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
              <button type="button" className="btn btn-ghost min-h-9 text-xs" onClick={() => moveSection(index, -1)}>
                위
              </button>
              <button type="button" className="btn btn-ghost min-h-9 text-xs" onClick={() => moveSection(index, 1)}>
                아래
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" className="btn btn-primary min-h-12" disabled={pending} onClick={save}>
        {pending ? "저장 중…" : "홈페이지 설정 저장"}
      </button>
      <AdminToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
