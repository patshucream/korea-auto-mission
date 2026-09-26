"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { SmartImage } from "@/components/ui/SmartImage";
import s from "./WorkshopHome.module.css";

type ServicePhoto = {
  id: string;
  title: string;
  path: string;
  alt: string;
  description: string;
  href: string;
};

export function DieselServiceShowcase({ items }: { items: ServicePhoto[] }) {
  const [selected, setSelected] = useState(0);
  const groupId = useId();
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  if (!items.length) return null;
  const active = Math.min(selected, items.length - 1);

  return (
    <div className={s.serviceLayout}>
      <div className={s.mobileServiceTabs} aria-label="디젤 클리닝 종류 선택">
        {items.map((item, index) => <button type="button" key={item.id} aria-pressed={index === active} aria-controls={`${groupId}-${index}`} onClick={() => setSelected(index)}><small>{String(index + 1).padStart(2, "0")}</small>{item.title.replace(/\s*클리닝$/, "")}</button>)}
      </div>
      <figure className={s.serviceFeature} data-reveal
        onPointerDown={(event) => { if (event.button === 0) swipeStart.current = { x: event.clientX, y: event.clientY }; }}
        onPointerCancel={() => { swipeStart.current = null; }}
        onPointerUp={(event) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            setSelected((active + (dx < 0 ? 1 : items.length - 1)) % items.length);
          }
        }}
        onDragStart={(event) => event.preventDefault()}>
        <div className={s.photoStage}>
          {items.map((item, index) => (
            <div key={item.id} className={`${s.photoLayer} ${index === active ? s.photoActive : ""}`} aria-hidden={index !== active}>
              <SmartImage path={item.path} alt={item.alt} className={s.featureImage} sizes="(max-width: 700px) 100vw, 50vw" />
            </div>
          ))}
        </div>
        <figcaption><span>WORKSHOP DETAIL</span><span aria-live="polite">{items[active].title} · 실제 작업 기록</span></figcaption>
        <div className={s.photoProgress} aria-label="작업 사진 선택">{items.map((item, index) => <button type="button" className={index === active ? s.progressActive : ""} key={item.id} aria-label={`${item.title} 사진 선택`} aria-pressed={index === active} onClick={() => setSelected(index)}>{String(index + 1).padStart(2, "0")}</button>)}</div>
      </figure>
      <div className={s.servicesGrid}>
        {items.map((item, index) => (
          <article className={`${s.service} ${index === active ? s.serviceActive : ""}`} id={`${groupId}-${index}`} key={item.id}>
            <span className={s.serviceNumber}>{String(index + 1).padStart(2, "0")}</span>
            <div className={s.serviceCopy}>
              <h3><button type="button" className={s.serviceSelect} aria-label={`${item.title} 작업 사진 보기`} aria-pressed={index === active} onClick={() => setSelected(index)} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)}>{item.title}<span aria-hidden="true">↗</span></button></h3>
              <p>{item.description}</p>
              <Link href={item.href} className={s.inlineLink}>작업·비용 안내 <span aria-hidden="true">↗</span></Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
