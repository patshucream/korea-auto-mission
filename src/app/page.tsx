import { WorkshopHome } from "@/components/home/WorkshopHome";
import { getHomepageData, getReviewStats } from "@/lib/data/content";

export default async function HomePage() {
  const [data, reviewStats] = await Promise.all([
    getHomepageData(),
    getReviewStats(),
  ]);
  return <WorkshopHome data={data} reviewStats={reviewStats} />;
}
