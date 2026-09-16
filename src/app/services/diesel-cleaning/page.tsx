import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { SmartImage } from "@/components/ui/SmartImage";
import { BusinessHours } from "@/components/ui/BusinessHours";
import { WorkCard } from "@/components/works/WorkCard";
import { ConsultationHelper } from "@/components/services/ConsultationHelper";
import { getPaginatedWorks, getSiteSettings } from "@/lib/data/content";
import { getMapUrl, getReservationUrl, SITE_URL, telHref } from "@/lib/utils";
import s from "../transmission/page.module.css";

const path = "/services/diesel-cleaning";
const title = "부산 흡기·인젝터·DPF 클리닝 상담";
const description = "부산 사상구 코리아오토미션의 디젤 클리닝 안내. 스포티지·맥스크루즈·모하비 등 실제 작업 사진을 보고 흡기, 인젝터, DPF 점검과 방문 일정을 상담하세요.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: `${SITE_URL}${path}` },
  openGraph: { title: `${title} | 코리아오토미션`, description, url: `${SITE_URL}${path}`, type: "website", locale: "ko_KR" },
};

const services = [
  { title: "흡기 클리닝", body: "흡기 계통의 오염 상태를 확인하고 필요한 정비를 안내합니다. 스포티지·맥스크루즈 등의 실제 작업 사진을 확인해 보세요.", category: "흡기 클리닝" },
  { title: "인젝터 클리닝", body: "차량 정보와 증상을 바탕으로 인젝터 점검 및 클리닝을 상담합니다. 흡기와 함께 작업한 사례도 각각 표시했습니다.", category: "인젝터 클리닝" },
  { title: "DPF 클리닝", body: "경고등이나 출력 저하가 있다면 발생 상황과 최근 정비 내역을 알려주세요. 점검 결과를 확인해 필요한 작업 범위를 안내합니다.", category: "DPF 클리닝" },
];
const faqs = [
  { q: "흡기·인젝터·DPF를 모두 해야 하나요?", a: "모든 차량에 세 가지 작업이 필요한 것은 아닙니다. 차종, 증상, 점검 결과를 확인한 후 필요한 작업을 안내합니다. 세 가지를 함께 진행한 맥스크루즈 사례와 일부 작업만 진행한 사례를 비교해 보세요." },
  { q: "클리닝 비용은 얼마인가요?", a: "차종과 작업 범위, 탈거 여부 등에 따라 달라집니다. 차종·연식·주행거리와 증상을 알려주시면 상담을 시작하고, 점검 후 작업 범위와 견적을 안내합니다." },
  { q: "클리닝으로 경고등이 해결되나요?", a: "경고등이나 출력 저하에는 여러 원인이 있을 수 있어 클리닝만으로 해결된다고 단정하지 않습니다. 진단 후 필요한 정비 여부를 확인합니다." },
  { q: "방문 전에 무엇을 알려드리면 되나요?", a: "차종, 연식, 주행거리, 증상과 경고등, 최근 정비 내역을 알려주세요. 방문 희망일도 함께 말씀해 주시면 입고 가능 일정을 안내합니다." },
];

