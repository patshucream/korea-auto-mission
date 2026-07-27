import Link from "next/link";
import type { WorkCase } from "@/lib/types";
import { HOME_BRANDS } from "@/lib/homepage";

type Props = {
  works: WorkCase[];
};

function brandCount(works: WorkCase[], brand: string) {
  return works.filter((w) => {
    const b = `${w.manufacturer || ""} ${w.vehicle_brand || ""}`.toLowerCase();
    if (brand === "국산차") {
      const imported = [
        "bmw",
        "벤츠",
        "mercedes",
        "benz",
        "아우디",
        "audi",
        "폭스바겐",
        "volkswagen",
        "vw",
        "미니",
        "mini",
        "랜드로버",
        "land rover",
        "포르쉐",
        "porsche",
        "볼보",
        "volvo",
      ];
      return !imported.some((k) => b.includes(k));
    }
    if (brand === "벤츠") {
      return b.includes("벤츠") || b.includes("mercedes") || b.includes("benz");
    }
    if (brand === "폭스바겐") {
      return b.includes("폭스") || b.includes("volkswagen") || b.includes("vw");
    }
    return b.includes(brand.toLowerCase());
  }).length;
}

export function BrandStrip({ works }: Props) {
  return (
    <section className="section-pad bg-white">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">브랜드별 탐색</h2>
          <p className="section-lead">차종에 맞는 진단과 정비 사례를 찾아보세요.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {HOME_BRANDS.map((brand) => {
            const count = brandCount(works, brand);
            const href =
              brand === "국산차"
                ? "/works"
                : `/works?brand=${encodeURIComponent(brand)}`;
            return (
              <Link
                key={brand}
                href={href}
                className="min-h-20 rounded-[10px] border border-border px-4 py-5 transition hover:border-navy"
              >
                <p className="text-base font-black tracking-wide text-charcoal">{brand}</p>
                <p className="mt-2 text-sm text-muted">작업사례 {count}건</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
