"use client";
import {useState,useTransition} from "react";
import {applyJournalRevisions} from "@/lib/actions/journal-revisions";
export function JournalRevisionButton() {
 const [pending,start]=useTransition();const [messages,setMessages]=useState<string[]>([]);
 return <div><button type="button" className="btn btn-primary" disabled={pending} onClick={()=>start(async()=>{
  try{const result=await applyJournalRevisions();setMessages(result.error?[result.error]:result.results.map(r=>`${r.title} — ${r.message}`));}
  catch{setMessages(["저장 결과를 확인하지 못했습니다. 다시 실행하면 반영 여부를 확인합니다."]);}
 })}>{pending?"적용 중…":"검토한 45건의 정비사례 수정 적용"}</button><ul className="mt-5 space-y-3 text-sm" aria-live="polite">{messages.map(m=><li key={m}>{m}</li>)}</ul></div>;
}
