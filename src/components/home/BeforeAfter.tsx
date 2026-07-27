import type { BeforeAfter } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = {
  items: BeforeAfter[];
};

export function BeforeAfterSection({ items }: Props) {
  const ordered = ["injector", "intake"]
    .map((category) => items.find((item) => item.category === category))
    .filter((item): item is BeforeAfter => Boolean(item));

  return (
    <section className="section-pad bg-warm-white-2">
      <div className="container-site">
        <h2 className="section-title">작업 전후</h2>
        <p className="section-lead">
          인젝터 클리닝과 흡기 클리닝의 작업 전·후를 나란히 확인할 수 있습니다.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {ordered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-charcoal">{item.title}</h3>
              <p className="mt-2 text-[0.98rem] leading-relaxed text-muted">
                {item.description}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 text-[12px] font-semibold tracking-wide text-slate-500">작업 전</p>
                  <SmartImage
                    path={item.before_image_path}
                    alt={`${item.title} 작업 전`}
                    className="aspect-[16/10] w-full rounded-xl"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    fallbackLabel="작업 전"
                  />
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold tracking-wide text-slate-500">작업 후</p>
                  <SmartImage
                    path={item.after_image_path}
                    alt={`${item.title} 작업 후`}
                    className="aspect-[16/10] w-full rounded-xl"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    fallbackLabel="작업 후"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
