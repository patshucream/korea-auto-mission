import { AdminShell } from "@/components/admin/AdminShell";
import { JournalRevisionButton } from "@/components/admin/JournalRevisionButton";
import { getJournalRevisions } from "@/lib/works/journal-revisions";
export const maxDuration = 60;
export default function JournalRevisionsPage() {
  const revisions = getJournalRevisions();
  return <AdminShell title="정비사례 상세 설명 보강" description="검색 노출 기록이 있는 실제 사례의 증상·작업 범위와 관련 안내를 보강합니다.">
    <div className="space-y-6 rounded-xl border border-border bg-white p-6">
      <p>블로그 원문과 대조한 {revisions.length}편입니다. 기존 본문·사진·제목·주소와 공개 상태를 유지하고, 사례별 설명과 관련 페이지 링크를 추가합니다. 이후 별도로 편집된 글은 건너뜁니다.</p>
      <ul className="space-y-4">{revisions.map(r => <li key={r.id}><strong>{r.title}</strong><p className="mt-2 text-sm text-muted">작업 설명 {r.after.content_html.match(/<h2>/g)?.length}개 구간</p><a className="text-sm underline" href={r.sourceUrl.replace("/97ga074/", "/koreaautolife/")} target="_blank" rel="noopener noreferrer">koreaautolife 원문 ↗</a></li>)}</ul>
      <JournalRevisionButton count={revisions.length}/>
    </div>
  </AdminShell>;
}
