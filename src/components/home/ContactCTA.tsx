import Link from "next/link";
import type { HomepageConfig, SiteSettings } from "@/lib/types";
import { getReservationUrl, telHref } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
  config: HomepageConfig;
};

export function ContactCTA({ settings, config }: Props) {
  const reserveUrl = getReservationUrl(settings);

  return (
    <section id="contact" className="section-pad bg-navy text-white">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="whitespace-pre-line text-[1.85rem] font-bold leading-snug tracking-[-0.03em] sm:text-[2.25rem]">
            {config.cta_title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/70">
            {config.cta_description}
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
            <a href={telHref(settings.phone)} className="btn btn-light" aria-label="전화 상담">
              전화 상담
            </a>
            <a
              href={reserveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-naver"
              aria-label="네이버 예약"
            >
              네이버 예약
            </a>
            <Link
              href="/works"
              className="col-span-2 text-center text-sm font-bold text-white/85 underline-offset-4 hover:underline sm:col-span-1 sm:self-center"
            >
              작업사례 보기 →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
