import { getHomepageConfig, isSectionVisible } from "@/lib/homepage";
import type { HomepageSectionId, SiteSettings } from "@/lib/types";

/** Only link to enabled homepage sections; standalone content remains reachable. */
export function getPublicNavigation(settings: SiteSettings) {
  const config = getHomepageConfig(settings);
  const enabled = (id: HomepageSectionId) =>
    config.section_order.includes(id) && isSectionVisible(config, id);
  return [
    ...(enabled("services")
      ? [{ href: "/services/diesel-cleaning", label: "디젤클리닝" }, { href: "/services/transmission", label: "미션수리" }, { href: "/services/electric-vehicle", label: "전기차 정비" }, { href: "/services/drivetrain", label: "4륜·구동계" }]
      : []),
    { href: "/works", label: "작업사례" },
    { href: "https://map.naver.com/p/search/코리아오토미션/place/11611827", label: "네이버 매장·후기" },
    ...(enabled("location")
      ? [{ href: "/#location", label: "오시는 길" }]
      : []),
  ];
}
