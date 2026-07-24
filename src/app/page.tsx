import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { WhyUs } from "@/components/home/WhyUs";
import { Services } from "@/components/home/Services";
import { LatestWorks } from "@/components/home/LatestWorks";
import { BeforeAfterSection } from "@/components/home/BeforeAfter";
import { Process } from "@/components/home/Process";
import { Reviews } from "@/components/home/Reviews";
import { FAQ } from "@/components/home/FAQ";
import { Location } from "@/components/home/Location";
import { getHomepageData } from "@/lib/data/content";

export default async function HomePage() {
  const data = await getHomepageData();

  return (
    <>
      <Header settings={data.settings} />
      <main className="pb-mobile-bar">
        {data.errorMessage ? (
          <div className="bg-navy-soft px-4 py-3 text-center text-sm font-medium text-navy">
            {data.errorMessage}
          </div>
        ) : null}
        <Hero settings={data.settings} />
        <Stats settings={data.settings} />
        <WhyUs settings={data.settings} />
        <Services services={data.services} />
        <LatestWorks works={data.works} />
        <BeforeAfterSection items={data.beforeAfter} />
        <Process steps={data.settings.process_steps} />
        <Reviews reviews={data.reviews} />
        <FAQ faqs={data.faqs} />
        <Location settings={data.settings} />
      </main>
      <Footer settings={data.settings} />
      <MobileBottomBar settings={data.settings} />
    </>
  );
}
