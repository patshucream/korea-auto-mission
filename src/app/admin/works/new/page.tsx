import { AdminShell } from "@/components/admin/AdminShell";
import { WorkCaseEditor } from "@/components/admin/WorkCaseEditor";
import { getAllServiceOptions } from "@/lib/data/content";

export default async function AdminWorkNewPage() {
  const services = await getAllServiceOptions();

  return (
    <AdminShell title="작업사례 작성" description="리치 에디터로 정비 리포트를 작성합니다.">
      <WorkCaseEditor services={services} />
    </AdminShell>
  );
}
