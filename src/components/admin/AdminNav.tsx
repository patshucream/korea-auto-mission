"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/lib/defaults";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-border bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-5 py-5">
        <p className="text-lg font-black text-charcoal">관리자</p>
        <p className="text-sm text-muted">코리아오토미션</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible" aria-label="관리자 메뉴">
        <Link
          href="/admin"
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-bold",
            pathname === "/admin" ? "bg-navy text-white" : "text-charcoal hover:bg-navy-soft",
          )}
        >
          대시보드
        </Link>
        {ADMIN_NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href.includes("#")
              ? pathname === item.href.split("#")[0]
              : pathname.startsWith(item.href));
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-bold",
                active && !item.href.includes("#")
                  ? "bg-navy text-white"
                  : "text-charcoal hover:bg-navy-soft",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-border p-4">
        <Link href="/" className="btn btn-ghost btn-full text-sm">
          홈페이지로 돌아가기
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-secondary btn-full text-sm">
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
