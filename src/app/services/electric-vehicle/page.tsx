import { WorkshopAddress } from "@/components/ui/WorkshopAddress";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SmsLink } from "@/components/ui/SmsLink";
import { EvRepairExplorer, EvConsultation } from "@/components/ev/EvExperience";
import { SmartImage } from "@/components/ui/SmartImage";
import { getPaginatedWorks, getSiteSettings } from "@/lib/data/content";
import { SITE_URL, getMapUrl, telHref } from "@/lib/utils";
import s from "./page.module.css";

const path = "/services/electric-vehicle";
const title = "부산 전기차 수리";
const description = "주행 소음과 충전 불량, 차량의 작은 변화부터 살핍니다. 모터·감속기 수리 기록과 배터리·인버터 점검 안내를 확인하세요. 코리아오토미션 전기차 정비 · 전화·문자 상담.";
const source = "https://blog.naver.com/koreaautolife/224436118376";
const photos = "/ev/ionic-repair/";
export const metadata: Metadata = {
  title, description, alternates: { canonical: `${SITE_URL}${path}` },
  openGraph: { title: `${title} | 코리아오토미션`, description, siteName: "코리아오토미션", url: `${SITE_URL}${path}`, type: "website", locale: "ko_KR", images: [{ url: `${SITE_URL}${photos}assembly.jpg`, width: 966, height: 725, alt: "코리아오토미션의 실제 전기차 모터·감속기 정비" }] },
  twitter: { card: "summary_large_image", title: `${title} | 코리아오토미션`, description, images: [`${SITE_URL}${photos}assembly.jpg`] },
};
const topics = [
  { name: "모터·감속기", sub: "주행 소음 / 가속·감속 시 진동", text: "언제, 어느 속도에서 소리가 달라지는지부터 듣습니다. 모터와 감속기 등 발생 부위를 구분해 필요한 작업을 확인합니다.", cue: "소리가 나는 속도와 상황을 알려주세요." },
  { name: "배터리·인버터", sub: "계기판 경고 / 출력 저하", text: "경고 문구만으로 부품 교체를 결정하지 않습니다. 차량 사양과 점검 결과에 따라 수리·교체 범위와 견적을 안내합니다.", cue: "경고 문구를 사진으로 남겨주세요." },
  { name: "충전 계통", sub: "충전 시작 불가 / 충전 중단", text: "완속·급속 중 어떤 조건에서 문제가 생기는지 확인합니다. 차종과 발생 상황을 바탕으로 점검을 상담합니다.", cue: "완속·급속 여부와 발생 빈도를 알려주세요." },
];
const questions = [
  ["소음이 나면 모터나 감속기를 통째로 바꿔야 하나요?", "소음만으로 통교환 여부를 결정할 수는 없습니다. 실제 아이오닉 EV 사례에서는 모터 내부 베어링 교체와 감속기 수리를 진행했습니다. 내 차량의 수리 범위는 점검 결과와 부품 상태에 따라 달라집니다."],
  ["EV6·아이오닉5도 상담할 수 있나요?", "네. EV6·아이오닉5 등 차종, 연식, 주행거리와 증상을 알려주세요. 차량 사양과 점검 결과에 따라 작업 가능 범위와 필요한 부품, 일정을 안내합니다."],
  ["비용과 수리 기간은 어떻게 정하나요?", "차량 상태와 필요한 부품, 작업량을 확인한 뒤 견적과 일정을 안내합니다. 같은 증상이라도 원인이 다를 수 있어 방문 전에 먼저 상담해 주세요."],
  ["전화 대신 문자로 상담해도 되나요?", "차종·연식·주행거리와 불편한 증상을 문자로 남겨주세요. 아래 상담 양식에서 증상을 선택할 수 있습니다. 소음이 나는 상황이나 계기판 경고 문구도 함께 알려주시면 도움이 됩니다."],
];

