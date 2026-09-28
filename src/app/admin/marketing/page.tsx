import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContactAttribution } from "@/components/admin/ContactAttribution";
import { requireAdmin } from "@/lib/auth/require-admin";
import { loadMarketingReport } from "@/lib/data/marketing";
import { analyticsPageName, deviceLabels, trafficBreakdown, trafficTotals } from "@/lib/marketing-contacts";

export default async function MarketingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, supabase } = await requireAdmin();
  if (!user || !supabase) redirect("/admin/login");
  const raw = await searchParams;
  const params = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, typeof value === "string" ? value : undefined]));
  const report = await loadMarketingReport(supabase, params);
  const { window, visits, contacts, workTitles } = report;
  const total = trafficTotals(visits);
  const deviceKnown = visits.filter(v => v.visited && v.device !== "unknown").length;
  const sourceUnknown = visits.filter(v => v.visited && ["direct", "legacy:direct"].includes(v.sourceKey)).length;
  const collected = visits.filter(v => v.events.some(e => e.details?.version === 2)).length;
  const exportParams = new URLSearchParams({ start: window.start, end: window.end, source: report.source, device: report.device, action: report.action });
  const inputClass = "mt-1 block min-h-11 w-full rounded-lg border border-border bg-white px-3 text-sm";
  const sourceRows = trafficBreakdown(visits, "source");
  const landingRows = trafficBreakdown(visits, "landing").map(row => ({ ...row, label: row.key.startsWith("/") ? analyticsPageName(row.key, "other", workTitles) : row.label }));

  return <AdminShell title="방문·상담 통계" description="어디서 들어와 어떤 페이지에서 문의 버튼을 눌렀는지 확인합니다. 한국 시간 기준입니다.">
    <div className="mb-4 flex flex-wrap gap-2">{[7,14,30,90].map(days => <Link key={days} href={`/admin/marketing?days=${days}`} className="btn btn-secondary min-h-10 text-sm">최근 {days}일</Link>)}</div>
    <form key={`${window.start}:${window.end}:${report.source}:${report.device}:${report.action}`} className="admin-card mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6" method="get">
      <label className="text-sm font-semibold">시작일<input name="start" type="date" min={window.oldest} max={window.today} defaultValue={window.start} className={inputClass} required /></label>
      <label className="text-sm font-semibold">종료일<input name="end" type="date" min={window.oldest} max={window.today} defaultValue={window.end} className={inputClass} required /></label>
      <label className="text-sm font-semibold">유입 경로<select name="source" defaultValue={report.source} className={inputClass}><option value="all">전체 경로</option>{report.sourceOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm font-semibold">기기<select name="device" defaultValue={report.device} className={inputClass}><option value="all">전체 기기</option>{Object.entries(deviceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm font-semibold">문의 내역<select name="action" defaultValue={report.action} className={inputClass}><option value="all">전화·문자 전체</option><option value="phone">전화 클릭 포함</option><option value="sms">문자 클릭 포함</option></select></label>
      <button className="btn btn-primary min-h-11 self-end" type="submit">조회하기</button>
    </form>
    <p className="mb-4 text-sm text-muted">조회 기간 {window.start} ~ {window.end}{window.end === window.today ? " · 오늘은 진행 중입니다." : ""} 문의 내역 필터는 아래 문의 목록에만 적용됩니다.</p>
    {report.failed ? <div className="admin-card"><h2 className="font-bold">통계 연결 확인이 필요합니다.</h2><p className="mt-2 text-sm">내역 조회에 실패했습니다. 방문이나 문의가 0건이라는 뜻은 아닙니다.</p></div> : <>
      {report.truncated && <p className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">기록이 많아 일부만 조회되었습니다. 아래 숫자는 전체 기간의 합계가 아닙니다. 기간을 줄여 다시 조회해 주세요.</p>}
      {!report.detailed && <p className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">기존 기록으로 조회 중입니다. 상세 수집용 데이터베이스 업데이트가 완료되면 시각·기기·세부 경로 수집이 시작됩니다.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[
        ["방문 세션", total.visits], ["전화 버튼 클릭 세션", total.phone], ["문자 버튼 클릭 세션", total.sms],
        ["전화·문자 중 하나 이상 클릭", total.contacts], ["문의 버튼 클릭률", total.rate === null ? "—" : `${total.rate.toFixed(1)}%`], ["매장·지도 클릭 세션", total.location],
      ].map(([label, value]) => <div className="admin-stat" key={label}><p className="text-sm font-semibold text-muted">{label}</p><p className="mt-2 text-3xl font-black text-navy">{typeof value === "number" ? value.toLocaleString() : value}</p></div>)}</div>
      <section className="admin-card my-5">
        <h2 className="font-bold">통계 해석과 수집 범위</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          <li>방문은 고유 고객 수가 아닙니다. 같은 날·같은 탭의 반복 기록은 합치며 재방문·테스트가 포함될 수 있습니다.</li>
          <li>문의 클릭률 = 방문 기록이 있는 세션 중 전화·문자 중 하나 이상 누른 세션 ÷ 방문 세션입니다. 두 버튼을 모두 눌러도 분자는 한 번만 셉니다. 실제 통화·발송·예약률은 아닙니다.</li>
          <li>유입 경로는 해당 방문의 첫 접속 기준입니다. 네이버 검색에서 들어왔더라도 광고 표시가 없다는 이유만으로 자연검색이라고 확정하지 않습니다. 예전 “네이버 · 광고표시 없음” 기록은 검색·블로그·지도를 구분할 수 없습니다.</li>
          <li>출처 확인 불가 {sourceUnknown} / {total.visits}방문 · 기기 확인 {deviceKnown} / {total.visits}방문 · 새 상세 기록이 있는 방문 {collected}건. 과거에 수집하지 않은 시각·기기·주소는 미수집으로 표시합니다.</li>
          <li>광고 차단·수집 중지·연결 오류로 누락될 수 있습니다. 추적 금지(DNT), 관리자용 탭, 개발 환경에서는 수집하지 않습니다. 최근 90일 범위에서 조회합니다.</li>
        </ul>
      </section>
      <Breakdown title="유입 경로별 방문과 문의 클릭" rows={sourceRows} />
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-2"><Breakdown title="모바일·PC별" rows={trafficBreakdown(visits, "device")} /><Breakdown title="날짜별" rows={trafficBreakdown(visits, "day")} /></div>
      <div className="mt-5"><Breakdown title="첫 접속 페이지별" rows={landingRows} /></div>
      <details className="admin-card mt-5"><summary className="cursor-pointer font-bold">방문 시간대별 분석</summary><p className="my-3 text-sm text-muted">처음 기록된 방문 시각(KST)별입니다. 문의가 발생한 시각은 아래 문의 내역에서 확인하세요.</p><Breakdown title="시간대별" rows={trafficBreakdown(visits, "hour")} embedded /></details>
      <ContactAttribution visits={contacts} workTitles={workTitles} exportHref={`/admin/marketing/export?${exportParams}`} />
    </>}
    <section className="admin-card mt-6"><h2 className="font-bold">실제 상담·입고와 함께 확인하세요.</h2><p className="mt-2 text-sm leading-6">문의 버튼 클릭은 실제 연락이나 매출과 다릅니다. 실제 상담·예약·입고를 따로 기록하고 광고비와 함께 비교해 주세요.</p><a className="btn btn-secondary mt-4" href="https://ads.naver.com/manage/ad-accounts/1313099" target="_blank" rel="noopener noreferrer">네이버 광고비 확인 ↗</a></section>
  </AdminShell>;
}

function Breakdown({ title, rows, embedded = false }: { title: string; rows: ReturnType<typeof trafficBreakdown>; embedded?: boolean }) {
  return <section className={embedded ? "min-w-0 overflow-x-auto" : "admin-card min-w-0 overflow-x-auto"}>
    <h2 className="mb-4 font-bold">{title}</h2>
    <table className="w-full text-left text-sm"><thead><tr className="border-b">{["구분","방문","전화 클릭","문자 클릭","문의 클릭률"].map(label => <th className="whitespace-nowrap px-2 py-3 first:pl-0" key={label}>{label}</th>)}</tr></thead><tbody>
      {rows.length ? rows.map(row => <tr className="border-b" key={row.key}><td className="min-w-32 py-3 pr-3">{row.label}</td><td className="px-2">{row.visits}</td><td className="px-2">{row.phone}</td><td className="px-2">{row.sms}</td><td className="px-2">{row.rate === null ? "—" : `${row.rate.toFixed(1)}%`}</td></tr>) : <tr><td colSpan={5} className="py-5 text-muted">해당 조건에 기록이 없습니다.</td></tr>}
    </tbody></table>
  </section>;
}
