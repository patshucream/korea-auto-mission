"use client";

import { useState } from "react";
import Image from "next/image";
import { SmsLink } from "@/components/ui/SmsLink";
import { telHref } from "@/lib/utils";
import s from "@/app/services/electric-vehicle/page.module.css";

const steps = [
  { name: "모터", image: "motor", heading: "조용한 주행의 중심.", text: "아이오닉 EV의 구동모터를 분해하고 내부 베어링을 신품으로 교체한 뒤 다시 조립했습니다.", alt: "아이오닉 EV 분해 정비 중 구동모터의 내부 코일" },
  { name: "감속기", image: "gears", heading: "힘을 전하는 부품까지.", text: "감속기 내부의 손상된 베어링을 확인하고 수리를 진행한 기록입니다. 사진은 탈거한 감속기의 외관입니다.", alt: "탈거한 아이오닉 EV 감속기 외관" },
  { name: "재조립", image: "assembly", heading: "다시 하나로. 다시 일상으로.", text: "모터와 감속기를 재장착하고 냉각수와 감속기 오일을 주입했습니다. 작업 전 발생하던 소음이 없어진 것을 확인하고 출고했습니다.", alt: "아이오닉 EV 모터와 감속기 재조립 모습" },
];
export function EvRepairExplorer() {
  const [selected, setSelected] = useState(0);
  const step = steps[selected];
  return <div className={s.explorer}>
    <div className={s.explorerPhoto}><Image key={step.image} src={`/ev/ionic-repair/${step.image}.jpg`} alt={step.alt} fill sizes="(max-width: 760px) 100vw, 65vw" /><span className={s.photoLabel}>IONIQ EV / 실제 작업 사진</span></div>
    <div className={s.explorerInfo}>
      <div className={s.segmented} role="group" aria-label="수리 과정 선택">{steps.map((item,i)=><button key={item.name} type="button" aria-pressed={i===selected} aria-controls="ev-step-description" onClick={()=>setSelected(i)}>{item.name}</button>)}</div>
      <div id="ev-step-description" aria-live="polite"><p className={s.stepNumber}>0{selected+1} / 03</p><h3>{step.heading}</h3><p>{step.text}</p></div>
      <p className={s.explorerHint}>부품을 선택해 실제 작업을 살펴보세요.</p>
    </div>
  </div>;
}

const symptoms = ["모터·감속기 소음", "주행 중 진동", "배터리·인버터 경고", "충전 불량", "기타 증상"];
export function EvConsultation({phone}: {phone:string}) {
  const [vehicle,setVehicle] = useState("");
  const [symptom,setSymptom] = useState("");
  const body = `[전기차 수리 상담]\n차량: ${vehicle.trim() || "차종·연식·주행거리를 적어주세요"}\n증상: ${symptom || "증상과 발생 상황을 적어주세요"}\n방문 가능 일정을 상담하고 싶습니다.`;
  return <div className={s.consultCard}>
    <label htmlFor="ev-vehicle">어떤 전기차를 운행하시나요?</label>
    <input id="ev-vehicle" value={vehicle} onChange={e=>setVehicle(e.target.value)} maxLength={90} placeholder="예: EV6 · 2022년 · 8만 km" autoComplete="off" />
    <fieldset><legend>어떤 변화가 느껴지나요?</legend><div className={s.symptomChips}>{symptoms.map(item=><button key={item} type="button" aria-pressed={symptom===item} onClick={()=>setSymptom(symptom===item?"":item)}>{item}</button>)}</div></fieldset>
    <SmsLink phone={phone} body={body} className={s.sendSms}>이 내용으로 문자 상담 <span aria-hidden="true">↗</span></SmsLink>
    <a className={s.directPhone} href={telHref(phone)} data-contact="phone">전화로 이야기하기 <span>{phone}</span></a>
    <p className={s.formNote}>입력은 선택입니다. 내용은 이 화면에서만 사용하며,<br />문자 앱에서 확인 후 직접 전송해 주세요.</p>
  </div>;
}
