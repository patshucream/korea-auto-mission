import type { SiteSettings } from "@/lib/types";
import { telHref } from "@/lib/utils";
import { SmsLink } from "@/components/ui/SmsLink";
import s from "@/components/layout/BrandFrame.module.css";
/** Both contact methods stay visible while reading. No automatic messages or calls. */
export function WorkMobileCtaBar({ settings, smsBody }: { settings: SiteSettings; smsBody?: string }) {
  return <div className={`${s.page} ${s["mobile-contact"]}`} aria-label="정비사례 빠른 상담">
    <a href={telHref(settings.phone)}><span>전화 상담<small>{settings.phone}</small></span></a>
    <SmsLink phone={settings.phone} body={smsBody}><span>문자 상담<small>차종·증상 남기기</small></span></SmsLink>
  </div>;
}
