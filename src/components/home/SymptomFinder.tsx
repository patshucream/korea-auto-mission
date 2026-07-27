import Link from "next/link";
import { HOME_SYMPTOM_CARDS } from "@/lib/homepage";

export function SymptomFinder() {
  return (
    <section className="section-pad bg-gray-100">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">증상별 빠른 찾기</h2>
          <p className="section-lead">비슷한 증상이 있다면 관련 작업사례부터 확인해 보세요.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {HOME_SYMPTOM_CARDS.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-[12px] border border-border bg-white px-4 py-5 text-center text-sm font-bold text-charcoal transition hover:border-navy hover:text-navy sm:text-base"
            >
              {card.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
