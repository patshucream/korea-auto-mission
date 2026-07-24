import type { Service } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  services: Service[];
};

export function Services({ services }: Props) {
  if (!services.length) {
    return (
      <section id="services" className="section-pad bg-warm-white-2">
        <div className="container-site">
          <h2 className="section-title">정비 서비스</h2>
          <p className="section-lead">
            현재 등록된 정비 서비스가 없습니다. 잠시 후 다시 확인해 주세요.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="section-pad bg-warm-white-2">
      <div className="container-site">
        <h2 className="section-title">정비 서비스</h2>
        <p className="section-lead">
          자동변속기와 구동계를 중심으로, 클리닝 작업까지 체계적으로 진행합니다.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article key={service.id} className="card-light flex h-full flex-col">
              <SmartImage
                path={service.image_path}
                alt={service.title}
                className="aspect-[16/10] w-full"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                fallbackLabel={service.title}
              />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-black text-charcoal">{service.title}</h3>
                <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">
                  {service.short_description}
                </p>
                <p className="mt-3 text-[0.98rem] leading-relaxed text-charcoal-soft">
                  {service.detailed_description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
