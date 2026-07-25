import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewsAdmin } from "@/components/admin/ReviewsAdmin";
import { getAdminReviews, getReviewStats } from "@/lib/data/content";

export default async function AdminReviewsPage() {
  const [reviews, stats] = await Promise.all([getAdminReviews(), getReviewStats()]);

  return (
    <AdminShell title="리뷰 관리" description="방문 후기 승인, 답변, 공개 상태를 관리합니다.">
      <ReviewsAdmin initialReviews={reviews} stats={stats} />
    </AdminShell>
  );
}
