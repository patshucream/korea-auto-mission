import Link from "next/link";
import type { Metadata } from "next";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/social-image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { ConsultationHelper } from "@/components/services/ConsultationHelper";
import { WorkCard } from "@/components/works/WorkCard";
import { getWorkBySlug, getSiteSettings } from "@/lib/data/content";
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
  const [settings, ioniq] = await Promise.all([getSiteSettings(), getWorkBySlug("naver-224380261625")]);
  const cases = [ioniq].filter((work) => work !== null);
  const topics = [
    { title: "배터리·인버터", body: "배터리와 인버터 관련 경고, 출력 저하 등 전기차 전장 문제를 점검합니다. 차종과 진단 결과에 따라 수리·교체 범위를 안내합니다." },
    { title: "충전 불량·충전 계통", body: "완속·급속 중 어느 쪽에서 충전이 안 되는지, 경고 문구가 나타나는지 알려주세요. 충전 계통을 확인하고 필요한 작업을 상담합니다." },
    { title: "모터·감속기", body: "주행 중 소음과 진동, 가속·감속 시 달라지는 증상을 확인합니다. 구동 모터와 감속기 등 원인을 점검한 뒤 작업 범위를 정합니다." },
  ];
  return <><Header settings={settings} dark /><main className={s.page}>
    <section className={s.intro}><div className={s.wrap}>
      <nav aria-label="현재 위치"><Link href="/">홈</Link><span>/</span>전기차 정비</nav>
      <p className={s.eyebrow}>KOREA AUTO MISSION / ELECTRIC VEHICLE</p>
      <h1>전기차 수리.<br />충전부터 주행까지 살핍니다.</h1>
      <p className={s.lead}>EV6·아이오닉5 등 전기차의 배터리·인버터,<br />충전 불량과 모터·감속기까지. 차종과 증상을 알려주세요.</p>
      <div className={s.contacts}><a href={telHref(settings.phone)} className={s.contact}>전화 상담 <span aria-hidden="true">↗</span></a><a href={`sms:${settings.phone.replace(/[^+\d]/g, "")}`} className={s.contact}>문자 상담 <span aria-hidden="true">↗</span></a></div>
      <p className={s.address}>{settings.address} · {settings.phone}</p>
    </div></section>
    <section className={s.topics} aria-labelledby="ev-topics"><p className={s.eyebrow}>전기차 점검 · 수리 상담</p><h2 id="ev-topics">어떤 문제가 생겼나요?</h2>
      <div>{topics.map((topic,index)=><article key={topic.title}><span>0{index+1}</span><h3>{topic.title}</h3><p>{topic.body}</p></article>)}</div>
      <p className={s.note}>수리 비용은 차량 상태와 작업량을 확인한 뒤 결정합니다. 방문 전에 차종과 증상을 상담해 주세요.</p>
    </section>
    {cases.length > 0 && <section className={s.journal} aria-labelledby="ev-records"><p className={s.eyebrow}>WORKSHOP JOURNAL</p><h2 id="ev-records">전기차 작업 기록.</h2><p className={s.note}>아이오닉5 모터·감속기 작업을 사진으로 확인해 보세요.</p><div className={s.caseGrid}>{cases.map((work) => <WorkCard key={work.id} work={work} />)}</div></section>}
    <ConsultationHelper settings={settings} service="전기차 수리" symptoms={["배터리·인버터 경고", "충전 불량", "모터·감속기 소음", "주행 중 진동", "기타 증상"]} />
    <section className={s.visit}><div><p className={s.eyebrow}>VISIT THE WORKSHOP</p><h2>{settings.business_name}</h2><p>{settings.address}</p><p>평일 {settings.weekday_hours} · 토요일 {settings.saturday_hours}</p><p>일요일 휴무 · 공휴일 {settings.holiday_hours}</p></div><Link href="/#location">네이버 지도·오시는 길 <span aria-hidden="true">↗</span></Link></section>
  </main><Footer settings={settings} /><MobileBottomBar settings={settings} /></>;
}
