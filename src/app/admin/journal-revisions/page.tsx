import {AdminShell} from "@/components/admin/AdminShell";
import {JournalRevisionButton} from "@/components/admin/JournalRevisionButton";
import {getJournalRevisions} from "@/lib/works/journal-revisions";
export const maxDuration=60;
export default function JournalRevisionsPage(){return <AdminShell title="정비사례 상세 설명 보강" description="전체 55건을 대조하고 수정이 필요한 45건의 설명·사진 캡션·원문 링크를 정리했습니다."><div className="space-y-6 rounded-xl border border-border bg-white p-6"><p>빠진 정비 항목과 예방정비 배경을 보완하고 22건의 사진 95장에 설명을 붙입니다. 사진 배치와 원문 링크를 정리하며, 앞서 승인한 두 차량의 대표 사진도 저장합니다. 제목과 공개 상태는 유지하고 이후 별도로 편집한 글은 자동으로 건너뜁니다.</p><ul className="space-y-4">{getJournalRevisions().map(r=><li key={r.id}><strong>{r.title}</strong><p className="mt-2 text-sm text-muted">작업 단계 {r.after.content_html.match(/<h2>/g)?.length}개 · 차량 정보 및 사진별 설명</p><a className="text-sm underline" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">koreaautolife 원문 ↗</a></li>)}</ul><JournalRevisionButton/></div></AdminShell>}
