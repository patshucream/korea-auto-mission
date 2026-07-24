import type { SiteSettings } from "@/lib/types";

type Props = {
  settings: SiteSettings;
};

export function WhyUs({ settings }: Props) {
  const points = [
    "자동변속기·구동계 중심의 전문 정비",
    "증상만 보고 성급히 교체하지 않는 진단 우선",
    "수입차와 국산차를 함께 다루는 현장 경험",
    "점검부터 수리까지 한 곳에서 책임 안내",
  ];

  return (
    <section id="intro" className="section-pad bg-warm-white">
      <div className="container-site grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <h2 className="section-title">{settings.why_title}</h2>
          <p className="section-lead whitespace-pre-line">{settings.why_content}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {points.map((point) => (
            <li
              key={point}
              className="rounded-[12px] border border-border bg-white px-5 py-4 text-[1.02rem] font-bold text-charcoal"
            >
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
