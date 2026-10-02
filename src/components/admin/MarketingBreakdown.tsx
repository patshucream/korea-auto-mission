"use client";

import { useState } from "react";
import type { trafficBreakdown } from "@/lib/marketing-contacts";

export function MarketingBreakdown({ title, rows }: { title: string; rows: ReturnType<typeof trafficBreakdown> }) {
  const [limit, setLimit] = useState(7);
  const visible = rows.slice(0, limit);
  const rate = (value: number | null) => value === null ? "—" : `${value.toFixed(1)}%`;
  return <section className="admin-card min-w-0">
    <h2 className="mb-4 font-bold">{title}</h2>
    {!rows.length ? <p className="py-5 text-sm text-muted">해당 조건에 기록이 없습니다.</p> : <>
      <ul className="divide-y divide-border sm:hidden">{visible.map(row => <li key={row.key} className="py-4 first:pt-0">
        <div className="flex items-start justify-between gap-3"><p className="min-w-0 break-words text-sm font-semibold">{row.label}</p><p className="shrink-0 text-lg font-bold tabular-nums text-navy">{row.visits.toLocaleString()}<span className="ml-1 text-xs font-normal text-muted">방문</span></p></div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted"><div><dt>전화 클릭</dt><dd className="mt-1 text-sm font-semibold text-navy">{row.phone}</dd></div><div><dt>문자 클릭</dt><dd className="mt-1 text-sm font-semibold text-navy">{row.sms}</dd></div><div><dt>문의 클릭률</dt><dd className="mt-1 text-sm font-semibold text-navy">{rate(row.rate)}</dd></div></dl>
      </li>)}</ul>
      <div className="hidden overflow-x-auto sm:block"><table className="w-full text-left text-sm"><thead><tr className="border-b">{["구분","방문","전화 클릭","문자 클릭","문의 클릭률"].map(label => <th className="whitespace-nowrap px-2 py-3 first:pl-0" key={label}>{label}</th>)}</tr></thead><tbody>{visible.map(row => <tr className="border-b" key={row.key}><td className="py-3 pr-3">{row.label}</td><td className="px-2 tabular-nums">{row.visits.toLocaleString()}</td><td className="px-2 tabular-nums">{row.phone}</td><td className="px-2 tabular-nums">{row.sms}</td><td className="px-2 tabular-nums">{rate(row.rate)}</td></tr>)}</tbody></table></div>
      {rows.length > 7 && <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted">{visible.length} / {rows.length}개 표시</span><button type="button" className="btn btn-secondary min-h-11 text-sm" onClick={() => setLimit(limit >= rows.length ? 7 : limit + 14)}>{limit >= rows.length ? "접기" : "더 보기"}</button></div>}
    </>}
  </section>;
}
