"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { publishPreparedBlogCases, savePreparedBlogDrafts, type BlogImportResult } from "@/lib/actions/blog-import";

export function BlogImportButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<BlogImportResult[]>([]);
  const [error, setError] = useState("");
  function run(publish: boolean) {
    startTransition(async () => {
      setError("");
      try {
        const response = await (publish ? publishPreparedBlogCases() : savePreparedBlogDrafts());
        setResults(response.results);
        setError(response.error || "");
      } catch {
        setError("저장을 완료하지 못했습니다. 다시 실행하면 이미 저장된 글을 확인합니다.");
      }
    });
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending} className="btn btn-primary disabled:opacity-50" onClick={() => run(true)}>
          {pending ? "처리 중…" : `koreaautolife 작업사례 ${count}편 공개`}
        </button>
        <button type="button" disabled={pending} className="btn btn-ghost disabled:opacity-50" onClick={() => run(false)}>
          임시저장만 하기
        </button>
      </div>
      <p className="text-sm leading-6 text-muted">공개하면 사진과 함께 홈페이지에 바로 표시됩니다. 이미 공개된 글과 삭제된 글은 건드리지 않습니다. 기존 초안은 수정한 본문을 유지하며 공개합니다.</p>
      <div aria-live="polite">
        {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
        {results.length ? <ul className="space-y-2 rounded-xl border border-border bg-white p-5">
          {results.map((result) => <li key={result.postId} className="text-sm">
            <span className={result.status === "error" ? "text-red-700" : "text-navy"}>{result.title} — {result.message}</span>
            {result.id ? <Link className="ml-2 underline" href={`/admin/works/${result.id}/edit`}>편집</Link> : null}
          </li>)}
        </ul> : null}
      </div>
    </div>
  );
}
