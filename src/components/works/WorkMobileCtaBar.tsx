"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { getMapUrl, getReservationUrl, telHref } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
};

/** 작업사례 상세 전용: 스크롤 방향에 따라 축소되는 sticky CTA */
export function WorkMobileCtaBar({ settings }: Props) {
  const reserveUrl = getReservationUrl(settings);
  const mapUrl = getMapUrl(settings);
  const [compact, setCompact] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < 80) setCompact(false);
      else if (delta > 8) setCompact(true);
      else if (delta < -8) setCompact(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur transition-all md:hidden ${
        compact ? "p-1.5" : "p-2.5"
      }`}
    >
      {!compact ? (
        <p className="mb-2 px-1 text-center text-[0.72rem] text-white/65">
          비슷한 증상이면 증상·차종을 알려주세요
        </p>
      ) : null}
      <div className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-3"}`}>
        <a
          href={telHref(settings.phone)}
          className={`btn btn-light text-[0.88rem] ${compact ? "!min-h-10" : "!min-h-12"}`}
        >
          전화
        </a>
        <a
          href={reserveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn btn-naver text-[0.88rem] ${compact ? "!min-h-10" : "!min-h-12"}`}
        >
          예약
        </a>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn btn-secondary text-[0.88rem] ${compact ? "!min-h-10" : "!min-h-12"}`}
        >
          위치
        </a>
      </div>
      {compact ? null : (
        <Link
          href="/#contact"
          className="mt-2 block text-center text-xs font-semibold text-white/70 underline-offset-2 hover:underline"
        >
          상담 문의
        </Link>
      )}
    </div>
  );
}
