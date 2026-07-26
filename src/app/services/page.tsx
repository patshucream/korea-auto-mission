import { redirect } from "next/navigation";

/** SEO·sitemap용 별칭 → 홈 정비 서비스 섹션 */
export default function ServicesAliasPage() {
  redirect("/#services");
}
