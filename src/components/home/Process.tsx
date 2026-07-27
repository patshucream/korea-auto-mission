import type { ProcessStep } from "@/lib/types";

type Props = {
  steps: ProcessStep[];
};

export function Process({ steps }: Props) {
  if (!steps.length) return null;

  return (
    <section id="process" className="section-pad bg-gray-100">
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 className="section-title">작업 진행 과정</h2>
          <p className="section-lead">상담부터 출고까지, 예측 가능한 흐름으로 안내합니다.</p>
        </div>

        <ol className="mt-12 hidden gap-0 md:grid md:grid-cols-5">
          {steps.map((step, index) => (
            <li key={`${step.title}-${index}`} className="relative px-3 first:pl-0 last:pr-0">
              {index < steps.length - 1 ? (
                <span
                  className="absolute left-[2.25rem] right-0 top-4 hidden h-px bg-border md:block"
                  aria-hidden
                />
              ) : null}
              <div className="relative z-[1] flex h-8 w-8 items-center justify-center rounded-full border border-navy bg-white text-xs font-black text-navy">
                {index + 1}
              </div>
              <h3 className="mt-4 text-lg font-black text-charcoal">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
            </li>
          ))}
        </ol>

        <ol className="mt-10 space-y-6 md:hidden">
          {steps.map((step, index) => (
            <li key={`m-${step.title}-${index}`} className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-black text-white">
                {index + 1}
              </div>
              <div>
                <h3 className="text-lg font-black text-charcoal">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
