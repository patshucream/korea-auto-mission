import type { SiteSettings } from "@/lib/types";
import { telHref } from "@/lib/utils";
import s from "@/components/home/PremiumHome.module.css";

export function MobileBottomBar({ settings }: { settings: SiteSettings }) {
  return (
    <div className={`${s.page} ${s["mobile-contact"]}`} aria-label="빠른 상담">
      <a
        href={telHref(settings.phone)}
        aria-label={`${settings.phone}로 전화 상담`}
      >
        전화 상담 ↗
      </a>
      <a
        href={`sms:${settings.phone.replace(/[^0-9+]/g, "")}`}
      >
        문자 상담 ↗
      </a>
    </div>
  );
}
