import type { Service } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  services: Service[];
};

export function Services({ services }: Props) {
  if (!services.length) {
    return (
      <section id="services" className="section-pad bg-gray-100">
        <div className="container-site">
          <h2 className="section-title">정비 서비스</h2>
          <p className="section-lead">현재 등록된 정비 서비스가 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="section-pad bg-gray-100">
      <div className="container-site">
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-[0.16em] text-gray-500">SERVICES</p>
          <h2 className="section-title mt-3">정비 서비스</h2>
          <p className="section-lead">
            자동변속기와 구동계를 중심으로, 필요한 정비를 정확하게 진행합니다.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.id}
              className="overflow-hidden rounded-[12px] bg-white"
            >
              {service.image_path ? (
                <SmartImage
                  path={service.image_path}
                  alt={service.title}
                  className="aspect-[16/10] w-full"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  fallbackLabel={service.title}
                />
              ) : (
                <div className="flex aspect-[16/10] items-end bg-charcoal px-6 py-6">
                  <p className="text-lg font-semibold tracking-[-0.02em] text-white/90">
                    {service.title}
                  </p>
                </div>
              )}
              <div className="px-6 py-6">
                {service.image_path ? (
                  <h3 className="text-xl font-semibold tracking-[-0.02em] text-charcoal">
                    {service.title}
                  </h3>
                ) : null}
                <p
                  className={
                    service.image_path
                      ? "mt-3 text-[1.02rem] leading-relaxed text-muted"
                      : "text-[1.02rem] leading-relaxed text-muted"
                  }
                >
                  {service.short_description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
