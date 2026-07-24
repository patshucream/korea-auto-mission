import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { getSiteSettings } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "코리아오토미션 개인정보처리방침",
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Header settings={settings} />
      <main className="pb-mobile-bar section-pad">
        <div className="container-site max-w-4xl">
          <h1 className="section-title">개인정보처리방침</h1>
          <p className="section-lead">
            {settings.business_name}({settings.english_brand_name})은 고객의 개인정보를
            소중히 다루며, 관련 법령을 준수합니다.
          </p>

          <div className="prose-ko mt-8 space-y-6 text-[1.05rem] leading-relaxed text-charcoal-soft">
            <section>
              <h2 className="text-xl font-black text-charcoal">1. 수집하는 개인정보 항목</h2>
              <p className="mt-2">
                전화 상담 및 예약 과정에서 성함, 연락처, 차량 정보, 상담 내용이 수집될 수
                있습니다. 웹사이트 관리자 계정 정보는 서비스 운영 목적으로만 사용됩니다.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-black text-charcoal">2. 개인정보의 이용 목적</h2>
              <p className="mt-2">
                수집된 정보는 상담 응대, 예약 확인, 정비 안내, 고객 문의 처리, 웹사이트
                운영을 위해 사용됩니다.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-black text-charcoal">3. 보유 및 이용 기간</h2>
              <p className="mt-2">
                관련 법령에 따른 보관 기간 또는 상담·정비 목적 달성 시까지 보유하며, 목적
                달성 후 지체 없이 파기합니다. 단, 법령상 보관이 필요한 경우 해당 기간 동안
                보관할 수 있습니다.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-black text-charcoal">4. 제3자 제공</h2>
              <p className="mt-2">
                원칙적으로 고객의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만
                법령에 근거한 요청이 있는 경우 제공될 수 있습니다.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-black text-charcoal">5. 문의</h2>
              <p className="mt-2">
                개인정보 관련 문의는 전화({settings.phone}) 또는 방문(
                {settings.address})으로 연락해 주세요.
              </p>
            </section>
          </div>

          <Link href="/" className="btn btn-secondary mt-10 inline-flex">
            홈으로 돌아가기
          </Link>
        </div>
      </main>
      <Footer settings={settings} />
      <MobileBottomBar settings={settings} />
    </>
  );
}
