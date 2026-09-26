import type { SiteSettings } from "@/lib/types";
import { telHref } from "@/lib/utils";
import s from "./BrandFrame.module.css";

export function MobileBottomBar({ settings }: { settings: SiteSettings }) {
  return (
    <div className={`${s.page} ${s["mobile-contact"]}`} aria-label="빠른 상담">
      <a
        href={telHref(settings.phone)}
        aria-label={`${settings.phone}로 전화 상담`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m7 3 3 5-2 2a15 15 0 0 0 6 6l2-2 5 3v3c0 1-1 2-2 2C9.6 22 2 14.4 2 5c0-1 1-2 2-2h3Z" /></svg>
        <span>전화 상담<small>{settings.phone}</small></span>
      </a>
      <a
        href={`sms:${settings.phone.replace(/[^0-9+]/g, "")}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12l6-5V6a2 2 0 0 0-2-2Z" /><path strokeLinecap="round" d="M7 9h10M7 14h6" /></svg>
        <span>문자 상담<small>차종·증상 남기기</small></span>
      </a>
    </div>
  );
}
