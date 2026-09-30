import manifest from "@/lib/data/work-seo-revisions.json";

export type SeoRevision = (typeof manifest.entries)[number];
export type SeoCurrentRow = Record<string, unknown>;
export type SeoReviewStatus = "ready" | "keep" | "already-applied" | "conflict" | "unavailable" | "unselected" | "locked" | "saved" | "error";
export type SeoReviewResult = {
  slug: string; title: string; status: SeoReviewStatus; message: string;
  current?: { id: string; sourceUrl: string; description: string };
};
export type SeoRevisionRepository = {
  readBySlug: (slug: string) => Promise<SeoCurrentRow | null>;
  saveDescription: (row: SeoCurrentRow, description: string) => Promise<boolean>;
};
export function getWorkSeoManifest() { return manifest; }

function sameFields(row: SeoCurrentRow, expected: Record<string, unknown>) {
  return Object.entries(expected).every(([key, value]) => (row[key] ?? null) === (value ?? null));
}

/** The only writable field. Titles, body, URLs and publication are never in this payload. */
export function seoDescriptionPatch(revision: SeoRevision) {
  return { seo_description: revision.after.seo_description };
}

/** Predict published-row normalization in migration 006 without running the DB trigger.
 * PostgreSQL TRIM(text) removes ordinary spaces, not all JavaScript whitespace.
 * updated_at is intentionally excluded: a successful edit normally changes it.
 */
export function publicationNormalizationChanges(row: SeoCurrentRow): string[] {
  const changes: string[] = [];
  if (typeof row.published_at !== "string" || !row.published_at) changes.push("published_at");
  const manufacturer = row.manufacturer;
  const brand = row.vehicle_brand;
  if ((manufacturer !== null && typeof manufacturer !== "string") || (brand !== null && typeof brand !== "string")) {
    return [...changes, "manufacturer", "vehicle_brand"];
  }
  const trim = (value: string) => value.replace(/^ +| +$/g, "");
  let nextManufacturer = manufacturer;
  let nextBrand = brand;
  if ((nextManufacturer === null || trim(nextManufacturer) === "") && nextBrand !== null) nextManufacturer = nextBrand;
  if (nextManufacturer !== null && trim(nextManufacturer) !== "") nextBrand = nextManufacturer;
  if (nextManufacturer !== manufacturer) changes.push("manufacturer");
  if (nextBrand !== brand) changes.push("vehicle_brand");
  return changes;
}

export function reviewSeoRevision(revision: SeoRevision, row: SeoCurrentRow | null): SeoReviewResult {
  const result = (status: SeoReviewStatus, message: string): SeoReviewResult => ({
    slug: revision.slug, title: revision.before.title, status, message,
    ...(row ? { current: { id: String(row.id ?? ""), sourceUrl: String(row.naver_blog_url ?? ""), description: String(row.seo_description ?? "") } } : {}),
  });
  if (!row || typeof row.id !== "string" || !row.id || row.status !== "published" || row.is_published !== true || row.deleted_at) {
    return result("unavailable", "현재 공개된 사례를 확인하지 못했습니다. 적용하지 않습니다.");
  }
  // Snapshot UUIDs are not assumed to identify production rows. Exact slug/source/content do.
  if (row.slug !== revision.slug || row.naver_blog_url !== revision.sourceUrl) {
    return result("conflict", "현재 사례 주소 또는 원문 주소가 스냅샷과 다릅니다. 별도 대조 전 적용할 수 없습니다.");
  }
  const stable = { title: revision.before.title, seo_title: revision.before.seo_title, ...revision.evidence.workFields };
  if (!sameFields(row, stable)) return result("conflict", "제목 또는 근거 내용이 이후에 바뀌었습니다. 현재 편집을 유지합니다.");
  if (revision.decision === "keep") return result("keep", "기존 설명 유지 대상으로 변경하지 않습니다.");
  if (row.seo_description === revision.after.seo_description) return result("already-applied", "제안한 설명과 이미 같습니다. 다시 저장하지 않습니다.");
  if (!sameFields(row, revision.before)) return result("conflict", "현재 SEO 값이 예상 기존값과 다릅니다. 이후 편집을 유지합니다.");
  if (typeof row.updated_at !== "string" || !row.updated_at) return result("conflict", "수정 버전을 확인하지 못했습니다. 동시 편집 보호를 위해 적용하지 않습니다.");
  if (publicationNormalizationChanges(row).length) return result("conflict", "검색 설명 저장 시 발행일 또는 제조사·브랜드가 자동 보정될 수 있습니다. 해당 정보의 별도 검토 전 적용하지 않습니다.");
  return result("ready", "현재 공개 행·원문·예상 기존값이 일치합니다. 선택 적용 검토가 가능합니다.");
}

/** Preview is read-only; apply re-reads selected rows before a version-checked write. */
export async function runSeoRevisions(revisions: SeoRevision[], mode: "preview" | "apply", selectedSlugs: string[], repository: SeoRevisionRepository, applyEnabled: boolean): Promise<SeoReviewResult[]> {
  const selected = new Set(selectedSlugs);
  const results: SeoReviewResult[] = [];
  for (const revision of revisions) {
    const basic = { slug: revision.slug, title: revision.before.title };
    if (mode === "apply" && !selected.has(revision.slug)) {
      results.push({ ...basic, status: "unselected", message: "선택하지 않아 변경하지 않았습니다." }); continue;
    }
    if (mode === "apply" && !applyEnabled) {
      results.push({ ...basic, status: "locked", message: "운영 적용 승인이 반영되기 전에는 저장할 수 없습니다." }); continue;
    }
    try {
      const row = await repository.readBySlug(revision.slug);
      const review = reviewSeoRevision(revision, row);
      if (mode === "preview" || review.status !== "ready" || !row) { results.push(review); continue; }
      const saved = await repository.saveDescription(row, seoDescriptionPatch(revision).seo_description);
      results.push({ ...review, status: saved ? "saved" : "conflict", message: saved
        ? "선택한 검색 설명만 저장했습니다."
        : "검토 이후 행이 변경됐거나 저장되지 않았습니다. 다시 미리보기로 확인해 주세요." });
    } catch {
      results.push({ ...basic, status: "error", message: "조회 또는 저장 결과를 확인하지 못했습니다. 미리보기로 현재값을 다시 확인해 주세요." });
    }
  }
  return results;
}
