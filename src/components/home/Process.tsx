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
        <ol className="mt-12 grid gap-6 md:grid-cols-5">
          {steps.map((step, index) => (
            <li key={`${step.title}-${index}`} className="relative">
              <p className="text-sm font-black text-navy">0{index + 1}</p>
              <h3 className="mt-2 text-lg font-black text-charcoal">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
