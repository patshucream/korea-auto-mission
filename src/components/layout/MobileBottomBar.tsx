"use client";

import type { SiteSettings } from "@/lib/types";
import { getReservationUrl, telHref } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
};

export function MobileBottomBar({ settings }: Props) {
  const reserveUrl = getReservationUrl(settings);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 p-2.5 backdrop-blur md:hidden">
      <div className="grid grid-cols-2 gap-2">
        <a href={telHref(settings.phone)} className="btn btn-light !min-h-12 text-[0.98rem]">
          전화 상담
        </a>
        <a
          href={reserveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-naver !min-h-12 text-[0.98rem]"
        >
          예약하기
        </a>
      </div>
    </div>
  );
}
