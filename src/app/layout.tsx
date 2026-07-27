import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/data/content";
import { getPublicImageUrl } from "@/lib/media";
import { SITE_URL } from "@/lib/utils";
import {
  buildOpeningHoursSpecification,
  formatBusinessHoursSummary,
} from "@/components/ui/BusinessHours";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

function toAbsoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  return undefined;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  // 공개 SEO URL은 항상 공식 도메인
  const siteUrl = SITE_URL;
  const og = getPublicImageUrl(settings.og_image_path) || `${siteUrl}/og-default.svg`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.seo_title,
      template: `%s | ${settings.business_name}`,
    },
    description: settings.seo_description,
    openGraph: {
      title: settings.seo_title,
      description: settings.seo_description,
      url: siteUrl,
      siteName: settings.business_name,
      locale: "ko_KR",
      type: "website",
      images: [{ url: og }],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seo_title,
      description: settings.seo_description,
      images: [og],
    },
    alternates: {
      canonical: siteUrl,
    },
    verification: {
      other: {
        "naver-site-verification": "158b488e174e30e37adb4cdfaddc98fdb9f7b1b0",
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const siteUrl = SITE_URL;

  const shopImage = toAbsoluteUrl(getPublicImageUrl(settings.shop_image_path));
  const heroImage = toAbsoluteUrl(getPublicImageUrl(settings.hero_image_path));
  const ogImage = toAbsoluteUrl(getPublicImageUrl(settings.og_image_path));
  const businessImage = shopImage || heroImage || ogImage;

  const sameAs = [settings.naver_blog_url]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

  const openingHoursSpecification = buildOpeningHoursSpecification(settings);

  // 기존 AutomotiveBusiness JSON-LD를 유지·보강 (중복 스크립트 추가 없음)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["AutoRepair", "AutomotiveBusiness"],
    name: settings.business_name || "코리아오토미션",
    alternateName: settings.english_brand_name || "KOREA AUTO MISSION",
    description: settings.seo_description,
    url: siteUrl,
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address || "부산 사상구 삼덕로 95",
      addressLocality: "부산",
      addressRegion: "사상구",
      addressCountry: "KR",
    },
    openingHours: formatBusinessHoursSummary(settings),
    ...(businessImage ? { image: businessImage } : {}),
    ...(openingHoursSpecification.length > 0
      ? { openingHoursSpecification }
      : {}),
    sameAs,
  };

  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body
        className="min-h-full antialiased font-sans"
        style={{
          ["--font-pretendard" as string]:
            '"Pretendard Variable", Pretendard, var(--font-noto-sans-kr), sans-serif',
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
