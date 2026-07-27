export type MediaUsageInfo = {
  used: boolean;
  isRepresentative: boolean;
  isTemp: boolean;
  isBody: boolean;
  workTitles: string[];
  workIds: string[];
  usedIn: string[];
};

export type WorkCaseMediaSummary = {
  id: string;
  title: string;
  vehicle_brand: string;
  vehicle_model: string;
  service_category: string;
  representative_image_path: string | null;
  gallery_image_paths: string[];
  before_images: string[];
  after_images: string[];
  og_image_path: string | null;
  content_image_paths: string[];
  /** 대표 제외 본문·갤러리·전후·에디터 이미지 (중복 제거, 표시 순서) */
  body_image_paths: string[];
  all_image_paths: string[];
};

type WorkCaseImageRow = {
  id: string;
  title: string;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  service_category?: string | null;
  representative_image_path: string | null;
  gallery_image_paths: string[] | null;
  before_images: string[] | null;
  after_images: string[] | null;
  og_image_path?: string | null;
  content_html?: string | null;
  content_json?: unknown;
};

type SimplePathRow = { path: string | null; label: string };

/** TipTap/HTML·공개 URL에서 storage path 추출 */
export function extractImagePathsFromContent(
  contentHtml: string | null | undefined,
  contentJson: unknown,
): string[] {
  const found = new Set<string>();

  const push = (raw: string | null | undefined) => {
    if (!raw) return;
    let value = raw.trim();
    if (!value) return;
    const publicMarker = "/storage/v1/object/public/images/";
    const idx = value.indexOf(publicMarker);
    if (idx >= 0) value = value.slice(idx + publicMarker.length);
    value = value.replace(/^\/+/, "").split("?")[0];
    if (
      value.startsWith("works/") ||
      value.startsWith("shop/") ||
      value.startsWith("hero/") ||
      value.startsWith("services/") ||
      value.startsWith("before-after/") ||
      value.startsWith("reviews/") ||
      value.startsWith("brands/")
    ) {
      found.add(value);
    }
  };

  if (contentHtml) {
    for (const match of contentHtml.matchAll(/src=["']([^"']+)["']/gi)) {
      push(match[1]);
    }
  }

  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (obj.type === "image" && obj.attrs && typeof obj.attrs === "object") {
      const attrs = obj.attrs as Record<string, unknown>;
      if (typeof attrs.src === "string") push(attrs.src);
    }
    if (Array.isArray(obj.content)) walk(obj.content);
  };
  walk(contentJson);

  return [...found];
}

export function buildWorkCaseMediaSummaries(
  works: WorkCaseImageRow[],
): WorkCaseMediaSummary[] {
  return works.map((work) => {
    const contentPaths = extractImagePathsFromContent(work.content_html, work.content_json);
    const gallery = (work.gallery_image_paths || []).filter(Boolean);
    const before = (work.before_images || []).filter(Boolean);
    const after = (work.after_images || []).filter(Boolean);
    const representative = work.representative_image_path || null;
    const og = work.og_image_path || null;

    const bodyOrdered: string[] = [];
    const seen = new Set<string>();
    const addBody = (path: string | null | undefined) => {
      if (!path || seen.has(path) || path === representative) return;
      seen.add(path);
      bodyOrdered.push(path);
    };
    for (const p of gallery) addBody(p);
    for (const p of before) addBody(p);
    for (const p of after) addBody(p);
    for (const p of contentPaths) addBody(p);
    if (og) addBody(og);

    const all = new Set<string>();
    if (representative) all.add(representative);
    for (const p of bodyOrdered) all.add(p);

    return {
      id: work.id,
      title: work.title || "제목 없음",
      vehicle_brand: work.vehicle_brand || "",
      vehicle_model: work.vehicle_model || "",
      service_category: work.service_category || "",
      representative_image_path: representative,
      gallery_image_paths: gallery,
      before_images: before,
      after_images: after,
      og_image_path: og,
      content_image_paths: contentPaths,
      body_image_paths: bodyOrdered,
      all_image_paths: [...all],
    };
  });
}

