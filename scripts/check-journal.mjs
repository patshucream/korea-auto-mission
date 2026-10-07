import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const root=process.cwd();const cache=new Map();
function load(relative){
 if(cache.has(relative))return cache.get(relative);
 if(relative.endsWith('.json'))return JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
 const m={exports:{}};cache.set(relative,m.exports);
 const code=ts.transpileModule(fs.readFileSync(path.join(root,relative),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{exports:m.exports,module:m,URL,require:id=>id.startsWith('@/')?load('src/'+id.slice(2)+(id.endsWith('.json')?'':'.ts')):require(id)});
 return m.exports;
}
const {buildJournalChapters,journalText}=load('src/lib/works/journal.ts');
const {sanitizeEditorHtml}=load('src/lib/editor/sanitize.ts');
const entries=load('src/lib/data/blog-drafts.json');
for(const {work} of entries){
 const chapters=buildJournalChapters(work);
 assert.ok(chapters.length>0,work.title);
 assert.equal(new Set(chapters.map(c=>c.id)).size,chapters.length);
 const original=[...sanitizeEditorHtml(work.content_html).matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(Array.from(chapters.flatMap(c=>c.photos.map(p=>p.src))),original,work.title+' retains all body photos');
 for(const chapter of chapters)assert.ok(!/<script|onerror=|javascript:/i.test(chapter.html));
}
const custom={content_html:'<h2>점검 &amp; 진단</h2><p>실제 결과</p><figure><img src="/safe.jpg" alt="부품" /><figcaption>정비 사진</figcaption><p>별도 설명</p></figure><h2>사진</h2><img src="/detail.jpg" data-caption="밸브 &amp; 연결부" /><img src="javascript:alert(1)" onerror="bad()" /><script>bad()</script>'};
const result=buildJournalChapters(custom);
assert.equal(result[0].title,'점검 & 진단');assert.equal(result[0].photos[0].caption,'정비 사진');assert.ok(result[0].html.includes('별도 설명'));
assert.equal(result[1].photos[0].caption,'밸브 & 연결부');assert.equal(result[1].photos.length,1);assert.ok(!JSON.stringify(result).includes('javascript:'));
const fallback=buildJournalChapters({symptoms:'<이상 증상>\n두 번째 줄',diagnosis:null});assert.equal(fallback.length,1);assert.ok(fallback[0].html.includes('&lt;이상 증상&gt;<br />'));
const {matchesRevisionFields}=load('src/lib/works/journal-revisions.ts');
const revisions=load('src/lib/data/journal-revisions.json');
assert.ok(revisions.length > 0);
for(const r of revisions){
 assert.ok(/^https:\/\/blog\.naver\.com\/(koreaautolife|97ga074)\/\d+$/.test(r.sourceUrl));
 assert.equal(matchesRevisionFields(r.before,r.before),true);
 assert.equal(matchesRevisionFields({...r.before,content_html:'관리자가 수정한 글'},r.before),false);
 assert.equal(matchesRevisionFields(r.after,r.after),true);
 assert.ok(journalText(r.after.content_html).length>100);
 const oldImages=[...r.before.content_html.matchAll(/src="([^"]+)"/g)].map(m=>m[1]);
 const newImages=buildJournalChapters(r.after).flatMap(c=>c.photos.map(p=>p.src));
 for(const src of [...oldImages,...(r.before.gallery_image_paths??[])])assert.ok(newImages.includes(src),'Preserve '+src);
 assert.equal(new Set(newImages).size,newImages.length);
 for(const src of newImages)assert.ok(fs.existsSync(path.join(root,'public',src)));
 if(r.after.representative_image_path)assert.ok(['224425270383','224424117180'].some(id=>r.sourceUrl.endsWith(id)));
 for(const key of ['title','id','slug','status','is_published','naver_blog_url'])assert.ok(!(key in r.after));
}
// Render the real journal/context components; unrelated layout and photo widgets
// are inert boundaries so these checks require no browser, network, or database.
const componentCache=new Map();
const inert={
 '@/components/layout/Header':'Header','@/components/layout/Footer':'Footer',
 './WorkCard':'WorkCard','./WorkMobileCtaBar':'WorkMobileCtaBar','./JournalPhotos':'JournalPhotos',
};
function loadComponent(relative){
 if(componentCache.has(relative))return componentCache.get(relative);
 const m={exports:{}};componentCache.set(relative,m.exports);
 const code=ts.transpileModule(fs.readFileSync(path.join(root,relative),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{exports:m.exports,module:m,URL,require:id=>{
  if(id.endsWith('.module.css'))return {};
  if(id==='next/link')return function TestLink({href,children,...props}){return createElement('a',{href,...props},children);};
  if(id==='@/components/ui/SmartImage')return {SmartImage:({path:src,alt})=>createElement('img',{src,alt})};
  if(id==='@/components/ui/SmsLink')return {SmsLink:({children,className})=>createElement('a',{className},children)};
  if(inert[id])return {[inert[id]]:()=>null};
  if(id==='./WorkServiceContext')return loadComponent('src/components/works/WorkServiceContext.tsx');
  if(id.startsWith('@/lib/'))return load('src/'+id.slice(2)+'.ts');
  if(id==='react/jsx-runtime')return require(id);
  throw Error('Unexpected component import: '+id);
 }});
 return m.exports;
}
const {RepairJournal}=loadComponent('src/components/works/RepairJournal.tsx');
const settings={address:'부산 사상구 삼덕로 95',phone:'051-000-0000'};
const renderWork=work=>({work,html:renderToStaticMarkup(createElement(RepairJournal,{work,settings,related:[]}))});
const renderCase=id=>{
 const work=entries.find(entry=>entry.source.postId===id)?.work;
 assert.ok(work,'Missing render fixture '+id);
 return renderWork(work);
};
// Preserve the reproduced speed/parts-only regressions even when those original
// candidates are removed from the publication batch. These are render fixtures.
const f150=renderWork({...entries[0].work,vehicle_brand:'포드',manufacturer:'포드',vehicle_model:'F150',mileage:'',symptoms:'약 50~60km/h 이상 주행에서 슬립과 떨림'});
assert.equal(f150.work.mileage,'');
assert.ok(f150.html.includes('50~60km/h'),'Actual speed remains in the symptom text');
assert.ok(!f150.html.includes('<dt>주행거리</dt>'),'Speed must not become an odometer reading');
const q3=renderCase('224271694802');
assert.ok(q3.html.includes('현재 매장은 부산 사상구 삼덕로 95에 있습니다.'));
assert.ok(!q3.html.includes('부산 사상구 삼덕로 95에서 진행'),'Current address must not be presented as the historical work location');
assert.ok(q3.html.includes('<dt>주행거리</dt><dd>'+q3.work.mileage+'</dd>'),'Explicit mileage is retained');
assert.ok(q3.html.includes('href="/services/transmission"'));
assert.ok(q3.html.includes('오토미션 수리 · 증상별 미션수리 안내'),'Verified transmission cases link using both service names');
const cleaning=renderCase('224426404936');
assert.ok(!cleaning.html.includes('href="/services/transmission"'),'Cleaning-only cases must not acquire transmission service claims');
const cayenne=renderWork({...entries[0].work,vehicle_brand:'포르쉐',manufacturer:'포르쉐',vehicle_model:'카이엔',representative_image_path:'/test-parts.jpg'});
assert.ok(cayenne.html.includes('alt="포르쉐 카이엔 정비 작업 사진"'),'Parts-only contractor work uses a neutral hero description');
assert.ok(!cayenne.html.includes('alt="포르쉐 카이엔 입고 차량"'));
console.log(`PASS: ${entries.length} case bodies preserve all photos; captions, fallback text, XSS stripping, ${revisions.length} source-scoped edit-preservation guards, rendered F150 speed/explicit Q3 mileage/current address/Cayenne parts-photo accuracy, and category-scoped transmission links verified.`);
