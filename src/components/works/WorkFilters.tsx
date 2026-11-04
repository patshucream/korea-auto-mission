"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { ServiceOption } from "@/lib/types";
import s from "./WorkLibrary.module.css";

export function WorkFilters({brands,models,services}:{brands:string[];models:string[];services:ServiceOption[]}) {
  const router=useRouter(); const search=useSearchParams(); const [pending,startTransition]=useTransition();
  const [q,setQ]=useState(search.get("q")||"");
  const brand=search.get("brand")||"";
  const model=search.get("model")||"";
  const sort=search.get("sort")||"newest";
  const service=search.get("service")||"";
  function apply(overrides: Record<string,string> = {}) {
    const params=new URLSearchParams();
    const values={q,brand,model,sort,service,category:search.get("category")||"",...overrides};
    for(const [key,value] of Object.entries(values))if(value)params.set(key,value);
    startTransition(()=>router.push(`/works?${params}`,{scroll:false}));
  }
  function reset(){setQ("");startTransition(()=>router.push("/works",{scroll:false}));}
  const selected=Boolean(search.get("q")||brand||model||service||search.get("category"));
  return <div className={s.filters} aria-busy={pending}>
    <form onSubmit={e=>{e.preventDefault();apply();}}>
      <div className={s.filterTop}><div><p className={s.filterEyebrow}>내 차의 정비 기록 찾기</p><h2>어떤 차량을 타고 계신가요?</h2></div><p>제조사와 정비 분야를 함께 선택할 수 있습니다.</p></div>
      <div className={s.vehicleFilters}>
        <label htmlFor="work-brand">제조사<select id="work-brand" value={brand} disabled={pending} onChange={e=>apply({brand:e.target.value,model:""})}><option value="">전체 제조사</option>{brands.map(b=><option key={b}>{b}</option>)}</select></label>
        <label htmlFor="work-model">차종<select id="work-model" value={model} disabled={pending} onChange={e=>apply({model:e.target.value})}><option value="">전체 차종</option>{models.map(m=><option key={m}>{m}</option>)}</select></label>
        <div className={s.searchField}><label className={s.searchLabel} htmlFor="work-search">증상·작업 검색</label><div className={s.searchRow}><input id="work-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="예: 변속충격, 감속기 소음"/><button type="submit" disabled={pending} aria-label="작업사례 검색">검색 ↗</button></div></div>
      </div>
      <p className={s.filterHint}>정비 분야 <span>옆으로 넘겨 더 보기 →</span></p>
      <div className={s.serviceFilters} aria-label="정비 분야"><button type="button" disabled={pending} aria-pressed={!service&&!search.get("category")} onClick={()=>apply({service:"",category:""})}>전체 분야</button>{services.map(item=><button type="button" disabled={pending} key={item.id} aria-pressed={service===item.id||(!service&&search.get("category")===item.title)} onClick={()=>apply({service:item.id,category:""})}>{item.title}</button>)}</div>
      <div className={s.filterBottom}><div aria-live="polite">{pending?<span>정비 기록을 찾고 있습니다…</span>:brand?<span>{brand}{model?` · ${model}`:""} 정비 기록</span>:<span>실제 입고 차량의 사진과 정비 과정</span>}{selected&&<button className={s.reset} type="button" disabled={pending} onClick={reset}>조건 초기화 ×</button>}</div><label className={s.sortLabel}>정렬<select value={sort} disabled={pending} onChange={e=>apply({sort:e.target.value})}><option value="newest">최신순</option><option value="oldest">오래된순</option></select></label></div>
    </form>
  </div>;
}
