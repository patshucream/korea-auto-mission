import { redirect } from "next/navigation";

/** SEO·sitemap용 별칭 → 홈 상담·예약 섹션 */
export default function ContactAliasPage() {
  redirect("/#contact");
}
