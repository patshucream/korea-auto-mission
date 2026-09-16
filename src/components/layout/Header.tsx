"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { getPublicNavigation } from "@/lib/public-nav";
import { telHref } from "@/lib/utils";
import s from "@/components/home/PremiumHome.module.css";

export function Header({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const items = getPublicNavigation(settings);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const wide = window.matchMedia("(min-width: 1001px)");
    const resize = () => {
      if (wide.matches) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    wide.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
      wide.removeEventListener("change", resize);
    };
  }, [open]);
  return (
    <header ref={header} className={`${s.page} ${s.header}`}>
      <Link
        className={s.brand}
        href="/"
        aria-label={`${settings.business_name} 홈`}
      >
        <span className={s["brand-symbol"]} aria-hidden="true">
          K<span>•</span>
        </span>
        <span>
          {settings.business_name}
          <small>{settings.english_brand_name}</small>
        </span>
      </Link>
      <nav
        className={`${s.navigation} ${open ? s["is-open"] : ""}`}
        id="premium-navigation"
        aria-label="주요 메뉴"
      >
        {items.map((item) =>
          item.href.startsWith("http") ? (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              {item.label} ↗
            </a>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
      <a
        className={s["header-contact"]}
        href={telHref(settings.phone)}
        aria-label={`${settings.phone}로 정비 상담`}
      >
        정비 상담 <span aria-hidden="true">↗</span>
      </a>
      <button
        ref={toggle}
        type="button"
        className={s["menu-toggle"]}
        aria-controls="premium-navigation"
        aria-expanded={open}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
      </button>
    </header>
  );
}
