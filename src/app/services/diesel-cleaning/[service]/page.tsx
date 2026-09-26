import Link from "next/link";
import type { Metadata } from "next";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/social-image";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { SmartImage } from "@/components/ui/SmartImage";
import { SmsLink } from "@/components/ui/SmsLink";
import { ConsultationHelper } from "@/components/services/ConsultationHelper";
import { WorkCard } from "@/components/works/WorkCard";
import { getPaginatedWorks, getSiteSettings } from "@/lib/data/content";
import { dieselGuides, dieselGuidePath, getDieselGuide } from "@/lib/diesel-guides";
import { SITE_URL, telHref } from "@/lib/utils";
import s from "../../transmission/page.module.css";

type Props = { params: Promise<{ service: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getDieselGuide((await params).service);
  if (!guide) notFound();
  const url = `${SITE_URL}${dieselGuidePath(guide.slug)}`;
  return { title: guide.title, description: guide.description,
    alternates: { canonical: url },
    openGraph: { title: `${guide.title} | 코리아오토미션`, description: guide.description, url, type: "website", locale: "ko_KR", images: [DEFAULT_SOCIAL_IMAGE] } };
}

export default async function DieselServiceGuide({ params }: Props) {
  const guide = getDieselGuide((await params).service);
  if (!guide) notFound();
  const [settings, result] = await Promise.all([
    getSiteSettings(), getPaginatedWorks({ category: guide.category, pageSize: 6 }),
  ]);
  const featured = result.items[0];
  const url = `${SITE_URL}${dieselGuidePath(guide.slug)}`;
  const schema = { "@context": "https://schema.org", "@type": "Service",
    name: guide.title, description: guide.description, url, serviceType: guide.category,
    areaServed: { "@type": "City", name: "부산광역시" },
    provider: { "@type": "AutoRepair", name: settings.business_name, telephone: settings.phone,
      url: SITE_URL, address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "KR" } } };
  return <>
    <Header settings={settings} />
    <main className={`${s.page} pb-mobile-bar`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <nav className={s.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href="/services/diesel-cleaning">디젤 클리닝</Link><span>/</span><span>{guide.category}</span></nav>
          <p className={s.eyebrow}>부산 사상구 · {settings.business_name}</p>
          <h1 className="whitespace-pre-line">{guide.heading}</h1>
          <p className={s.lead}>{guide.intro}</p>
          <div className={s.actions}>
            <a className={s.primary} href={telHref(settings.phone)}>전화로 작업 상담 ↗</a>
            <SmsLink className={s.textLink} phone={settings.phone} body={`[${guide.category} 상담]\n차종·연식:\n주행거리:\n증상:\n방문 희망일:`}>문자로 차종·증상 보내기 ↗</SmsLink>
          </div>
          <p className={s.heroHours}>평일 {settings.weekday_hours} · 토요일 {settings.saturday_hours} · 일요일 휴무</p>
          <p className={s.address}>{settings.address} · 비용은 차량 상태와 작업량 확인 후 안내</p>
        </div>
        <figure className={s.heroFigure}>
          <SmartImage path={featured?.representative_image_path || settings.shop_image_path} alt={featured?.title || settings.business_name} className={s.heroImage} sizes="(max-width: 800px) 100vw, 50vw" priority />
          <figcaption>{featured ? <Link href={`/works/${featured.slug}`}>실제 작업 기록 · {featured.title} ↗</Link> : settings.business_name}</figcaption>
        </figure>
      </section>
      <nav className={s.sectionNav} aria-label="작업 안내 목차"><a href="#check-points">상담 전 확인</a><a href="#repair-cases">실제 작업 사진</a><a href="#repair-faq">비용·작업 안내</a><a href="#consultation">문자 상담 작성</a></nav>
      <section id="check-points" className={s.section}>
        <p className={s.eyebrow}>{guide.category} 상담</p><h2>이 내용을 알려주시면<br />상담을 시작할 수 있습니다.</h2>
        <div className={s.symptoms}>{guide.questions.map((item, i) => <article key={item.title}><span className={s.number}>0{i + 1}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
      </section>
      <section id="repair-cases" className={`${s.section} ${s.casesSection}`}>
        <p className={s.eyebrow}>코리아오토미션 실제 정비 기록</p><h2>{guide.category} 작업 사진.</h2>
        <p className={s.sectionLead}>각 차량의 증상과 진행한 작업을 함께 확인하세요. 내 차량의 견적과 작업 범위는 별도로 점검해 안내합니다.</p>
        {result.items.length ? <div className={s.cases}>{result.items.map(work => <WorkCard key={work.id} work={work} />)}</div> : <p className={s.sectionLead}>작업사례를 준비 중입니다. 차량 정보와 증상으로 상담해 주세요.</p>}
        <Link className={s.textLink} href={`/works?category=${encodeURIComponent(guide.category)}`}>{guide.category} 사례 전체 보기 ↗</Link>
      </section>
      <section id="repair-faq" className={`${s.section} ${s.faqSection}`}><div><p className={s.eyebrow}>견적을 알아보고 있다면</p><h2>비용과 작업 범위.</h2></div><div className={s.faqs}>{guide.faqs.map(faq => <details key={faq.q} open><summary>{faq.q}<span aria-hidden="true">+</span></summary><p>{faq.a}</p></details>)}</div></section>
      <ConsultationHelper settings={settings} service={guide.category} symptoms={[...guide.symptoms]} />
      <nav className={s.sectionNav} aria-label="다른 디젤 작업 안내">{dieselGuides.filter(item => item.slug !== guide.slug).map(item => <Link key={item.slug} href={dieselGuidePath(item.slug)}>{item.category} 안내 ↗</Link>)}<Link href="/services/diesel-cleaning">디젤 클리닝 전체 안내 ↗</Link></nav>
    </main>
    <Footer settings={settings} /><MobileBottomBar settings={settings} />
  </>;
}
