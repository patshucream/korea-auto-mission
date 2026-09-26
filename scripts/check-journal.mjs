import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
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
assert.equal(revisions.length,3);
for(const r of revisions){
 assert.ok(r.sourceUrl.startsWith('https://blog.naver.com/koreaautolife/'));
 assert.equal(matchesRevisionFields(r.before,r.before),true);
 assert.equal(matchesRevisionFields({...r.before,content_html:'관리자가 수정한 글'},r.before),false);
 assert.equal(matchesRevisionFields(r.after,r.after),true);
 assert.ok(journalText(r.after.content_html).length>journalText(r.before.content_html).length);
 for(const key of ['title','id','slug','status','is_published','naver_blog_url','representative_image_path'])assert.ok(!(key in r.after));
}
console.log('PASS: 35 case bodies preserve all photos; captions, fallback text, XSS stripping, and 3 source-scoped edit-preservation guards verified.');
