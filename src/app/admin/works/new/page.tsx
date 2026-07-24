import { AdminShell } from "@/components/admin/AdminShell";
import { WorkCaseForm } from "@/components/admin/WorkCaseForm";
import { getAllServiceOptions } from "@/lib/data/content";

export default async function AdminWorkNewPage() {
  const services = await getAllServiceOptions();

  return (
    <AdminShell title="작업사례 추가" description="새 작업사례를 등록합니다.">
      <WorkCaseForm services={services} />
    </AdminShell>
  );
}
