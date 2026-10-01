"use client";

import type { ReactNode } from "react";

/** Opens the customer's SMS composer; it never sends a message automatically. */
export function SmsLink({ phone, body = "[정비 상담]\n차종·연식:\n주행거리:\n증상:\n방문 희망일:", className, children }: {
  phone: string; body?: string; className?: string; children: ReactNode;
}) {
  const number = phone.replace(/[^0-9+]/g, "");
  return <a href={`sms:${number}${body ? `?body=${encodeURIComponent(body)}` : ""}`}
    className={className}
    onClick={(event) => {
      if (!body) return;
      const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      event.currentTarget.href = `sms:${number}${apple ? "&" : "?"}body=${encodeURIComponent(body)}`;
    }}>{children}</a>;
}
