import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/data/content";
import { getPublicImageUrl } from "@/lib/media";
import { getSiteUrl } from "@/lib/utils";
import { formatBusinessHoursSummary } from "@/components/ui/BusinessHours";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = getSiteUrl();
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
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    name: settings.business_name,
    alternateName: settings.english_brand_name,
    description: settings.seo_description,
    url: siteUrl,
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: "부산",
      addressRegion: "사상구",
      addressCountry: "KR",
    },
    openingHours: formatBusinessHoursSummary(settings),
    image: getPublicImageUrl(settings.og_image_path) || undefined,
    sameAs: [settings.naver_blog_url].filter(Boolean),
  };

  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full`}>
      <body className="min-h-full antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
