import assert from "node:assert/strict";
import { deriveSplitHours, formatLegacyHours } from "../src/lib/business-hours.ts";

const defaults = { weekday: "09:00 - 18:00", saturday: "09:00 - 15:00", holiday: "방문 전 확인해 주세요" };
for (const holiday of ["방문 전 확인해 주세요", "휴무", "10:00 - 14:00"]) {
  const settings = { weekday: "08:30 - 19:00", saturday: "09:30 - 14:00", holiday };
  assert.deepEqual(deriveSplitHours(formatLegacyHours(settings), "일요일", defaults), settings);
}
assert.equal(deriveSplitHours("평일 09:00 - 18:00 토요일 09:00 - 15:00", "일요일", defaults).holiday, defaults.holiday);
assert.equal(deriveSplitHours("평일 09:00 - 18:00", "일요일 · 공휴일", defaults).holiday, "휴무");
console.log("Business-hour legacy persistence checks passed.");
