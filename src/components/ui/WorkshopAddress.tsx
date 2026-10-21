"use client";

import { useState } from "react";
import s from "./WorkshopAddress.module.css";

export function WorkshopAddress({ address, mapUrl, light = false, compact = false, copy = false }: {
  address: string; mapUrl: string; light?: boolean; compact?: boolean; copy?: boolean;
}) {
  const [status, setStatus] = useState("");
  async function copyAddress() {
    try { await navigator.clipboard.writeText(address); setStatus("주소를 복사했습니다."); }
    catch { setStatus("주소를 길게 눌러 복사해 주세요."); }
  }
  return <div className={`${s.wrap} ${light ? s.light : ""} ${compact ? s.compact : ""} ${copy ? s.location : ""}`}>
    <a className={s.map} href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`${address} — 네이버 지도에서 길찾기`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
      <span className={s.address}>{address}</span><span className={s.direction}>{compact ? "길찾기" : "네이버 길찾기"} ↗</span>
    </a>
    {copy && <><button className={s.copy} type="button" onClick={copyAddress}>주소 복사</button><span className={s.status} role="status">{status}</span></>}
  </div>;
}
