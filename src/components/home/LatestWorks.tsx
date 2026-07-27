import Link from "next/link";
import type { WorkCase } from "@/lib/types";
import { formatDateKo } from "@/lib/utils";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  works: WorkCase[];
};

export function LatestWorks({ works }: Props) {
  const items = works.slice(0, 6);
  const featured = items[0];
  const rest = items.slice(1);

  return (
    <section id="works" className="section-pad bg-gray-100">
      <div className="container-site">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="section-title">실제 작업사례</h2>
            <p className="section-lead">진단과 정비 과정을 요약한 최근 공개 사례입니다.</p>
          </div>
          <Link href="/works" className="btn btn-secondary self-start sm:self-auto">
            전체 작업사례
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="mt-12 border border-border bg-white px-5 py-10 text-center text-muted">
            아직 등록된 작업사례가 없습니다.
          </p>
        ) : (
          <div className="mt-12 space-y-8">
            {featured ? (
              <FeaturedWork work={featured} />
            ) : null}
            {rest.length ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((work) => (
                  <WorkTeaser key={work.id} work={work} />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedWork({ work }: { work: WorkCase }) {
  const vehicle = [work.manufacturer || work.vehicle_brand, work.vehicle_model]
    .filter(Boolean)
    .join(" ");
  return (
    <article className="grid gap-6 overflow-hidden border border-border bg-white lg:grid-cols-2">
      <Link href={`/works/${work.slug}`} className="block">
        <SmartImage
          path={work.representative_image_path}
          alt={work.title}
          className="aspect-[16/11] w-full lg:h-full lg:min-h-[320px]"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          fallbackLabel={vehicle || work.title}
        />
      </Link>
      <div className="flex flex-col justify-center px-6 py-6 lg:pr-10">
        <p className="text-sm font-medium text-muted">
          {vehicle}
          {work.service_category ? ` · ${work.service_category}` : ""}
        </p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.02em] text-charcoal lg:text-[1.85rem]">
          <Link href={`/works/${work.slug}`} className="hover:opacity-70">
            {work.title}
          </Link>
        </h3>
        <p className="mt-4 line-clamp-3 text-base leading-relaxed text-muted">
          {work.excerpt || work.symptoms || work.work_summary}
        </p>
        <p className="mt-5 text-sm text-muted">
          {formatDateKo(work.published_at || work.created_at)}
        </p>
        <Link
          href={`/works/${work.slug}`}
          className="btn btn-primary mt-6 self-start"
        >
          상세보기
        </Link>
      </div>
    </article>
  );
}

function WorkTeaser({ work }: { work: WorkCase }) {
  const vehicle = [work.manufacturer || work.vehicle_brand, work.vehicle_model]
    .filter(Boolean)
    .join(" ");
  return (
    <article className="min-w-0">
      <Link href={`/works/${work.slug}`} className="block">
        <SmartImage
          path={work.representative_image_path}
          alt={work.title}
          className="aspect-[4/3] w-full rounded-[10px]"
          sizes="(max-width: 768px) 100vw, 33vw"
          fallbackLabel={vehicle || work.title}
        />
        <p className="mt-4 truncate text-sm text-muted">
          {vehicle}
          {work.service_category ? ` · ${work.service_category}` : ""}
        </p>
        <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-charcoal">
          {work.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {work.excerpt || work.symptoms || work.work_summary}
        </p>
        <p className="mt-3 text-xs text-muted">
          {formatDateKo(work.published_at || work.created_at)}
        </p>
      </Link>
    </article>
  );
}
