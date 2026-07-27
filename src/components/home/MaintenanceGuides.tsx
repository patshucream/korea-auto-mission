import Link from "next/link";
import type { WorkCase } from "@/lib/types";
import { HOME_GUIDE_TOPICS } from "@/lib/homepage";

type Props = {
  /** 공개 작업사례 — 가이드 링크 보강용 */
  works: WorkCase[];
};

export function MaintenanceGuides({ works }: Props) {
  const fromWorks = works
    .filter((w) => w.title && w.slug)
    .slice(0, 4)
    .map((w) => ({
      title: w.title,
      description: w.excerpt || w.work_summary || w.symptoms || "실제 작업사례 보기",
      href: `/works/${w.slug}`,
    }));

  const items = fromWorks.length >= 2 ? fromWorks : [...HOME_GUIDE_TOPICS];

  return (
    <section className="section-pad bg-gray-100">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">정비 정보</h2>
          <p className="section-lead">
            공개된 작업사례와 자주 찾는 주제를 바탕으로 점검 포인트를 안내합니다.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.href + item.title}
              href={item.href}
              className="rounded-[12px] border border-border bg-white px-5 py-5 transition hover:border-navy"
            >
              <h3 className="text-lg font-black text-charcoal">{item.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
