"use client";

import type { SiteSettings } from "@/lib/types";
import { NaverReserveButton, PhoneButton } from "@/components/ui/ContactButtons";

type Props = {
  settings: SiteSettings;
};

export function MobileBottomBar({ settings }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-warm-white/95 p-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-2 gap-2">
        <PhoneButton settings={settings} fullWidth className="min-h-12 text-base" />
        <NaverReserveButton settings={settings} fullWidth className="min-h-12 text-base" />
      </div>
    </div>
  );
}
