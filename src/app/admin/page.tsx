import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminDashboardStats } from "@/lib/data/content";
import { REVIEW_STATUS_LABEL } from "@/lib/reviews";
import { formatDateKo } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <AdminShell title="대시보드" description="홈페이지 콘텐츠 현황을 한눈에 확인합니다.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="서비스" value={stats.services} href="/admin/services" />
        <Stat label="작업 사례" value={stats.works} href="/admin/works" />
        <Stat label="승인 대기 리뷰" value={stats.pendingReviews} href="/admin/reviews" />
        <Stat label="공개 리뷰" value={stats.approvedReviews} href="/admin/reviews" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/general" className="btn btn-primary min-h-11 text-sm">
          기본 정보 수정
        </Link>
        <Link href="/admin/works/new" className="btn btn-secondary min-h-11 text-sm">
          작업 사례 추가
        </Link>
        <Link href="/admin/reviews" className="btn btn-secondary min-h-11 text-sm">
          리뷰 관리
        </Link>
        <Link href="/admin/services" className="btn btn-ghost min-h-11 text-sm">
          서비스 관리
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="admin-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-navy">최근 작업 사례</h2>
            <Link href="/admin/works" className="text-sm font-semibold text-navy">
              전체 보기
            </Link>
          </div>
          {stats.recentWorks.length === 0 ? (
            <p className="text-sm text-muted">등록된 작업 사례가 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentWorks.map((work) => (
                <li key={work.id}>
                  <Link
                    href={`/admin/works/${work.id}`}
                    className="block rounded-[10px] border border-border px-3 py-3 hover:border-navy"
                  >
                    <p className="font-semibold text-charcoal">{work.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {work.is_published ? "공개" : "비공개"} · {formatDateKo(work.created_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-navy">최근 등록 리뷰</h2>
            <Link href="/admin/reviews" className="text-sm font-semibold text-navy">
              전체 보기
            </Link>
          </div>
          {stats.recentReviews.length === 0 ? (
            <p className="text-sm text-muted">등록된 리뷰가 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentReviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-[10px] border border-border px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-charcoal">{review.author_name}</p>
                    <span className="text-xs font-bold text-muted">
                      {REVIEW_STATUS_LABEL[review.status]}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-charcoal-soft">{review.content}</p>
                  <p className="mt-1 text-xs text-muted">{formatDateKo(review.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="admin-stat transition hover:border-navy">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 text-3xl font-black text-navy">{value}</p>
    </Link>
  );
}
