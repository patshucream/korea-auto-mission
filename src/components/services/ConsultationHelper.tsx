"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { telHref } from "@/lib/utils";
import s from "./ConsultationHelper.module.css";

export function ConsultationHelper({ settings, service, symptoms }: {
  settings: SiteSettings; service: string; symptoms: string[];
}) {
  const [vehicle, setVehicle] = useState("");
  const [symptom, setSymptom] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const message = `[코리아오토미션 ${service} 상담]\n차량: ${vehicle.trim() || "차종, 연식, 주행거리를 적어주세요"}\n증상: ${symptom || "증상과 발생 상황을 적어주세요"}\n방문 가능 일정을 상담하고 싶습니다.`;
  const digits = settings.phone.replace(/[^0-9+]/g, "");
  const smsHref = `sms:${digits}?body=${encodeURIComponent(message)}`;

  async function copyMessage() {
    try { await navigator.clipboard.writeText(message); setCopied(true); setCopyError(false); }
    catch { setCopied(false); setCopyError(true); }
  }

  return <section className={s.wrap} id="consultation" aria-labelledby="consultation-title">
    <div>
      <p className={s.eyebrow}>내 차에 맞는 정비 상담</p>
      <h2 id="consultation-title">차종과 증상을<br />알려주세요.</h2>
      <p>진단 후 필요한 작업 범위와 견적을 안내합니다.<br />방문 전 정비 가능 여부와 일정을 확인해 주세요.</p>
      <a href={telHref(settings.phone)} className={s.phone} data-contact="phone">{settings.phone}</a>
      <p className={s.hours}>평일 {settings.weekday_hours} · 토요일 {settings.saturday_hours}<br />일요일 휴무 · 공휴일 {settings.holiday_hours}</p>
    </div>
    <div className={s.card}>
      <h3>전화가 어려우면 문자로 남겨주세요.</h3>
      <label htmlFor="consultation-vehicle">차량 정보 <span>선택</span></label>
      <input id="consultation-vehicle" value={vehicle} maxLength={90} onChange={e=>setVehicle(e.target.value)} placeholder="예: 스포티지 / 2018년 / 12만 km" autoComplete="off" />
      <fieldset><legend>상담할 증상 <span>선택</span></legend><div className={s.chips}>{symptoms.map(item=><button key={item} type="button" aria-pressed={symptom===item} onClick={()=>setSymptom(symptom===item?"":item)}>{item}</button>)}</div></fieldset>
      <p className={s.note}>문자 앱이 열리면 내용을 확인하고 직접 전송해 주세요. 입력 내용은 이 화면에서만 사용합니다.</p>
      <div className={s.actions}><a className={s.primary} href={smsHref} data-contact="sms" onClick={e => { if (/iPhone|iPad|iPod/.test(navigator.userAgent)) e.currentTarget.href = `sms:${digits}&body=${encodeURIComponent(message)}`; }}>문자로 증상 보내기 ↗</a><button type="button" onClick={copyMessage}>상담 내용 복사</button></div>
      <span role="status" className={s.status}>{copied ? "상담 내용을 복사했습니다. 문자 앱에 붙여 넣어 주세요." : copyError ? `복사가 지원되지 않습니다. ${settings.phone}로 직접 문자해 주세요.` : ""}</span>
    </div>
  </section>;
}
