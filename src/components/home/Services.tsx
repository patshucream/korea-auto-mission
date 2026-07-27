import Link from "next/link";
import type { Service, WorkCase } from "@/lib/types";

type Props = {
  services: Service[];
  works: WorkCase[];
};

export function Services({ services, works }: Props) {
  const items = services.slice(0, 6);

  if (!items.length) {
    return (
      <section id="services" className="section-pad bg-white">
        <div className="container-site">
          <h2 className="section-title">주요 서비스</h2>
          <p className="section-lead">현재 등록된 정비 서비스가 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="section-pad bg-white">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">주요 서비스</h2>
          <p className="section-lead">
            자동변속기와 디젤 클리닝을 중심으로 필요한 정비를 정확하게 진행합니다.
          </p>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {items.map((service) => {
            const count = works.filter(
              (w) =>
                w.service_id === service.id ||
                w.service_category === service.title,
            ).length;
            return (
              <article key={service.id} className="border-t border-border pt-6">
                <h3 className="text-xl font-black tracking-[-0.02em] text-charcoal">
                  {service.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted">
                  {service.short_description}
                </p>
                <p className="mt-4 text-sm text-muted">
                  관련 작업사례 {count}건
                </p>
                <Link
                  href={`/works?service=${encodeURIComponent(service.id)}`}
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-navy underline-offset-4 hover:underline"
                >
                  상세보기 / 사례 보기
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
