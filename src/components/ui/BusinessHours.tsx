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

/** "09:00 - 18:00" 형태 CMS 값을 Schema.org opens/closes로 파싱 */
export function parseHourRange(
  value: string | null | undefined,
): { opens: string; closes: string } | null {
  if (!value) return null;
  const match = value
    .trim()
    .match(/(\d{1,2}:\d{2})\s*[-~–—]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  return { opens: match[1], closes: match[2] };
}

/**
 * 관리자 영업시간(weekday/saturday/holiday)을 OpeningHoursSpecification으로 변환.
 * 일요일은 휴무 고정이라 제외. 공휴일 문구가 시간 형식이 아니면 생략.
 */
export function buildOpeningHoursSpecification(settings: SiteSettings) {
  const specs: Array<{
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string | string[];
    opens: string;
    closes: string;
  }> = [];

  const weekday = parseHourRange(settings.weekday_hours);
  if (weekday) {
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ],
      opens: weekday.opens,
      closes: weekday.closes,
    });
  }

  const saturday = parseHourRange(settings.saturday_hours);
  if (saturday) {
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: saturday.opens,
      closes: saturday.closes,
    });
  }

  const holiday = parseHourRange(settings.holiday_hours);
  if (holiday) {
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "PublicHolidays",
      opens: holiday.opens,
      closes: holiday.closes,
    });
  }

  return specs;
}
