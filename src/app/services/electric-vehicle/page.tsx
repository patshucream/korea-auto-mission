import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { ConsultationHelper } from "@/components/services/ConsultationHelper";
import { WorkCard } from "@/components/works/WorkCard";
import { getWorkBySlug, getSiteSettings } from "@/lib/data/content";
import { SITE_URL, telHref } from "@/lib/utils";
import s from "./page.module.css";

const path = "/services/electric-vehicle";
const title = "부산 전기차 감속기 정비 · 소음·진동 상담";
const description = "코리아오토미션의 전기차 감속기 점검·수리 상담 안내. 차종과 주행 중 소음·진동 증상을 확인하고 필요한 작업 범위와 견적을 안내합니다. 부산 사상구 삼덕로 95.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: `${SITE_URL}${path}` },
  openGraph: { title: `${title} | 코리아오토미션`, description, url: `${SITE_URL}${path}`, type: "website", locale: "ko_KR" },
};

export default async function ElectricVehiclePage() {
  const [settings, soul, ioniq] = await Promise.all([getSiteSettings(), getWorkBySlug("naver-224413696535"), getWorkBySlug("naver-224380261625")]);
  const cases = [soul, ioniq].filter((work) => work !== null);
  const topics = [
    { title: "감속기 소음", body: "어떤 속도에서 소리가 나는지, 가속하거나 감속할 때 달라지는지 알려주세요. 차량 상태를 확인한 뒤 필요한 점검을 안내합니다." },
    { title: "주행 중 진동", body: "출발할 때인지, 일정 속도로 주행할 때인지 증상이 나타나는 상황을 확인합니다. 증상만으로 수리 범위를 단정하지 않습니다." },
    { title: "감속기 정비 상담", body: "차종·연식·주행거리와 정비 이력을 알려주세요. 작업 가능 범위와 입고 일정, 견적은 차량을 확인한 뒤 안내합니다." },
  ];
  return <><Header settings={settings} dark /><main className={s.page}>
    <section className={s.intro}><div className={s.wrap}>
      <nav aria-label="현재 위치"><Link href="/">홈</Link><span>/</span>전기차 정비</nav>
      <p className={s.eyebrow}>KOREA AUTO MISSION / ELECTRIC VEHICLE</p>
      <h1>전기차 감속기 정비.<br />주행 중의 변화를 살핍니다.</h1>
      <p className={s.lead}>감속기 소음과 주행 중 진동이 신경 쓰인다면,<br />차종과 증상부터 코리아오토미션에 알려주세요.</p>
      <a href={telHref(settings.phone)} className={s.contact}>전기차 정비 상담 <span aria-hidden="true">↗</span></a>
      <p className={s.address}>{settings.address} · {settings.phone}</p>
    </div></section>
    <section className={s.topics} aria-labelledby="ev-topics"><p className={s.eyebrow}>감속기 · 구동계 상담</p><h2 id="ev-topics">언제, 어떤 증상이 있나요?</h2>
      <div>{topics.map((topic,index)=><article key={topic.title}><span>0{index+1}</span><h3>{topic.title}</h3><p>{topic.body}</p></article>)}</div>
      <p className={s.note}>수리 비용은 차량 상태와 작업량을 확인한 뒤 결정합니다. 방문 전에 차종과 증상을 상담해 주세요.</p>
    </section>
    {cases.length > 0 && <section className={s.journal} aria-labelledby="ev-records"><p className={s.eyebrow}>WORKSHOP JOURNAL</p><h2 id="ev-records">전기차 작업 기록.</h2><p className={s.note}>쏘울EV OBC 탈거 점검과 아이오닉5 모터·감속기 작업을 사진으로 확인해 보세요.</p><div className={s.caseGrid}>{cases.map((work) => <WorkCard key={work.id} work={work} />)}</div></section>}
    <ConsultationHelper settings={settings} service="전기차 감속기 정비" symptoms={["감속기 소음", "주행 중 진동", "가속·감속 시 소음", "기타 증상"]} />
    <section className={s.visit}><div><p className={s.eyebrow}>VISIT THE WORKSHOP</p><h2>{settings.business_name}</h2><p>{settings.address}</p><p>평일 {settings.weekday_hours} · 토요일 {settings.saturday_hours}</p><p>일요일 휴무 · 공휴일 방문 전 확인</p></div><Link href="/#location">네이버 지도·오시는 길 <span aria-hidden="true">↗</span></Link></section>
  </main><Footer settings={settings} /><MobileBottomBar settings={settings} /></>;
}
