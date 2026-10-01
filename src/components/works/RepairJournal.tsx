import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmsLink } from "@/components/ui/SmsLink";
import { SmartImage } from "@/components/ui/SmartImage";
import { WorkCard } from "./WorkCard";
import { WorkMobileCtaBar } from "./WorkMobileCtaBar";
import { JournalPhotos } from "./JournalPhotos";
import { WorkServiceContext } from "./WorkServiceContext";
import { buildJournalChapters } from "@/lib/works/journal";
import { getWorkServiceLabels } from "@/lib/works/services";
import { formatDateKo, getMapUrl, telHref, SITE_URL } from "@/lib/utils";
import type { SiteSettings, WorkCase } from "@/lib/types";
import s from "./RepairJournal.module.css";

export function RepairJournal({work,settings,related}:{work:WorkCase;settings:SiteSettings;related:WorkCase[]}) {
  const chapters=buildJournalChapters(work);
  const labels=getWorkServiceLabels(work);
  const brand=work.manufacturer||work.vehicle_brand;
  const mileage=work.mileage;
  const facts=[["차종",[brand,work.vehicle_model].filter(Boolean).join(" ")],["연식",work.model_year],["주행거리",mileage],["변속기",work.transmission_type]].filter(([,value])=>value);
  const bodyPhotos=chapters.flatMap(c=>c.photos.map(p=>p.src));
  const gallery=[...new Set([...(work.gallery_image_paths||[]),...(work.before_images||[]),...(work.after_images||[])])].filter(path=>!bodyPhotos.includes(path)&&path!==work.representative_image_path);
  const totalPhotos=new Set([work.representative_image_path,...bodyPhotos,...gallery].filter(Boolean)).size;
  const smsBody=`[작업사례 문의]\n참고한 글: ${work.title}\n${SITE_URL}/works/${work.slug}\n내 차종·연식:\n주행거리:\n증상:\n방문 희망일:`;
  const summary=work.symptoms||work.excerpt||work.subtitle;
  return <><Header settings={settings} dark/><main className={s.page}>
    <article>
      <header className={s.intro}>
        <nav className={s.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href="/works">정비사례</Link><span>/</span><span>{work.vehicle_model}</span></nav>
        <div className={s.heroGrid}><div className={s.heading}><p className={s.eyebrow}>WORKSHOP JOURNAL <span>정비 기록</span></p><p className={s.categories}>{labels.join(" · ")}</p><h1>{work.title}</h1>{summary&&<p className={s.lead}>{summary}</p>}<p className={s.articleMeta}>{formatDateKo(work.published_at||work.created_at)}<span>사진 {totalPhotos}장</span></p><div className={s.introActions}><SmsLink phone={settings.phone} body={smsBody} className={s.smsButton}>내 차량 문자 상담 <span aria-hidden="true">↗</span></SmsLink><a href={telHref(settings.phone)} className={s.phoneLink}>전화 상담 ↗</a></div></div>
        {work.representative_image_path&&<figure className={s.cover}><SmartImage path={work.representative_image_path} alt={`${brand} ${work.vehicle_model} 정비 작업 사진`} className={s.coverImage} sizes="(max-width:700px) 100vw, 50vw" priority/><figcaption>{[brand,work.vehicle_model].filter(Boolean).join(" ")} · 코리아오토미션 작업 기록</figcaption></figure>}</div>
        <dl className={s.facts}>{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>작업 분야</dt><dd>{labels.join(" · ")}</dd></div></dl>
      </header>
      <div className={s.layout}>
        <aside className={s.sidebar}><div className={s.sticky}><p className={s.eyebrow}>IN THIS RECORD</p><nav aria-label="작업 과정 목차"><ol>{chapters.map((chapter,i)=><li key={chapter.id}><a href={`#${chapter.id}`}><span>{String(i+1).padStart(2,"0")}</span>{chapter.title}</a></li>)}</ol></nav><p className={s.sideNote}>궁금한 부분을 사진과 함께<br/>문자로 알려주셔도 좋습니다.</p><SmsLink phone={settings.phone} body={smsBody} className={s.sideSms}>문자로 정비 문의 ↗</SmsLink></div></aside>
        <div className={s.story}>
          <WorkServiceContext work={work} settings={settings} />
          <details className={s.mobileToc}><summary>작업 과정 바로 보기 <span>＋</span></summary><nav aria-label="모바일 작업 과정 목차">{chapters.map((chapter,i)=><a href={`#${chapter.id}`} key={chapter.id}>{String(i+1).padStart(2,"0")}　{chapter.title}</a>)}</nav></details>
          {chapters.map((chapter,index)=><section id={chapter.id} key={chapter.id} className={s.chapter}><div className={s.chapterHeading}><span>{String(index+1).padStart(2,"0")}</span><h2>{chapter.title}</h2></div><div className={s.prose} dangerouslySetInnerHTML={{__html:chapter.html}}/><JournalPhotos photos={chapter.photos} title={chapter.title}/></section>)}
          {work.replaced_parts&&<section className={s.parts}><p className={s.eyebrow}>PARTS & MAINTENANCE</p><h2>이 차량에 교체한 부품</h2><p>{work.replaced_parts}</p></section>}
          {work.cause&&<section className={s.parts}><h2>확인한 원인</h2><p>{work.cause}</p></section>}
          {(work.repair_duration||work.warranty_info)&&<section className={s.parts}><h2>작업 안내</h2>{work.repair_duration&&<p>작업 시간: {work.repair_duration}</p>}{work.warranty_info&&<p>{work.warranty_info}</p>}</section>}
          {gallery.length>0&&<section className={s.chapter}><div className={s.chapterHeading}><span>＋</span><h2>추가 작업 사진</h2></div><JournalPhotos photos={gallery.map((src,i)=>({src,caption:`${work.vehicle_model} 작업 기록 ${i+1}`}))} title="추가 작업 사진"/></section>}
          {work.naver_blog_url&&<div className={s.source}><span>코리아오토미션의 정비 기록입니다.</span><a href={work.naver_blog_url} target="_blank" rel="noopener noreferrer">네이버 블로그 원문 ↗</a></div>}
          <section className={s.consult} id="case-consultation"><p className={s.eyebrow}>ASK THE WORKSHOP</p><h2>내 차의 증상도<br/>편하게 알려주세요.</h2><p>차종·연식·주행거리와 증상을 문자로 남겨주세요.<br/>작업 범위와 비용은 차량 상태를 확인한 뒤 안내합니다.</p><div><SmsLink phone={settings.phone} body={smsBody} className={s.smsButton}>문자로 상담하기 ↗</SmsLink><a href={telHref(settings.phone)} className={s.phoneLink}>전화 {settings.phone}</a></div><a href={getMapUrl(settings)} className={s.mapLink} target="_blank" rel="noopener noreferrer">{settings.address} · 오시는 길 ↗</a></section>
        </div>
      </div>
    </article>
    {related.length>0&&<section className={s.related}><div><p className={s.eyebrow}>MORE WORKSHOP RECORDS</p><h2>함께 살펴볼 정비사례</h2><Link href="/works">전체 사례 보기 ↗</Link></div><div className={s.relatedGrid}>{related.slice(0,3).map(item=><WorkCard key={item.id} work={item}/>)}</div></section>}
  </main><Footer settings={settings}/><WorkMobileCtaBar settings={settings} smsBody={smsBody}/></>;
}
