import { getHomepageConfig, isSectionVisible } from "@/lib/homepage";
import type { HomepageSectionId, SiteSettings } from "@/lib/types";
import { getBlogUrl } from "@/lib/utils";

/** Only link to enabled homepage sections; standalone content remains reachable. */
export function getPublicNavigation(settings: SiteSettings) {
  const config = getHomepageConfig(settings);
  const enabled = (id: HomepageSectionId) =>
    config.section_order.includes(id) && isSectionVisible(config, id);
  return [
    ...(enabled("why") ? [{ href: "/#why", label: "정비 철학" }] : []),
    ...(enabled("services")
      ? [{ href: "/#services", label: "정비 분야" }, { href: "/services/transmission", label: "미션수리" }, { href: "/services/diesel-cleaning", label: "디젤클리닝" }]
      : []),
    { href: "/works", label: "작업사례" },
    { href: "/reviews", label: "고객후기" },
    ...(enabled("location")
      ? [{ href: "/#location", label: "오시는 길" }]
      : []),
    { href: getBlogUrl(settings), label: "정비 블로그" },
  ];
}
