"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { ServiceOption } from "@/lib/types";
import {
  HOME_BRANDS,
  WORKS_POPULAR_QUERIES,
  WORKS_QUICK_FILTERS,
} from "@/lib/homepage";

type Props = {
  brands: string[];
  models: string[];
  services: ServiceOption[];
};

export function WorkFilters({ brands, models, services }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [model, setModel] = useState(searchParams.get("model") || "");
  const [service, setService] = useState(searchParams.get("service") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  const brandOptions = useMemo(() => {
    const set = new Set([...brands, ...HOME_BRANDS.filter((b) => b !== "국산차")]);
    return [...set];
  }, [brands]);

  const activeCount = [q, brand, model, service].filter(Boolean).length;

  function apply(next?: {
    q?: string;
    brand?: string;
    model?: string;
    service?: string;
    sort?: string;
  }) {
    const params = new URLSearchParams();
    const values = {
      q: next?.q ?? q,
      brand: next?.brand ?? brand,
      model: next?.model ?? model,
      service: next?.service ?? service,
      sort: next?.sort ?? sort,
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    startTransition(() => {
      router.push(`/works?${params.toString()}`);
      setDrawerOpen(false);
    });
  }

  function reset() {
    setQ("");
    setBrand("");
    setModel("");
    setService("");
    setSort("newest");
    startTransition(() => {
      router.push("/works");
      setDrawerOpen(false);
    });
  }

  const filterForm = (
    <form
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <div className="xl:col-span-2">
        <label htmlFor="q" className="admin-label">
          검색 / 증상
        </label>
        <input
          id="q"
          className="admin-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="차량, 증상, 제목"
        />
      </div>
      <div>
        <label htmlFor="brand" className="admin-label">
          제조사
        </label>
        <select
          id="brand"
          className="admin-select"
          value={brand}
          onChange={(e) => {
            setBrand(e.target.value);
            setModel("");
          }}
        >
          <option value="">전체</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="model" className="admin-label">
          모델
        </label>
        <select
          id="model"
          className="admin-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="">전체</option>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="service" className="admin-label">
          서비스
        </label>
        <select
          id="service"
          className="admin-select"
          value={service}
          onChange={(e) => setService(e.target.value)}
        >
          <option value="">전체</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="sort" className="admin-label">
          정렬
        </label>
        <select
          id="sort"
          className="admin-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
        </select>
      </div>
      <div className="flex items-end gap-2 md:col-span-2 xl:col-span-6">
        <button type="submit" className="btn btn-primary min-h-11" disabled={pending}>
          {pending ? "검색 중…" : "검색"}
        </button>
        <button type="button" className="btn btn-ghost min-h-11" onClick={reset}>
          필터 초기화
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-muted">인기 검색어</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WORKS_POPULAR_QUERIES.map((term) => (
            <button
              key={term}
              type="button"
              className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-charcoal hover:border-navy"
              onClick={() => {
                setQ(term);
                apply({ q: term });
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-muted">제조사 바로가기</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {HOME_BRANDS.map((b) => (
            <Link
              key={b}
              href={b === "국산차" ? "/works" : `/works?brand=${encodeURIComponent(b)}`}
              className="min-h-11 rounded-[8px] border border-border px-4 py-2 text-sm font-bold text-charcoal hover:border-navy"
            >
              {b}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-muted">빠른 필터</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WORKS_QUICK_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              className="min-h-11 rounded-[8px] bg-navy px-4 text-sm font-bold text-white"
              onClick={() => {
                setQ(f.q);
                apply({ q: f.q });
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="md:hidden">
        <button
          type="button"
          className="btn btn-secondary min-h-11 w-full"
          onClick={() => setDrawerOpen(true)}
        >
          상세 필터{activeCount ? ` (${activeCount})` : ""}
        </button>
      </div>

      <div className="hidden border border-border bg-white p-5 md:block">{filterForm}</div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="필터 닫기"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[16px] bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-black text-navy">필터</p>
              <button
                type="button"
                className="btn btn-ghost min-h-10 text-sm"
                onClick={() => setDrawerOpen(false)}
              >
                닫기
              </button>
            </div>
            {filterForm}
          </div>
        </div>
      ) : null}
    </div>
  );
}
