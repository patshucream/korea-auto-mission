"use client";

import { useEffect, useMemo, useState } from "react";

export type TocItem = {
  id: string;
  text: string;
};

type Props = {
  toc: TocItem[];
  shareUrl: string;
  shareTitle: string;
};

export function WorkReadingTools({ toc, shareUrl, shareTitle }: Props) {
  const [activeId, setActiveId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const ids = useMemo(() => toc.map((t) => t.id), [toc]);

  useEffect(() => {
    if (!ids.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.4, 0.7] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const img = target?.closest?.("img");
      if (!img || !img.src) return;
      if (!img.closest(".work-content, .work-gallery, .work-before-after")) return;
      e.preventDefault();
      setLightbox(img.src);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // user cancelled share
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("주소를 복사하세요", shareUrl);
    }
  }

  return (
    <>
      {toc.length ? (
        <nav className="mb-8 rounded-[12px] border border-border bg-white p-4">
          <p className="text-sm font-black text-navy">목차</p>
          <ol className="mt-3 space-y-2 text-sm">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={
                    activeId === item.id
                      ? "font-bold text-navy"
                      : "text-muted hover:text-navy"
                  }
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost min-h-11 text-sm" onClick={share}>
          공유
        </button>
        <button type="button" className="btn btn-ghost min-h-11 text-sm" onClick={copyUrl}>
          {copied ? "복사됨" : "주소 복사"}
        </button>
      </div>

      <button
        type="button"
        className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-sm font-black text-navy shadow-md md:bottom-8"
        aria-label="상단으로 이동"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="확대 이미지"
            className="max-h-[90vh] max-w-full object-contain"
          />
        </div>
      ) : null}
    </>
  );
}
