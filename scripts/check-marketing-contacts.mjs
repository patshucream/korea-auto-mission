import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const dir = mkdtempSync(join(tmpdir(), "koreauto-stat-tests-"));
for (const name of ["marketing-attribution", "marketing-contacts"]) {
  const input = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8");
  writeFileSync(join(dir, `${name}.js`), ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText);
}
const require = createRequire(import.meta.url);
const { groupContactVisits, marketingStartDay, marketingSourceLabels, buildTrafficVisits, trafficTotals, trafficBreakdown, trafficWindow, contactCsv } = require(join(dir, "marketing-contacts.js"));
const { trafficSource, publicAnalyticsPath, trafficDevice } = require(join(dir, "marketing-attribution.js"));
process.on("exit", () => rmSync(dir, { recursive: true, force: true }));

const base = { day: "2026-09-28", session_id: "visit-a", source: "naver", landing: "home", page: "home", event: "phone" };
const visits = groupContactVisits([
  base,
  base,
  { ...base, page: "diesel" },
  { ...base, page: "diesel", event: "sms" },
  { ...base, event: "visit" },
  { ...base, session_id: "visit-b", source: "naver_diesel", event: "sms" },
  { ...base, day: "2026-09-27" },
]);
assert.equal(visits.length, 3, "Repeated clicks/pages must not inflate contact sessions");
assert.deepEqual(visits[0].phonePages, ["home", "diesel"]);
assert.deepEqual(visits[0].smsPages, ["diesel"]);
assert.deepEqual(visits[0].sources, ["naver"]);
assert.deepEqual(visits[1].sources, ["naver_diesel"], "Do not merge different visitors' attribution");
assert.equal(visits[2].day, "2026-09-27", "The same session on another day is a separate visit");
assert.equal(visits.filter(v => v.phonePages.length).length, 2);
assert.equal(visits.filter(v => v.smsPages.length).length, 2);
assert.match(marketingSourceLabels.naver, /광고표시 없음/, "Do not relabel unknown Naver traffic as organic search");
assert.equal(marketingStartDay(7, new Date("2026-09-27T15:00:00Z")), "2026-09-22");
assert.equal(marketingStartDay(7, new Date("2026-09-27T14:59:59Z")), "2026-09-21");
assert.deepEqual(groupContactVisits([{ ...base, event: "visit" }]), []);
console.log("Contact attribution grouping and Korea-time date checks passed.");

const from = (search, referrer = "https://search.naver.com/search.naver?query=private") => trafficSource(search, referrer, "koreauto.co.kr");
assert.deepEqual(from(""), { source: "naver", detail: "naver_search" });
assert.equal(from("?utm_source=naver&utm_medium=cpc&utm_content=diesel").detail, "naver_paid_diesel");
assert.equal(from("?n_ad_group=grp-a001-01-000000073947574").detail, "naver_paid_ev");
assert.equal(from("", "https://blog.naver.com/koreaautolife").detail, "naver_blog");
assert.equal(from("", "https://m.place.naver.com/restaurant/123").detail, "naver_map");
assert.equal(from("", "https://naver.com.attacker.test/").detail, "other");
assert.equal(from("?utm_source=daangn&utm_medium=cpc", "").detail, "daangn_paid");
assert.equal(from("?gclid=not-stored", "").detail, "google_paid");
assert.equal(from("", "").detail, "direct");
assert.equal(publicAnalyticsPath("/services/transmission?phone=private#private"), "/services/transmission");
assert.equal(publicAnalyticsPath("/admin/marketing"), null);
assert.equal(publicAnalyticsPath("/unknown/private-user-info"), null);
assert.equal(trafficDevice("Mozilla iPhone Mobile"), "mobile");
assert.equal(trafficDevice("Mozilla Android Tablet"), "tablet");
assert.equal(trafficDevice("Mozilla Macintosh"), "desktop");
const detailed = { ...base, observed_at: "2026-09-28T00:00:00Z", details: { version: 2, device: "mobile", source_detail: "naver_search", landing_path: "/", page_path: "/services/diesel-cleaning" } };
const report = buildTrafficVisits([
 { ...detailed, event: "visit" }, detailed, { ...detailed, event: "sms" },
 { ...base, session_id: "no-contact", event: "visit" },
 { ...base, session_id: "contact-without-visit" },
]);
const totals = trafficTotals(report);
assert.equal(totals.visits, 2);
assert.equal(totals.contacts, 2);
assert.equal(totals.contactsWithVisit, 1);
assert.equal(totals.rate, 50, "Both phone+SMS count once; contact without visit must not inflate rate");
assert.equal(trafficBreakdown(report, "device").find(r => r.key === "mobile").visits, 1);
assert.equal(trafficBreakdown(report, "hour").find(r => r.key === "09").phone, 1);
assert.equal(report.find(r => r.key.includes("no-contact")).device, "unknown");
assert.equal(trafficWindow({start:"2026-02-31",end:"2026-09-28"}, new Date("2026-09-28T00:00:00Z")).start, "2026-09-15");
assert.equal(trafficWindow({start:"2026-09-21",end:"2026-09-27"}, new Date("2026-09-28T00:00:00Z")).end, "2026-09-27");
const csv = contactCsv(report.filter(v => v.phone || v.sms));
assert.ok(csv.startsWith("\uFEFF"));
assert.ok(csv.includes("네이버 검색 · 광고표시 없음"));
assert.ok(csv.includes("미수집"));
assert.ok(!csv.includes("visit-a"), "Do not export anonymous session identifiers");
console.log("Detailed source classification, privacy, deduplication, rates, filters and CSV checks passed.");

