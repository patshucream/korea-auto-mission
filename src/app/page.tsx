import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { Hero } from "@/components/home/Hero";
import { Strength } from "@/components/home/Strength";
import { Services } from "@/components/home/Services";
import { LatestWorks } from "@/components/home/LatestWorks";
import { Reviews } from "@/components/home/Reviews";
import { ContactCTA } from "@/components/home/ContactCTA";
import { getHomepageData, getReviewStats } from "@/lib/data/content";

export default async function HomePage() {
  const [data, reviewStats] = await Promise.all([
    getHomepageData(),
    getReviewStats(),
  ]);

  return (
    <>
      <Header settings={data.settings} />
      <main className="pb-mobile-bar">
        <Hero settings={data.settings} />
        <Strength />
        <Services services={data.services} />
        <LatestWorks works={data.works} settings={data.settings} />
        <Reviews
          reviews={data.reviews}
          totalApproved={reviewStats.approved}
          average={reviewStats.averageRating}
        />
        <ContactCTA settings={data.settings} />
      </main>
      <Footer settings={data.settings} />
      <MobileBottomBar settings={data.settings} />
    </>
  );
}
