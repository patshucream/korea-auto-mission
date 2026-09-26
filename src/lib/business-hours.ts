type SplitHours = { weekday: string; saturday: string; holiday: string };

/** Keep all three values in the legacy field when separate DB columns are absent. */
export function formatLegacyHours({ weekday, saturday, holiday }: SplitHours) {
  return `평일 ${weekday} 토요일 ${saturday} 공휴일 ${holiday}`;
}

export function deriveSplitHours(hours: string, closedDays: string, defaults: SplitHours): SplitHours {
  const weekday = hours.match(/평일\s*([0-9]{1,2}:[0-9]{2}\s*[-–~]\s*[0-9]{1,2}:[0-9]{2})/)?.[1]?.trim() || defaults.weekday;
  const saturday = hours.match(/토(?:요일)?\s*([0-9]{1,2}:[0-9]{2}\s*[-–~]\s*[0-9]{1,2}:[0-9]{2})/)?.[1]?.trim() || defaults.saturday;
  const explicitHoliday = hours.match(/공휴일\s+(.+)$/)?.[1]?.trim();
  const holiday = explicitHoliday || (/공휴일/.test(closedDays) ? "휴무" : defaults.holiday);
  return { weekday, saturday, holiday };
}
