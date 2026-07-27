import type { JSONContent } from "@tiptap/core";

export type WorkTemplateId =
  | "mission-repair"
  | "mission-oil"
  | "dpf"
  | "intake"
  | "injector"
  | "diagnosis"
  | "blank";

export type WorkTemplate = {
  id: WorkTemplateId;
  label: string;
  headings: string[];
};

export const WORK_TEMPLATES: WorkTemplate[] = [
  {
    id: "mission-repair",
    label: "미션수리",
    headings: [
      "입고 증상",
      "진단 결과",
      "고장 원인",
      "작업 과정",
      "교체 부품",
      "작업 결과",
      "정비사 안내",
      "자주 묻는 질문",
    ],
  },
  {
    id: "mission-oil",
    label: "미션오일",
    headings: ["증상 및 점검 배경", "오일 상태", "교환/보충 작업", "작업 후 확인", "정비사 안내"],
  },
  {
    id: "dpf",
    label: "DPF 클리닝",
    headings: ["경고등·증상", "진단 결과", "클리닝 작업", "재생·배출 확인", "정비사 안내"],
  },
  {
    id: "intake",
    label: "흡기 클리닝",
    headings: ["증상", "흡기 오염 상태", "클리닝 과정", "작업 결과", "정비사 안내"],
  },
  {
    id: "injector",
    label: "인젝터 클리닝",
    headings: ["증상", "인젝터 점검", "클리닝·시험", "작업 결과", "정비사 안내"],
  },
  {
    id: "diagnosis",
    label: "정밀진단",
    headings: ["상담 내용", "진단 항목", "진단 결과", "권장 정비", "안내 사항"],
  },
  {
    id: "blank",
    label: "빈 글",
    headings: [],
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
