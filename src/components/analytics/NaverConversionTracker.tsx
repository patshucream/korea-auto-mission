"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordNaverContact, recordNaverPageView } from "@/lib/naver-tracking";

export function NaverConversionTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const pageView = () => { void recordNaverPageView(pathname); };
    pageView();
    function click(event: MouseEvent) {
      if (!event.isTrusted) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (link) void recordNaverContact(link.getAttribute("href") || "");
    }
    document.addEventListener("click", click, true);
    window.addEventListener("marketing-preference", pageView);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("marketing-preference", pageView);
    };
  }, [pathname]);
  return null;
}
