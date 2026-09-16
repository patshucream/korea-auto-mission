import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { SmartImage } from "@/components/ui/SmartImage";
import { BusinessHours } from "@/components/ui/BusinessHours";
import { WorkCard } from "@/components/works/WorkCard";
import { ConsultationHelper } from "@/components/services/ConsultationHelper";
import { getPaginatedWorks, getPublishedServiceOptions, getSiteSettings } from "@/lib/data/content";
import { getMapUrl, getReservationUrl, SITE_URL, telHref } from "@/lib/utils";
import s from "./page.module.css";

const path = "/services/transmission";
const title = "부산 미션수리 · 자동변속기 진단";
const description = "부산 사상구 코리아오토미션의 수입차·국산차 자동변속기 정비 안내. 변속 충격, 슬립, 가속 떨림의 실제 수리 사례와 진단·견적·입고 과정을 확인하세요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}${path}` },
  openGraph: {
    title: `${title} | 코리아오토미션`, description,
    url: `${SITE_URL}${path}`, type: "website", locale: "ko_KR",
  },
  twitter: { card: "summary_large_image", title: `${title} | 코리아오토미션`, description },
};

const symptoms = [
  { title: "변속할 때 충격이 느껴진다면", body: "출발할 때인지, 주행 중 특정 단수에서인지 알려주세요. 차종과 증상이 나타나는 조건을 함께 확인합니다." },
  { title: "RPM은 오르는데 가속이 더디다면", body: "고속 주행이나 가속 중 발생하는 슬립 증상을 상담해 주세요. 실제 사례에서는 변속기 내부와 토크컨버터를 함께 점검했습니다." },
  { title: "가속할수록 떨림이 커진다면", body: "떨림이 시작되는 속도와 상황을 기록해 주세요. 올란도·알페온 사례에서 진단 내용과 작업 결과를 확인할 수 있습니다." },
];

const faqs = [
  { question: "미션수리 비용을 전화로 알 수 있나요?", answer: "차종·연식·주행거리와 증상을 알려주시면 상담을 시작할 수 있습니다. 실제 작업 범위와 견적은 입고 점검 및 진단 결과를 확인한 뒤 안내합니다." },
  { question: "수리는 얼마나 걸리나요?", answer: "점검 결과와 필요한 작업, 부품 준비에 따라 달라집니다. 차량 정보와 방문 희망일을 알려주시면 입고 일정과 확인이 필요한 사항을 안내합니다." },
  { question: "수입차와 국산차 모두 상담할 수 있나요?", answer: "수입차·국산차 자동변속기 정비를 상담합니다. 차량별 정비 가능 여부는 차종과 연식, 증상을 확인한 뒤 안내하므로 방문 전에 문의해 주세요." },
  { question: "상담 전에 무엇을 준비하면 되나요?", answer: "차종, 연식, 주행거리, 증상이 나타나는 상황과 최근 정비 내역을 준비해 주세요. 경고등이 있다면 함께 알려주시면 됩니다." },
];