export function workCaseDisplayTitle(work: WorkCaseMediaSummary) {
  const vehicle = [work.vehicle_brand, work.vehicle_model].filter(Boolean).join(" ").trim();
  if (vehicle && work.service_category) return `${vehicle} ${work.service_category}`;
  if (vehicle) return vehicle;
  return work.title;
}

export function buildMediaUsageMap(input: {
  works: WorkCaseImageRow[];
  servicePaths: SimplePathRow[];
  settingPaths: SimplePathRow[];
  beforeAfterPaths: SimplePathRow[];
}): Map<string, MediaUsageInfo> {
  const map = new Map<string, MediaUsageInfo>();

  function ensure(path: string): MediaUsageInfo {
    let info = map.get(path);
    if (!info) {
      info = {
        used: false,
        isRepresentative: false,
        isTemp: path.startsWith("works/temp/") || path === "works/temp",
        isBody: false,
        workTitles: [],
        workIds: [],
        usedIn: [],
      };
      map.set(path, info);
    }
    return info;
  }

  function mark(path: string | null | undefined, label: string) {
    if (!path) return;
    const info = ensure(path);
    info.used = true;
    if (!info.usedIn.includes(label)) info.usedIn.push(label);
  }

  for (const work of input.works) {
    const title = work.title || "제목 없음";
    const contentPaths = extractImagePathsFromContent(work.content_html, work.content_json);
    const touch = (
      path: string | null | undefined,
      role: string,
      opts?: { representative?: boolean; body?: boolean },
    ) => {
      if (!path) return;
      const info = ensure(path);
      info.used = true;
      if (!info.workIds.includes(work.id)) info.workIds.push(work.id);
      if (!info.workTitles.includes(title)) info.workTitles.push(title);
      if (!info.usedIn.includes(role)) info.usedIn.push(role);
      if (opts?.representative) info.isRepresentative = true;
      if (opts?.body) info.isBody = true;
    };

    touch(work.representative_image_path, "대표사진", { representative: true });
    for (const p of work.gallery_image_paths || []) touch(p, "갤러리", { body: true });
    for (const p of work.before_images || []) touch(p, "작업 전", { body: true });
    for (const p of work.after_images || []) touch(p, "작업 후", { body: true });
    for (const p of contentPaths) touch(p, "본문", { body: true });
    touch(work.og_image_path, "OG 이미지", { body: true });
  }

  for (const row of input.servicePaths) mark(row.path, row.label);
  for (const row of input.settingPaths) mark(row.path, row.label);
  for (const row of input.beforeAfterPaths) mark(row.path, row.label);

  return map;
}

export function getMediaUsage(
  map: Map<string, MediaUsageInfo>,
  path: string,
  folder: string,
): MediaUsageInfo {
  const fromMap = map.get(path);
  const isTemp =
    folder === "works/temp" ||
    folder.startsWith("works/temp/") ||
    path.startsWith("works/temp/");
  if (fromMap) {
    return { ...fromMap, isTemp: fromMap.isTemp || isTemp };
  }
  return {
    used: false,
    isRepresentative: false,
    isTemp,
    isBody: false,
    workTitles: [],
    workIds: [],
    usedIn: [],
  };
}

export function formatBytes(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** 대략적 압축률: 파일크기 / (가로×세로×3바이트 RGB) */
export function estimateCompressionRatio(
  sizeBytes: number | null | undefined,
  width: number | null | undefined,
  height: number | null | undefined,
) {
  if (!sizeBytes || !width || !height || width <= 0 || height <= 0) return null;
  const raw = width * height * 3;
  if (raw <= 0) return null;
  const ratio = sizeBytes / raw;
  return {
    percent: Math.min(100, Math.max(0.1, ratio * 100)),
    label: `${(ratio * 100).toFixed(1)}%`,
  };
}
