"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Content is visible without JavaScript. Only offscreen elements are revealed. */
export function WorkshopMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!root.current || !window.IntersectionObserver) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const elements = Array.from(root.current.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.motion = "visible";
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08 });

    for (const element of elements) {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.dataset.motion = "pending";
        observer.observe(element);
      }
    }
    const showAll = () => {
      if (preference.matches) {
        observer.disconnect();
        elements.forEach((element) => delete element.dataset.motion);
      }
    };
    preference.addEventListener("change", showAll);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", showAll);
      elements.forEach((element) => delete element.dataset.motion);
    };
  }, []);

  return <main ref={root} id="main">{children}</main>;
}
