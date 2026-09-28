import Link from "next/link";
import type { SiteSettings, WorkCase } from "@/lib/types";
import { getWorkServiceLabels } from "@/lib/works/services";
import s from "./RepairJournal.module.css";

const guides: Record<string, { href: string; label: string }> = {
  "오토미션 수리": { href: "/services/transmission", label: "미션수리 · 증상·비용 상담 안내" },
  "흡기 클리닝": { href: "/services/diesel-cleaning/intake", label: "흡기 클리닝 · 점검·작업 안내" },
  "인젝터 클리닝": { href: "/services/diesel-cleaning/injector", label: "인젝터 클리닝 · 점검·작업 안내" },
  "DPF 클리닝": { href: "/services/diesel-cleaning/dpf", label: "DPF 클리닝 · 점검·작업 안내" },
  "전기차 수리": { href: "/services/electric-vehicle", label: "전기차 수리 · 점검·작업 안내" },
};

/** Derive links from the saved case categories, without claiming unrecorded work. */
export function WorkServiceContext({ work, settings }: { work: WorkCase; settings: SiteSettings }) {
  const links = getWorkServiceLabels(work).flatMap(label => guides[label] ? [guides[label]] : []);
  return <section className={s.serviceContext} aria-labelledby="case-visit-title">
    <div>
      <p className={s.eyebrow}>부산 사상구 · 코리아오토미션</p>
      <h2 id="case-visit-title">비슷한 증상으로 정비소를 찾고 계신가요?</h2>
      <p>이 글은 {settings.address}에서 진행한 실제 작업 기록입니다. 같은 증상도 원인은 다를 수 있어, 차종과 상태를 확인한 뒤 작업 범위와 비용을 안내합니다.</p>
    </div>
    {links.length > 0 && <nav aria-label="이 작업과 관련된 정비 안내">{links.map(link =>
      <Link key={link.href} href={link.href}>{link.label}<span aria-hidden="true">↗</span></Link>,
    )}</nav>}
    <a href="#case-consultation" className={s.contextContact}>내 차량 전화·문자 상담 <span aria-hidden="true">↓</span></a>
  </section>;
}
