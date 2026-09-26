import {AdminShell} from "@/components/admin/AdminShell";
import {JournalRevisionButton} from "@/components/admin/JournalRevisionButton";
import {getJournalRevisions} from "@/lib/works/journal-revisions";
export const maxDuration=60;
export default function JournalRevisionsPage(){return <AdminShell title="정비사례 상세 설명 보강" description="koreaautolife 원문을 확인한 세 사례의 작업 단계와 사진 설명을 보강합니다."><div className="space-y-6 rounded-xl border border-border bg-white p-6"><p>쏘울EV 충전 장치 점검, 스팅어 클러치 수리, 쏘렌토 흡기·DPF 세척의 설명과 사진 캡션을 적용합니다. 제목·공개 상태·대표 사진은 유지합니다. 기존 내용과 달라진 글은 자동으로 건너뜁니다.</p><ul className="space-y-4">{getJournalRevisions().map(r=><li key={r.id}><strong>{r.title}</strong><p className="mt-2 text-sm text-muted">작업 단계 {r.after.content_html.match(/<h2>/g)?.length}개 · 차량 정보 및 사진별 설명</p><a className="text-sm underline" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">koreaautolife 원문 ↗</a></li>)}</ul><JournalRevisionButton/></div></AdminShell>}
