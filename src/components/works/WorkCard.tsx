"use client";

import Link from "next/link";
import type { WorkCase } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatDateKo } from "@/lib/utils";
import { estimateReadingMinutes } from "@/lib/works/seo";

type Props = {
  work: WorkCase;
};

export function WorkCard({ work }: Props) {
  const vehicle = [work.manufacturer || work.vehicle_brand, work.vehicle_model]
    .filter(Boolean)
    .join(" ");
  const service = work.service_category || "";
  const symptoms = (work.symptom_tags || []).slice(0, 2);
  const summary = work.excerpt || work.work_summary || "";
  const minutes = estimateReadingMinutes(work);

  return (
    <article className="flex h-full flex-col">
      <Link href={`/works/${work.slug}`} className="group block">
        <SmartImage
          path={work.representative_image_path}
          alt={work.title}
          className="aspect-[16/9] w-full overflow-hidden rounded-[10px] bg-navy/5"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          fallbackLabel={vehicle || "코리아오토미션"}
        />
        <div className="mt-4 flex flex-1 flex-col">
          <p className="text-sm font-medium text-muted">
            {vehicle || "차량 정보"}
            {work.model_year ? ` · ${work.model_year}` : ""}
          </p>
          <h3 className="mt-2 line-clamp-2 text-[1.15rem] font-black leading-snug tracking-[-0.02em] text-charcoal group-hover:opacity-75">
            {work.title}
          </h3>
          {summary ? (
            <p className="mt-2 line-clamp-2 text-[0.98rem] leading-relaxed text-muted">
              {summary}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {service ? (
              <span className="rounded border border-navy/20 bg-navy/5 px-2 py-0.5 text-xs font-bold text-navy">
                {service}
              </span>
            ) : null}
            {symptoms.map((tag) => (
              <span
                key={tag}
                className="rounded border border-border px-2 py-0.5 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>{formatDateKo(work.published_at || work.created_at)}</span>
            <span>조회 {work.view_count ?? 0}</span>
            <span>약 {minutes}분</span>
          </div>
          <span className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-navy underline-offset-4 group-hover:underline">
            자세히 보기
          </span>
        </div>
      </Link>
    </article>
  );
}
