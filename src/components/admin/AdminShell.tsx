import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/utils";

export async function AdminShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-warm-white px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-[14px] border border-border bg-white p-6">
          <h1 className="text-2xl font-black text-charcoal">관리자 설정 안내</h1>
          <p className="mt-3 leading-relaxed text-muted">
            Supabase 환경 변수가 설정되지 않았습니다. `.env.local`에 아래 값을 입력한 뒤
            개발 서버를 다시 시작해 주세요.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-dark-section-2 p-4 text-sm text-white">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000`}
          </pre>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-charcoal-soft">
            <li>Supabase 프로젝트를 생성합니다.</li>
            <li>
              SQL Editor에서 아래 마이그레이션을 <strong>순서대로</strong> 실행합니다.
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>`supabase/migrations/001_initial_schema.sql`</li>
                <li>`supabase/migrations/002_service_id_and_sort_order.sql`</li>
                <li>`supabase/migrations/003_business_hours.sql`</li>
              </ul>
            </li>
            <li>필요 시 `supabase/seed.sql`을 실행합니다. (이미 데이터가 있으면 건너뜁니다)</li>
            <li>Authentication → Users에서 관리자 이메일을 생성합니다.</li>
          </ol>
          <Link href="/" className="btn btn-secondary mt-6 inline-flex">
            홈페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const { user } = await requireAdmin();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-warm-white lg:flex">
      <AdminNav />
      <div className="flex-1">
        <header className="border-b border-border bg-white px-5 py-5 lg:px-8">
          <h1 className="text-2xl font-black text-charcoal">{title}</h1>
          {description ? <p className="mt-1 text-muted">{description}</p> : null}
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
