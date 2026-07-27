import Link from "next/link";
import type { Service } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  services: Service[];
};

export function Services({ services }: Props) {
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
            자동변속기와 디젤 클리닝을 중심으로, 필요한 정비를 정확하게 진행합니다.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((service) => (
            <article key={service.id} className="min-w-0 border-t border-border pt-5">
              {service.image_path ? (
                <SmartImage
                  path={service.image_path}
                  alt={service.title}
                  className="mb-4 aspect-[16/10] w-full rounded-[10px]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  fallbackLabel={service.title}
                />
              ) : null}
              <h3 className="text-xl font-black tracking-[-0.02em] text-charcoal">
                {service.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted">
                {service.short_description}
              </p>
              <Link
                href="/#contact"
                className="mt-4 inline-flex text-sm font-bold text-navy underline-offset-2 hover:underline"
              >
                상담·상세 문의
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
