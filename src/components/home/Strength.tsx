export function Strength() {
  const items = [
    { label: "30 YEARS", title: "변속기 전문 경력" },
    { label: "IMPORT CARS", title: "수입차 진단·수리" },
    { label: "DIAGNOSIS", title: "증상에 맞춘 정밀 점검" },
  ] as const;

  return (
    <section id="strength" className="section-pad bg-white">
      <div className="container-site">
        <div className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-16">
          {items.map((item) => (
            <div key={item.label} className="min-w-0 text-center md:text-left">
              <p className="text-[1.45rem] font-bold tracking-[0.04em] text-charcoal break-keep sm:text-[1.75rem] lg:text-[1.95rem]">
                {item.label}
              </p>
              <p className="mt-3 text-base text-muted sm:mt-4 sm:text-lg">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