export default async function TransmissionPage() {
  const [settings, services] = await Promise.all([getSiteSettings(), getPublishedServiceOptions()]);
  const service = services.find((item) => item.title === "오토미션 수리");
  const filter: Record<string, string> = service ? { service: service.id } : { category: "오토미션 수리" };
  const { items: works, total } = await getPaginatedWorks({ ...filter, pageSize: 4 });
  const allCasesHref = `/works?${new URLSearchParams(filter).toString()}`;
  const featured = works[0];
  const phone = telHref(settings.phone);
  const reservation = getReservationUrl(settings);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service", name: "부산 자동변속기 진단 및 미션수리",
        serviceType: "자동변속기 진단 및 수리", description, url: `${SITE_URL}${path}`,
        areaServed: { "@type": "City", name: "부산광역시" },
        provider: { "@type": "AutoRepair", name: settings.business_name, url: SITE_URL, telephone: settings.phone,
          address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "KR" } },
      },
      {
        "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "미션수리 안내", item: `${SITE_URL}${path}` },
        ],
      },
    ],
  };

  return <>
    <Header settings={settings} />
    <main id="transmission-main" className={`${s.page} pb-mobile-bar`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <nav aria-label="현재 위치" className={s.breadcrumb}><Link href="/">홈</Link><span>/</span><span>미션수리 안내</span></nav>
          <p className={s.eyebrow}>부산 사상구 · 수입차·국산차 자동변속기</p>
          <h1>부산 미션수리,<br />내 차 증상부터<br />상담하세요.</h1>
          <p className={s.lead}>변속 충격, 슬립, 가속할 때의 떨림.<br />코리아오토미션은 원인을 먼저 확인하고<br />필요한 정비 범위와 견적을 안내합니다.</p>
          <div className={s.actions}>
            <a className={s.primary} href={phone} data-contact="phone">전화로 증상 상담 <span aria-hidden="true">↗</span></a>
            <a className={s.textLink} href="#repair-cases">실제 수리 사례 보기 ↓</a>
          </div>
          <a className={s.heroPhone} href={phone}>{settings.phone}</a>
          <p className={s.heroHours}>평일 {settings.weekday_hours} · 토요일 {settings.saturday_hours} · 일요일 휴무</p>
          <p className={s.address}>{settings.address} · <a href="#consultation">문자로 상담 내용 남기기 ↓</a></p>
        </div>
        <figure className={s.heroFigure}>
          <SmartImage path={featured?.representative_image_path || settings.shop_image_path} alt={featured?.title || `${settings.business_name} 정비 현장`} className={s.heroImage} sizes="(max-width: 800px) 100vw, 50vw" priority />
          <figcaption>{featured ? <Link href={`/works/${featured.slug}`}>실제 작업 기록 · {featured.title} ↗</Link> : settings.business_name}</figcaption>
        </figure>
      </section>

      <nav aria-label="미션수리 안내 목차" className={s.sectionNav}>
        <a href="#symptoms">증상 상담</a><a href="#repair-cases">실제 수리 사례</a><a href="#repair-process">진단·수리 과정</a><a href="#repair-faq">비용·입고 안내</a><a href="#visit">방문 상담</a>
      </nav>
      <div className={s.promise}><span>점검 결과에 따른 견적 안내</span><span>합의된 범위로 정비 진행</span><span>실제 작업 사진 공개</span></div>

      <section id="symptoms" className={s.section}>
        <p className={s.eyebrow}>증상으로 시작하는 상담</p>
        <h2>언제, 어떻게 불편한가요?</h2>
        <p className={s.sectionLead}>증상만으로 수리 범위를 단정하지 않습니다. 차량 정보와 점검 결과를 함께 확인합니다.</p>
        <div className={s.symptoms}>{symptoms.map((item, index) => <article key={item.title}>
          <span className={s.number}>0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p>
        </article>)}</div>
      </section>

      <section id="repair-cases" className={`${s.section} ${s.casesSection}`}>
        <p className={s.eyebrow}>사진과 함께 남긴 정비 기록</p>
        <div className={s.sectionHeading}><h2>실제로 어떤 수리를 했는지<br />확인해 보세요.</h2><Link className={s.textLink} href={allCasesHref}>미션수리 사례 전체 보기{total ? ` (${total})` : ""} ↗</Link></div>
        {works.length ? <div className={s.cases}>{works.map((work) => <WorkCard key={work.id} work={work} />)}</div> : <p className={s.sectionLead}>차종과 증상을 알려주시면 상담을 도와드립니다.</p>}
      </section>

      <ConsultationHelper settings={settings} service="미션수리" symptoms={["변속 충격", "가속 지연·슬립", "가속할 때 떨림", "경고등", "기타 증상"]} />

      <section id="repair-process" className={s.section}>
        <p className={s.eyebrow}>상담부터 출고까지</p>
        <h2>진단하고, 설명하고, 정비합니다.</h2>
        <ol className={s.process}>{settings.process_steps.map((step, index) => <li key={`${index}-${step.title}`}><span className={s.number}>{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol>
      </section>

      <section id="repair-faq" className={`${s.section} ${s.faqSection}`}>
        <div><p className={s.eyebrow}>방문 전에 궁금한 점</p><h2>비용과 입고 안내.</h2></div>
        <div className={s.faqs}>{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <section id="visit" className={`${s.section} ${s.visit}`}>
        <div><p className={s.eyebrow}>부산 사상구에서 상담하세요</p><h2>{settings.business_name}</h2><p className={s.sectionLead}>{settings.address}</p>
          <a className={s.phone} href={phone}>{settings.phone}</a>
          <p>차종 · 연식 · 주행거리 · 증상을 알려주세요.</p>
          <div className={s.actions}>{reservation ? <a className={s.primary} href={reservation} target="_blank" rel="noopener noreferrer">네이버 예약·매장 정보 ↗</a> : null}<a className={s.textLink} href={getMapUrl(settings)} target="_blank" rel="noopener noreferrer">지도에서 위치 확인 ↗</a></div>
        </div>
        <BusinessHours settings={settings} className={s.hours} />
      </section>
    </main>
    <Footer settings={settings} />
    <MobileBottomBar settings={settings} />
  </>;
}
