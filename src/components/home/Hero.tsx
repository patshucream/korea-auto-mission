"use client";

import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { getPublicImageUrl } from "@/lib/media";
import { telHref } from "@/lib/utils";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  settings: SiteSettings;
};

export function Hero({ settings }: Props) {
  const imagePath = settings.hero_image_path || settings.shop_image_path;

  return (
    <section className="relative -mt-[72px] min-h-[100svh] overflow-hidden bg-black text-white">
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
          <div className="h-full min-h-[100svh] w-full bg-[#1a1a1a]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-black/60" aria-hidden />
      </div>

      <div className="container-site relative flex min-h-[100svh] items-center pb-20 pt-28 lg:pb-24 lg:pt-32">
        <div className="mx-auto w-full max-w-3xl text-center lg:mx-0 lg:text-left">
          <p className="text-[0.8rem] font-medium tracking-[0.18em] text-white/65 sm:text-sm">
            {settings.english_brand_name}
          </p>
          <h1 className="mt-5 whitespace-pre-line text-[2.15rem] font-bold leading-[1.25] tracking-[-0.03em] text-white sm:text-[2.75rem] lg:text-[3.35rem]">
            {"수입차 변속기 수리,\n경험으로 정확하게 진단합니다."}
          </h1>
          <p className="mt-6 text-[1.05rem] leading-relaxed text-white/80 sm:text-lg">
            30년 경력의 변속기 전문 정비 · 부산 코리아오토미션
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a href={telHref(settings.phone)} className="btn btn-light min-w-[10.5rem]">
              정비 상담하기
            </a>
            <Link href="/#works" className="btn btn-on-dark min-w-[10.5rem]">
              작업 사례 보기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
