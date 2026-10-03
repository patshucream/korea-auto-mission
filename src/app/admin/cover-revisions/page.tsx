import { AdminShell } from "@/components/admin/AdminShell";
import { SmartImage } from "@/components/ui/SmartImage";
import { CoverRevisionButton } from "@/components/admin/CoverRevisionButton";
import revisions from "@/lib/data/cover-revisions.json";
export const maxDuration = 60;
export default function CoverRevisionsPage() {
  return <AdminShell title="작업사례 차량 대표사진" description="해당 블로그 원문에서 확인한 실제 차량 사진입니다.">
    <div className="space-y-8">
      <p>확인한 {revisions.length}편의 대표사진만 교체합니다. 본문·제목·공개 상태는 유지하며, 이후 다른 사진으로 편집된 글은 건너뜁니다.</p>
      <CoverRevisionButton count={revisions.length} />
      <div className="grid gap-6 md:grid-cols-3">{revisions.map(r => <article className="overflow-hidden rounded-xl border border-border bg-white" key={r.slug}>
        <SmartImage path={r.after} alt={`${r.title} 원문 차량 사진`} className="aspect-video w-full" sizes="(max-width:768px) 100vw, 33vw" />
        <div className="space-y-3 p-5"><h2 className="font-bold">{r.title}</h2><a className="underline" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">원문 확인 ↗</a></div>
      </article>)}</div>
    </div>
  </AdminShell>;
}
