import { AdminShell } from "@/components/admin/AdminShell";
import { JournalRevisionButton } from "@/components/admin/JournalRevisionButton";
import { getJournalRevisions } from "@/lib/works/journal-revisions";
export const maxDuration = 60;
export default function JournalRevisionsPage() {
  const revisions = getJournalRevisions();
  return <AdminShell title="전체 정비사례 검색·상세 설명 보강" description="기존에 확인한 작업 기록을 바탕으로 차종·증상별 설명과 검색 정보를 보강합니다.">
    <div className="space-y-6 rounded-xl border border-border bg-white p-6">
      <p>실제 작업 기록 {revisions.length}편의 반복 설명을 정리하고 실제 작업 내용과 사진 설명을 보강합니다. 기존 사진, 주소와 공개 상태를 유지합니다. 이후 별도로 편집된 글은 건너뜁니다.</p>
      <ul className="space-y-4">{revisions.map(r => <li key={r.id}><strong>{r.title}</strong><p className="mt-2 text-sm text-muted">작업 설명 {r.after.content_html.match(/<h2>/g)?.length}개 구간</p><a className="text-sm underline" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">네이버 블로그 원문 ↗</a></li>)}</ul>
      <JournalRevisionButton count={revisions.length}/>
    </div>
  </AdminShell>;
}
