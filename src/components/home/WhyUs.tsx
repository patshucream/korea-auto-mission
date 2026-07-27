import type { SiteSettings } from "@/lib/types";
import { getWhyPoints } from "@/lib/homepage";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  settings: SiteSettings;
};

export function WhyUs({ settings }: Props) {
  const points = getWhyPoints(settings);

  return (
    <section id="why" className="section-pad bg-white">
      <div className="container-site">
        <div className="max-w-xl">
          <h2 className="section-title">{settings.why_title || "왜 코리아오토미션인가"}</h2>
          <p className="section-lead mt-3 whitespace-pre-line">{settings.why_content}</p>
        </div>

        <div className="mt-10 space-y-10 md:mt-12 md:space-y-12 lg:space-y-14">
          {points.map((point, index) => {
            const reverse = index % 2 === 1;
            const hasImage = Boolean(point.image_path);
            const number = String(index + 1).padStart(2, "0");

            if (!hasImage) {
              return (
                <div key={point.id} className="max-w-2xl border-l border-navy/15 pl-5 md:pl-6">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-navy/70">
                    {number}
                  </p>
                  <h3 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.02em] text-charcoal md:text-[1.5rem]">
                    {point.title}
                  </h3>
                  <p className="mt-2 max-w-prose text-[0.98rem] leading-7 text-muted">
                    {point.body}
                  </p>
                </div>
              );
            }

            return (
              <div
                key={point.id}
                className={`grid items-center gap-6 md:gap-8 lg:grid-cols-2 lg:gap-12 ${
                  reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="overflow-hidden rounded-2xl bg-[#eef0f3]">
                  <SmartImage
                    path={point.image_path}
                    alt={point.title}
                    className="aspect-[16/10] w-full"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    objectPosition={point.object_position || "center"}
                    fallbackLabel={point.title}
                  />
                </div>

                <div className="lg:max-w-md lg:justify-self-start xl:max-w-lg">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-navy/70">
                    {number}
                  </p>
                  <h3 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.02em] text-charcoal md:text-[1.5rem]">
                    {point.title}
                  </h3>
                  <p className="mt-2.5 text-[0.98rem] leading-7 text-muted">{point.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
