import type { SiteSettings } from "@/lib/types";
import { getMapUrl, getReservationUrl, telHref } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
};

export function ContactCTA({ settings }: Props) {
  const reserveUrl = getReservationUrl(settings);
  const mapUrl = getMapUrl(settings);

  return (
    <section id="contact" className="section-pad bg-black text-white">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[1.85rem] font-bold leading-snug tracking-[-0.03em] sm:text-[2.25rem]">
            차량 증상, 먼저 상담해 보세요.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-[1.05rem]">
            증상과 차량 정보를 알려주시면 점검 방향과 방문 일정을 안내드립니다.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <a href={telHref(settings.phone)} className="btn btn-light sm:min-w-[9.5rem]">
              전화 상담
            </a>
            <a
              href={reserveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-naver sm:min-w-[9.5rem]"
            >
              예약하기
            </a>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-on-dark sm:min-w-[9.5rem]"
            >
              오시는 길
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
