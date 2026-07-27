import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Node, mergeAttributes } from "@tiptap/core";

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-variant") || "info",
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const variant = HTMLAttributes["data-variant"] || "info";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "callout",
        class: `editor-callout editor-callout-${variant}`,
      }),
      0,
    ];
  },
});

export const CtaButton = Node.create({
  name: "ctaButton",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      kind: {
        default: "phone",
        parseHTML: (el) => el.getAttribute("data-kind") || "phone",
        renderHTML: (attrs) => ({ "data-kind": attrs.kind }),
      },
      label: {
        default: "문의하기",
        parseHTML: (el) => el.getAttribute("data-label") || "문의하기",
        renderHTML: (attrs) => ({ "data-label": attrs.label }),
      },
      href: {
        default: "",
        parseHTML: (el) => el.getAttribute("href") || "",
        renderHTML: (attrs) => ({ href: attrs.href }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'a[data-type="cta-button"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const kind = HTMLAttributes["data-kind"] || "phone";
    const label = HTMLAttributes["data-label"] || "문의하기";
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-type": "cta-button",
        class: `editor-cta editor-cta-${kind}`,
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      label,
    ];
  },
});

export function createEditorExtensions(placeholder =
  "증상, 진단, 작업 과정을 자세히 작성해 주세요…") {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: "editor-link" },
    }),
    Image.configure({
      HTMLAttributes: { class: "editor-image" },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Placeholder.configure({ placeholder }),
    Youtube.configure({
      controls: true,
      modestBranding: true,
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Callout,
    CtaButton,
  ];
}
