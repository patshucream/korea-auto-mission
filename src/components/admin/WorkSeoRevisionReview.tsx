"use client";

import { useState, useTransition } from "react";
import { applyWorkSeoRevisions, previewWorkSeoRevisions } from "@/lib/actions/work-seo-revisions";
import type { SeoReviewResult } from "@/lib/works/seo-revisions";

type Entry = { slug: string; sourceUrl: string; title: string; before: string; after: string; reason: string; changed: boolean; publicObserved: boolean };

export function WorkSeoRevisionReview({ entries, applyEnabled }: { entries: Entry[]; applyEnabled: boolean }) {
  const [pending, start] = useTransition();
  const [results, setResults] = useState<SeoReviewResult[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const run = (apply: boolean) => start(async () => {
    setError("");
    try {
      const response = apply ? await applyWorkSeoRevisions(selected) : await previewWorkSeoRevisions();
      setResults(response.results); setError(response.error); setSelected([]);
    } catch { setError("결과를 확인하지 못했습니다. 미리보기로 현재값을 다시 확인해 주세요."); }
  });
  return <div className="space-y-6">
    <div className="space-y-3 rounded-xl border border-border bg-white p-5">
      <p>35개 사례의 검색 설명 검토안입니다. 제목·본문·주소·공개 상태는 유지합니다. 공개 화면 확인 11건과 운영 DB 대조는 구분됩니다.</p>
      <p className="text-sm text-muted">‘현재값 미리보기’는 저장 없이 공개 행과 원문·기존값을 비교합니다. 일치하는 변경 대상만 개별 선택할 수 있습니다.</p>
      {!applyEnabled && <p className="font-bold">운영 적용은 잠겨 있습니다. 변경안 승인 후 적용 기능을 활성화해야 저장할 수 있습니다.</p>}
      <div className="flex flex-wrap gap-3"><button type="button" className="btn btn-secondary" disabled={pending} onClick={() => run(false)}>현재값 미리보기</button><button type="button" className="btn btn-primary" disabled={pending || !applyEnabled || !selected.length} onClick={() => run(true)}>선택한 {selected.length}개 검색 설명 적용</button></div>
      <p aria-live="polite" className="text-sm">{pending ? "확인 중…" : error || (results.length ? "사례별 결과를 확인해 주세요." : "현재 운영 DB는 아직 대조하지 않았습니다.")}</p>
    </div>
    {entries.map(entry => {
      const result = results.find(item => item.slug === entry.slug);
      const ready = result?.status === "ready" && entry.changed;
      return <section key={entry.slug} className="space-y-3 rounded-xl border border-border bg-white p-5">
        <label className="flex items-start gap-3 font-bold"><input type="checkbox" className="mt-1" disabled={pending || !ready} checked={selected.includes(entry.slug)} onChange={event => setSelected(current => event.target.checked ? [...current, entry.slug] : current.filter(slug => slug !== entry.slug))}/><span>{entry.title}</span></label>
        <p className="text-sm text-muted">{entry.changed ? "설명 변경 후보" : "기존 설명 유지"} · {entry.publicObserved ? "공개 설명·제목·대표주소 관측 완료" : "공개 화면 미관측"}</p><p className="text-sm">{entry.reason}</p>
        <dl className="grid gap-3 text-sm md:grid-cols-2"><div><dt className="font-bold">예상 기존 설명</dt><dd className="mt-1">{entry.before}</dd></div><div><dt className="font-bold">제안 설명</dt><dd className="mt-1">{entry.after}</dd></div></dl>
        {result && <div className="space-y-1 rounded bg-gray-50 p-3 text-sm"><p className="font-bold">{result.message}</p>{result.current && <><p>현재 설명: {result.current.description || "미제공"}</p>{result.status === "conflict" && <p>현재 사례 ID: {result.current.id} · 현재 원문: {result.current.sourceUrl || "미제공"}</p>}</>}</div>}
        <a href={entry.sourceUrl} className="text-sm underline" target="_blank" rel="noopener noreferrer">검토 근거 원문 ↗</a>
      </section>;
    })}
  </div>;
}
