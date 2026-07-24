import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { NaverReserveButton, PhoneButton } from "@/components/ui/ContactButtons";
import { BusinessHours } from "@/components/ui/BusinessHours";

type Props = {
  settings: SiteSettings;
};

export function Footer({ settings }: Props) {
  return (
    <footer className="bg-dark-section-2 text-white">
      <div className="container-site section-pad">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-2xl font-black">{settings.business_name}</p>
            <p className="mt-1 text-sm tracking-[0.12em] text-white/70">
              {settings.english_brand_name}
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/85">
              수입차·국산차 자동변속기 및 구동계 전문 정비소. 정확한 진단으로
              시작하는 정비를 지향합니다.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-lg font-bold">연락처</p>
              <ul className="mt-3 space-y-2 text-white/85">
                <li>{settings.address}</li>
                <li>
                  <a
                    className="underline-offset-2 hover:underline"
                    href={`tel:${settings.phone.replace(/[^0-9]/g, "")}`}
                  >
                    {settings.phone}
                  </a>
                </li>
              </ul>
            </div>

            <BusinessHours settings={settings} variant="footer" />
          </div>

          <div>
            <p className="text-lg font-bold">바로가기</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/works" className="text-white/85 hover:text-white">
                  작업사례
                </Link>
              </li>
              <li>
                <a
                  href={settings.naver_blog_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/85 hover:text-white"
                >
                  네이버 블로그
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-white/85 hover:text-white">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-white/85 hover:text-white">
                  관리자
                </Link>
              </li>
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:max-w-xs">
              <PhoneButton settings={settings} fullWidth />
              <NaverReserveButton settings={settings} fullWidth />
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-sm text-white/60">
          © {new Date().getFullYear()} {settings.business_name}. 모든 권리 보유.
        </div>
      </div>
    </footer>
  );
}
