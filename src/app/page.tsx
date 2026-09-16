import { PremiumHome } from "@/components/home/PremiumHome";
import { getHomepageData, getReviewStats } from "@/lib/data/content";

export default async function HomePage() {
  const [data, reviewStats] = await Promise.all([
    getHomepageData(),
    getReviewStats(),
  ]);
  return <PremiumHome data={data} reviewStats={reviewStats} />;
}
