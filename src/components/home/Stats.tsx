import type { SiteSettings } from "@/lib/types";

type Props = {
  settings: SiteSettings;
};

export function Stats({ settings }: Props) {
  const items = [
    { label: "정비 경력", value: settings.stat_experience },
    { label: "전문 서비스", value: settings.stat_services },
    { label: "취급 브랜드", value: settings.stat_brands },
    { label: "누적 작업 경험", value: settings.stat_works },
  ];

  return (
    <section className="bg-dark-section text-white" aria-label="주요 수치">
      <div className="container-site py-10 md:py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="border-l-2 border-white/25 pl-4">
              <p className="text-sm font-medium text-white/70">{item.label}</p>
              <p className="mt-2 text-2xl font-black tracking-tight md:text-[1.7rem]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
