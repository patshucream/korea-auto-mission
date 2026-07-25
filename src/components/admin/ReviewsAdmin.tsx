"use client";

import { useMemo, useState, useTransition } from "react";
import type { Review, ReviewStatus } from "@/lib/types";
import {
  bulkUpdateReviewStatus,
  deleteReview,
  saveReviewReply,
  updateReviewStatus,
} from "@/lib/actions/admin";
import { REVIEW_STATUS_LABEL, maskAuthorName } from "@/lib/reviews";
import { formatDateKo } from "@/lib/utils";
import { AdminToast } from "@/components/admin/AdminToast";

type Props = {
  initialReviews: Review[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    hidden: number;
    rejected: number;
    averageRating: number;
  };
};

type Tab = "all" | ReviewStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "승인 대기" },
  { key: "approved", label: "공개" },
  { key: "hidden", label: "숨김" },
  { key: "rejected", label: "거절" },
];

export function ReviewsAdmin({ initialReviews, stats }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");
  const [rating, setRating] = useState<"all" | number>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<Review | null>(null);
  const [reply, setReply] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (tab !== "all") list = list.filter((r) => r.status === tab);
    if (rating !== "all") list = list.filter((r) => r.rating === rating);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.author_name.toLowerCase().includes(needle) ||
          r.content.toLowerCase().includes(needle) ||
          (r.vehicle_name || "").toLowerCase().includes(needle),
      );
    }
    list.sort((a, b) => {
      const at = new Date(a.created_at || 0).getTime();
      const bt = new Date(b.created_at || 0).getTime();
      return sort === "newest" ? bt - at : at - bt;
    });
    return list;
  }, [reviews, tab, rating, q, sort]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
  }

  function patchLocal(id: string, patch: Partial<Review>) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDetail((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }

  function runStatus(id: string, status: ReviewStatus) {
    startTransition(async () => {
      const result = await updateReviewStatus(id, status);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      patchLocal(id, {
        status,
        is_published: status === "approved",
        approved_at: status === "approved" ? new Date().toISOString() : null,
      });
      showToast(`${REVIEW_STATUS_LABEL[status]} 처리되었습니다.`);
    });
  }

  function runBulk(status: "approved" | "hidden") {
    if (!selected.length) {
      showToast("선택된 리뷰가 없습니다.", "error");
      return;
    }
    startTransition(async () => {
      const result = await bulkUpdateReviewStatus(selected, status);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      setReviews((prev) =>
        prev.map((r) =>
          selected.includes(r.id)
            ? {
                ...r,
                status,
                is_published: status === "approved",
                approved_at: status === "approved" ? new Date().toISOString() : r.approved_at,
              }
            : r,
        ),
      );
      setSelected([]);
      showToast(`선택한 ${selected.length}건을 ${REVIEW_STATUS_LABEL[status]} 처리했습니다.`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="승인 대기" value={stats.pending} />
        <StatCard label="공개 리뷰" value={stats.approved} />
        <StatCard label="평균 별점" value={stats.averageRating ? stats.averageRating.toFixed(1) : "—"} />
        <StatCard label="전체 리뷰" value={stats.total} />
      </div>

      <div className="admin-card space-y-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`min-h-11 rounded-[10px] px-3 text-sm font-semibold ${
                tab === t.key ? "bg-navy text-white" : "bg-gray-100 text-charcoal"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="admin-input"
            placeholder="이름 또는 내용 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="admin-select"
            value={rating === "all" ? "all" : String(rating)}
            onChange={(e) =>
              setRating(e.target.value === "all" ? "all" : Number(e.target.value))
            }
          >
            <option value="all">별점 전체</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}점
              </option>
            ))}
          </select>
          <select
            className="admin-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary text-sm"
            disabled={pending || !selected.length}
            onClick={() => runBulk("approved")}
          >
            선택 승인
          </button>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            disabled={pending || !selected.length}
            onClick={() => runBulk("hidden")}
          >
            선택 숨김
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="admin-card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-3 pr-2">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((r) => selected.includes(r.id))}
                  onChange={(e) =>
                    setSelected(e.target.checked ? filtered.map((r) => r.id) : [])
                  }
                  aria-label="전체 선택"
                />
              </th>
              <th className="py-3 pr-3 font-semibold">작성자</th>
              <th className="py-3 pr-3 font-semibold">차량</th>
              <th className="py-3 pr-3 font-semibold">별점</th>
              <th className="py-3 pr-3 font-semibold">내용</th>
              <th className="py-3 pr-3 font-semibold">상태</th>
              <th className="py-3 pr-3 font-semibold">작성일</th>
              <th className="py-3 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((review) => (
              <tr key={review.id} className="border-b border-border/70 align-top">
                <td className="py-3 pr-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(review.id)}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked
                          ? [...prev, review.id]
                          : prev.filter((id) => id !== review.id),
                      )
                    }
                    aria-label={`${review.author_name} 선택`}
                  />
                </td>
                <td className="py-3 pr-3 font-semibold">{review.author_name}</td>
                <td className="py-3 pr-3 text-muted">{review.vehicle_name || "—"}</td>
                <td className="py-3 pr-3">{review.rating}</td>
                <td className="max-w-[220px] py-3 pr-3 text-charcoal-soft">
                  {review.content.slice(0, 48)}
                  {review.content.length > 48 ? "…" : ""}
                </td>
                <td className="py-3 pr-3">
                  <StatusBadge status={review.status} />
                </td>
                <td className="py-3 pr-3 text-muted">{formatDateKo(review.created_at)}</td>
                <td className="py-3">
                  <button
                    type="button"
                    className="text-sm font-bold text-navy underline-offset-2 hover:underline"
                    onClick={() => {
                      setDetail(review);
                      setReply(review.admin_reply || "");
                    }}
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-muted">조건에 맞는 리뷰가 없습니다.</p>
        ) : null}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((review) => (
          <article key={review.id} className="admin-card space-y-3">
            <div className="flex items-start justify-between gap-2">
              <label className="flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={selected.includes(review.id)}
                  onChange={(e) =>
                    setSelected((prev) =>
                      e.target.checked
                        ? [...prev, review.id]
                        : prev.filter((id) => id !== review.id),
                    )
                  }
                />
                {review.author_name}
              </label>
              <StatusBadge status={review.status} />
            </div>
            <p className="text-sm text-muted">
              {review.vehicle_name || "차량 미입력"} · ★{review.rating} ·{" "}
              {formatDateKo(review.created_at)}
            </p>
            <p className="text-sm leading-relaxed text-charcoal-soft">
              {review.content.slice(0, 100)}
              {review.content.length > 100 ? "…" : ""}
            </p>
            <button
              type="button"
              className="btn btn-secondary min-h-11 w-full text-sm"
              onClick={() => {
                setDetail(review);
                setReply(review.admin_reply || "");
              }}
            >
              상세 보기
            </button>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="admin-card text-center text-muted">조건에 맞는 리뷰가 없습니다.</p>
        ) : null}
      </div>

      {detail ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="닫기"
            onClick={() => setDetail(null)}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[14px] bg-white p-5 sm:rounded-[14px] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-navy">리뷰 상세</h2>
                <p className="mt-1 text-sm text-muted">
                  {maskAuthorName(detail.author_name)} · {formatDateKo(detail.created_at)}
                </p>
              </div>
              <button
                type="button"
                className="min-h-11 min-w-11 rounded-[10px] border border-border"
                onClick={() => setDetail(null)}
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="font-bold">작성자:</span> {detail.author_name}
              </p>
              <p>
                <span className="font-bold">차량:</span> {detail.vehicle_name || "—"}
              </p>
              <p>
                <span className="font-bold">별점:</span> {detail.rating} / 5
              </p>
              <p>
                <span className="font-bold">상태:</span> {REVIEW_STATUS_LABEL[detail.status]}
              </p>
              <p className="rounded-[10px] bg-gray-100 p-3 leading-relaxed">{detail.content}</p>
            </div>

            <div className="mt-4">
              <label className="admin-label" htmlFor="admin-reply">
                관리자 답변
              </label>
              <textarea
                id="admin-reply"
                className="admin-textarea"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                disabled={pending}
              />
              <button
                type="button"
                className="btn btn-primary mt-2 min-h-11 text-sm"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await saveReviewReply(detail.id, reply);
                    if (!result.ok) {
                      showToast(result.error, "error");
                      return;
                    }
                    patchLocal(detail.id, { admin_reply: reply.trim() || null });
                    showToast("답변이 저장되었습니다.");
                  });
                }}
              >
                답변 저장
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn btn-primary min-h-11 text-sm"
                disabled={pending}
                onClick={() => runStatus(detail.id, "approved")}
              >
                승인
              </button>
              <button
                type="button"
                className="btn btn-secondary min-h-11 text-sm"
                disabled={pending}
                onClick={() => runStatus(detail.id, "hidden")}
              >
                숨김
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-11 text-sm"
                disabled={pending}
                onClick={() => runStatus(detail.id, "rejected")}
              >
                거절
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-11 text-sm text-danger"
                disabled={pending}
                onClick={() => setDeleteId(detail.id)}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="닫기"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-[14px] bg-white p-5">
            <h3 className="text-lg font-black text-navy">리뷰를 삭제할까요?</h3>
            <p className="mt-2 text-sm text-muted">삭제하면 복구할 수 없습니다.</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="btn btn-ghost min-h-11 flex-1"
                onClick={() => setDeleteId(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary min-h-11 flex-1"
                disabled={pending}
                onClick={() => {
                  const id = deleteId;
                  startTransition(async () => {
                    const result = await deleteReview(id);
                    if (!result.ok) {
                      showToast(result.error, "error");
                      return;
                    }
                    setReviews((prev) => prev.filter((r) => r.id !== id));
                    setDetail(null);
                    setDeleteId(null);
                    showToast("리뷰가 삭제되었습니다.");
                  });
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminToast
        message={toast?.message ?? null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-stat">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-navy">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const styles: Record<ReviewStatus, string> = {
    pending: "bg-admin-navy-soft text-navy",
    approved: "bg-emerald-50 text-emerald-800",
    hidden: "bg-gray-100 text-gray-700",
    rejected: "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
      {REVIEW_STATUS_LABEL[status]}
    </span>
  );
}
