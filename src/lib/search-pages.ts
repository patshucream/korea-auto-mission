/** Keep search results and pagination on their own canonical page. */
export function listingSearchPage(
  path: string,
  params: Record<string, string | string[] | undefined>,
) {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const rawPage = Number(first(params.page) || 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const filtered = Object.entries(params).some(([key, value]) =>
    ["q", "brand", "model", "service", "category", "sort"].includes(key) && Boolean(first(value)),
  );
  return {
    page,
    filtered,
    canonicalPath: filtered || page === 1 ? path : `${path}?page=${page}`,
  };
}

/** Never submit drafts or URLs that declare a different canonical destination. */
export function isIndexableWork(row: {
  slug?: string | null;
  status?: string | null;
  noindex?: boolean | null;
  canonical_url?: string | null;
}, siteUrl: string) {
  if (!row.slug || row.noindex || (row.status && row.status !== "published")) return false;
  if (!row.canonical_url) return true;
  try {
    const canonical = new URL(row.canonical_url, siteUrl);
    const expected = new URL(`/works/${encodeURIComponent(row.slug)}`, siteUrl);
    return canonical.href === expected.href;
  } catch { return false; }
}
