import Link from "next/link";
import type { WorkCase } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatDateKo } from "@/lib/utils";

type Props = {
  work: WorkCase;
};

export function WorkCard({ work }: Props) {
  const vehicle = [work.manufacturer || work.vehicle_brand, work.vehicle_model]
    .filter(Boolean)
    .join(" ");
  const tags = [
    ...(work.symptom_tags || []).slice(0, 2),
    work.service_category ? work.service_category : "",
  ].filter(Boolean);

  return (
    <article className="flex h-full flex-col border-t border-border pt-5">
      <Link href={`/works/${work.slug}`} className="block">
        <SmartImage
          path={work.representative_image_path}
          alt={work.title}
          className="aspect-[16/10] w-full rounded-[10px]"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          fallbackLabel={vehicle || work.title}
        />
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-sm font-medium text-muted">
          {vehicle}
          {work.model_year ? ` · ${work.model_year}` : ""}
        </p>
        <h3 className="mt-2 text-xl font-black leading-snug tracking-[-0.02em] text-charcoal">
          <Link href={`/works/${work.slug}`} className="hover:opacity-70">
            {work.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-2 flex-1 text-[1.02rem] leading-relaxed text-muted">
          {work.excerpt || work.work_summary || work.symptoms}
        </p>
        {tags.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-border px-2 py-0.5 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
          <span>{formatDateKo(work.published_at || work.created_at)}</span>
          <span>조회 {work.view_count ?? 0}</span>
        </div>
        <Link
          href={`/works/${work.slug}`}
          className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-navy underline-offset-4 hover:underline"
        >
          상세보기
        </Link>
      </div>
    </article>
  );
}
