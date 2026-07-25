import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
  variant?: "footer" | "light";
  className?: string;
};

/** 일요일은 휴무 고정, 공휴일은 CMS holiday_hours 사용 */
const SUNDAY_HOURS = "휴무";

export function BusinessHours({ settings, variant = "light", className }: Props) {
  const isFooter = variant === "footer";
  const rows: Array<{ label: string; value: string }> = [
    { label: "평일", value: settings.weekday_hours },
    { label: "토요일", value: settings.saturday_hours },
    { label: "일요일", value: SUNDAY_HOURS },
    { label: "공휴일", value: settings.holiday_hours },
  ];

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
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
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
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function formatBusinessHoursSummary(settings: SiteSettings): string {
  return `평일 ${settings.weekday_hours} / 토요일 ${settings.saturday_hours} / 일요일 ${SUNDAY_HOURS} / 공휴일 ${settings.holiday_hours}`;
}
