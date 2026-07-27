"use client";

import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { getPublicImageUrl } from "@/lib/media";
import { getReservationUrl, telHref } from "@/lib/utils";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  settings: SiteSettings;
};

export function Hero({ settings }: Props) {
  const imagePath = settings.hero_image_path || settings.shop_image_path;
  const reserveUrl = getReservationUrl(settings);
  const title =
    settings.hero_title?.trim() ||
    "수입차 오토미션과 디젤 정비,\n정확한 진단부터 시작합니다";
  const description =
    settings.hero_description?.trim() ||
    "부산 사상구 코리아오토미션\n변속기 전문 경험과 정밀 진단을 바탕으로 원인을 먼저 확인합니다.";

  return (
    <section className="relative -mt-[72px] min-h-[78svh] overflow-hidden bg-navy text-white lg:min-h-[88svh]">
      <div className="absolute inset-0">
        {getPublicImageUrl(imagePath) ? (
          <SmartImage
            path={imagePath}
            alt={`${settings.business_name} 정비 현장`}
            className="h-full min-h-[78svh] w-full lg:min-h-[88svh]"
            sizes="100vw"
            priority
            fallbackLabel="정비 현장"
          />
        ) : (
          <div className="h-full min-h-[78svh] w-full bg-navy lg:min-h-[88svh]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40" aria-hidden />
      </div>

      <div className="container-site relative flex min-h-[78svh] items-end pb-16 pt-28 lg:min-h-[88svh] lg:items-center lg:pb-28 lg:pt-32">
        <div className="w-full max-w-3xl">
          <p className="text-[0.75rem] font-medium tracking-[0.18em] text-white/65">
            {settings.english_brand_name}
          </p>
          <h1 className="mt-4 whitespace-pre-line text-[1.9rem] font-bold leading-[1.28] tracking-[-0.03em] sm:text-[2.55rem] lg:text-[3.1rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-xl whitespace-pre-line text-base leading-relaxed text-white/80 sm:text-lg">
            {description}
          </p>
          <div className="mt-9 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
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
              className="col-span-2 text-center text-sm font-bold text-white/85 underline-offset-4 hover:underline sm:col-span-1 sm:ml-2 sm:self-center"
            >
              작업사례 보기 →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