// Execute the real tracker against in-memory browser/SDK doubles; no production events.
const trackerSource = readFileSync(new URL('../src/components/analytics/MarketingTracker.tsx', import.meta.url), 'utf8');
const trackerJs = ts.transpileModule(trackerSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const { runInNewContext } = await import('node:vm');
function trackerHarness({host='koreauto.co.kr',path='/services/diesel-cleaning',dnt='0',search='',referrer='https://search.naver.com/search.naver?query=private'}={}) {
 const entries = new Map(); const localEntries = new Map(); const listeners = new Map(); const calls = [];
 const storage = map => ({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)});
 const sessionStorage = storage(entries); const localStorage = storage(localEntries);
 const location = {hostname:host,pathname:path,search};
 class Element { constructor(href){this.href=href;} closest(){return this;} getAttribute(){return this.href;} }
 const exports = {};
 const context = { exports, require:name=> name==='react' ? {useEffect:fn=>fn()} : name==='next/navigation' ? {usePathname:()=>location.pathname} : name==='@/lib/supabase/client' ? {tryCreateClient:()=>({rpc:(name,args)=>{calls.push({name,args});return Promise.resolve({error:null});}})} : {publicAnalyticsPath,trafficDevice,trafficSource}, window:{location}, location, sessionStorage, localStorage, navigator:{doNotTrack:dnt,userAgent:'Mozilla iPhone Mobile'}, document:{referrer,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)}, crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000001'}, Intl, Date, JSON, URLSearchParams, Element };
 runInNewContext(trackerJs, context);
 return {calls,location,run:()=>exports.MarketingTracker(),click:href=>listeners.get('click')?.({target:new Element(href)})};
}
const tracker = trackerHarness(); tracker.run(); tracker.click('tel:01055580528'); tracker.click('sms:01055580528?body=private-customer-message');
assert.equal(tracker.calls.length,3);
assert.equal(tracker.calls[0].args.p_details.source_detail,'naver_search');
assert.equal(tracker.calls[1].args.p_source,'naver');
assert.equal(tracker.calls[2].args.p_event,'sms');
assert.ok(!JSON.stringify(tracker.calls).includes('private-customer-message'));
assert.ok(!JSON.stringify(tracker.calls).includes('01055580528'));
tracker.location.pathname='/works/naver-224401754733';tracker.location.search='';tracker.run();tracker.click('tel:01055580528');
assert.equal(tracker.calls.at(-1).args.p_details.landing_path,'/services/diesel-cleaning');
assert.equal(tracker.calls.at(-1).args.p_details.page_path,'/works/naver-224401754733');
assert.equal(tracker.calls.at(-1).args.p_details.source_detail,'naver_search');
for(const options of [{host:'localhost'},{dnt:'1'},{path:'/admin/marketing'}]){const blocked=trackerHarness(options);blocked.run();assert.equal(blocked.calls.length,0);}
const mixed=buildTrafficVisits([{...base,event:'visit'}, {...detailed,event:'visit',page:'diesel'}]);
assert.equal(mixed[0].firstAt,null,'Do not invent historical arrival time from a later timed page');
console.log('Real tracker mocked SDK checks passed: source retention, phone+SMS, minimization, DNT/admin/local exclusions.');
