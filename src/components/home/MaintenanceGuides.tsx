import Link from "next/link";
import type { WorkCase } from "@/lib/types";

type Props = {
  /** 공개 작업사례 — 정비정보 섹션용. 없으면 섹션 숨김 */
  works: WorkCase[];
};

/**
 * 전용 정비정보 콘텐츠 타입이 생기기 전까지는
 * 공개 작업사례가 있을 때만 최신 글을 안내합니다.
 * 하드코딩 더미 콘텐츠는 표시하지 않습니다.
 */
export function MaintenanceGuides({ works }: Props) {
  const items = works.filter((w) => w.title && w.slug).slice(0, 4);
  if (!items.length) return null;

  return (
    <section id="guides" className="section-pad bg-gray-100">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">정비정보</h2>
          <p className="section-lead">
            실제 작업사례를 바탕으로 점검 포인트와 정비 흐름을 확인할 수 있습니다.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/works/${item.slug}`}
              className="rounded-[10px] border border-border bg-white px-5 py-5 transition hover:border-navy"
            >
              <h3 className="text-lg font-black text-charcoal">{item.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                {item.excerpt || item.work_summary || item.symptoms}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
