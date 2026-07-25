"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, ADMIN_NAV_SECONDARY } from "@/lib/defaults";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type Props = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

function NavLink({
  href,
  label,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const base = href.split("#")[0];
  const active =
    href === "/admin"
      ? pathname === "/admin"
      : pathname === base || (base !== "/admin" && pathname.startsWith(base));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "block rounded-[10px] px-3 py-2.5 text-sm font-semibold transition",
        active
          ? "bg-navy text-white"
          : "text-charcoal/80 hover:bg-navy-soft hover:text-navy",
      )}
    >
      {label}
    </Link>
  );
}

export function AdminNav({ mobileOpen, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-full flex-col border-border bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:border-r",
        mobileOpen === false ? "hidden lg:flex" : "flex",
      )}
    >
      <div className="border-b border-border px-5 py-5">
        <p className="text-xs font-bold tracking-[0.14em] text-muted">ADMIN</p>
        <p className="mt-1 text-lg font-black text-navy">코리아오토미션</p>
        <p className="text-sm text-muted">콘텐츠 관리</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="관리자 메뉴">
        <NavLink href="/admin" label="대시보드" pathname={pathname} onNavigate={onNavigate} />
        {ADMIN_NAV.map((item) => (
          <NavLink
            key={item.href + item.label}
            href={item.href}
            label={item.label}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
        <div className="my-3 border-t border-border pt-3">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-muted">
            추가 설정
          </p>
          {ADMIN_NAV_SECONDARY.map((item) => (
            <NavLink
              key={item.href + item.label}
              href={item.href}
              label={item.label}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>

      <div className="space-y-2 border-t border-border p-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-full text-sm"
          onClick={onNavigate}
        >
          홈페이지 보기
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
