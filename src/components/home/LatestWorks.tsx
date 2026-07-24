import Link from "next/link";
import type { WorkCase } from "@/lib/types";
import { WorkCard } from "@/components/works/WorkCard";

type Props = {
  works: WorkCase[];
};

export function LatestWorks({ works }: Props) {
  return (
    <section id="works" className="section-pad bg-warm-white">
      <div className="container-site">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title">최근 작업사례</h2>
            <p className="section-lead">최신 게시 작업사례 6건을 확인하세요.</p>
          </div>
          <Link href="/works" className="btn btn-secondary self-start md:self-auto">
            전체 작업사례 보기
          </Link>
        </div>

        {works.length === 0 ? (
          <p className="mt-10 rounded-[12px] border border-border bg-white px-5 py-8 text-center text-muted">
            아직 등록된 작업사례가 없습니다.
          </p>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {works.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
