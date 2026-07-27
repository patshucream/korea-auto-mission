import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { SymptomFinder } from "@/components/home/SymptomFinder";
import { Services } from "@/components/home/Services";
import { WhyUs } from "@/components/home/WhyUs";
import { LatestWorks } from "@/components/home/LatestWorks";
import { BeforeAfterSection } from "@/components/home/BeforeAfter";
import { Process } from "@/components/home/Process";
import { BrandStrip } from "@/components/home/BrandStrip";
import { MaintenanceGuides } from "@/components/home/MaintenanceGuides";
import { Reviews } from "@/components/home/Reviews";
import { FAQ } from "@/components/home/FAQ";
import { Location } from "@/components/home/Location";
import { ContactCTA } from "@/components/home/ContactCTA";
import { getHomepageData, getReviewStats } from "@/lib/data/content";
import { getHomepageConfig, isSectionVisible } from "@/lib/homepage";
import type { HomepageSectionId, Service, WorkCase } from "@/lib/types";

export default async function HomePage() {
  const [data, reviewStats] = await Promise.all([
    getHomepageData(),
    getReviewStats(),
  ]);

  const config = getHomepageConfig(data.settings);
  const services = pickFeaturedServices(data.services, config.featured_service_ids);
  const works = pickFeaturedWorks(data.works, config.featured_work_ids);
  const hasGuides = works.some((w) => w.title && w.slug);
  const beforeAfterItems = data.beforeAfter.filter((item) => item.is_published !== false);

  const sections: Partial<Record<HomepageSectionId, React.ReactNode>> = {
    hero: <Hero settings={data.settings} />,
    trust: <TrustStrip items={config.trust_items} />,
    symptoms: <SymptomFinder />,
    services: <Services services={services} works={works} />,
    why: <WhyUs settings={data.settings} />,
    works: <LatestWorks works={works} />,
    beforeAfter: beforeAfterItems.length ? (
      <BeforeAfterSection items={beforeAfterItems} />
    ) : null,
    process: <Process steps={data.settings.process_steps} />,
    brands: <BrandStrip works={works} />,
    guides: hasGuides ? <MaintenanceGuides works={works} /> : null,
    reviews: (
      <Reviews
        reviews={data.reviews}
        totalApproved={reviewStats.approved}
        average={reviewStats.averageRating}
      />
    ),
    faq: <FAQ faqs={data.faqs} />,
    location: <Location settings={data.settings} />,
    cta: <ContactCTA settings={data.settings} config={config} />,
  };

  const order = config.section_order.length
    ? config.section_order
    : (Object.keys(sections) as HomepageSectionId[]);

  return (
    <>
      <Header settings={data.settings} />
      <main className="pb-mobile-bar">
        {order.map((id) => {
          if (!isSectionVisible(config, id)) return null;
          if (id === "guides" && !hasGuides) return null;
          const node = sections[id];
          return node ? <div key={id}>{node}</div> : null;
        })}
      </main>
      <Footer settings={data.settings} />
      <MobileBottomBar settings={data.settings} />
    </>
  );
}

function pickFeaturedServices(services: Service[], ids: string[]) {
  if (!ids.length) return services;
  const map = new Map(services.map((s) => [s.id, s]));
  const picked = ids.map((id) => map.get(id)).filter(Boolean) as Service[];
  return picked.length ? picked : services;
}

function pickFeaturedWorks(works: WorkCase[], ids: string[]) {
  if (!ids.length) return works;
  const map = new Map(works.map((w) => [w.id, w]));
  const picked = ids.map((id) => map.get(id)).filter(Boolean) as WorkCase[];
  return picked.length ? picked : works;
}
