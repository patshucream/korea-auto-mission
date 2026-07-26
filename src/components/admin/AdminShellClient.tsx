"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";

export function AdminShellClient({
  children,
  title,
  description,
  configured = true,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  configured?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!configured) {
    return (
      <div className="admin-app min-h-screen px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-[14px] border border-border bg-white p-6">
          <h1 className="text-2xl font-black text-navy">관리자 설정 안내</h1>
          <p className="mt-3 leading-relaxed text-muted">
            Supabase 환경 변수가 설정되지 않았습니다. `.env.local`에 아래 값을 입력한 뒤 개발
            서버를 다시 시작해 주세요.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-[12px] bg-navy p-4 text-sm text-white">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# 프로덕션 공개 URL은 코드의 SITE_URL(https://koreauto.co.kr)을 사용합니다`}
          </pre>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-charcoal-soft">
            <li>Supabase 프로젝트를 생성합니다.</li>
            <li>
              SQL Editor에서 마이그레이션을 순서대로 실행합니다.
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>`001_initial_schema.sql`</li>
                <li>`002_service_id_and_sort_order.sql`</li>
                <li>`003_business_hours.sql`</li>
                <li>`004_reviews_moderation.sql`</li>
                <li>`005_holiday_hours_open.sql`</li>
              </ul>
            </li>
            <li>Authentication → Users에서 관리자 이메일을 생성합니다.</li>
          </ol>
          <Link href="/" className="btn btn-secondary mt-6 inline-flex">
            홈페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="메뉴 닫기"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] transform bg-white shadow-xl transition lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminNav mobileOpen onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="hidden lg:block">
        <AdminNav />
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-border lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="메뉴 열기"
            >
              <span className="text-lg">☰</span>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-black text-navy sm:text-2xl">{title}</h1>
              {description ? (
                <p className="mt-0.5 truncate text-sm text-muted">{description}</p>
              ) : null}
            </div>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost hidden min-h-11 text-sm sm:inline-flex"
            >
              홈페이지 보기
            </Link>
          </div>
        </header>
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
