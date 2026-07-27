import { HOME_BRANDS } from "@/lib/homepage";

export function BrandStrip() {
  return (
    <section className="section-pad bg-white">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">주요 취급 브랜드</h2>
          <p className="section-lead">수입차 중심으로, 차종에 맞는 진단과 정비를 진행합니다.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HOME_BRANDS.map((brand) => (
            <div
              key={brand}
              className="rounded-[10px] border border-border px-4 py-5 text-center text-sm font-black tracking-wide text-charcoal"
            >
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
