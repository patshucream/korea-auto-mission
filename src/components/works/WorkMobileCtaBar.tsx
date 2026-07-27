"use client";

import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { getReservationUrl, telHref } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
};

/** 작업사례 상세 전용: 전화 / 상담 / 예약 */
export function WorkMobileCtaBar({ settings }: Props) {
  const reserveUrl = getReservationUrl(settings);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 p-2.5 backdrop-blur md:hidden">
      <div className="grid grid-cols-3 gap-2">
        <a href={telHref(settings.phone)} className="btn btn-light !min-h-12 text-[0.9rem]">
          전화
        </a>
        <Link href="/#contact" className="btn btn-secondary !min-h-12 text-[0.9rem]">
          상담
        </Link>
        <a
          href={reserveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-naver !min-h-12 text-[0.9rem]"
        >
          예약
        </a>
      </div>
    </div>
  );
}
