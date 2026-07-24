"use client";

import { useState, useTransition } from "react";
import type { SiteSettings } from "@/lib/types";
import { saveSiteSettings } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Props = {
  settings: SiteSettings;
};

export function GeneralSettingsForm({ settings }: Props) {
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          try {
            const { id, created_at, updated_at, ...rest } = form;
            void id;
            void created_at;
            void updated_at;
            const weekday = rest.weekday_hours.trim() || "09:00 - 18:00";
            const saturday = rest.saturday_hours.trim() || "09:00 - 15:00";
            const holiday = rest.holiday_hours.trim() || "휴무";
            await saveSiteSettings({
              ...rest,
              weekday_hours: weekday,
              saturday_hours: saturday,
              holiday_hours: holiday,
              // 레거시 칼럼 동기화 (SEO·구버전 호환, UI에는 미사용)
              hours: `평일 ${weekday} 토요일 ${saturday}`,
              closed_days: holiday === "휴무" ? "일요일 · 공휴일" : holiday,
            });
            setForm((prev) => ({
              ...prev,
              weekday_hours: weekday,
              saturday_hours: saturday,
              holiday_hours: holiday,
              hours: `평일 ${weekday} 토요일 ${saturday}`,
              closed_days: holiday === "휴무" ? "일요일 · 공휴일" : holiday,
            }));
            setMessage("저장되었습니다.");
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
          }
        });
      }}
    >
      <section id="contact" className="card-light space-y-4 p-5">
        <h2 className="text-xl font-black">기본 · 연락처 설정</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="상호명">
            <input className="admin-input" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} />
          </Field>
          <Field label="영문 브랜드명">
            <input className="admin-input" value={form.english_brand_name} onChange={(e) => update("english_brand_name", e.target.value)} />
          </Field>
          <Field label="전화">
            <input className="admin-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </Field>
          <Field label="주소">
            <input className="admin-input" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </Field>
          <Field label="평일 영업시간">
            <input
              className="admin-input"
              value={form.weekday_hours}
              onChange={(e) => update("weekday_hours", e.target.value)}
              placeholder="예: 09:00 - 18:00"
            />
          </Field>
          <Field label="토요일 영업시간">
            <input
              className="admin-input"
              value={form.saturday_hours}
              onChange={(e) => update("saturday_hours", e.target.value)}
              placeholder="예: 09:00 - 15:00"
            />
          </Field>
          <Field label="일요일/공휴일 안내">
            <input
              className="admin-input"
              value={form.holiday_hours}
              onChange={(e) => update("holiday_hours", e.target.value)}
              placeholder="예: 휴무"
            />
          </Field>
          <Field label="네이버 블로그 URL">
            <input className="admin-input" value={form.naver_blog_url} onChange={(e) => update("naver_blog_url", e.target.value)} />
          </Field>
          <Field label="네이버 지도 URL">
            <input className="admin-input" value={form.naver_map_url} onChange={(e) => update("naver_map_url", e.target.value)} />
          </Field>
          <Field label="네이버 예약 URL">
            <input
              className="admin-input"
              value={form.naver_reservation_url}
              onChange={(e) => update("naver_reservation_url", e.target.value)}
              placeholder="비워두면 블로그 링크로 연결됩니다"
            />
          </Field>
        </div>
      </section>

      <section className="card-light space-y-4 p-5">
        <h2 className="text-xl font-black">히어로</h2>
        <Field label="히어로 제목">
          <textarea className="admin-textarea" value={form.hero_title} onChange={(e) => update("hero_title", e.target.value)} />
        </Field>
        <Field label="히어로 설명">
          <textarea className="admin-textarea" value={form.hero_description} onChange={(e) => update("hero_description", e.target.value)} />
        </Field>
        <ImageUploader
          folder="hero"
          label="히어로 이미지"
          value={form.hero_image_path}
          onChange={(v) => update("hero_image_path", typeof v === "string" ? v : null)}
        />
        <ImageUploader
          folder="shop"
          label="매장/정비 이미지"
          value={form.shop_image_path}
          onChange={(v) => update("shop_image_path", typeof v === "string" ? v : null)}
        />
      </section>

      <section id="stats" className="card-light space-y-4 p-5">
        <h2 className="text-xl font-black">홈페이지 주요 수치</h2>
        <p className="text-sm text-muted">
          누적 작업 경험은 데이터베이스 건수로 자동 계산하지 않습니다. 관리자가 직접 입력하세요.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="정비 경력">
            <input className="admin-input" value={form.stat_experience} onChange={(e) => update("stat_experience", e.target.value)} />
          </Field>
          <Field label="전문 서비스">
            <input className="admin-input" value={form.stat_services} onChange={(e) => update("stat_services", e.target.value)} />
          </Field>
          <Field label="취급 브랜드">
            <input className="admin-input" value={form.stat_brands} onChange={(e) => update("stat_brands", e.target.value)} />
          </Field>
          <Field label="누적 작업 경험">
            <input
              className="admin-input"
              value={form.stat_works}
              onChange={(e) => update("stat_works", e.target.value)}
              placeholder="예: 500건 이상 / 30년간 축적된 작업 경험"
            />
          </Field>
        </div>
      </section>

      <section className="card-light space-y-4 p-5">
        <h2 className="text-xl font-black">전문점 소개</h2>
        <Field label="소개 제목">
          <input className="admin-input" value={form.why_title} onChange={(e) => update("why_title", e.target.value)} />
        </Field>
        <Field label="소개 내용">
          <textarea className="admin-textarea min-h-40" value={form.why_content} onChange={(e) => update("why_content", e.target.value)} />
        </Field>
      </section>

      {message ? <p className="font-medium text-navy">{message}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
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
