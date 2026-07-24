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

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {ordered.map((item) => (
            <article key={item.id} className="card-light p-5">
              <h3 className="text-xl font-black text-charcoal">{item.title}</h3>
              <p className="mt-2 text-[1.02rem] leading-relaxed text-muted">
                {item.description}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 text-sm font-bold text-charcoal">작업 전</p>
                  <SmartImage
                    path={item.before_image_path}
                    alt={`${item.title} 작업 전`}
                    className="aspect-square w-full rounded-lg"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    fallbackLabel="작업 전"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-charcoal">작업 후</p>
                  <SmartImage
                    path={item.after_image_path}
                    alt={`${item.title} 작업 후`}
                    className="aspect-square w-full rounded-lg"
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
