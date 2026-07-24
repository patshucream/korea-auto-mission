import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewsAdmin } from "@/components/admin/ReviewsAdmin";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { Review } from "@/lib/types";

export default async function AdminReviewsPage() {
  let reviews: Review[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await tryCreateClient();
    if (supabase) {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .order("display_order", { ascending: true });
      if (data) reviews = data as Review[];
    }
  }

  return (
    <AdminShell
      title="고객 후기"
      description="실제 후기만 게시하세요. 샘플은 기본 비공개입니다."
    >
      <ReviewsAdmin initialReviews={reviews} />
    </AdminShell>
  );
}
