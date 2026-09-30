import { AdminShell } from "@/components/admin/AdminShell";
import { WorkSeoRevisionReview } from "@/components/admin/WorkSeoRevisionReview";
import { getWorkSeoManifest } from "@/lib/works/seo-revisions";

export const maxDuration = 60;
export default function WorkSeoRevisionsPage() {
  const manifest = getWorkSeoManifest();
  const entries = manifest.entries.map(entry => ({
    slug: entry.slug, sourceUrl: entry.sourceUrl, title: entry.before.title,
    before: entry.before.seo_description, after: entry.after.seo_description,
    reason: entry.reason, changed: entry.decision === "revise", publicObserved: entry.publicVerification.status === "observed",
  }));
  return <AdminShell title="작업사례 검색 설명 검토" description="현재값과 비교한 뒤 선택한 검색 설명만 적용합니다."><WorkSeoRevisionReview entries={entries} applyEnabled={manifest.applyEnabled}/></AdminShell>;
}
