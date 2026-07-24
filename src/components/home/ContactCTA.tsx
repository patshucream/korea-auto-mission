import type { SiteSettings } from "@/lib/types";
import { telHref } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
};

export function ContactCTA({ settings }: Props) {
  const reserveUrl =
    settings.naver_reservation_url?.trim() ||
    settings.naver_blog_url ||
    "https://blog.naver.com/97ga074";
  const mapUrl = settings.naver_map_url?.trim() || "#";

  return (
    <section id="contact" className="section-pad bg-black text-white">
      <div className="container-site">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium tracking-[0.16em] text-white/50">CONTACT</p>
          <h2 className="mt-4 text-[1.9rem] font-bold leading-snug tracking-[-0.03em] sm:text-[2.4rem]">
            차량 증상, 먼저 상담해 보세요.
          </h2>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-white/70">
            증상과 차량 정보를 알려주시면 점검 방향과 방문 일정을 안내드립니다.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a href={telHref(settings.phone)} className="btn btn-light">
              전화 상담
            </a>
            <a
              href={reserveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-naver"
            >
              네이버 예약
            </a>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-on-dark"
            >
              오시는 길
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
