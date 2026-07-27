"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { NAV_ITEMS } from "@/lib/defaults";
import { cn, getReservationUrl, telHref } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
};

const QUICK_LINKS = [
  { href: "/works?q=미션", label: "미션수리 사례" },
  { href: "/works?q=DPF", label: "DPF 사례" },
  { href: "/works?service=", label: "전체 서비스" },
  { href: "/#services", label: "정비 서비스" },
  { href: "/works", label: "전체 작업사례" },
] as const;

export function Header({ settings }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reserveUrl = getReservationUrl(settings);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-200",
        scrolled || open
          ? "border-white/10 bg-navy/95 text-white backdrop-blur-md"
          : "border-transparent bg-navy/70 text-white backdrop-blur-sm",
      )}
    >
      <div
        className={cn(
          "container-site flex items-center justify-between gap-3 transition-[height] duration-200",
          scrolled ? "h-14" : "h-[72px]",
        )}
      >
        <Link href="/" className="min-w-0 flex-1 lg:flex-none" aria-label="홈으로 이동">
          <span
            className={cn(
              "block truncate font-semibold tracking-tight transition-all",
              scrolled ? "text-[0.98rem]" : "text-[1.08rem] sm:text-[1.15rem]",
            )}
          >
            {settings.business_name}
          </span>
          {!scrolled ? (
            <span className="mt-0.5 block truncate text-[0.65rem] font-medium tracking-[0.12em] text-white/55">
              {settings.english_brand_name}
            </span>
          ) : null}
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-11 rounded px-3 py-2 text-[0.92rem] font-medium text-white/80 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={telHref(settings.phone)}
            className="btn btn-ghost !min-h-11 !border-white/25 !text-white px-4 text-sm"
            aria-label={`${settings.phone}로 전화 상담`}
          >
            전화
          </a>
          <a
            href={reserveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-light !min-h-11 px-5 text-sm"
            aria-label="네이버 예약하기"
          >
            예약
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border border-white/25 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative flex h-4 w-5" aria-hidden>
            <span
              className={cn(
                "absolute left-0 top-0 h-0.5 w-5 bg-white transition",
                open && "top-1.5 rotate-45",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-1.5 h-0.5 w-5 bg-white transition",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-3 h-0.5 w-5 bg-white transition",
                open && "top-1.5 -rotate-45",
              )}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "max-h-[calc(100svh-4.5rem)] overflow-y-auto border-t border-white/10 bg-navy lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="container-site flex flex-col gap-1 py-4" aria-label="모바일 메뉴">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-12 rounded px-3 py-3 text-lg font-medium text-white"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <p className="mt-4 px-3 text-xs font-bold tracking-[0.12em] text-white/45">
            바로가기
          </p>
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href === "/works?service=" ? "/#services" : item.href}
              className="min-h-11 rounded px-3 py-2.5 text-base text-white/85"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 grid grid-cols-2 gap-2 px-1 pb-2">
            <a
              href={telHref(settings.phone)}
              className="btn btn-light"
              onClick={() => setOpen(false)}
            >
              전화 상담
            </a>
            <a
              href={reserveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-naver"
              onClick={() => setOpen(false)}
            >
              네이버 예약
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
