"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { ServiceOption } from "@/lib/types";
import s from "./WorkLibrary.module.css";

export function WorkFilters({brands,models,services}:{brands:string[];models:string[];services:ServiceOption[]}) {
  const router=useRouter(); const search=useSearchParams(); const [pending,startTransition]=useTransition();
  const [q,setQ]=useState(search.get("q")||"");
  const [brand,setBrand]=useState(search.get("brand")||"");
  const [model,setModel]=useState(search.get("model")||"");
  const [sort,setSort]=useState(search.get("sort")||"newest");
  const service=search.get("service")||"";
  function apply(nextService=service) {
    const params=new URLSearchParams();
    for(const [key,value] of Object.entries({q,brand,model,sort,service:nextService}))if(value)params.set(key,value);
    startTransition(()=>router.push(`/works?${params}`));
  }
  function reset(){setQ("");setBrand("");setModel("");setSort("newest");startTransition(()=>router.push("/works"));}
  return <div className={s.filters} aria-busy={pending}>
    <form onSubmit={e=>{e.preventDefault();apply();}}>
      <label className={s.searchLabel} htmlFor="work-search">내 차와 비슷한 정비 기록 찾기</label>
      <div className={s.searchRow}><input id="work-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="차종이나 증상을 입력하세요"/><button type="submit" disabled={pending}>{pending?"찾는 중…":"검색 ↗"}</button></div>
      <div className={s.serviceFilters} aria-label="정비 분야"><button type="button" aria-pressed={!service} onClick={()=>apply("")}>전체 분야</button>{services.map(item=><button type="button" key={item.id} aria-pressed={service===item.id} onClick={()=>apply(item.id)}>{item.title}</button>)}</div>
      <details className={s.advanced}><summary>제조사·차종·정렬 <span>＋</span></summary><div className={s.advancedGrid}>
        <label>제조사<select value={brand} onChange={e=>{setBrand(e.target.value);setModel("");}}><option value="">전체 제조사</option>{brands.map(b=><option key={b}>{b}</option>)}</select></label>
        <label>차종<select value={model} onChange={e=>setModel(e.target.value)}><option value="">전체 차종</option>{models.map(m=><option key={m}>{m}</option>)}</select></label>
        <label>정렬<select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">최신순</option><option value="oldest">오래된순</option></select></label>
        <div><button type="submit" disabled={pending}>조건 적용</button><button type="button" onClick={reset}>초기화</button></div>
      </div></details>
    </form>
    {(search.get("q")||search.get("brand")||search.get("model")||service||search.get("category"))&&<button className={s.reset} type="button" onClick={reset}>선택한 조건 모두 지우기 ×</button>}
  </div>;
}
