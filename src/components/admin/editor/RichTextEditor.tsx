"use client";

import { useCallback, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { createEditorExtensions } from "@/lib/editor/extensions";
import { uploadImageToStorage } from "@/lib/image";

type Props = {
  valueJson?: unknown | null;
  onChange: (json: unknown, html: string) => void;
  folder?: string;
  editable?: boolean;
  /** 에디터 본문 이미지 public URL 목록 변경 시 */
  onImagesChange?: (urls: string[]) => void;
};

export function RichTextEditor({
  valueJson,
  onChange,
  folder = "works/temp",
  editable = true,
  onImagesChange,
}: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const uploading = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: createEditorExtensions(),
    content: (valueJson as object) || { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON(), ed.getHTML());
      onImagesChange?.(collectImageUrls(ed));
    },
    editorProps: {
      attributes: {
        class:
          "prose-ko editor-body min-h-[420px] max-w-none px-5 py-6 focus:outline-none text-charcoal sm:px-8 sm:py-8",
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!images.length) return false;
        event.preventDefault();
        void uploadImages(images);
        return true;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        const files: File[] = [];
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }
        if (!files.length) return false;
        event.preventDefault();
        void uploadImages(files);
        return true;
      },
    },
  });

  const uploadImages = useCallback(
    async (files: File[]) => {
      if (!editor || uploading.current) return;
      uploading.current = true;
      setUploadPct(0);
      try {
        let done = 0;
        for (const file of files) {
          const { publicUrl } = await uploadImageToStorage(file, folder, (p) => {
            const base = (done / files.length) * 100;
            setUploadPct(Math.round(base + p / files.length));
          });
          editor
            .chain()
            .focus()
            .setImage({
              src: publicUrl,
              alt: file.name.replace(/\.[^.]+$/, ""),
            })
            .run();
          done += 1;
          setUploadPct(Math.round((done / files.length) * 100));
        }
        onImagesChange?.(collectImageUrls(editor));
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
      } finally {
        uploading.current = false;
        window.setTimeout(() => setUploadPct(null), 600);
      }
    },
    [editor, folder, onImagesChange],
  );

  if (!editor) {
    return (
      <div className="min-h-[420px] rounded-[12px] border border-border bg-white p-6 text-sm text-muted">
        에디터 로딩 중…
      </div>
    );
  }

  const imageActive = editor.isActive("image");

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-white">
      {editable ? (
        <div className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-1 p-2">
            <Tool
              tip="제목"
              active={editor.isActive("heading")}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H
            </Tool>
            <Tool
              tip="굵게"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              B
            </Tool>
            <Tool
              tip="목록"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              •
            </Tool>
            <Tool
              tip="이미지"
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
            >
              🖼
            </Tool>
            <Tool
              tip="링크"
              active={editor.isActive("link")}
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
            >
              링크
            </Tool>
            <Tool
              tip="인용"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              “
            </Tool>
            <Tool tip="구분선" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
              ―
            </Tool>
            <div className="relative">
              <Tool tip="더보기" active={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
                더보기
              </Tool>
              {moreOpen ? (
                <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-[10px] border border-border bg-white p-2 shadow-lg">
                  <MoreItem
                    label="제목 1"
                    onClick={() => {
                      editor.chain().focus().toggleHeading({ level: 1 }).run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="제목 2"
                    onClick={() => {
                      editor.chain().focus().toggleHeading({ level: 2 }).run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="제목 3"
                    onClick={() => {
                      editor.chain().focus().toggleHeading({ level: 3 }).run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="기울임"
                    onClick={() => {
                      editor.chain().focus().toggleItalic().run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="밑줄"
                    onClick={() => {
                      editor.chain().focus().toggleUnderline().run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="취소선"
                    onClick={() => {
                      editor.chain().focus().toggleStrike().run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="체크리스트"
                    onClick={() => {
                      editor.chain().focus().toggleTaskList().run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="번호 목록"
                    onClick={() => {
                      editor.chain().focus().toggleOrderedList().run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="왼쪽 정렬"
                    onClick={() => {
                      editor.chain().focus().setTextAlign("left").run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="가운데 정렬"
                    onClick={() => {
                      editor.chain().focus().setTextAlign("center").run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="오른쪽 정렬"
                    onClick={() => {
                      editor.chain().focus().setTextAlign("right").run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="표"
                    onClick={() => {
                      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="유튜브"
                    onClick={() => {
                      const url = window.prompt("유튜브 URL");
                      if (url) editor.commands.setYoutubeVideo({ src: url });
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="안내 박스"
                    onClick={() => {
                      insertCallout(editor, "info", "안내 내용");
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="경고 박스"
                    onClick={() => {
                      insertCallout(editor, "warning", "주의 사항");
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="강조 박스"
                    onClick={() => {
                      insertCallout(editor, "highlight", "강조 내용");
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="전화 CTA"
                    onClick={() => {
                      editor
                        .chain()
                        .focus()
                        .insertContent({
                          type: "ctaButton",
                          attrs: {
                            kind: "phone",
                            label: "전화 상담",
                            href: "tel:01055580528",
                          },
                        })
                        .run();
                      setMoreOpen(false);
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {imageActive ? (
            <div className="flex flex-wrap gap-1 border-t border-border bg-gray-50 px-2 py-2">
              {(["small", "normal", "large", "full"] as const).map((size) => (
                <Tool
                  key={size}
                  tip={`크기: ${size}`}
                  active={editor.getAttributes("image").size === size}
                  onClick={() => editor.chain().focus().updateAttributes("image", { size }).run()}
                >
                  {size === "small" ? "작게" : size === "normal" ? "보통" : size === "large" ? "크게" : "전체"}
                </Tool>
              ))}
              {(["left", "center", "right"] as const).map((align) => (
                <Tool
                  key={align}
                  tip={`정렬: ${align}`}
                  active={editor.getAttributes("image").align === align}
                  onClick={() => editor.chain().focus().updateAttributes("image", { align }).run()}
                >
                  {align === "left" ? "왼쪽" : align === "center" ? "가운데" : "오른쪽"}
                </Tool>
              ))}
              <Tool
                tip="캡션"
                onClick={() => {
                  const prev = (editor.getAttributes("image").caption as string) || "";
                  const caption = window.prompt("이미지 설명(캡션)", prev);
                  if (caption === null) return;
                  editor.chain().focus().updateAttributes("image", { caption }).run();
                }}
              >
                캡션
              </Tool>
              <Tool
                tip="대체 텍스트"
                onClick={() => {
                  const prev = (editor.getAttributes("image").alt as string) || "";
                  const alt = window.prompt("대체 텍스트(alt)", prev);
                  if (alt === null) return;
                  editor.chain().focus().updateAttributes("image", { alt }).run();
                }}
              >
                ALT
              </Tool>
              <Tool
                tip="확대"
                onClick={() => {
                  const src = editor.getAttributes("image").src as string;
                  if (src) setLightbox(src);
                }}
              >
                확대
              </Tool>
              <Tool
                tip="순서 변경"
                onClick={() => {
                  window.alert(
                    "이미지를 선택한 뒤 잘라내기(Ctrl/Cmd+X)와 붙여넣기(Ctrl/Cmd+V)로 순서를 바꿀 수 있습니다.",
                  );
                }}
              >
                순서
              </Tool>
            </div>
          ) : null}

          {uploadPct !== null ? (
            <div className="border-t border-border px-3 py-2 text-xs font-semibold text-navy">
              이미지 업로드 중… {uploadPct}%
            </div>
          ) : null}
        </div>
      ) : null}

      <EditorContent editor={editor} />

      {lightbox ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="미리보기" className="max-h-[90vh] max-w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}

function collectImageUrls(editor: Editor): string[] {
  const urls: string[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === "image" && node.attrs.src) {
      urls.push(String(node.attrs.src));
    }
  });
  return [...new Set(urls)];
}

function insertCallout(editor: Editor, variant: string, text: string) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "callout",
      attrs: { variant },
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    })
    .run();
}

function Tool({
  children,
  onClick,
  active,
  tip,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  tip: string;
}) {
  return (
    <button
      type="button"
      title={tip}
      aria-label={tip}
      onClick={onClick}
      className={`min-h-9 min-w-9 rounded-md px-2 text-xs font-bold ${
        active ? "bg-navy text-white" : "border border-border bg-white text-charcoal"
      }`}
    >
      {children}
    </button>
  );
}

function MoreItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-charcoal hover:bg-gray-50"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
