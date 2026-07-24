import { AdminShell } from "@/components/admin/AdminShell";
import { ServicesAdmin } from "@/components/admin/ServicesAdmin";
import { getAdminServices } from "@/lib/data/content";

export default async function AdminServicesPage() {
  const services = await getAdminServices();

  return (
    <AdminShell
      title="정비 서비스"
      description="홈페이지에 표시되는 정비 서비스를 추가·수정·삭제하고 순서를 변경합니다."
    >
      <ServicesAdmin initialServices={services} />
    </AdminShell>
  );
}
