"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { WorkCase } from "@/lib/types";
import { deleteWorkCase, duplicateWorkCase, reorderWorkCases } from "@/lib/actions/admin";

type Props = {
  initialWorks: WorkCase[];
};

export function WorksAdminList({ initialWorks }: Props) {
  const [works, setWorks] = useState(initialWorks);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return works;
    return works.filter(
      (w) =>
        w.title.toLowerCase().includes(query) ||
        w.vehicle_brand.toLowerCase().includes(query) ||
        w.vehicle_model.toLowerCase().includes(query) ||
        w.service_category.toLowerCase().includes(query),
    );
  }, [works, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="admin-input max-w-md"
          placeholder="제목, 브랜드, 모델, 서비스 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Link href="/admin/works/new" className="btn btn-primary">
          작업사례 추가
        </Link>
      </div>

      {message ? <p className="font-medium text-navy">{message}</p> : null}

      <div className="space-y-3">
        {filtered.map((work, index) => (
          <div key={work.id} className="card-light p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-black text-charcoal">{work.title}</p>
                <p className="text-sm text-muted">
                  {work.vehicle_brand} {work.vehicle_model} · {work.service_category} ·{" "}
                  {work.is_published ? "게시" : "임시저장"}
                  {work.is_featured ? " · 추천" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 text-sm"
                  onClick={() => {
                    if (index === 0) return;
                    const next = [...works];
                    const from = works.findIndex((w) => w.id === work.id);
                    if (from <= 0) return;
                    [next[from - 1], next[from]] = [next[from], next[from - 1]];
                    setWorks(next);
                  }}
                >
                  위로
                </button>
                <Link href={`/admin/works/${work.id}`} className="btn btn-secondary min-h-10 text-sm">
                  수정
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 text-sm"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await duplicateWorkCase(work.id);
                      setMessage("복제되었습니다.");
                      window.location.href = `/admin/works/${result.id}`;
                    });
                  }}
                >
                  복제
                </button>
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 text-sm"
                  onClick={() => {
                    if (!confirm("이 작업사례를 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
                    startTransition(async () => {
                      await deleteWorkCase(work.id);
                      setWorks((prev) => prev.filter((w) => w.id !== work.id));
                      setMessage("삭제되었습니다.");
                    });
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-ghost"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await reorderWorkCases(works.map((w) => w.id));
            setMessage("표시 순서가 저장되었습니다.");
          });
        }}
      >
        현재 목록 순서 저장
      </button>
    </div>
  );
}
