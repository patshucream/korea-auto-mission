import { getWorkServiceLabels, workMatchesService } from "@/lib/works/services";
import prepared from "@/lib/data/blog-drafts.json";
import type { PaginatedWorks, ServiceOption, WorkCase, WorksFilterParams } from "@/lib/types";

/** Prepared content is always a draft. Only the explicit local preview displays it. */
export function getPreparedBlogImports() {
  return prepared.map((entry) => ({
    source: entry.source,
    work: { ...entry.work, status: "draft" as const, is_published: false } satisfies WorkCase,
  }));
}

export function isBlogImportPreview(): boolean {
  return process.env.BLOG_IMPORT_PREVIEW === "1";
}

export function getBlogPreviewWorks(): WorkCase[] {
  if (!isBlogImportPreview()) return [];
  return getPreparedBlogImports().map(({ work }) => ({ ...work, noindex: true }));
}

export function isBlogPreviewWork(id: string): boolean {
  return getBlogPreviewWorks().some((work) => work.id === id);
}

/** Normalize both Naver permalink and PostView forms for duplicate detection. */
export function naverPostKey(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["blog.naver.com", "m.blog.naver.com"].includes(url.hostname)) return null;
    const pieces = url.pathname.split("/").filter(Boolean);
    const blog = url.searchParams.get("blogId") || pieces[0];
    const post = url.searchParams.get("logNo") || pieces[1];
    return blog && /^\d+$/.test(post || "") ? `${blog.toLowerCase()}:${post}` : null;
  } catch {
    return null;
  }
}

export function mergeBlogPreviewWorks(stored: WorkCase[]): WorkCase[] {
  const ids = new Set(stored.map((work) => work.id));
  const slugs = new Set(stored.map((work) => work.slug));
  const sources = new Set(stored.map((work) => naverPostKey(work.naver_blog_url)).filter(Boolean));
  const additions = getBlogPreviewWorks().filter((work) =>
    !ids.has(work.id) && !slugs.has(work.slug) && !sources.has(naverPostKey(work.naver_blog_url)),
  );
  return [...stored, ...additions].sort((a, b) =>
    new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime(),
  );
}

/** Preview uses one merged list so filtering, totals and pagination agree. */
export function paginateBlogPreview(
  all: WorkCase[],
  services: ServiceOption[],
  params: WorksFilterParams,
): PaginatedWorks {
  const page = Math.max(1, Math.floor(params.page || 1));
  const pageSize = Math.min(24, Math.max(1, Math.floor(params.pageSize || 12)));
  const query = params.q?.trim().toLocaleLowerCase();
  const serviceOptions = new Map(services.map((service) => [service.id, service]));
  for (const work of all) {
    if (work.service_id && !serviceOptions.has(work.service_id)) serviceOptions.set(work.service_id, { id: work.service_id, title: work.service_category });
  }
  const selectedService = params.service ? serviceOptions.get(params.service) : undefined;
  let items = all.filter((work) =>
    (!params.brand || work.vehicle_brand === params.brand) &&
    (!params.model || work.vehicle_model === params.model) &&
    (!params.service || (selectedService ? workMatchesService(work, selectedService) : work.service_id === params.service)) &&
    (params.service || !params.category || getWorkServiceLabels(work).includes(params.category)) &&
    (!query || [work.title, work.vehicle_brand, work.vehicle_model, work.symptoms, work.work_summary, ...(work.symptom_tags || [])].join(" ").toLocaleLowerCase().includes(query)),
  );
  items = items.sort((a, b) => {
    const difference = new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || b.created_at).getTime();
    return params.sort === "oldest" ? difference : -difference;
  });
  const total = items.length;
  const options = new Map(services.map((service) => [service.id, service]));
  for (const work of all) {
    if (work.service_id && !options.has(work.service_id)) {
      options.set(work.service_id, { id: work.service_id, title: work.service_category });
    }
  }
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    brands: [...new Set(all.map((work) => work.vehicle_brand).filter(Boolean))].sort(),
    models: [...new Set(all.map((work) => work.vehicle_model).filter(Boolean))].sort(),
    services: [...options.values()],
    categories: [...new Set(all.flatMap(getWorkServiceLabels))].sort(),
  };
}
