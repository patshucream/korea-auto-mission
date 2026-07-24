export function Strength() {
  const items = [
    {
      label: "30 YEARS",
      title: "변속기 전문 경력",
    },
    {
      label: "IMPORT CARS",
      title: "수입차 진단·수리",
    },
    {
      label: "DIAGNOSIS",
      title: "증상에 맞춘 정밀 점검",
    },
  ] as const;

  return (
    <section id="strength" className="section-pad bg-white">
      <div className="container-site">
        <div className="grid gap-16 md:grid-cols-3 md:gap-10 lg:gap-20">
          {items.map((item) => (
            <div key={item.label} className="text-center md:text-left">
              <p className="text-[1.65rem] font-bold tracking-[0.06em] text-charcoal sm:text-[1.9rem] lg:text-[2.1rem]">
                {item.label}
              </p>
              <p className="mt-4 text-lg text-muted sm:text-xl">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
