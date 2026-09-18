import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";

type Row = { source?: string; landing?: string; day?: string; visits: number; phone: number; sms: number };
type Summary = { totals: Row & {location:number}; sources: Row[]; landings: Row[]; daily: Row[] };
const labels: Record<string,string> = { naver_mission:"네이버 광고 · 미션",naver_diesel:"네이버 광고 · 디젤",naver_other:"네이버 광고 · 기타",naver:"네이버 · 광고표시 없음",google:"구글",direct:"직접 방문·확인 불가",other:"기타",home:"홈",mission:"미션수리 안내",diesel:"디젤 클리닝 안내",works:"작업사례 목록",work:"작업사례 글" };

export default async function MarketingPage({ searchParams }: {searchParams: Promise<{days?:string}>}) {
  const {user,supabase} = await requireAdmin();
  if (!user || !supabase) redirect("/admin/login");
  const params = await searchParams;
  const days = [7,14,30,90].includes(Number(params.days)) ? Number(params.days) : 14;
  const {data,error} = await supabase.rpc("marketing_summary",{p_days:days});
  const stats = data as Summary | null;
  return <AdminShell title="방문·상담 통계" description="광고 유입이 상담 행동으로 이어지는지 확인합니다. 한국 시간 기준입니다.">
    <div className="mb-5 flex flex-wrap gap-2">{[7,14,30,90].map(d=><Link key={d} href={`/admin/marketing?days=${d}`} className={`btn min-h-10 text-sm ${d===days?"btn-primary":"btn-secondary"}`}>{d}일</Link>)}</div>
    {error || !stats ? <div className="admin-card"><h2 className="font-bold">통계 연결 확인이 필요합니다.</h2><p className="mt-2 text-sm">수집 기능이 아직 연결되지 않았거나 조회에 실패했습니다. 0건으로 해석하지 마세요.</p></div> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["방문 세션",stats.totals.visits],["전화 버튼 클릭 세션",stats.totals.phone],["문자 버튼 클릭 세션",stats.totals.sms],["매장·지도 클릭 세션",stats.totals.location]].map(([label,value])=><div className="admin-stat" key={label}><p className="text-sm font-semibold text-muted">{label}</p><p className="mt-2 text-3xl font-black text-navy">{Number(value).toLocaleString()}</p></div>)}</div>
      <p className="my-5 text-sm leading-6 text-muted">같은 날·같은 브라우저 탭의 반복 행동은 중복을 줄여 집계합니다. 방문 세션은 사람 수와 다르며, 전화·문자 클릭은 실제 통화·발송·예약 완료를 의미하지 않습니다. 수집 중지, 광고 차단, 관리자 방문 및 연결 오류 등으로 누락될 수 있습니다. 설치 이후 데이터만 표시됩니다.</p>
      <section className="admin-card mb-5"><h2 className="font-bold">이 숫자는 실제 통화 건수가 아닙니다.</h2><p className="mt-2 text-sm leading-6">전화·문자 버튼을 누른 세션을 집계합니다. 네이버 광고센터는 광고 클릭과 연결된 전환을 별도로 집계하므로 숫자가 다를 수 있습니다. 광고보고서의 사용자 정의 #1은 전화 버튼 클릭, #2는 문자 버튼 클릭으로 사용합니다.</p><p className="mt-2 text-sm leading-6">“네이버 · 광고표시 없음”은 광고 구분 표시 없이 네이버에서 들어온 방문입니다. 일반 검색만으로 들어왔다고 확정할 수는 없습니다. 설치 전 기록은 네이버에 소급 전송하지 않습니다.</p></section>
      <div className="grid gap-5 xl:grid-cols-2"><StatsTable title="유입 경로별" rows={stats.sources} field="source" /><StatsTable title="첫 방문 페이지별" rows={stats.landings} field="landing" /></div>
      <div className="mt-5"><StatsTable title="날짜별" rows={stats.daily} field="day" /></div>
    </>}
    <section className="admin-card mt-6"><h2 className="font-bold">광고비와 실제 입고를 함께 확인하세요.</h2><p className="mt-2 text-sm leading-6">전화 상담 시 홈페이지를 보고 연락했는지 확인하고, 실제 상담·예약·입고 건수를 별도로 기록해 주세요. 광고비 ÷ 실제 입고 건수로 성과를 판단합니다. 상담 버튼 클릭만으로 예산을 늘리지 않습니다.</p><a className="btn btn-secondary mt-4" href="https://ads.naver.com/manage/ad-accounts/1313099" target="_blank" rel="noopener noreferrer">네이버 광고비 확인 ↗</a></section>
  </AdminShell>;
}
function StatsTable({title,rows,field}: {title:string; rows:Row[]; field:"source"|"landing"|"day"}) {
  return <section className="admin-card overflow-x-auto"><h2 className="mb-4 font-bold">{title}</h2><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-3 pr-3">구분</th><th className="whitespace-nowrap px-2">방문</th><th className="whitespace-nowrap px-2">전화 버튼 클릭</th><th className="whitespace-nowrap px-2">문자 버튼 클릭</th></tr></thead><tbody>{rows.length ? rows.map(row=><tr className="border-b" key={row[field]}><td className="py-3 pr-3">{labels[row[field] || ""] || row[field]}</td><td className="px-2">{row.visits}</td><td className="px-2">{row.phone}</td><td className="px-2">{row.sms}</td></tr>) : <tr><td colSpan={4} className="py-5 text-muted">선택한 기간에 수집된 기록이 없습니다.</td></tr>}</tbody></table></section>;
}
