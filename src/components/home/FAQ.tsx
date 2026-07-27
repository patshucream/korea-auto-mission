"use client";

import { useState } from "react";
import type { Faq } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  faqs: Faq[];
};

export function FAQ({ faqs }: Props) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <section className="section-pad bg-white">
      <div className="container-site">
        <h2 className="section-title">자주 묻는 질문</h2>
        <p className="section-lead">예약, 견적, 작업 기간 등 자주 묻는 내용을 모았습니다.</p>

        <div className="mt-10 space-y-3">
          {faqs.map((faq) => {
            const open = openId === faq.id;
            return (
              <div key={faq.id} className="card-light">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : faq.id)}
                >
                  <span className="text-lg font-bold text-charcoal">{faq.question}</span>
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-lg font-bold text-navy",
                      open && "bg-navy text-white",
                    )}
                    aria-hidden
                  >
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open ? (
                  <div className="border-t border-border px-5 py-4 text-[1.05rem] leading-relaxed text-charcoal-soft">
                    {faq.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
