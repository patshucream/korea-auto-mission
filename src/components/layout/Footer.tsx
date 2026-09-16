import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { getPublicNavigation } from "@/lib/public-nav";
import { telHref } from "@/lib/utils";
import s from "@/components/home/PremiumHome.module.css";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className={`${s.page} ${s.footer}`}>
      <div>
        <Link className={s.brand} href="/">
          <span>
            {settings.business_name}
            <small>{settings.english_brand_name}</small>
          </span>
        </Link>
        <p className={s["footer-address"]}>
          {settings.address}
          <br />
          <a href={telHref(settings.phone)}>{settings.phone}</a>
        </p>
      </div>
      <nav className={s["footer-nav"]} aria-label="하단 메뉴">
        {getPublicNavigation(settings).map((item) =>
          item.href.startsWith("http") ? (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.label} ↗
            </a>
          ) : (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ),
        )}
      </nav>
      <div>
        <Link href="/privacy">개인정보처리방침 ↗</Link>
        <small>
          © {new Date().getFullYear()} {settings.english_brand_name}
        </small>
      </div>
    </footer>
  );
}
