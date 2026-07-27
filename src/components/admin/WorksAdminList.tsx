"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { WorkCase, WorkCaseStatus } from "@/lib/types";
import {
  bulkUpdateWorkStatus,
  deleteWorkCase,
  duplicateWorkCase,
  restoreWorkCase,
} from "@/lib/actions/admin";
import { getPublicImageUrl } from "@/lib/media";
import { formatDateKo } from "@/lib/utils";
import { AdminToast } from "@/components/admin/AdminToast";

type Props = {
  initialWorks: WorkCase[];
};

type StatusFilter = "all" | WorkCaseStatus;

export function WorksAdminList({ initialWorks }: Props) {
  const [works, setWorks] = useState(initialWorks);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState<"updated" | "views" | "published">("updated");
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [pending, startTransition] = useTransition();

  function showToast(message: string, type: "success" | "error" = "success") {
    setToastType(type);
    setToast(message);
  }

  const brands = useMemo(
    () =>
      [...new Set(works.map((w) => w.manufacturer || w.vehicle_brand).filter(Boolean))].sort(),
    [works],
  );

  const filtered = useMemo(() => {
    let list = [...works];
    if (status !== "all") {
      list = list.filter((w) => (w.status || (w.is_published ? "published" : "draft")) === status);
    } else {
      list = list.filter((w) => w.status !== "trash");
    }
    if (brand !== "all") {
      list = list.filter((w) => (w.manufacturer || w.vehicle_brand) === brand);
    }
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (w) =>
          w.title.toLowerCase().includes(query) ||
          (w.manufacturer || w.vehicle_brand).toLowerCase().includes(query) ||
          w.vehicle_model.toLowerCase().includes(query) ||
          w.service_category.toLowerCase().includes(query),
      );
    }
    list.sort((a, b) => {
      if (sort === "views") return (b.view_count || 0) - (a.view_count || 0);
      if (sort === "published") {
        return (
          new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
        );
      }
      return new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime();
    });
    return list;
  }, [works, q, status, brand, sort]);

  function statusLabel(work: WorkCase) {
    const s = work.status || (work.is_published ? "published" : "draft");
    const map: Record<string, string> = {
      draft: "임시저장",
      published: "공개",
      private: "비공개",
      scheduled: "예약발행",
      trash: "휴지통",
    };
    return map[s] || s;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <input
            className="admin-input"
            placeholder="제목, 차량, 서비스 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="all">상태 전체</option>
            <option value="draft">임시저장</option>
            <option value="published">공개</option>
            <option value="private">비공개</option>
            <option value="scheduled">예약발행</option>
            <option value="trash">휴지통</option>
          </select>
          <select className="admin-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="all">제조사 전체</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select className="admin-select" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="updated">최근 수정순</option>
            <option value="published">공개일순</option>
            <option value="views">조회수순</option>
          </select>
        </div>
        <Link href="/admin/works/new" className="btn btn-primary min-h-11">
          새 글 작성
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary min-h-11 text-sm"
          disabled={pending || !selected.length}
          onClick={() => {
            startTransition(async () => {
              const result = await bulkUpdateWorkStatus(selected, "published");
              if (!result.ok) {
                showToast(result.error, "error");
                return;
              }
              setWorks((prev) =>
                prev.map((w) =>
                  selected.includes(w.id)
                    ? { ...w, status: "published", is_published: true }
                    : w,
                ),
              );
              setSelected([]);
              showToast("선택한 글을 공개했습니다.");
            });
          }}
        >
          일괄 공개
        </button>
        <button
          type="button"
          className="btn btn-ghost min-h-11 text-sm"
          disabled={pending || !selected.length}
          onClick={() => {
            startTransition(async () => {
              const result = await bulkUpdateWorkStatus(selected, "private");
              if (!result.ok) {
                showToast(result.error, "error");
                return;
              }
              setWorks((prev) =>
                prev.map((w) =>
                  selected.includes(w.id)
                    ? { ...w, status: "private", is_published: false }
                    : w,
                ),
              );
              setSelected([]);
              showToast("선택한 글을 비공개로 변경했습니다.");
            });
          }}
        >
          일괄 비공개
        </button>
        <button
          type="button"
          className="btn btn-ghost min-h-11 text-sm text-danger"
          disabled={pending || !selected.length}
          onClick={() => {
            if (!window.confirm("선택한 글을 휴지통으로 이동할까요?")) return;
            startTransition(async () => {
              const result = await bulkUpdateWorkStatus(selected, "trash");
              if (!result.ok) {
                showToast(result.error, "error");
                return;
              }
              setWorks((prev) =>
                prev.map((w) =>
                  selected.includes(w.id) ? { ...w, status: "trash", is_published: false } : w,
                ),
              );
              setSelected([]);
              showToast("휴지통으로 이동했습니다.");
            });
          }}
        >
          일괄 삭제
        </button>
      </div>

      <div className="hidden overflow-x-auto rounded-[12px] border border-border bg-white md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((w) => selected.includes(w.id))}
                  onChange={(e) =>
                    setSelected(e.target.checked ? filtered.map((w) => w.id) : [])
                  }
                />
              </th>
              <th className="p-3">대표</th>
              <th className="p-3">제목</th>
              <th className="p-3">차량</th>
              <th className="p-3">서비스</th>
              <th className="p-3">상태</th>
              <th className="p-3">공개일</th>
              <th className="p-3">조회</th>
              <th className="p-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((work) => {
              const thumb = getPublicImageUrl(work.representative_image_path);
              return (
                <tr key={work.id} className="border-b border-border/70 align-middle">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(work.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, work.id]
                            : prev.filter((id) => id !== work.id),
                        )
                      }
                    />
                  </td>
                  <td className="p-3">
                    <div
                      className="h-12 w-16 rounded-md bg-gray-100 bg-cover bg-center"
                      style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
                    />
                  </td>
                  <td className="p-3 font-semibold">{work.title}</td>
                  <td className="p-3 text-muted">
                    {work.manufacturer || work.vehicle_brand} {work.vehicle_model}
                  </td>
                  <td className="p-3 text-muted">{work.service_category || "—"}</td>
                  <td className="p-3">{statusLabel(work)}</td>
                  <td className="p-3 text-muted">{formatDateKo(work.published_at)}</td>
                  <td className="p-3">{work.view_count ?? 0}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/works/${work.id}/edit`} className="font-bold text-navy underline-offset-2 hover:underline">
                        수정
                      </Link>
                      {work.is_published ? (
                        <Link href={`/works/${work.slug}`} target="_blank" className="font-bold text-muted underline-offset-2 hover:underline">
                          보기
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className="font-bold text-muted"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await duplicateWorkCase(work.id);
                            window.location.href = `/admin/works/${result.id}/edit`;
                          });
                        }}
                      >
                        복제
                      </button>
                      {work.status === "trash" ? (
                        <button
                          type="button"
                          className="font-bold text-navy"
                          disabled={pending}
                          onClick={() => {
                            startTransition(async () => {
                              const result = await restoreWorkCase(work.id);
                              if (!result.ok) {
                                showToast(result.error, "error");
                                return;
                              }
                              setWorks((prev) =>
                                prev.map((w) =>
                                  w.id === work.id
                                    ? { ...w, status: "draft", deleted_at: null }
                                    : w,
                                ),
                              );
                              showToast("복구되었습니다.");
                            });
                          }}
                        >
                          복구
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="font-bold text-danger"
                          disabled={pending}
                          onClick={() => {
                            if (!window.confirm("휴지통으로 이동할까요?")) return;
                            startTransition(async () => {
                              const result = await deleteWorkCase(work.id);
                              if (!result.ok) {
                                showToast(result.error, "error");
                                return;
                              }
                              setWorks((prev) =>
                                prev.map((w) =>
                                  w.id === work.id
                                    ? { ...w, status: "trash", is_published: false }
                                    : w,
                                ),
                              );
                              showToast("휴지통으로 이동했습니다.");
                            });
                          }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-muted">조건에 맞는 작업사례가 없습니다.</p>
        ) : null}
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((work) => (
          <article key={work.id} className="admin-card space-y-2">
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={selected.includes(work.id)}
                onChange={(e) =>
                  setSelected((prev) =>
                    e.target.checked ? [...prev, work.id] : prev.filter((id) => id !== work.id),
                  )
                }
              />
              {work.title}
            </label>
            <p className="text-sm text-muted">
              {work.manufacturer || work.vehicle_brand} {work.vehicle_model} · {statusLabel(work)}
            </p>
            <Link href={`/admin/works/${work.id}/edit`} className="btn btn-secondary min-h-11 w-full text-sm">
              수정
            </Link>
          </article>
        ))}
      </div>

      <AdminToast message={toast} type={toastType} onClose={() => setToast(null)} />
    </div>
  );
}
