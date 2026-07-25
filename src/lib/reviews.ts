import type { Review, ReviewStatus } from "@/lib/types";

export const REVIEW_STATUSES: ReviewStatus[] = [
  "pending",
  "approved",
  "hidden",
  "rejected",
];

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "승인 대기",
  approved: "공개",
  hidden: "숨김",
  rejected: "거절",
};

/** 김민수 → 김**, 이 → 이*, AB → A* */
export function maskAuthorName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "고객";
  if (trimmed.length === 1) return `${trimmed}*`;
  return `${trimmed[0]}${"*".repeat(Math.min(trimmed.length - 1, 2))}`;
}

export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .trim();
}

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return (
    typeof value === "string" &&
    (REVIEW_STATUSES as string[]).includes(value)
  );
}

export function mapReview(row: Record<string, unknown>): Review {
  const author =
    (typeof row.author_name === "string" && row.author_name.trim()) ||
    (typeof row.customer_name === "string" && row.customer_name.trim()) ||
    "고객";
  const vehicle =
    (typeof row.vehicle_name === "string" && row.vehicle_name.trim()) ||
    (typeof row.vehicle_info === "string" && row.vehicle_info.trim()) ||
    null;

  let status: ReviewStatus = "pending";
  if (isReviewStatus(row.status)) {
    status = row.status;
  } else if (row.is_published === true) {
    status = "approved";
  }

  return {
    id: String(row.id),
    author_name: author,
    vehicle_name: vehicle,
    customer_name: author,
    vehicle_info: vehicle ?? "",
    content: typeof row.content === "string" ? row.content : "",
    rating: typeof row.rating === "number" ? row.rating : Number(row.rating) || 5,
    status,
    admin_reply:
      typeof row.admin_reply === "string" && row.admin_reply.trim()
        ? row.admin_reply
        : null,
    password_hash: typeof row.password_hash === "string" ? row.password_hash : null,
    display_order: typeof row.display_order === "number" ? row.display_order : 0,
    is_published: status === "approved" || row.is_published === true,
    is_sample: Boolean(row.is_sample),
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : undefined,
    approved_at:
      typeof row.approved_at === "string" ? row.approved_at : null,
  };
}

export function averageRating(reviews: Pick<Review, "rating">[]): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
