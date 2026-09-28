import { WorkshopHome } from "@/components/home/WorkshopHome";
import { getHomepageData, getReviewStats } from "@/lib/data/content";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = { alternates: { canonical: SITE_URL } };

export default async function HomePage() {
  const [data, reviewStats] = await Promise.all([
    getHomepageData(),
    getReviewStats(),
  ]);
  return <WorkshopHome data={data} reviewStats={reviewStats} />;
}
