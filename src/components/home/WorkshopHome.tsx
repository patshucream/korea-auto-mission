import Link from "next/link";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { SmsLink } from "@/components/ui/SmsLink";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reviews } from "@/components/home/Reviews";
import { NaverLocationMap, KOREA_AUTO_NAVER_PLACE } from "./NaverLocationMap";
import { DieselServiceShowcase } from "./DieselServiceShowcase";
import { WorkshopMotion } from "./WorkshopMotion";
import { getHomepageConfig, getWhyPoints, isSectionVisible } from "@/lib/homepage";
import { dieselGuides, dieselGuidePath } from "@/lib/diesel-guides";
import { getWorkServiceLabels } from "@/lib/works/services";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { getBlogUrl, telHref } from "@/lib/utils";
import type { HomepageData, HomepageSectionId, ReviewStats, WorkCase } from "@/lib/types";
import s from "./WorkshopHome.module.css";

const Arrow = () => <span aria-hidden="true">↗</span>;

function featuredItems<T extends { id: string }>(items: T[], ids: string[]) {
  if (!ids.length) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const selected = ids.flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
  return selected.length ? selected : items;
}

function isDiesel(work: WorkCase) {
  return /흡기|인젝터|DPF|디젤/.test(getWorkServiceLabels(work).join(" "));
}

const cleaningPhotos: Record<string, { path: string; alt: string; description: string }> = {
  "흡기 클리닝": {
    path: "/blog-imports/224347411717/10.jpg",
    alt: "미니 컨트리맨 흡기 매니폴드 실제 작업 사진",
    description: "흡기 계통의 오염 상태를 살피고, 필요한 클리닝 범위를 확인합니다.",
  },
  "인젝터 클리닝": {
    path: "/blog-imports/224391282453/19.jpg",
    alt: "그랜저 HG 디젤 인젝터 실제 작업 사진",
    description: "차량의 증상과 정비 이력을 확인하고, 인젝터 점검과 작업을 안내합니다.",
  },
  "DPF 클리닝": {
    path: "/blog-imports/224401754733/18.jpg",
    alt: "쏘렌토 DPF를 세척 장비에 연결한 실제 작업 사진",
    description: "경고등과 출력 저하의 원인을 점검한 뒤, 필요한 정비를 상담합니다.",
  },
};

function WorkPreview({ work }: { work: WorkCase }) {
  const vehicle = [work.manufacturer || work.vehicle_brand, work.vehicle_model].filter(Boolean).join(" ");
  return (
    <article className={s.case} data-reveal>
      <Link href={`/works/${work.slug}`} className={s.caseImageLink} aria-label={`${work.title} 작업 사례 보기`}>
        <SmartImage path={work.representative_image_path || work.gallery_image_paths?.[0]} alt={work.title} className={s.caseImage} sizes="(max-width: 700px) 100vw, 33vw" fallbackLabel={vehicle} />
        <span className={s.caseArrow}><Arrow /></span>
      </Link>
      <p className={s.caseCategory}>{getWorkServiceLabels(work).join(" · ")}</p>
      <h3><Link href={`/works/${work.slug}`}>{work.title}</Link></h3>
      <p className={s.caseDescription}>{work.excerpt || work.repair_process || work.work_summary}</p>
      <Link className={s.inlineLink} href={`/works/${work.slug}`}>작업 과정 살펴보기 <Arrow /></Link>
    </article>
  );
}

