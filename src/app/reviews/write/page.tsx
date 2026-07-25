import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { ReviewWriteForm } from "@/components/reviews/ReviewWriteForm";
import { getSiteSettings } from "@/lib/data/content";

export default async function ReviewWritePage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Header settings={settings} />
      <main className="pb-mobile-bar bg-warm-white">
        <section className="section-pad">
          <div className="container-site max-w-2xl">
            <Link href="/reviews" className="text-sm font-semibold text-muted hover:text-charcoal">
              ← 후기 목록
            </Link>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-charcoal">후기 작성하기</h1>
            <p className="mt-2 text-muted">
              작성하신 후기는 관리자 확인 후 홈페이지에 공개됩니다.
            </p>
            <div className="mt-8">
              <ReviewWriteForm />
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
      <MobileBottomBar settings={settings} />
    </>
  );
}
