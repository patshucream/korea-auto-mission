import { redirect } from "next/navigation";

/** SEO·sitemap용 별칭 → 홈 전문성 섹션 */
export default function AboutAliasPage() {
  redirect("/#strength");
}
