"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { NAV_ITEMS } from "@/lib/defaults";
import { cn, telHref } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
};

export function Header({ settings }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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
        "sticky top-0 z-50 border-b transition-colors",
        scrolled || open
          ? "border-white/10 bg-black/95 text-white backdrop-blur-md"
          : "border-transparent bg-black/40 text-white backdrop-blur-sm",
      )}
    >
      <div className="container-site flex h-[72px] items-center justify-between gap-4">
        <Link href="/" className="min-w-0 flex-1 lg:flex-none">
          <span className="block truncate text-[1.1rem] font-semibold tracking-tight sm:text-lg">
            {settings.business_name}
          </span>
          <span className="block truncate text-[0.68rem] font-medium tracking-[0.12em] text-white/55 sm:text-[0.72rem]">
            {settings.english_brand_name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-[0.95rem] font-medium text-white/80 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={telHref(settings.phone)}
            className="btn btn-light min-h-11 px-4 text-sm"
          >
            정비 상담
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded border border-white/25 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">메뉴</span>
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
          "border-t border-white/10 bg-black lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="container-site flex flex-col gap-1 py-4" aria-label="모바일 메뉴">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-3 text-lg font-medium text-white"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={telHref(settings.phone)}
            className="btn btn-light mt-3"
            onClick={() => setOpen(false)}
          >
            정비 상담하기
          </a>
        </nav>
      </div>
    </header>
  );
}
