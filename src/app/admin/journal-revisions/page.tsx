import { AdminShell } from "@/components/admin/AdminShell";
import { JournalRevisionButton } from "@/components/admin/JournalRevisionButton";
import { getJournalRevisions } from "@/lib/works/journal-revisions";
export const maxDuration = 60;
export default function JournalRevisionsPage() {
  const revisions = getJournalRevisions();
  return <AdminShell title="오토미션 작업사례 검색 표현 보강" description="실제 미션 작업의 차종·증상·수리 표현을 제목과 검색 설명에 반영합니다.">
    <div className="space-y-6 rounded-xl border border-border bg-white p-6">
      <p>실제 작업 기록 {revisions.length}편의 제목·검색 설명과 본문 소제목을 보강합니다. 기존 본문과 사진, 주소와 공개 상태를 유지합니다. 이후 별도로 편집된 글은 건너뜁니다.</p>
      <ul className="space-y-4">{revisions.map(r => <li key={r.id}><strong>{r.title}</strong><p className="mt-2 text-sm text-muted">작업 설명 {r.after.content_html.match(/<h2>/g)?.length}개 구간</p><a className="text-sm underline" href={r.sourceUrl.replace("/97ga074/", "/koreaautolife/")} target="_blank" rel="noopener noreferrer">koreaautolife 원문 ↗</a></li>)}</ul>
      <JournalRevisionButton count={revisions.length}/>
    </div>
  </AdminShell>;
}
