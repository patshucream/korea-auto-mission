import { SmsLink } from "@/components/ui/SmsLink";
import Link from "next/link";
import type { Metadata } from "next";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/social-image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { ConsultationHelper } from "@/components/services/ConsultationHelper";
import { getSiteSettings } from "@/lib/data/content";
import { SITE_URL, telHref } from "@/lib/utils";
import s from "./page.module.css";

const path = "/services/electric-vehicle";
const title = "부산 전기차 수리 · 배터리·인버터·충전·감속기 정비";
const description = "코리아오토미션의 전기차 수리 상담. EV6·아이오닉5 등 배터리·인버터, 충전 계통, 모터·감속기를 점검하고 작업 범위와 견적을 안내합니다. 전화·문자 상담, 부산 사상구 삼덕로 95.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: `${SITE_URL}${path}` },
  openGraph: { title: `${title} | 코리아오토미션`, description, url: `${SITE_URL}${path}`, type: "website", locale: "ko_KR", images: [DEFAULT_SOCIAL_IMAGE] },
};

export default async function ElectricVehiclePage() {
  const settings = await getSiteSettings();
  const topics = [
    { title: "배터리·인버터", hint: "계기판 경고 · 출력 저하", ask: "표시된 경고 문구와 증상이 시작된 시점을 알려주세요.", body: "배터리와 인버터 관련 경고, 출력 저하 등 전기차 전장 문제를 점검합니다. 차종과 진단 결과에 따라 수리·교체 범위를 안내합니다." },
    { title: "충전 불량·충전 계통", hint: "충전 시작 불가 · 충전 중단", ask: "완속·급속 여부와 충전기에 표시된 문구를 알려주세요.", body: "완속·급속 중 어느 쪽에서 충전이 안 되는지, 경고 문구가 나타나는지 알려주세요. 충전 계통을 확인하고 필요한 작업을 상담합니다." },
    { title: "모터·감속기", hint: "주행 소음 · 가속·감속 시 진동", ask: "어느 속도나 상황에서 소리와 진동이 생기는지 알려주세요.", body: "주행 중 소음과 진동, 가속·감속 시 달라지는 증상을 확인합니다. 구동 모터와 감속기 등 원인을 점검한 뒤 작업 범위를 정합니다." },
  ];
  const questions = [
    { q: "EV6·아이오닉5도 상담할 수 있나요?", a: "EV6·아이오닉5 등 전기차의 차종·연식과 증상을 알려주세요. 차량 사양과 점검 결과에 따라 작업 가능 범위, 필요한 부품과 일정을 안내합니다." },
    { q: "배터리나 인버터는 바로 교체해야 하나요?", a: "경고 문구나 출력 저하만으로 특정 부품의 교체를 결정하지 않습니다. 차량 상태를 점검하고 수리·교체가 필요한 범위와 견적을 안내합니다." },
    { q: "충전이 안 될 때 무엇을 알려드리면 되나요?", a: "완속·급속 중 어느 충전에서 발생하는지, 매번 같은지, 계기판이나 충전기에 어떤 문구가 표시되는지 알려주세요. 가능하면 표시 문구를 사진으로 남겨 상담할 때 함께 보내주세요." },
    { q: "수리 비용과 기간은 얼마나 걸리나요?", a: "같은 차종도 원인과 작업 범위가 다릅니다. 차량 상태, 필요한 부품과 작업량을 확인한 뒤 비용과 일정을 안내합니다. 방문 전 전화나 문자로 먼저 상담해 주세요." },
    { q: "전화가 어려우면 문자로 상담해도 되나요?", a: "네. 차종·연식·주행거리와 증상, 경고 문구, 방문 희망일을 문자로 남겨주세요. 아래에서 증상을 선택하면 문자 상담 내용을 준비할 수 있습니다." },
  ];
  const schema = { "@context": "https://schema.org", "@type": "Service", name: title, description, url: `${SITE_URL}${path}`, serviceType: "전기차 점검·수리 상담", areaServed: { "@type": "City", name: "부산" }, provider: { "@type": "AutoRepair", name: settings.business_name, telephone: settings.phone, url: SITE_URL } };
  return <><Header settings={settings} dark /><main className={s.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className={s.intro}><div className={s.wrap}>
      <nav aria-label="현재 위치"><Link href="/">홈</Link><span>/</span>전기차 정비</nav>
      <p className={s.eyebrow}>KOREA AUTO MISSION / ELECTRIC VEHICLE</p>
      <h1>부산 전기차 수리.<br />배터리부터 모터·감속기까지.</h1>
      <p className={s.lead}>EV6·아이오닉5 등 전기차의 배터리·인버터,<br />충전 불량과 모터·감속기까지. 차종과 증상을 알려주세요.</p>
      <div className={s.contacts}><a href={telHref(settings.phone)} className={s.contact}>전화 상담 <span aria-hidden="true">↗</span></a><SmsLink phone={settings.phone} body={"[전기차 수리 상담]\n차종·연식:\n주행거리:\n증상:\n방문 희망일:"} className={s.contact}>문자 상담 <span aria-hidden="true">↗</span></SmsLink></div>
      <p className={s.address}>{settings.address} · {settings.phone}</p>
    </div></section>
    <nav className={s.sectionNav} aria-label="전기차 정비 안내 목차"><a href="#ev-topics">증상별 안내</a><a href="#ev-questions">자주 묻는 질문</a><a href="#consultation">문자 상담</a></nav>
    <section className={s.topics} aria-labelledby="ev-topics"><p className={s.eyebrow}>전기차 점검 · 수리 상담</p><h2 id="ev-topics">어떤 문제가 생겼나요?</h2>
      <div>{topics.map((topic,index)=><article key={topic.title}><span>0{index+1}</span><h3>{topic.title}</h3><p className={s.symptom}>{topic.hint}</p><p>{topic.body}</p><p className={s.ask}>{topic.ask}</p><a className={s.topicLink} href="#consultation">이 증상 상담하기 ↗</a></article>)}</div>
      <p className={s.note}>수리 비용은 차량 상태와 작업량을 확인한 뒤 결정합니다. 방문 전에 차종과 증상을 상담해 주세요.</p>
    </section>
    <section className={s.process} aria-labelledby="ev-process"><p className={s.eyebrow}>상담부터 작업 안내까지</p><h2 id="ev-process">내 차에 필요한 작업을 확인합니다.</h2><ol><li><span>01</span><div><h3>차종과 증상 전달</h3><p>EV6·아이오닉5 등 차종, 연식, 주행거리와 불편한 증상을 전화·문자로 알려주세요.</p></div></li><li><span>02</span><div><h3>방문 일정과 점검 상담</h3><p>차량을 확인할 일정을 상담하고, 점검으로 필요한 작업 범위를 확인합니다.</p></div></li><li><span>03</span><div><h3>작업 범위·견적 안내</h3><p>차량 상태와 필요한 부품, 작업량을 바탕으로 비용과 일정을 안내합니다.</p></div></li></ol></section>
    <section className={s.faq} aria-labelledby="ev-questions"><p className={s.eyebrow}>방문 전 궁금한 점</p><h2 id="ev-questions">전기차 수리 상담 안내.</h2><div>{questions.map(item => <details key={item.q}><summary>{item.q}<span aria-hidden="true">＋</span></summary><p>{item.a}</p></details>)}</div></section>
    <ConsultationHelper settings={settings} service="전기차 수리" vehiclePlaceholder="예: EV6 / 2022년 / 8만 km" symptoms={["배터리·인버터 경고", "충전 불량", "모터·감속기 소음", "주행 중 진동", "기타 증상"]} />
    <section className={s.visit}><div><p className={s.eyebrow}>VISIT THE WORKSHOP</p><h2>{settings.business_name}</h2><p>{settings.address}</p><p>평일 {settings.weekday_hours} · 토요일 {settings.saturday_hours}</p><p>일요일 휴무 · 공휴일 {settings.holiday_hours}</p></div><Link href="/#location">네이버 지도·오시는 길 <span aria-hidden="true">↗</span></Link></section>
  </main><Footer settings={settings} /><MobileBottomBar settings={settings} service="전기차 수리" /></>;
}
