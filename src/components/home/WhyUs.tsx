import type { SiteSettings } from "@/lib/types";

type Props = {
  settings: SiteSettings;
};

const POINTS = [
  {
    title: "무조건 교환보다 원인 진단",
    body: "증상만 보고 부품을 바꾸지 않습니다. 점검으로 범위를 먼저 좁힙니다.",
  },
  {
    title: "정비 전후 상태 설명",
    body: "왜 필요한 작업인지, 무엇을 확인했는지 고객이 이해하도록 설명합니다.",
  },
  {
    title: "작업 사진과 과정 기록",
    body: "가능하면 작업 과정을 남겨 이후에도 참고할 수 있게 합니다.",
  },
  {
    title: "변속기 전문 경험",
    body: "수입차·국산차 자동변속기와 구동계를 중심으로 30년 현장 경험을 쌓았습니다.",
  },
];

export function WhyUs({ settings }: Props) {
  return (
    <section id="why" className="section-pad bg-gray-100">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">{settings.why_title || "왜 코리아오토미션인가"}</h2>
          <p className="section-lead whitespace-pre-line">
            {settings.why_content}
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {POINTS.map((point, index) => (
            <article
              key={point.title}
              className={`flex flex-col justify-end rounded-[12px] bg-white p-6 ${
                index % 2 === 1 ? "md:mt-8" : ""
              }`}
            >
              <p className="text-xs font-bold tracking-[0.12em] text-navy">
                0{index + 1}
              </p>
              <h3 className="mt-3 text-xl font-black text-charcoal">{point.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted">{point.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
