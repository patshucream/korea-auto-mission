import type { SiteSettings, WorkCase } from "@/lib/types";
import { getBlogUrl } from "@/lib/utils";
import { SmartImage } from "@/components/ui/SmartImage";
import Link from "next/link";

type Props = {
  works: WorkCase[];
  settings: SiteSettings;
};

export function LatestWorks({ works, settings }: Props) {
  const blogUrl = getBlogUrl(settings);
  const items = works.slice(0, 3);

  return (
    <section id="works" className="section-pad bg-white">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">최근 작업 사례</h2>
          <p className="section-lead">실제 입고·진단·정비 과정을 요약한 최근 사례입니다.</p>
        </div>

        {items.length === 0 ? (
          <p className="mt-12 border border-border px-5 py-10 text-center text-muted">
            아직 등록된 작업사례가 없습니다.
          </p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
            {items.map((work) => {
              const vehicle = [work.vehicle_brand, work.vehicle_model]
                .filter(Boolean)
                .join(" ");
              return (
                <article key={work.id} className="group min-w-0">
                  <Link href={`/works/${work.slug}`} className="block">
                    <SmartImage
                      path={work.representative_image_path}
                      alt={work.title}
                      className="aspect-[4/3] w-full rounded-[12px]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      fallbackLabel={vehicle || work.title}
                    />
                    <div className="mt-5">
                      <p className="truncate text-sm font-medium text-gray-500">
                        {vehicle || work.service_category}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-charcoal group-hover:opacity-70">
                        {work.title}
                      </h3>
                      <p className="mt-3 line-clamp-2 text-base leading-relaxed text-muted">
                        {work.work_summary || work.symptoms}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <a
            href={blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            더 많은 작업 사례 보기
          </a>
        </div>
      </div>
    </section>
  );
}
