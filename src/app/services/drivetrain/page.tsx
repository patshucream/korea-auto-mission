import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { SmsLink } from "@/components/ui/SmsLink";
import { SmartImage } from "@/components/ui/SmartImage";
import { ConsultationHelper } from "@/components/services/ConsultationHelper";
import { getSiteSettings, getWorkBySlug } from "@/lib/data/content";
import { SITE_URL, telHref } from "@/lib/utils";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/social-image";
import s from "../electric-vehicle/page.module.css";

const title = "부산 4륜 구동계 수리 · 트랜스퍼케이스·디퍼렌셜 정비";
const description = "코리아오토미션의 트랜스퍼케이스·앞뒤 디퍼렌셜 정비 안내. 4륜 구동 이상, 주행 소음·진동과 누유를 점검하고 차량 상태에 맞는 작업을 상담합니다. 부산 사상구, 전화·문자 상담.";
const url = `${SITE_URL}/services/drivetrain`;
export const metadata: Metadata = { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website", locale: "ko_KR", images: [DEFAULT_SOCIAL_IMAGE] } };

export default async function DrivetrainPage() {
  const [settings, work] = await Promise.all([getSiteSettings(), getWorkBySlug("naver-224377593631")]);
  const topics = [
    { name: "트랜스퍼케이스", symptom: "가속할 때 충격 · 4륜 구동 이상", text: "증상이 나타나는 속도와 상황을 확인하고 트랜스퍼케이스 및 연결 부위를 점검합니다. 차량 사양과 손상 상태에 따라 수리 범위를 안내합니다." },
    { name: "앞·뒤 디퍼렌셜", symptom: "주행 중 소음 · 진동 · 오일 누유", text: "디퍼렌셜(디퍼런셜)의 소음과 누유, 오일 상태 등을 확인합니다. 점검 결과에 따라 필요한 수리나 오일 정비를 상담합니다." },
    { name: "구동계 증상 점검", symptom: "속도에 따라 달라지는 소리 · 하부 충격", text: "같은 소음과 진동도 원인은 다를 수 있습니다. 미션·트랜스퍼·디퍼렌셜 중 특정 부품 문제로 단정하지 않고 차량 상태부터 확인합니다." },
  ];
  const schema = { "@context": "https://schema.org", "@type": "Service", name: title, description, url, serviceType: "4륜 구동계 점검·수리", provider: { "@type": "AutoRepair", name: settings.business_name, telephone: settings.phone, url: SITE_URL } };
  return <><Header settings={settings} dark /><main className={s.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className={s.intro}><div className={s.wrap}><nav aria-label="현재 위치"><Link href="/">홈</Link><span>/</span>4륜·구동계</nav><p className={s.eyebrow}>KOREA AUTO MISSION / DRIVETRAIN</p><h1>부산 4륜·구동계 수리.<br />트랜스퍼부터 디퍼렌셜까지.</h1><p className={s.lead}>주행 중 소음과 진동, 가속할 때 충격, 하부 누유.<br />차종과 증상을 확인하고 필요한 정비를 안내합니다.</p><div className={s.contacts}><a className={s.contact} href={telHref(settings.phone)}>전화 상담 ↗</a><SmsLink phone={settings.phone} body={"[4륜·구동계 상담]\n차종·연식:\n주행거리:\n증상과 발생 상황:"} className={s.contact}>문자 상담 ↗</SmsLink></div><p className={s.address}>{settings.address} · {settings.phone}</p></div></section>
    <nav className={s.sectionNav} aria-label="4륜 정비 안내 목차"><a href="#drivetrain-topics">정비 안내</a>{work && <a href="#drivetrain-case">실제 작업사례</a>}<a href="#consultation">문자 상담</a></nav>
    <section className={s.topics} aria-labelledby="drivetrain-topics"><p className={s.eyebrow}>TRANSFER CASE · DIFFERENTIAL</p><h2 id="drivetrain-topics">어디서, 언제 불편한가요?</h2><div>{topics.map((topic, i) => <article key={topic.name}><span>0{i+1}</span><h3>{topic.name}</h3><p className={s.symptom}>{topic.symptom}</p><p>{topic.text}</p></article>)}</div><p className={s.note}>차종·연식·주행거리와 증상이 생기는 상황을 알려주세요. 견적은 차량 상태와 작업량을 확인한 뒤 안내합니다.</p></section>
    {work && <section className={s.process} aria-labelledby="drivetrain-case"><p className={s.eyebrow}>실제 작업 기록</p><h2 id="drivetrain-case">{work.title}</h2><Link href={`/works/${work.slug}`}><SmartImage path={work.representative_image_path} alt={work.title} sizes="(max-width: 700px) 100vw, 800px" className="mt-6 aspect-[16/10] w-full overflow-hidden" /></Link><p className="mt-6 leading-8">저속 가속 시 충격으로 입고한 BMW X3의 트랜스퍼 케이스 정비 기록입니다. 분해 점검과 부품 교체 과정, 함께 진행한 미션·앞뒤 디퍼렌셜 오일 교환을 확인할 수 있습니다.</p><Link href={`/works/${work.slug}`} className={s.contact}>사진과 작업 과정 보기 ↗</Link></section>}
    <section className={s.faq}><p className={s.eyebrow}>방문 전 안내</p><h2>4륜 정비 상담에서 자주 묻는 질문.</h2><div><details><summary>소리가 나면 디퍼렌셜 고장인가요?<span>＋</span></summary><p>소리만으로 원인을 결정할 수 없습니다. 가속·감속·회전 중 언제 발생하는지와 차량 상태를 확인한 뒤 점검 범위를 안내합니다.</p></details><details><summary>수리 비용과 기간은 어떻게 정하나요?<span>＋</span></summary><p>차량 사양과 손상 상태, 필요한 부품과 작업량에 따라 달라집니다. 방문 전 전화·문자로 차종과 증상을 알려주시면 상담을 시작할 수 있습니다.</p></details></div></section>
    <ConsultationHelper settings={settings} service="4륜·구동계 수리" vehiclePlaceholder="예: BMW X3 / 연식 / 주행거리" symptoms={["가속 시 충격", "주행 소음·진동", "하부 누유", "4륜 구동 이상", "기타 증상"]} />
    <section className={s.visit}><div><p className={s.eyebrow}>VISIT THE WORKSHOP</p><h2>{settings.business_name}</h2><p>{settings.address}</p><p>평일 {settings.weekday_hours} · 토요일 {settings.saturday_hours}</p><p>일요일 휴무 · 공휴일 {settings.holiday_hours}</p></div><Link href="/#location">네이버 지도·오시는 길 ↗</Link></section>
  </main><Footer settings={settings} /><MobileBottomBar settings={settings} service="4륜·구동계 수리" /></>;
}
