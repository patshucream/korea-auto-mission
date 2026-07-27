import type { HomepageTrustItem } from "@/lib/types";

type Props = {
  items: HomepageTrustItem[];
};

export function TrustStrip({ items }: Props) {
  if (!items.length) return null;

  return (
    <section id="strength" className="border-y border-border bg-white">
      <div className="container-site py-10 lg:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {items.map((item) => (
            <div key={item.title} className="min-w-0">
              <p className="text-2xl font-black tracking-[-0.03em] text-navy sm:text-[1.75rem]">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