export function WorkshopHome({ data, reviewStats }: { data: HomepageData; reviewStats: ReviewStats }) {
  const { settings } = data;
  const config = getHomepageConfig(settings);
  const selectedWorks = featuredItems(data.works, config.featured_work_ids);
  const balanced = [
    selectedWorks.find(isDiesel),
    selectedWorks.find((work) => getWorkServiceLabels(work).includes("오토미션 수리")),
    selectedWorks.find((work) => getWorkServiceLabels(work).includes("전기차 수리")),
    ...selectedWorks,
  ].filter((work): work is WorkCase => Boolean(work));
  const works = config.featured_work_ids.length ? selectedWorks : [...new Map(balanced.map((work) => [work.id, work])).values()];
  const services = featuredItems(data.services, config.featured_service_ids);
  const dieselServices = services.filter((service) => cleaningPhotos[service.title]);
  const dpfWork = data.works.find((work) => work.slug === "naver-224401754733" || work.naver_blog_url?.includes("224401754733"));
  const recordHref = dpfWork ? `/works/${dpfWork.slug}` : "/services/diesel-cleaning/dpf";
  const phone = telHref(settings.phone);
  const map = KOREA_AUTO_NAVER_PLACE;
  const visible = (id: HomepageSectionId) => config.section_order.includes(id) && isSectionVisible(config, id);
  const points = getWhyPoints(settings).slice(0, 3);
  const brands = [...new Set(data.works.map((work) => work.vehicle_brand).filter(Boolean))];

  const sections: Partial<Record<HomepageSectionId, ReactNode>> = {
    hero: (
      <section className={s.hero} aria-labelledby="workshop-title">
        <SmartImage path={settings.shop_image_path || settings.hero_image_path} alt="코리아오토미션에서 차량을 점검하는 실제 정비 현장" className={s.heroPhoto} sizes="100vw" priority objectPosition="68% 48%" />
        <div className={s.heroShade} aria-hidden="true" />
        <div className={s.heroCopy}>
          <p className={s.eyebrow}><span className={s.blueLine} />KOREA AUTO MISSION </p>
          <h1 id="workshop-title">{(settings.hero_title || DEFAULT_SETTINGS.hero_title).split("\n").map((line, index) => <span className={index === 1 ? s.accentLine : undefined} key={index}>{line}</span>)}</h1>
          <p className={s.heroLead}>{settings.hero_description}</p>
          <div className={s.heroActions}>
            <a className={s.primaryButton} href={phone}>전화 상담 <Arrow /></a>
            <SmsLink phone={settings.phone} className={s.heroSms}>문자 상담 <Arrow /></SmsLink>
            <Link className={s.inlineLink} href={visible("works") ? "#works" : "/works"}>내 차 작업사례 찾기 <span aria-hidden="true">↓</span></Link>
          </div>
        </div>
        <div className={s.heroFoot}><p>디젤클리닝 <span>/</span> 미션수리 <span>/</span> 전기차 수리 <span>/</span> 4륜·구동계</p><p>{settings.address}<span className={s.heroFootArrow} aria-hidden="true">↓</span></p></div>
      </section>
    ),
    trust: config.trust_items.length ? (
      <section id="strength" className={s.trust} aria-label="코리아오토미션 정비 정보">
        {config.trust_items.slice(0, 4).map((item, index) => <div key={`${item.title}-${index}`}><strong>{item.title}</strong><span>{item.description}</span></div>)}
      </section>
    ) : null,
    symptoms: (
      <nav className={s.symptoms} aria-label="증상별 정비 상담 안내">
        <span>지금, 차량의 증상이 궁금하다면</span>
        <Link href="/services/diesel-cleaning">출력 저하·떨림 <Arrow /></Link>
        <Link href="/services/transmission">변속 충격·미션 이상 <Arrow /></Link>
        <Link href="/services/electric-vehicle">전기차 충전·주행 이상 <Arrow /></Link><Link href="/services/drivetrain">4륜 구동·하부 소음 <Arrow /></Link>
      </nav>
    ),
    services: (
      <section id="services" className={s.section}>
        <div className={s.sectionHeading} data-reveal><div><p className={s.eyebrow}>OUR SERVICES</p><h2>내연기관부터 전기차까지.<br />차에 맞는 정비.</h2></div><p>디젤클리닝 · 자동변속기 · 전기차 · 4륜 구동계.<br />차량 상태와 작업량을 확인한 뒤 견적을 안내합니다.</p></div>
        <nav className={s.serviceJump} aria-label="주요 정비 분야"><a href="#diesel-service"><small>01</small>디젤클리닝 <Arrow /></a><a href="#transmission-service"><small>02</small>미션수리 <Arrow /></a><a href="#ev-service"><small>03</small>전기차 정비 <Arrow /></a><a href="#drivetrain-service"><small>04</small>4륜·구동계 <Arrow /></a></nav>
        {dieselServices.length > 0 && <div id="diesel-service" className={s.serviceTitle}><p className={s.eyebrow}>01 / DIESEL CLEANING</p><h3>디젤클리닝</h3><p>흡기 · 인젝터 · DPF. 차량 상태에 맞는 작업을 안내합니다.</p></div>}
        <DieselServiceShowcase items={dieselServices.map((service) => {
            const photo = cleaningPhotos[service.title];
            const guide = dieselGuides.find((item) => item.category === service.title);
            const href = guide ? dieselGuidePath(guide.slug) : "/services/diesel-cleaning";
            return { id: service.id, title: service.title, ...photo, href };
          })} />
        <section id="transmission-service" className={s.missionFeature}>
          <figure className={s.missionPhoto} data-reveal><SmartImage path="/blog-imports/224409409390/04.jpg" alt="기아 스팅어의 자동변속기를 분해해 정비하는 코리아오토미션 실제 작업 사진" className={s.missionImage} sizes="(max-width: 700px) 100vw, 50vw" /><figcaption>기아 스팅어 · 자동변속기 정비 기록</figcaption></figure>
          <div className={s.missionCopy}><p className={s.eyebrow}>02 / AUTOMATIC TRANSMISSION</p><h3>오토미션 수리</h3><p className={s.serviceSummary}>변속 충격부터 가속할 때의 떨림까지.<br />수입차·국산차 자동변속기를 점검합니다.</p><ul className={s.serviceTopics}><li>변속 충격·슬립</li><li>주행 중 떨림</li><li>누유·경고등</li></ul><p className={s.serviceNote}>증상이 나타나는 상황과 차량 정보를 확인하고, 필요한 수리 범위와 견적을 안내합니다.</p><Link href="/services/transmission" className={s.inlineLink}>미션수리·실제 사례 보기 <Arrow /></Link></div>
        </section>
        <section id="ev-service" className={s.missionFeature}>
          <figure className={s.missionPhoto} data-reveal><SmartImage path="/blog-imports/224413696535/01.jpg" alt="코리아오토미션에 입고한 실제 기아 쏘울EV 차량" className={s.missionImage} sizes="(max-width: 700px) 100vw, 50vw" /><figcaption>기아 쏘울EV · 실제 입고 차량</figcaption></figure>
          <div className={s.missionCopy}><p className={s.eyebrow}>03 / ELECTRIC VEHICLE</p><h3>전기차 정비</h3><p className={s.serviceSummary}>EV6·아이오닉5 등 전기차.<br />배터리부터 모터·감속기까지.</p><ul className={s.serviceTopics}><li>배터리·인버터</li><li>충전 불량·충전 계통</li><li>모터·감속기 소음·진동</li></ul><p className={s.serviceNote}>차종·연식·주행거리와 증상을 알려주세요. 점검 후 필요한 작업을 안내합니다.</p><Link href="/services/electric-vehicle" className={s.inlineLink}>전기차 점검·수리 안내 <Arrow /></Link></div>
        </section>
        <section id="drivetrain-service" className={s.missionFeature}>
          <figure className={s.missionPhoto} data-reveal><SmartImage path="/blog-imports/224377593631/11.jpg" alt="BMW X3 트랜스퍼 케이스를 분해한 실제 작업 사진" className={s.missionImage} sizes="(max-width: 700px) 100vw, 50vw" /><figcaption>BMW X3 · 트랜스퍼 케이스 정비 기록</figcaption></figure>
          <div className={s.missionCopy}><p className={s.eyebrow}>04 / FOUR-WHEEL DRIVE</p><h3>4륜·구동계 수리</h3><p className={s.serviceSummary}>트랜스퍼케이스 · 디퍼렌셜.<br />주행 중 소음과 충격, 누유를 점검합니다.</p><ul className={s.serviceTopics}><li>트랜스퍼케이스</li><li>앞·뒤 디퍼렌셜</li><li>4륜 구동 이상</li></ul><p className={s.serviceNote}>같은 소음과 진동도 원인은 다를 수 있습니다. 차량 상태를 확인한 뒤 필요한 정비를 안내합니다.</p><Link href="/services/drivetrain" className={s.inlineLink}>4륜 정비·실제 사례 보기 <Arrow /></Link></div>
        </section>
        <aside className={s.estimateNote} aria-labelledby="estimate-heading">
          <div><h3 id="estimate-heading">견적은 차량을 확인한 뒤 안내합니다.</h3><p>차종·연식, 오염·손상 상태, 작업 범위에 따라 비용이 달라집니다.<br />차종·주행거리·증상을 알려주시면 상담을 시작할 수 있습니다.</p></div>
          <SmsLink phone={settings.phone} className={s.inlineLink}>문자로 증상 상담 <Arrow /></SmsLink>
        </aside>
      </section>
    ),
    why: points.length ? (
      <section id="why" className={s.standards} aria-label="정비의 기준">
        <div className={s.sectionHeading} data-reveal><div><p className={s.eyebrow}>THE WORK, IN DETAIL</p><h2>설명은 분명하게.<br />과정은 사진으로.</h2></div><p>현장에서 남긴 정비 기록과 함께<br />필요한 작업의 이유를 설명합니다.</p></div>
        <div className={s.recordLayout}>
          <Link href={recordHref} className={s.recordImageLink} data-reveal aria-label="쏘렌토 DPF 클리닝 작업 과정 보기"><SmartImage path="/blog-imports/224401754733/18.jpg" alt="쏘렌토 DPF를 세척 장비에 연결한 실제 작업 사진" className={s.recordImage} sizes="(max-width: 700px) 100vw, 55vw" /><span className={s.recordLabel}>쏘렌토 · DPF 클리닝 <Arrow /></span></Link>
          <div className={s.standardPoints}>{points.map((point, index) => <article key={point.id}><span>0{index + 1}</span><h3>{point.title}</h3><p>{point.body}</p></article>)}</div>
        </div>
      </section>
    ) : null,
    works: works.length ? (
      <section id="works" className={s.section}>
        <div className={s.sectionHeading} data-reveal><div><p className={s.eyebrow}>WORKSHOP JOURNAL</p><h2>한 대씩, 쌓아온 기록.</h2></div><Link href="/works" className={s.inlineLink}>작업 사례 전체 보기 <Arrow /></Link></div>
        <div className={s.cases}>{works.slice(0, 3).map((work) => <WorkPreview key={work.id} work={work} />)}</div>
      </section>
    ) : null,
    process: settings.process_steps.length ? (
      <section id="process" className={s.processSection}><div className={s.sectionHeading} data-reveal><div><p className={s.eyebrow}>SERVICE PROCESS</p><h2>상담부터 출고까지.</h2></div><p>차량 상태를 확인하고,<br />작업 범위와 비용을 먼저 설명합니다.</p></div><ol className={s.process}>{settings.process_steps.map((step, index) => <li key={`${step.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol></section>
    ) : null,
    brands: brands.length ? (
      <nav className={s.brands} aria-label="차량 브랜드별 작업 사례"><span>차종별 작업 기록</span><div>{brands.map((brand) => <Link href={`/works?brand=${encodeURIComponent(brand)}`} key={brand}>{brand}<Arrow /></Link>)}</div></nav>
    ) : null,
    guides: (
      <section id="guides" className={s.guideSection}><p className={s.eyebrow}>BEFORE MAINTENANCE</p><h2>작업을 알아보기 전에.</h2><div>{dieselGuides.map((guide) => <Link className={s.guideLink} href={dieselGuidePath(guide.slug)} key={guide.slug}><span>{guide.title}</span><Arrow /></Link>)}</div></section>
    ),
    reviews: data.reviews.length ? <div className={s.reviews}><Reviews reviews={data.reviews} totalApproved={reviewStats.approved} average={reviewStats.averageRating} /></div> : null,
    faq: data.faqs.length ? (
      <section id="faq" className={s.faqSection}><div><p className={s.eyebrow}>QUESTIONS & ANSWERS</p><h2>방문 전,<br />궁금한 점부터.</h2><p className={s.faqIntro}>차종과 증상에 따라 작업 범위가 달라집니다.</p></div><div className={s.faqs}>{data.faqs.map((faq) => <details key={faq.id}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></section>
    ) : null,
    location: (
      <section id="location" className={s.location}>
        <div className={s.locationCopy}><p className={s.eyebrow}>LOCATION</p><h2>코리아오토미션<br />오시는 길.</h2><p className={s.address}>{settings.address}</p><dl className={s.hours}><div><dt>평일</dt><dd>{settings.weekday_hours}</dd></div><div><dt>토요일</dt><dd>{settings.saturday_hours}</dd></div><div><dt>일요일</dt><dd>휴무</dd></div><div><dt>공휴일</dt><dd>{settings.holiday_hours}</dd></div></dl><p className={s.visitNote}>방문 전 전화로 입고 일정을 상담해 주세요.</p><a href={map} className={s.inlineLink} target="_blank" rel="noopener noreferrer">네이버 매장·후기 <Arrow /></a></div>
        <div className={s.locationMap} data-reveal><NaverLocationMap /></div>
      </section>
    ),
    cta: (
      <section id="contact" className={s.contact}><div><p className={s.eyebrow}>CONTACT THE WORKSHOP</p><h2>{config.cta_title}</h2><p>{config.cta_description}</p></div><div className={s.contactActions}><a href={phone} className={s.phone}>{settings.phone}<Arrow /></a><div><SmsLink phone={settings.phone} className={s.lightButton}>문자로 상담하기 <Arrow /></SmsLink><a href={getBlogUrl(settings)} className={s.inlineLink} target="_blank" rel="noopener noreferrer">정비 블로그 <Arrow /></a></div><span>차종 · 연식 · 주행거리 · 증상을 함께 알려주세요.</span></div></section>
    ),
  };

  const displayOrder: HomepageSectionId[] = config.section_order.filter(id => id !== "works");
  const earlyAnchor = displayOrder.includes("symptoms") ? "symptoms" : "hero";
  if (visible("works")) displayOrder.splice(displayOrder.indexOf(earlyAnchor) + 1, 0, "works");

  return <div className={s.page}><a href="#main" className={s.skip}>본문으로 바로가기</a><Header settings={settings} dark /><WorkshopMotion>{displayOrder.map((id) => visible(id) && sections[id] ? <div key={id}>{sections[id]}</div> : null)}</WorkshopMotion><Footer settings={settings} /><MobileBottomBar settings={settings} /></div>;
}
