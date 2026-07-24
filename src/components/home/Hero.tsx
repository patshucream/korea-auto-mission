"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { SiteSettings } from "@/lib/types";
import { NaverReserveButton, PhoneButton } from "@/components/ui/ContactButtons";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  settings: SiteSettings;
};

export function Hero({ settings }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-warm-white-2">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(31,58,95,0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(31,58,95,0.06), transparent 35%)",
        }}
        aria-hidden
      />
      <div className="container-site relative grid items-center gap-8 py-10 md:py-14 lg:grid-cols-2 lg:gap-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <p className="text-sm font-bold tracking-[0.14em] text-navy">
            {settings.english_brand_name}
          </p>
          <h1 className="mt-3 whitespace-pre-line text-[2rem] font-black leading-[1.25] tracking-tight text-charcoal sm:text-[2.4rem] lg:text-[2.8rem]">
            {settings.hero_title}
          </h1>
          <p className="mt-5 whitespace-pre-line text-[1.05rem] leading-relaxed text-muted sm:text-lg">
            {settings.hero_description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PhoneButton settings={settings} />
            <NaverReserveButton settings={settings} />
            <Link href="/#location" className="btn btn-secondary">
              오시는 길
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
          className="relative"
        >
          <SmartImage
            path={settings.hero_image_path}
            alt={`${settings.business_name} 정비 현장`}
            className="aspect-[4/3] w-full rounded-[14px] lg:aspect-[5/4]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            fallbackLabel="정비 현장 사진"
          />
        </motion.div>
      </div>
    </section>
  );
}