export default async function DieselCleaningPage() {
  const [settings, ...results] = await Promise.all([getSiteSettings(), ...services.map(service => getPaginatedWorks({ category: service.category, pageSize: 6 }))]);
  const works = Array.from(new Map(results.flatMap(result => result.items).map(work => [work.id, work])).values()).slice(0, 6);
  const featured = works.find(work => /스포티지/.test(work.title)) || works[0];
  const phone = telHref(settings.phone);
  const data = { "@context": "https://schema.org", "@type": "Service", name: title, description, url: `${SITE_URL}${path}`, serviceType: "흡기, 인젝터, DPF 점검 및 클리닝", areaServed: { "@type": "City", name: "부산광역시" }, provider: { "@type": "AutoRepair", name: settings.business_name, url: SITE_URL, telephone: settings.phone, address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "KR" } } };
  return <>
    <Header settings={settings} />
    <main className={`${s.page} pb-mobile-bar`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <nav className={s.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><span>디젤 클리닝 안내</span></nav>
          <p className={s.eyebrow}>부산 사상구 · 흡기·인젝터·DPF</p>
          <h1>부산 디젤 클리닝,<br />내 차에 필요한<br />작업부터 확인하세요.</h1>
          <p className={s.lead}>출력 저하, 떨림, 경고등이 신경 쓰인다면.<br />차종과 증상을 확인하고 필요한 점검과<br />클리닝 범위를 안내합니다.</p>
          <div className={s.actions}><a className={s.primary} href={phone} data-contact="phone">전화로 클리닝 상담 ↗</a><a className={s.textLink} href="#repair-cases">실제 작업 사진 보기 ↓</a></div>
          <a className={s.heroPhone} href={phone}>{settings.phone}</a>
          <p className={s.heroHours}>평일 {settings.weekday_hours} · 토요일 {settings.saturday_hours} · 일요일 휴무</p>
          <p className={s.address}>{settings.address} · <a href="#consultation">문자로 상담 내용 남기기 ↓</a></p>
        </div>
        <figure className={s.heroFigure}><SmartImage path={featured?.representative_image_path || settings.shop_image_path} alt={featured?.title || "코리아오토미션 정비 현장"} className={s.heroImage} sizes="(max-width: 800px) 100vw, 50vw" priority /><figcaption>{featured ? <Link href={`/works/${featured.slug}`}>실제 작업 기록 · {featured.title} ↗</Link> : settings.business_name}</figcaption></figure>
      </section>
      <nav className={s.sectionNav} aria-label="디젤 클리닝 안내 목차"><a href="#cleaning-services">작업별 안내</a><a href="#repair-cases">실제 작업 사례</a><a href="#consultation">차량 상담</a><a href="#repair-faq">비용·입고 안내</a></nav>
      <div className={s.promise}><span>차량 상태에 맞는 작업 안내</span><span>견적 확인 후 정비 진행</span><span>실제 작업 사진 공개</span></div>
      <section id="cleaning-services" className={s.section}><p className={s.eyebrow}>한 가지 작업씩 정확하게</p><h2>흡기, 인젝터, DPF.<br />필요한 작업은 차량마다 다릅니다.</h2><div className={s.symptoms}>{services.map((service, i)=><article key={service.title}><span className={s.number}>0{i+1}</span><h3>{service.title}</h3><p>{service.body}</p><Link className={s.textLink} href={`/works?category=${encodeURIComponent(service.category)}`}>{service.title} 사례 보기 ↗</Link></article>)}</div></section>
      <section id="repair-cases" className={`${s.section} ${s.casesSection}`}><p className={s.eyebrow}>사진으로 확인하는 실제 정비</p><h2>내 차와 비슷한 작업을<br />먼저 확인해 보세요.</h2><p className={s.sectionLead}>각 사례에 실제 진행한 작업을 모두 표시했습니다.</p><div className={s.cases}>{works.map(work=><WorkCard key={work.id} work={work} />)}</div></section>
      <ConsultationHelper settings={settings} service="디젤 클리닝" symptoms={["출력 저하", "떨림", "경고등", "흡기 점검", "인젝터 점검", "DPF 점검"]} />
      <section id="repair-faq" className={`${s.section} ${s.faqSection}`}><div><p className={s.eyebrow}>방문 전에 궁금한 점</p><h2>비용과 작업 범위 안내.</h2></div><div className={s.faqs}>{faqs.map(faq=><details key={faq.q}><summary>{faq.q}<span aria-hidden="true">+</span></summary><p>{faq.a}</p></details>)}</div></section>
      <section className={`${s.section} ${s.visit}`}><div><p className={s.eyebrow}>방문 일정부터 상담하세요</p><h2>{settings.business_name}</h2><p className={s.sectionLead}>{settings.address}</p><a className={s.phone} href={phone}>{settings.phone}</a><div className={s.actions}><a className={s.primary} href={getReservationUrl(settings)} target="_blank" rel="noopener noreferrer">네이버 매장 정보 ↗</a><a className={s.textLink} href={getMapUrl(settings)} target="_blank" rel="noopener noreferrer">지도에서 위치 확인 ↗</a></div></div><BusinessHours settings={settings} className={s.hours} /></section>
    </main><Footer settings={settings} /><MobileBottomBar settings={settings} />
  </>;
}
