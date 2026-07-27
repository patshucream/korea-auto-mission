import type { JSONContent } from "@tiptap/core";

export type WorkTemplateId =
  | "mission-repair"
  | "mission-oil"
  | "transfer-case"
  | "differential"
  | "dpf"
  | "intake"
  | "injector"
  | "diagnosis"
  | "blank";

export type WorkTemplate = {
  id: WorkTemplateId;
  label: string;
  /** 제목 자리표시자 — 차량명이 있으면 앞에 붙임 */
  titleHint: string;
  excerptHint: string;
  headings: string[];
  reportDefaults: {
    symptoms?: string;
    diagnosis?: string;
    cause?: string;
    repair_process?: string;
    replaced_parts?: string;
    warranty_info?: string;
  };
  symptomTags: string[];
  generalTags: string[];
  seoTitleHint: string;
  seoDescriptionHint: string;
  serviceKeywords: string[];
};

export const WORK_TEMPLATES: WorkTemplate[] = [
  {
    id: "mission-repair",
    label: "미션 수리",
    titleHint: "자동변속기 수리",
    excerptHint: "변속 이상 증상을 점검하고 미션을 수리한 사례입니다.",
    headings: [
      "입고 증상",
      "진단 과정",
      "원인",
      "작업 과정",
      "교체 또는 수리 부품",
      "작업 결과",
      "정비사 안내",
    ],
    reportDefaults: {
      symptoms: "",
      diagnosis: "",
      cause: "",
      repair_process: "",
      replaced_parts: "",
      warranty_info: "",
    },
    symptomTags: ["변속충격", "미션경고등", "슬립"],
    generalTags: ["자동변속기", "미션수리"],
    seoTitleHint: "자동변속기 수리",
    seoDescriptionHint:
      "변속 충격·슬립 등 자동변속기 이상을 진단하고 수리한 코리아오토미션 작업사례입니다.",
    serviceKeywords: ["변속기", "미션", "자동변속"],
  },
  {
    id: "mission-oil",
    label: "미션오일",
    titleHint: "미션오일 교환",
    excerptHint: "미션오일 상태 점검 후 교환·보충을 진행한 사례입니다.",
    headings: [
      "입고 증상",
      "진단 과정",
      "오일 상태",
      "작업 과정",
      "작업 결과",
      "정비사 안내",
    ],
    reportDefaults: {},
    symptomTags: ["미션오일", "변속지연"],
    generalTags: ["미션오일"],
    seoTitleHint: "미션오일 교환",
    seoDescriptionHint:
      "미션오일 상태 점검과 교환 작업을 진행한 코리아오토미션 사례입니다.",
    serviceKeywords: ["미션오일", "오일"],
  },
  {
    id: "transfer-case",
    label: "트랜스퍼케이스",
    titleHint: "트랜스퍼케이스 수리",
    excerptHint: "사륜구동 이음·경고 증상을 점검하고 트랜스퍼케이스를 수리한 사례입니다.",
    headings: [
      "입고 증상",
      "진단 과정",
      "원인",
      "작업 과정",
      "교체 또는 수리 부품",
      "작업 결과",
      "정비사 안내",
    ],
    reportDefaults: {},
    symptomTags: ["트랜스퍼", "사륜구동", "이음"],
    generalTags: ["트랜스퍼케이스"],
    seoTitleHint: "트랜스퍼케이스 수리",
    seoDescriptionHint:
      "트랜스퍼케이스 이상 진단과 수리 과정을 정리한 코리아오토미션 작업사례입니다.",
    serviceKeywords: ["트랜스퍼"],
  },
  {
    id: "differential",
    label: "디퍼렌셜",
    titleHint: "디퍼렌셜 수리",
    excerptHint: "디퍼렌셜 소음·누유 증상을 점검하고 수리한 사례입니다.",
    headings: [
      "입고 증상",
      "진단 과정",
      "원인",
      "작업 과정",
      "교체 또는 수리 부품",
      "작업 결과",
      "정비사 안내",
    ],
    reportDefaults: {},
    symptomTags: ["디퍼렌셜", "차동", "소음"],
    generalTags: ["디퍼렌셜"],
    seoTitleHint: "디퍼렌셜 수리",
    seoDescriptionHint:
      "디퍼렌셜 이상 진단과 수리 과정을 정리한 코리아오토미션 작업사례입니다.",
    serviceKeywords: ["디퍼렌셜", "차동"],
  },
  {
    id: "dpf",
    label: "DPF 클리닝",
    titleHint: "DPF 클리닝",
    excerptHint: "DPF 경고등·출력 저하를 점검하고 클리닝을 진행한 사례입니다.",
    headings: [
      "입고 증상",
      "진단 과정",
      "원인",
      "작업 과정",
      "작업 결과",
      "정비사 안내",
    ],
    reportDefaults: {},
    symptomTags: ["DPF", "매연", "경고등"],
    generalTags: ["DPF클리닝"],
    seoTitleHint: "DPF 클리닝",
    seoDescriptionHint:
      "DPF 막힘·경고등 증상을 진단하고 클리닝한 코리아오토미션 사례입니다.",
    serviceKeywords: ["DPF"],
  },
  {
    id: "intake",
    label: "흡기 클리닝",
    titleHint: "흡기 클리닝",
    excerptHint: "흡기 계통 오염을 점검하고 클리닝을 진행한 사례입니다.",
    headings: [
      "입고 증상",
      "진단 과정",
      "흡기 오염 상태",
      "작업 과정",
      "작업 결과",
      "정비사 안내",
    ],
    reportDefaults: {},
    symptomTags: ["흡기", "출력저하"],
    generalTags: ["흡기클리닝"],
    seoTitleHint: "흡기 클리닝",
    seoDescriptionHint:
      "흡기 오염 진단과 클리닝 작업을 진행한 코리아오토미션 사례입니다.",
    serviceKeywords: ["흡기"],
  },
  {
    id: "injector",
    label: "인젝터 클리닝",
    titleHint: "인젝터 클리닝",
    excerptHint: "인젝터 이상을 점검하고 클리닝·시험을 진행한 사례입니다.",
    headings: [
      "입고 증상",
      "진단 과정",
      "인젝터 점검",
      "작업 과정",
      "작업 결과",
      "정비사 안내",
    ],
    reportDefaults: {},
    symptomTags: ["인젝터", "연비", "진동"],
    generalTags: ["인젝터클리닝"],
    seoTitleHint: "인젝터 클리닝",
    seoDescriptionHint:
      "인젝터 점검과 클리닝 작업을 진행한 코리아오토미션 사례입니다.",
    serviceKeywords: ["인젝터"],
  },
  {
    id: "diagnosis",
    label: "정밀진단",
    titleHint: "정밀진단",
    excerptHint: "증상 상담 후 정밀진단을 진행하고 점검 방향을 안내한 사례입니다.",
    headings: [
      "입고 증상",
      "진단 과정",
      "진단 결과",
      "권장 정비",
      "정비사 안내",
    ],
    reportDefaults: {},
    symptomTags: ["정밀진단"],
    generalTags: ["진단"],
    seoTitleHint: "정밀진단",
    seoDescriptionHint:
      "수입차·국산차 정밀진단 과정을 정리한 코리아오토미션 사례입니다.",
    serviceKeywords: ["진단"],
  },
  {
    id: "blank",
    label: "빈 글",
    titleHint: "",
    excerptHint: "",
    headings: [],
    reportDefaults: {},
    symptomTags: [],
    generalTags: [],
    seoTitleHint: "",
    seoDescriptionHint: "",
    serviceKeywords: [],
  },
];

