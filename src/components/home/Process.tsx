import type { ProcessStep } from "@/lib/types";

type Props = {
  steps: ProcessStep[];
};

export function Process({ steps }: Props) {
  return (
    <section id="process" className="section-pad bg-dark-section text-white">
      <div className="container-site">
        <h2 className="text-[clamp(1.6rem,2.2vw,2.25rem)] font-bold tracking-tight">
          작업 과정
        </h2>
        <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-white/80">
          상담부터 출고까지, 고객이 이해할 수 있도록 단계별로 진행합니다.
        </p>

        <ol className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={`${step.title}-${index}`}
              className="rounded-[12px] border border-white/15 bg-white/5 p-5"
            >
              <p className="text-sm font-bold text-white/60">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-xl font-black">{step.title}</h3>
              <p className="mt-3 text-[1.02rem] leading-relaxed text-white/85">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
