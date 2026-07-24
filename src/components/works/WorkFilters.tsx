"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { ServiceOption } from "@/lib/types";

type Props = {
  brands: string[];
  models: string[];
  services: ServiceOption[];
  /** @deprecated services 사용 */
  categories?: string[];
};

export function WorkFilters({ brands, models, services }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [model, setModel] = useState(searchParams.get("model") || "");
  const [service, setService] = useState(searchParams.get("service") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  const filteredModels = useMemo(() => {
    if (!brand) return models;
    return models;
  }, [brand, models]);

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
    });
  }

  function reset() {
    setQ("");
    setBrand("");
    setModel("");
    setService("");
    setSort("newest");
    startTransition(() => router.push("/works"));
  }

  return (
    <form
      className="card-light grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <div className="xl:col-span-2">
        <label htmlFor="q" className="admin-label">
          키워드 검색
        </label>
        <input
          id="q"
          className="admin-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="차량, 증상, 제목 검색"
        />
      </div>

      <div>
        <label htmlFor="brand" className="admin-label">
          차량 브랜드
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
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="model" className="admin-label">
          차량 모델
        </label>
        <select
          id="model"
          className="admin-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="">전체</option>
          {filteredModels.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="service" className="admin-label">
          정비 서비스
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
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "검색 중…" : "검색"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={reset}>
          필터 초기화
        </button>
      </div>
    </form>
  );
}
