import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  settings: SiteSettings;
  /** footer: 어두운 배경 / light: 밝은 배경(오시는 길) */
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
          "font-bold",
          isFooter ? "text-lg text-white" : "text-charcoal",
        )}
      >
        영업시간
      </p>
      <dl className="mt-3 space-y-2.5 text-[1.02rem] leading-snug sm:text-[1.05rem]">
        {ROWS.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-baseline justify-between gap-3 sm:gap-6"
          >
            <dt
              className={cn(
                "shrink-0 font-medium",
                isFooter ? "text-white/75" : "text-charcoal",
              )}
            >
              {label}
            </dt>
            <dd
              className={cn(
                "min-w-0 text-right tabular-nums",
                isFooter ? "text-white/90" : "text-muted",
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

/** 구조화 데이터·레거시 필드용 한 줄 요약 (UI에는 사용하지 않음) */
export function formatBusinessHoursSummary(settings: SiteSettings): string {
  return `평일 ${settings.weekday_hours} / 토요일 ${settings.saturday_hours} / 일요일·공휴일 ${settings.holiday_hours}`;
}
