import Link from "next/link";
import { getWorkServiceLabels } from "@/lib/works/services";
import { AdminShell } from "@/components/admin/AdminShell";
import { BlogImportButton } from "@/components/admin/BlogImportButton";
import { SmartImage } from "@/components/ui/SmartImage";
import { getPreparedBlogImports, isBlogImportPreview } from "@/lib/works/blog-imports";

export default function BlogImportsPage() {
  const imports = getPreparedBlogImports();
  const preview = isBlogImportPreview();
  return <AdminShell title="블로그 작업사례 가져오기" description="기존 블로그의 사진과 정비 기록을 홈페이지 형식으로 정리했습니다.">
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="mb-2 text-xl font-bold">정비 기록 10편 · 실제 사진 72장</h2>
        <p className="mb-5 text-sm leading-7 text-muted">원문의 사실을 바탕으로 증상, 진단, 작업 과정과 결과를 정리했습니다. 저장 후에는 기존 작업사례 편집기에서 수정할 수 있습니다.</p>
        <BlogImportButton />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {imports.map(({ source, work }) => <article key={work.id} className="overflow-hidden rounded-xl border border-border bg-white">
          <SmartImage path={work.representative_image_path} alt={work.title} className="aspect-video w-full" sizes="(max-width:768px) 100vw, 33vw" />
          <div className="space-y-3 p-5">
            <p className="text-xs font-bold text-muted">{getWorkServiceLabels(work).join(" · ")} · 사진 {source.photos.length}장</p>
            <h2 className="text-lg font-bold">{work.title}</h2>
            <p className="text-sm leading-6 text-muted">{work.excerpt}</p>
            {source.editorNote ? <p className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">확인 메모: {source.editorNote}</p> : null}
            <div className="flex flex-wrap gap-4 text-sm font-bold">
              {preview ? <Link className="underline" href={`/works/${work.slug}`}>홈페이지 미리보기</Link> : null}
              <a className="underline" href={source.url} target="_blank" rel="noopener noreferrer">블로그 원문 ↗</a>
            </div>
          </div>
        </article>)}
      </div>
    </div>
  </AdminShell>;
}
