import Link from "next/link";
import { finderBrand, finderModel } from "@/lib/works/finder";
import s from "./CaseFinderLink.module.css";

type Props = { brand?: string; model?: string; category?: string; query?: string; label?: string; };
export function CaseFinderLink({ brand, model, category, query, label }: Props) {
  const params = new URLSearchParams();
  if (brand) params.set("brand", finderBrand(brand));
  if (model) params.set("model", finderModel(model));
  if (category) params.set("category", category);
  if (query) params.set("q", query);
  const vehicle = [finderBrand(brand || ""), finderModel(model || "")].filter(Boolean).join(" ");
  return <nav className={s.finder} aria-label="내 차와 비슷한 사례 찾기">
    <div><p className={s.title}>내 차와 비슷한 사례가 궁금하신가요?</p><p className={s.description}>{vehicle ? `${vehicle}의 다른 작업을 보거나, 내 차종과 증상으로 찾아보세요.` : `${label || category || "정비"} 사례에서 차종과 증상으로 좁혀보세요.`}</p></div>
    <div className={s.actions}><Link className={s.primary} href={`/works?${params}`}>{vehicle ? `${finderModel(model || brand || "")} 사례 찾기` : "내 차와 비슷한 사례 찾기"}<span aria-hidden="true">↗</span></Link><Link className={s.secondary} href="/works">다른 차종·증상 찾기 <span aria-hidden="true">↗</span></Link></div>
  </nav>;
}
