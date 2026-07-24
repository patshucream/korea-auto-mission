import { AdminShell } from "@/components/admin/AdminShell";
import { GeneralSettingsForm } from "@/components/admin/GeneralSettingsForm";
import { getSiteSettings } from "@/lib/data/content";

export default async function AdminGeneralPage() {
  const settings = await getSiteSettings();

  return (
    <AdminShell title="기본 설정" description="연락처, 히어로, 주요 수치를 관리합니다.">
      <GeneralSettingsForm settings={settings} />
    </AdminShell>
  );
}
