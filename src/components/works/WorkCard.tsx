import Link from "next/link";
import { getWorkServiceLabels } from "@/lib/works/services";
import type { WorkCase } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatDateKo } from "@/lib/utils";
import s from "./WorkLibrary.module.css";

export function WorkCard({ work }: { work: WorkCase }) {
  const vehicle = [work.manufacturer || work.vehicle_brand, work.vehicle_model].filter(Boolean).join(" ");
  return <article className={s.card}>
    <Link href={`/works/${work.slug}`} className={s.cardLink}>
      <div className={s.imageWrap}><SmartImage path={work.representative_image_path} alt={work.title} className={s.cardImage} sizes="(max-width:700px) 100vw, (max-width:1280px) 50vw, 33vw" fallbackLabel={vehicle}/><span className={s.imageArrow} aria-hidden="true">↗</span></div>
      <div className={s.cardBody}>
        <p className={s.category}>{getWorkServiceLabels(work).join(" · ")}</p>
        <h3>{work.title}</h3>
        <p className={s.summary}>{work.symptoms || work.excerpt || work.work_summary}</p>
        <div className={s.cardMeta}><span>{vehicle}{work.mileage ? ` · ${work.mileage}` : ""}</span><time dateTime={work.published_at || work.created_at}>{formatDateKo(work.published_at || work.created_at)}</time></div>
        <span className={s.readMore}>사진과 작업 과정 보기 <span aria-hidden="true">↗</span></span>
      </div>
    </Link>
  </article>;
}