export default async function ElectricVehiclePage() {
  const [settings, electricWorks] = await Promise.all([
    getSiteSettings(),
    getPaginatedWorks({ category: "전기차 수리", sort: "newest", page: 1, pageSize: 6 }),
  ]);
  const relatedCases = electricWorks.items.filter(work => work.slug !== "naver-224436118376");
  const schema = { "@context": "https://schema.org", "@type": "Service", name: title, description, url: `${SITE_URL}${path}`, image: `${SITE_URL}${photos}assembly.jpg`, serviceType: "전기차 점검·수리 상담", provider: { "@type": "AutoRepair", name: settings.business_name, telephone: settings.phone, url: SITE_URL } };
  return <div className={s.site}>
    <header className={s.evHeader}>
      <Link href="/" className={s.wordmark} aria-label="코리아오토미션 홈">KOREA AUTO<span>전기차 정비</span></Link>
      <nav aria-label="전기차 전용 메뉴"><a href="#ev-cases">작업사례</a><a href="#ev-care">정비 범위</a><a href="#consultation" className={s.navCta}>상담하기</a></nav>
    </header>
    <main className={s.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className={s.hero} aria-labelledby="ev-title">
      <p className={s.eyebrow}>코리아오토미션의 전기차 정비</p>
      <h1 id="ev-title">다시, 조용하게.<br /><span>전기차를 위한 정교함.</span></h1>
      <p className={s.lead}>주행의 작은 변화부터, 구동계 깊숙한 곳까지.<br />모터·감속기·배터리·인버터·충전 계통을 살핍니다.</p>
      <div className={s.heroActions}><a href="#ev-cases">전기차 작업사례 보기 <span aria-hidden="true">↓</span></a><a href="#consultation">내 차 상담하기 <span aria-hidden="true">↗</span></a></div>
      <figure className={s.heroProduct}>
        <Image src={`${photos}assembly.jpg`} alt="실제 아이오닉 EV 수리 중 재조립한 모터·감속기 어셈블리" fill sizes="(max-width: 760px) 100vw, 1100px" preload />
        <figcaption><span>실제 수리 현장에서</span><strong>작은 부품 하나까지.</strong><small>아이오닉 EV 모터 · 감속기</small></figcaption>
      </figure>
    </section>
    <section className={s.statement} aria-label="전기차 정비 소개"><p>익숙했던 조용함이 달라졌다면.<br /><span>소리를 듣고, 원인을 구분하고,<br />내 차에 필요한 수리를 찾습니다.</span></p><a href="#ev-care">정비 범위 알아보기 ↗</a></section>
    <section className={s.caseLibrary} id="ev-cases" aria-labelledby="ev-cases-title">
      <div className={s.sectionHead}><div><p className={s.eyebrow}>전기차 작업사례</p><h2 id="ev-cases-title">사진으로 보는,<br />우리의 정비 기록.</h2></div><p>어떤 차량이, 어떤 증상으로 왔을까요?<br />실제 입고 차량과 작업 과정을 살펴보세요.</p></div>
      <div className={s.caseCards}>
        <article className={s.caseCard}><a href="#ev-record" className={s.caseCardLink}>
          <div className={s.caseCover}><Image src={`${photos}vehicle.jpg`} alt="모터·감속기 소음 수리로 입고된 아이오닉 EV, 왼쪽 차량" fill sizes="(max-width: 760px) 100vw, 50vw" /><span className={s.caseBadge}>모터 · 감속기</span></div>
          <div className={s.caseCardBody}><p className={s.caseVehicle}>현대 아이오닉 EV</p><h3>주행 소음으로 입고.<br />모터·감속기 수리.</h3><p>구동모터 베어링 교체와 감속기 수리, 재조립 후 소음 확인까지의 실제 작업입니다.</p><div className={s.caseCardBottom}><time dateTime="2026-10-09">2026.10.09 · 블로그 작업 기록</time><span aria-hidden="true">↗</span></div><span className={s.caseRead}>아래에서 사진과 수리 과정 보기</span></div>
        </a></article>
        {relatedCases.map(work=><article key={work.id} className={s.caseCard}><Link href={`/works/${work.slug}`} className={s.caseCardLink}>
          <div className={s.caseCover}><SmartImage path={work.representative_image_path} alt={work.title} className={s.casePhoto} sizes="(max-width: 760px) 100vw, 50vw" fallbackLabel={work.vehicle_model}/><span className={s.caseBadge}>전기차 정비</span></div>
          <div className={s.caseCardBody}><p className={s.caseVehicle}>{[work.manufacturer || work.vehicle_brand,work.vehicle_model].filter(Boolean).join(" ")}</p><h3>{work.title}</h3><p>{work.excerpt || work.symptoms || work.work_summary}</p><div className={s.caseCardBottom}><span>홈페이지 작업사례</span><span aria-hidden="true">↗</span></div><span className={s.caseRead}>사진과 상세 작업 기록 보기</span></div>
        </Link></article>)}
      </div>
    </section>
    <section className={s.record} id="ev-record" aria-labelledby="record-title">
      <div className={s.sectionHead}><div><p className={s.eyebrow}>실제 작업. 실제 이야기.</p><h2 id="record-title">안쪽까지 보면,<br />이유가 보입니다.</h2></div><p>주행 중 소음으로 입고된 아이오닉 EV.<br />모터와 감속기를 분해·수리한 과정을 소개합니다.</p></div>
      <EvRepairExplorer />
      <div className={s.caseOverview}>
        <figure><Image src={`${photos}vehicle.jpg`} alt="모터·감속기 수리로 입고된 아이오닉 EV, 사진 왼쪽 차량" width={966} height={725} sizes="(max-width: 760px) 100vw, 40vw" /><figcaption>사진 왼쪽 · 현대 아이오닉 EV</figcaption></figure>
        <div><span className={s.caseTag}>REPAIR JOURNAL · 2026.10.09</span><h3>통째로 바꾸기 전에.<br />수리할 수 있는 부분을 확인하다.</h3><p>이번 차량은 구동모터 베어링 교체와 감속기 수리를 진행했습니다. 재조립과 오일 주입 후 소음이 없어진 것을 확인했습니다.</p><p className={s.caseNote}>같은 소음이라도 원인과 필요한 작업은 차량마다 다릅니다. 이 사례가 모든 차량의 수리 방법을 뜻하지는 않습니다.</p><a href={source} target="_blank" rel="noopener noreferrer" className={s.textLink}>블로그에서 전체 기록 보기 ↗</a></div>
      </div>
    </section>
    <section className={s.care} id="ev-care" aria-labelledby="care-title"><div className={s.sectionHead}><div><p className={s.eyebrow}>전기차 정비의 범위</p><h2 id="care-title">구동부터 충전까지.<br />하나의 전기차를 위해.</h2></div><p>부품 이름을 몰라도 괜찮습니다.<br />운전하면서 느낀 변화를 알려주세요.</p></div>
      <div className={s.systemGrid}>{topics.map((t,i)=><article key={t.name} className={s.systemCard}>
        <svg className={s.systemIcon} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">{i===0?<><circle cx="40" cy="40" r="26"/><circle cx="40" cy="40" r="15"/><circle cx="40" cy="40" r="5"/>{[0,45,90,135].map(a=><path key={a} d="M40 8v8M40 64v8" transform={`rotate(${a} 40 40)`}/>)}</>:i===1?<><rect x="17" y="23" width="45" height="34" rx="6"/><path d="M66 34v12M28 40h10M33 35v10M47 40h6"/></>:<><path d="M29 14v17M49 14v17M22 31h34v9a17 17 0 0 1-34 0zM39 57v12"/><path d="M65 17l-5 9h8l-5 9"/></>}</svg>
        <p className={s.systemSub}>{t.sub}</p><h3>{t.name}</h3><p>{t.text}</p><a href="#consultation" aria-label={`${t.name} 상담하기`}><span>상담하기</span><b aria-hidden="true">↗</b></a>
      </article>)}</div>
    </section>
    <section className={s.approach}><p className={s.eyebrow}>복잡한 정비, 편안한 상담.</p><h2>설명은 명확하게.<br /><span>선택은 충분히 이해한 다음.</span></h2><div>{[["차량 이야기부터", "차종과 증상, 소음이 나는 조건을 전화·문자로 확인합니다."],["점검으로 확인", "방문 일정을 상담하고 차량을 점검해 원인과 작업 범위를 확인합니다."],["견적과 일정 안내", "필요한 부품과 작업량을 바탕으로 비용과 일정을 안내합니다."]].map(([h,p],i)=><article key={h}><span>0{i+1}</span><h3>{h}</h3><p>{p}</p></article>)}</div></section>
    <section className={s.faq}><h2>궁금한 점,<br />먼저 살펴보세요.</h2><div>{questions.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">＋</span></summary><p>{a}</p></details>)}</div></section>
    <section className={s.consultation} id="consultation" aria-labelledby="consult-title"><div className={s.consultIntro}><p className={s.eyebrow}>다음은, 당신의 전기차.</p><h2 id="consult-title">어떤 변화가<br />느껴지시나요?</h2><p>차종과 증상만 알려주세요.<br />필요한 점검부터 함께 확인하겠습니다.</p><WorkshopAddress address={settings.address} mapUrl={getMapUrl(settings)} /><p className={s.hours}>평일 {settings.weekday_hours}<br />토요일 {settings.saturday_hours}<br />일요일 휴무 · 공휴일 {settings.holiday_hours}</p></div><EvConsultation phone={settings.phone}/></section>
    </main>
    <footer className={s.evFooter}><div><Link href="/" className={s.wordmark}>KOREA AUTO<span>코리아오토미션</span></Link><p>{settings.address}<br /><a href={telHref(settings.phone)}>{settings.phone}</a></p></div><nav aria-label="매장 안내"><Link href="/#location">오시는 길 ↗</Link><Link href="/">코리아오토미션 홈 ↗</Link><Link href="/privacy">개인정보처리방침</Link></nav><small>© {new Date().getFullYear()} KOREA AUTO MISSION</small></footer>
    <aside className={s.mobileDock} aria-label="전기차 빠른 상담"><a href={telHref(settings.phone)} data-contact="phone">전화 상담 ↗</a><SmsLink phone={settings.phone} body={"[전기차 수리 상담]\n차종·연식:\n주행거리:\n증상:"}>문자 상담 ↗</SmsLink></aside>
  </div>;
}
