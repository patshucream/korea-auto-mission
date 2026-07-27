import Link from "next/link";
import type { WorkCase } from "@/lib/types";
import { formatDateKo } from "@/lib/utils";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  works: WorkCase[];
};

export function LatestWorks({ works }: Props) {
  const items = works.slice(0, 6);

  return (
    <section id="works" className="section-pad bg-white">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">최근 작업사례</h2>
          <p className="section-lead">실제 입고·진단·정비 과정을 요약한 최근 공개 사례입니다.</p>
        </div>

        {items.length === 0 ? (
          <p className="mt-12 border border-border px-5 py-10 text-center text-muted">
            아직 등록된 작업사례가 없습니다.
          </p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((work) => {
              const vehicle = [
                work.manufacturer || work.vehicle_brand,
                work.vehicle_model,
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <article key={work.id} className="group min-w-0">
                  <Link href={`/works/${work.slug}`} className="block">
                    <SmartImage
                      path={work.representative_image_path}
                      alt={work.title}
                      className="aspect-[4/3] w-full rounded-[12px]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      fallbackLabel={vehicle || work.title}
                    />
                    <div className="mt-4">
                      <p className="truncate text-sm font-medium text-muted">
                        {vehicle}
                        {work.service_category ? ` · ${work.service_category}` : ""}
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-charcoal group-hover:opacity-70">
                        {work.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                        {work.excerpt || work.symptoms || work.work_summary}
                      </p>
                      <p className="mt-3 text-xs text-muted">
                        {formatDateKo(work.published_at || work.created_at)}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link href="/works" className="btn btn-secondary">
            전체 작업사례 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
