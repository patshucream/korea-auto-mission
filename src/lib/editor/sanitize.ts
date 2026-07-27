import sanitizeHtml from "sanitize-html";

/** TipTap/에디터 본문용 — jsdom 없는 서버 안전 sanitize */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "span",
  "figure",
  "figcaption",
] as const;

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel", "title", "class"],
  img: [
    "src",
    "alt",
    "title",
    "class",
    "width",
    "height",
    "data-size",
    "data-align",
    "data-type",
    "data-variant",
    "data-kind",
    "data-label",
  ],
  div: ["class", "data-type", "data-variant", "data-kind", "data-label", "id"],
  span: ["class", "data-type", "data-variant", "data-kind", "data-label"],
  p: ["class", "id"],
  h1: ["class", "id"],
  h2: ["class", "id"],
  h3: ["class", "id"],
  table: ["class"],
  thead: ["class"],
  tbody: ["class"],
  tr: ["class"],
  th: ["class", "colspan", "rowspan"],
  td: ["class", "colspan", "rowspan"],
  figure: ["class"],
  figcaption: ["class"],
  ul: ["class"],
  ol: ["class"],
  li: ["class"],
  blockquote: ["class"],
};

function stripToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSafeUrl(value: string | undefined, kind: "href" | "src"): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^javascript:/i.test(trimmed) || /^vbscript:/i.test(trimmed) || /^data:/i.test(trimmed)) {
    return false;
  }
  if (kind === "href") {
    return /^(https?:|mailto:|\/|#)/i.test(trimmed);
  }
  // img src: http(s) or site-relative / storage path
  return /^(https?:|\/)/i.test(trimmed);
}

export function sanitizeEditorHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  try {
    return sanitizeHtml(html, {
      allowedTags: [...ALLOWED_TAGS],
      // script / iframe / object / embed / form / style 은 allowlist에 없음 → 제거
      allowedAttributes: ALLOWED_ATTRS,
      allowedSchemes: ["http", "https", "mailto"],
      allowedSchemesByTag: {
        img: ["http", "https"],
        a: ["http", "https", "mailto"],
      },
      allowProtocolRelative: false,
      // on* 이벤트 속성은 allowlist 밖이라 자동 제거
      disallowedTagsMode: "discard",
      transformTags: {
        a: (_tagName, attribs) => {
          const href = attribs.href;
          if (!isSafeUrl(href, "href")) {
            const { href: _h, ...rest } = attribs;
            return { tagName: "a", attribs: rest };
          }
          const next = { ...attribs };
          if (next.target === "_blank") {
            next.rel = "noopener noreferrer";
          }
          return { tagName: "a", attribs: next };
        },
        img: (_tagName, attribs) => {
          if (!isSafeUrl(attribs.src, "src")) {
            return { tagName: "img", attribs: { alt: attribs.alt || "" } };
          }
          return { tagName: "img", attribs };
        },
      },
    });
  } catch (error) {
    console.error("[sanitizeEditorHtml] failed", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // 페이지 500 방지: 태그 제거한 텍스트 fallback
    return stripToText(html);
  }
}
