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
  "iframe",
] as const;

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel", "title", "class", "data-type", "data-kind", "data-label"],
  img: [
    "src",
    "alt",
    "title",
    "class",
    "width",
    "height",
    "data-size",
    "data-align",
    "data-caption",
    "data-type",
    "data-variant",
    "data-kind",
    "data-label",
    "loading",
  ],
  div: ["class", "data-type", "data-variant", "data-kind", "data-label", "id"],
  span: ["class", "data-type", "data-variant", "data-kind", "data-label"],
  p: ["class", "id", "style"],
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
  iframe: [
    "src",
    "width",
    "height",
    "allow",
    "allowfullscreen",
    "frameborder",
    "title",
    "class",
    "loading",
  ],
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
    return /^(https?:|mailto:|tel:|\/|#)/i.test(trimmed);
  }
  return /^(https?:|\/)/i.test(trimmed);
}

function isSafeYoutubeEmbed(src: string): boolean {
  try {
    const url = new URL(src);
    const host = url.hostname.replace(/^www\./, "");
    return (
      (host === "youtube.com" ||
        host === "youtube-nocookie.com" ||
        host === "youtu.be") &&
      (url.pathname.startsWith("/embed/") || host === "youtu.be")
    );
  } catch {
    return false;
  }
}

export function sanitizeEditorHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  try {
    return sanitizeHtml(html, {
      allowedTags: [...ALLOWED_TAGS],
      allowedAttributes: ALLOWED_ATTRS,
      allowedSchemes: ["http", "https", "mailto", "tel"],
      allowedSchemesByTag: {
        img: ["http", "https"],
        a: ["http", "https", "mailto", "tel"],
        iframe: ["https"],
      },
      allowProtocolRelative: false,
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
          const next: Record<string, string> = {};
          for (const [key, value] of Object.entries(attribs)) {
            if (typeof value === "string") next[key] = value;
          }
          next.loading = attribs.loading || "lazy";
          return { tagName: "img", attribs: next };
        },
        iframe: (_tagName, attribs) => {
          const src = attribs.src || "";
          if (!isSafeYoutubeEmbed(src)) {
            return { tagName: "span", attribs: {} as Record<string, string> };
          }
          const next: Record<string, string> = {
            src,
            width: attribs.width || "560",
            height: attribs.height || "315",
            loading: "lazy",
            allowfullscreen: "true",
            allow:
              attribs.allow ||
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            title: attribs.title || "YouTube video",
            frameborder: attribs.frameborder || "0",
          };
          if (attribs.class) next.class = attribs.class;
          return { tagName: "iframe", attribs: next };
        },
      },
    });
  } catch (error) {
    console.error("[sanitizeEditorHtml] failed", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return stripToText(html);
  }
}
