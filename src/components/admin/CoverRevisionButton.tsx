"use client";
import { useState, useTransition } from "react";
import { applyCoverRevisions } from "@/lib/actions/cover-revisions";
export function CoverRevisionButton({ count }: { count: number }) {
  const [pending, start] = useTransition();
  const [messages, setMessages] = useState<string[]>([]);
  return <div>
    <button type="button" className="btn btn-primary" disabled={pending} onClick={() => start(async () => {
      try {
        const response = await applyCoverRevisions();
        setMessages(response.error ? [response.error] : response.results.map(r => `${r.title} — ${r.message}`));
      } catch { setMessages(["저장 결과를 확인하지 못했습니다. 다시 실행하면 반영 여부를 확인합니다."]); }
    })}>{pending ? "교체 중…" : `확인한 ${count}편의 대표사진만 차량 사진으로 교체`}</button>
    <ul className="mt-5 space-y-3 text-sm" aria-live="polite">{messages.map(m => <li key={m}>{m}</li>)}</ul>
  </div>;
}
