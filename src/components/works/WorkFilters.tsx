"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { ServiceOption } from "@/lib/types";
import { finderBrand, finderModel } from "@/lib/works/finder";
import s from "./WorkLibrary.module.css";

export function WorkFilters({brands,models,services}:{brands:string[];models:string[];services:ServiceOption[]}) {
  const router=useRouter(); const search=useSearchParams(); const [pending,startTransition]=useTransition();
  const [q,setQ]=useState(search.get("q")||"");
  const brand=finderBrand(search.get("brand")||"");
  const model=finderModel(search.get("model")||"");
  const sort=search.get("sort")||"newest";
  const service=search.get("service")||"";
  function apply(overrides: Record<string,string> = {}) {
    const params=new URLSearchParams();
    const values={q,brand,model,sort,service,category:search.get("category")||"",...overrides};
    for(const [key,value] of Object.entries(values))if(value)params.set(key,value);
    startTransition(()=>router.push(`/works?${params}`,{scroll:false}));
  }
  function reset(){setQ("");startTransition(()=>router.push("/works",{scroll:false}));}
  const symptoms=[{label:"변속 충격",query:"변속 충격"},{label:"가속 안 됨·슬립",query:"슬립"},{label:"소음",query:"소음"},{label:"떨림·진동",query:"떨림"},{label:"후진 불량",query:"후진"},{label:"경고등",query:"경고등"}];
  const selected=Boolean(search.get("q")||brand||model||service||search.get("category"));
  return <div className={s.filters} aria-busy={pending}>
    <form onSubmit={e=>{e.preventDefault();apply();}}>
      <div className={s.filterTop}><div><h2>내 차와 비슷한 사례 찾기</h2><p className={s.finderHelp}>차종만, 증상만 골라도 됩니다. 함께 고르면 더 좁혀집니다.</p></div></div>
      <div className={s.vehicleFilters}>
        <label htmlFor="work-brand">제조사<select id="work-brand" value={brand} disabled={pending} onChange={e=>apply({brand:e.target.value,model:""})}><option value="">전체 제조사</option>{brands.map(b=><option key={b}>{b}</option>)}</select></label>
        <label htmlFor="work-model">차종<select id="work-model" value={model} disabled={pending} onChange={e=>apply({model:e.target.value})}><option value="">전체 차종</option>{models.map(m=><option key={m}>{m}</option>)}</select></label>
        <div className={s.searchField}><label className={s.searchLabel} htmlFor="work-search">차종·증상 검색</label><div className={s.searchRow}><input id="work-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="예: 스팅어 변속 충격"/><button type="submit" disabled={pending} aria-label="작업사례 검색">검색 ↗</button></div></div>
      </div>
      <div className={s.symptomFilters} role="group" aria-label="증상 바로 찾기">{symptoms.map(item=><button type="button" key={item.query} disabled={pending} aria-pressed={search.get("q")===item.query} onClick={()=>{const next=search.get("q")===item.query?"":item.query;setQ(next);apply({q:next});}}>{item.label}</button>)}</div>
      <details className={s.moreFilters} open={service||search.get("category")?true:undefined}><summary>정비 분야로 더 좁히기{service?` · ${services.find(item=>item.id===service)?.title||"선택됨"}`:""}</summary>
      <p className={s.filterHint}>정비 분야 <span>옆으로 넘겨 더 보기 →</span></p>
      <div className={s.serviceFilters} aria-label="정비 분야"><button type="button" disabled={pending} aria-pressed={!service&&!search.get("category")} onClick={()=>apply({service:"",category:""})}>전체 분야</button>{services.map(item=><button type="button" disabled={pending} key={item.id} aria-pressed={service===item.id||(!service&&search.get("category")===item.title)} onClick={()=>apply({service:item.id,category:""})}>{item.title}</button>)}</div>
      </details>
      {selected&&<div className={s.activeFilters} aria-label="선택한 검색 조건">{brand&&<button type="button" disabled={pending} onClick={()=>apply({brand:"",model:""})}>{brand} 해제 ×</button>}{model&&<button type="button" disabled={pending} onClick={()=>apply({model:""})}>{model} 해제 ×</button>}{search.get("q")&&<button type="button" disabled={pending} onClick={()=>{setQ("");apply({q:""});}}>“{search.get("q")}” 해제 ×</button>}</div>}
      <div className={s.filterBottom}><div aria-live="polite">{pending?<span>정비 기록을 찾고 있습니다…</span>:brand?<span>{brand}{model?` · ${model}`:""} 정비 기록</span>:<span>실제 입고 차량의 사진과 정비 과정</span>}{selected&&<button className={s.reset} type="button" disabled={pending} onClick={reset}>조건 초기화 ×</button>}</div><label className={s.sortLabel}>정렬<select value={sort} disabled={pending} onChange={e=>apply({sort:e.target.value})}><option value="newest">최신순</option><option value="oldest">오래된순</option></select></label></div>
    </form>
  </div>;
}
