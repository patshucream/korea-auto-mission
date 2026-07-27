"use client";

import { useEffect, useState, useTransition } from "react";
import type { SiteSettings } from "@/lib/types";
import { saveSiteSettings } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AdminToast } from "@/components/admin/AdminToast";

type Props = {
  settings: SiteSettings;
};

export function GeneralSettingsForm({ settings }: Props) {
  const [form, setForm] = useState(settings);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function showToast(message: string, type: "success" | "error" = "success") {
    setToastType(type);
    setToast(message);
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            const weekday = (form.weekday_hours ?? "").trim() || "09:00 - 18:00";
            const saturday = (form.saturday_hours ?? "").trim() || "09:00 - 15:00";
            const holiday = (form.holiday_hours ?? "").trim() || "정상영업";
            const hours = `평일 ${weekday} 토요일 ${saturday}`;
            // 공휴일 정상영업 시 레거시 closed_days 는 일요일만 표시
            const closedDays =
              holiday === "휴무" || holiday === "휴일" ? "일요일 · 공휴일" : "일요일";
            // DB 컬럼만 명시 전송 (id/created_at 등·undefined 제외)
            const result = await saveSiteSettings({
              business_name: form.business_name,
              english_brand_name: form.english_brand_name,
              phone: form.phone,
              address: form.address,
              weekday_hours: weekday,
              saturday_hours: saturday,
              holiday_hours: holiday,
              hours,
              closed_days: closedDays,
              naver_blog_url: form.naver_blog_url,
              naver_map_url: form.naver_map_url,
              naver_reservation_url: form.naver_reservation_url,
              hero_title: form.hero_title,
              hero_description: form.hero_description,
              hero_image_path: form.hero_image_path,
              shop_image_path: form.shop_image_path,
              stat_experience: form.stat_experience,
              stat_services: form.stat_services,
              stat_brands: form.stat_brands,
              stat_works: form.stat_works,
              why_title: form.why_title,
              why_content: form.why_content,
              process_steps: form.process_steps,
            });
            if (!result.ok) {
              showToast(result.error, "error");
              return;
            }
            setForm((prev) => ({
              ...prev,
              weekday_hours: weekday,
              saturday_hours: saturday,
              holiday_hours: holiday,
              hours,
              closed_days: closedDays,
            }));
            setDirty(false);
            showToast("저장되었습니다.");
          } catch (error) {
            showToast(
              error instanceof Error ? error.message : "저장에 실패했습니다.",
              "error",
            );
          }
        });
      }}
    >
      <section id="contact" className="admin-card space-y-4">
        <h2 className="text-xl font-black text-navy">기본 · 연락처 설정</h2>
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
              id="hours"
              className="admin-input"
              value={form.weekday_hours ?? ""}
              onChange={(e) => update("weekday_hours", e.target.value)}
              placeholder="예: 09:00 - 18:00"
            />
          </Field>
          <Field label="토요일 영업시간">
            <input
              className="admin-input"
              value={form.saturday_hours ?? ""}
              onChange={(e) => update("saturday_hours", e.target.value)}
              placeholder="예: 09:00 - 15:00"
            />
          </Field>
          <Field label="공휴일 안내">
            <input
              className="admin-input"
              value={form.holiday_hours ?? ""}
              onChange={(e) => update("holiday_hours", e.target.value)}
              placeholder="예: 정상영업"
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

      <div className="sticky bottom-3 z-10 rounded-[12px] border border-border bg-white/95 p-3 shadow-sm backdrop-blur">
        <button type="submit" className="btn btn-primary min-h-11 w-full sm:w-auto" disabled={pending}>
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
      <AdminToast message={toast} type={toastType} onClose={() => setToast(null)} />
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
