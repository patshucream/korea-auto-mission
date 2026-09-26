import revisions from "@/lib/data/journal-revisions.json";

export function getJournalRevisions() { return revisions; }
export function matchesRevisionFields(row: Record<string, unknown>, expected: Record<string, unknown>) {
  return Object.entries(expected).every(([key,value]) => JSON.stringify(row[key] ?? null) === JSON.stringify(value ?? null));
}
