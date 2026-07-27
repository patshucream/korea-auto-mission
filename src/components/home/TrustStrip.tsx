import type { HomepageTrustItem } from "@/lib/types";

type Props = {
  items: HomepageTrustItem[];
};

export function TrustStrip({ items }: Props) {
  if (!items.length) return null;

  return (
    <section className="section-pad bg-white">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">믿을 수 있는 정비 기준</h2>
          <p className="section-lead">숫자보다 현장에서 쌓인 진단 습관과 설명 방식을 보여 드립니다.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.title}
              className="border-t border-navy/20 pt-5"
            >
              <h3 className="text-lg font-black tracking-[-0.02em] text-charcoal">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
