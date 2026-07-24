import { AdminShell } from "@/components/admin/AdminShell";
import { SeoSettingsForm } from "@/components/admin/SeoSettingsForm";
import { getSiteSettings } from "@/lib/data/content";

export default async function AdminSeoPage() {
  const settings = await getSiteSettings();
  return (
    <AdminShell title="검색 노출 설정" description="SEO 제목, 설명, OG 이미지를 관리합니다.">
      <SeoSettingsForm settings={settings} />
    </AdminShell>
  );
}
