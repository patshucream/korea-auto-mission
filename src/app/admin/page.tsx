import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_NAV } from "@/lib/defaults";

export default function AdminDashboardPage() {
  return (
    <AdminShell title="관리자 대시보드" description="홈페이지 콘텐츠를 관리합니다.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ADMIN_NAV.filter((item) => !item.href.includes("#")).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[12px] border border-border bg-white p-5 transition hover:border-navy"
          >
            <p className="text-lg font-black text-charcoal">{item.label}</p>
            <p className="mt-2 text-sm text-muted">바로가기</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
