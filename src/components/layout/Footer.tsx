import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { BusinessHours } from "@/components/ui/BusinessHours";

type Props = {
  settings: SiteSettings;
};

export function Footer({ settings }: Props) {
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="container-site py-12 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em]">{settings.business_name}</p>
            <p className="mt-1 text-xs tracking-[0.14em] text-white/45">
              {settings.english_brand_name}
            </p>
            <p className="mt-5 text-sm leading-relaxed text-white/65">{settings.address}</p>
            <a
              className="mt-2 inline-block text-sm text-white/80 hover:text-white"
              href={`tel:${settings.phone.replace(/[^0-9]/g, "")}`}
            >
              {settings.phone}
            </a>
          </div>

          <BusinessHours settings={settings} variant="footer" className="text-sm" />

          <div>
            <p className="text-sm font-semibold text-white/90">바로가기</p>
            <ul className="mt-4 space-y-2 text-sm text-white/65">
              <li>
                <a
                  href={settings.naver_blog_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  네이버 블로그
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-white">
                  관리자
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} {settings.business_name}
        </div>
      </div>
    </footer>
  );
}
