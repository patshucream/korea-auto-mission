import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
  variant?: "footer" | "light";
  className?: string;
};

const ROWS: Array<{
  key: keyof Pick<SiteSettings, "weekday_hours" | "saturday_hours" | "holiday_hours">;
  label: string;
}> = [
  { key: "weekday_hours", label: "평일" },
  { key: "saturday_hours", label: "토요일" },
  { key: "holiday_hours", label: "일요일·공휴일" },
];

export function BusinessHours({ settings, variant = "light", className }: Props) {
  const isFooter = variant === "footer";

  return (
    <div className={cn(className)}>
      <p
        className={cn(
          "font-semibold",
          isFooter ? "text-sm text-white/90" : "text-charcoal",
        )}
      >
        영업시간
      </p>
      <dl
        className={cn(
          "mt-3 space-y-2 leading-snug",
          isFooter ? "text-sm" : "text-[1.02rem] sm:text-[1.05rem]",
        )}
      >
        {ROWS.map(({ key, label }) => (
          <div key={key} className="flex items-baseline justify-between gap-4">
            <dt
              className={cn(
                "shrink-0",
                isFooter ? "text-white/50" : "font-medium text-charcoal",
              )}
            >
              {label}
            </dt>
            <dd
              className={cn(
                "min-w-0 text-right tabular-nums",
                isFooter ? "text-white/75" : "text-muted",
              )}
            >
              {settings[key]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function formatBusinessHoursSummary(settings: SiteSettings): string {
  return `평일 ${settings.weekday_hours} / 토요일 ${settings.saturday_hours} / 일요일·공휴일 ${settings.holiday_hours}`;
}
