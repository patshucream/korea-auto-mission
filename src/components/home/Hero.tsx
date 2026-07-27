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
    "변속 충격, 미션오일, DPF·흡기·인젝터까지. 30년 경험으로 원인부터 확인합니다.";

  return (
    <section className="relative -mt-[72px] min-h-[100svh] overflow-hidden bg-navy text-white">
      <div className="absolute inset-0">
        {getPublicImageUrl(imagePath) ? (
          <SmartImage
            path={imagePath}
            alt={`${settings.business_name} 정비 작업장`}
            className="h-full min-h-[100svh] w-full"
            sizes="100vw"
            priority
            fallbackLabel="정비 작업장"
          />
        ) : (
          <div className="h-full min-h-[100svh] w-full bg-navy" aria-hidden />
        )}
        <div className="absolute inset-0 bg-navy/55" aria-hidden />
      </div>

      <div className="container-site relative flex min-h-[100svh] items-center pb-24 pt-28 lg:pb-28 lg:pt-32">
        <div className="mx-auto w-full max-w-3xl lg:mx-0">
          <p className="text-[0.78rem] font-medium tracking-[0.16em] text-white/70 sm:text-sm">
            {settings.english_brand_name}
          </p>
          <h1 className="mt-5 whitespace-pre-line text-[1.85rem] font-bold leading-[1.3] tracking-[-0.03em] text-white sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-xl whitespace-pre-line text-base leading-relaxed text-white/85 sm:text-lg">
            {description}
          </p>
          <div className="mt-10 grid w-full grid-cols-2 gap-3 sm:flex sm:flex-wrap">
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
            <Link href="/#works" className="btn btn-on-dark col-span-2 sm:col-span-1">
              작업사례 보기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
