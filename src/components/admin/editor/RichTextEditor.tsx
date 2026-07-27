"use client";

import { useCallback, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { createEditorExtensions } from "@/lib/editor/extensions";
import { uploadImageToStorage } from "@/lib/image";

type Props = {
  valueJson?: unknown | null;
  onChange: (json: unknown, html: string) => void;
  folder?: string;
  editable?: boolean;
};

export function RichTextEditor({
  valueJson,
  onChange,
  folder = "works/temp",
  editable = true,
}: Props) {
  const uploading = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: createEditorExtensions(),
    content: (valueJson as object) || { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON(), ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose-ko min-h-[320px] max-w-none px-4 py-3 focus:outline-none text-charcoal",
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length || !editor) return false;
        const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!images.length) return false;
        event.preventDefault();
        void uploadImages(images);
        return true;
      },
    },
  });

  const uploadImages = useCallback(
    async (files: File[]) => {
      if (!editor || uploading.current) return;
      uploading.current = true;
      try {
        for (const file of files) {
          const { publicUrl } = await uploadImageToStorage(file, folder);
          editor
            .chain()
            .focus()
            .setImage({ src: publicUrl, alt: file.name.replace(/\.[^.]+$/, "") })
            .run();
        }
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
      } finally {
        uploading.current = false;
      }
    },
    [editor, folder],
  );

  if (!editor) {
    return (
      <div className="min-h-[360px] rounded-[12px] border border-border bg-white p-4 text-sm text-muted">
        에디터 로딩 중…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-white">
      {editable ? (
        <div className="flex flex-wrap gap-1 border-b border-border bg-gray-50 p-2">
          <ToolbarBtn
            label="H1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          />
          <ToolbarBtn
            label="H2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarBtn
            label="H3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          />
          <ToolbarBtn
            label="B"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarBtn
            label="I"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarBtn
            label="U"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          />
          <ToolbarBtn
            label="S"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />
          <ToolbarBtn
            label="• 목록"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarBtn
            label="1. 목록"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarBtn
            label="체크"
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          />
          <ToolbarBtn
            label="인용"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <ToolbarBtn
            label="구분선"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
          <ToolbarBtn
            label="왼쪽"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          />
          <ToolbarBtn
            label="가운데"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          />
          <ToolbarBtn
            label="오른쪽"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          />
          <ToolbarBtn
            label="링크"
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("링크 URL", prev || "https://");
              if (url === null) return;
              if (!url) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}
          />
          <ToolbarBtn
            label="이미지"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.multiple = true;
              input.onchange = () => {
                const files = input.files ? Array.from(input.files) : [];
                if (files.length) void uploadImages(files);
              };
              input.click();
            }}
          />
          <ToolbarBtn
            label="유튜브"
            onClick={() => {
              const url = window.prompt("유튜브 URL");
              if (!url) return;
              editor.commands.setYoutubeVideo({ src: url });
            }}
          />
          <ToolbarBtn
            label="안내"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "callout",
                  attrs: { variant: "info" },
                  content: [{ type: "paragraph", content: [{ type: "text", text: "안내 내용" }] }],
                })
                .run()
            }
          />
          <ToolbarBtn
            label="경고"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "callout",
                  attrs: { variant: "warning" },
                  content: [{ type: "paragraph", content: [{ type: "text", text: "주의 사항" }] }],
                })
                .run()
            }
          />
          <ToolbarBtn
            label="강조"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "callout",
                  attrs: { variant: "highlight" },
                  content: [{ type: "paragraph", content: [{ type: "text", text: "강조 내용" }] }],
                })
                .run()
            }
          />
          <ToolbarBtn
            label="전화 CTA"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "ctaButton",
                  attrs: { kind: "phone", label: "전화 상담", href: "tel:01055580528" },
                })
                .run()
            }
          />
          <ToolbarBtn
            label="표"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          />
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-md px-2.5 text-xs font-bold ${
        active ? "bg-navy text-white" : "bg-white text-charcoal border border-border"
      }`}
    >
      {label}
    </button>
  );
}
