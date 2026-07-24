import Link from "next/link";
import type { WorkCase } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatDateKo } from "@/lib/utils";

type Props = {
  work: WorkCase;
};

export function WorkCard({ work }: Props) {
  return (
    <article className="card-light flex h-full flex-col">
      <Link href={`/works/${work.slug}`} className="block">
        <SmartImage
          path={work.representative_image_path}
          alt={work.title}
          className="aspect-[16/10] w-full"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          fallbackLabel={`${work.vehicle_brand} ${work.vehicle_model}`}
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-bold text-navy">
          {work.vehicle_brand} {work.vehicle_model}
          {work.model_year ? ` · ${work.model_year}` : ""}
        </p>
        <h3 className="mt-2 text-xl font-black leading-snug text-charcoal">
          <Link href={`/works/${work.slug}`} className="hover:text-navy">
            {work.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm font-medium text-muted">{work.service_category}</p>
        <p className="mt-3 line-clamp-3 flex-1 text-[1.02rem] leading-relaxed text-charcoal-soft">
          {work.work_summary || work.symptoms}
        </p>
        <p className="mt-4 text-sm text-muted">{formatDateKo(work.published_at || work.created_at)}</p>
      </div>
    </article>
  );
}
