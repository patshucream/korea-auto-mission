import type { SiteSettings } from "@/lib/types";
import { NaverReserveButton, PhoneButton } from "@/components/ui/ContactButtons";
import { BusinessHours } from "@/components/ui/BusinessHours";

type Props = {
  settings: SiteSettings;
};

export function Location({ settings }: Props) {
  return (
    <section id="location" className="section-pad bg-gray-100">
      <div className="container-site grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="section-title">위치 및 영업시간</h2>
          <p className="section-lead">방문 전 전화로 일정을 확인해 주시면 안내가 더 정확합니다.</p>

          <dl className="mt-8 space-y-4 text-[1.05rem]">
            <div>
              <dt className="font-bold text-charcoal">주소</dt>
              <dd className="mt-1 text-muted">{settings.address}</dd>
            </div>
            <div>
              <dt className="font-bold text-charcoal">전화</dt>
              <dd className="mt-1 text-muted">{settings.phone}</dd>
            </div>
          </dl>

          <BusinessHours settings={settings} variant="light" className="mt-6" />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PhoneButton settings={settings} />
            <NaverReserveButton settings={settings} />
            <a
              href={settings.naver_map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              길찾기
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-border bg-white">
          <iframe
            title="코리아오토미션 네이버 지도"
            src={`https://map.naver.com/p/search/${encodeURIComponent(settings.address)}`}
            className="h-[360px] w-full min-h-[360px] border-0 lg:h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
