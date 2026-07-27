import type { SiteSettings } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  settings: SiteSettings;
};

const POINTS = [
  {
    title: "무조건 교환보다 원인 진단",
    body: "증상만 보고 부품을 바꾸지 않습니다. 점검으로 작업 범위를 먼저 좁힙니다.",
  },
  {
    title: "작업 전후 상태 설명",
    body: "왜 필요한 작업인지, 무엇을 확인했는지 이해할 수 있게 설명합니다.",
  },
  {
    title: "정비 과정 기록",
    body: "가능하면 작업 과정을 남겨 이후에도 참고할 수 있게 합니다.",
  },
  {
    title: "변속기 전문 경험",
    body: "수입차·국산차 자동변속기와 구동계를 중심으로 30년 현장 경험을 쌓았습니다.",
  },
];

export function WhyUs({ settings }: Props) {
  const imagePath = settings.shop_image_path || settings.hero_image_path;

  return (
    <section id="why" className="section-pad bg-white">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">{settings.why_title || "왜 코리아오토미션인가"}</h2>
          <p className="section-lead whitespace-pre-line">{settings.why_content}</p>
        </div>

        <div className="mt-14 space-y-14">
          {POINTS.map((point, index) => {
            const reverse = index % 2 === 1;
            return (
              <div
                key={point.title}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
                  reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div
                  className={`min-h-[220px] overflow-hidden rounded-[10px] bg-navy ${
                    imagePath ? "" : "flex items-end p-8"
                  }`}
                >
                  {imagePath ? (
                    <SmartImage
                      path={imagePath}
                      alt={point.title}
                      className="aspect-[16/10] w-full lg:aspect-[5/3]"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      fallbackLabel={point.title}
                    />
                  ) : (
                    <p className="text-2xl font-black tracking-[-0.03em] text-white/90">
                      0{index + 1}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-navy">
                    0{index + 1}
                  </p>
                  <h3 className="mt-3 text-2xl font-black tracking-[-0.02em] text-charcoal">
                    {point.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-muted">{point.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
