import { requireAdmin } from "@/lib/auth/require-admin";
import { loadMarketingReport } from "@/lib/data/marketing";
import { contactCsv } from "@/lib/marketing-contacts";

export async function GET(request: Request) {
  const { user, supabase } = await requireAdmin();
  if (!user || !supabase) return new Response("로그인이 필요합니다.", { status: 401, headers: { "Cache-Control": "no-store" } });
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const report = await loadMarketingReport(supabase, params);
  if (report.failed || report.truncated) return new Response("전체 내역을 조회하지 못했습니다. 기간을 줄여 다시 시도해 주세요.", { status: 503, headers: { "Cache-Control": "no-store" } });
  return new Response(contactCsv(report.contacts, report.workTitles), { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="koreauto-contact-${report.window.start}-${report.window.end}.csv"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