export function templateToDoc(template: WorkTemplate): JSONContent {
  if (!template.headings.length) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  const content: JSONContent[] = [];
  for (const heading of template.headings) {
    content.push({
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: heading }],
    });
    content.push({ type: "paragraph" });
  }
  return { type: "doc", content };
}

export function isEditorDocEmpty(json: unknown): boolean {
  if (!json || typeof json !== "object") return true;
  const doc = json as JSONContent;
  const blocks = doc.content || [];
  if (!blocks.length) return true;
  return blocks.every((block) => {
    if (block.type === "paragraph") {
      const text = (block.content || [])
        .map((n) => (n.type === "text" ? n.text || "" : ""))
        .join("")
        .trim();
      return !text;
    }
    return false;
  });
}

/** 빈 값만 채움 — 기존 작성 내용 덮어쓰지 않음 */
export function fillIfEmpty(current: string, next: string): string {
  return current.trim() ? current : next;
}

export function mergeCommaTags(current: string, nextTags: string[]): string {
  const existing = current
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const merged = [...existing];
  for (const tag of nextTags) {
    if (tag && !merged.includes(tag)) merged.push(tag);
  }
  return merged.join(", ");
}

export function buildTemplateTitle(
  template: WorkTemplate,
  manufacturer: string,
  model: string,
): string {
  if (!template.titleHint) return "";
  const vehicle = [manufacturer.trim(), model.trim()].filter(Boolean).join(" ");
  return vehicle ? `${vehicle} ${template.titleHint}` : template.titleHint;
}

export function buildTemplateSeoTitle(
  template: WorkTemplate,
  manufacturer: string,
  model: string,
): string {
  if (!template.seoTitleHint) return "";
  const vehicle = [manufacturer.trim(), model.trim()].filter(Boolean).join(" ");
  const base = vehicle
    ? `${vehicle} ${template.seoTitleHint}`
    : template.seoTitleHint;
  return `${base} | 코리아오토미션`;
}

export function suggestServiceId(
  template: WorkTemplate,
  services: Array<{ id: string; title: string }>,
  currentId: string,
): string {
  if (currentId) return currentId;
  for (const keyword of template.serviceKeywords) {
    const found = services.find((s) => s.title.includes(keyword));
    if (found) return found.id;
  }
  return currentId;
}
