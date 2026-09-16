import type { ServiceOption, WorkCase } from "@/lib/types";

export const WORK_SERVICE_LABELS = [
  "오토미션 수리",
  "트랜스퍼 케이스·디퍼런셜",
  "흡기 클리닝",
  "인젝터 클리닝",
  "DPF 클리닝",
  "수입차 정밀진단",
] as const;

/** Additional services use existing text-array tags, preserving older CMS records. */
export function getWorkServiceLabels(work: Pick<WorkCase, "service_category" | "general_tags">): string[] {
  const labels = new Set([work.service_category, ...(work.general_tags || [])]);
  const ordered: string[] = WORK_SERVICE_LABELS.filter((label) => labels.has(label));
  if (work.service_category && !ordered.includes(work.service_category)) ordered.unshift(work.service_category);
  return ordered;
}

export function workMatchesService(work: WorkCase, service: ServiceOption): boolean {
  return work.service_id === service.id || getWorkServiceLabels(work).includes(service.title);
}

/** Service IDs originate from the services table; text is quoted for PostgREST. */
export function workServiceFilter(service: ServiceOption): string {
  if (!/^[0-9a-f-]{36}$/i.test(service.id)) throw new Error("Invalid service ID");
  return `service_id.eq.${service.id},general_tags.cs.{${JSON.stringify(service.title)}}`;
}
