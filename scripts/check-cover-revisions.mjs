import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const revisions=JSON.parse(fs.readFileSync('src/lib/data/cover-revisions.json'));
assert.equal(revisions.length,18);assert.equal(new Set(revisions.map(r=>r.slug)).size,18);
for(const r of revisions){assert.ok(fs.existsSync('public'+r.after));assert.ok(r.after.includes(r.slug.slice(6)));assert.ok(r.sourceUrl.endsWith(r.slug.slice(6)));}
const code=ts.transpileModule(fs.readFileSync('src/lib/actions/cover-revisions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
for(const scenario of ['valid','private','deleted','wrong-source','changed','already','race','unauthorized']){
 const revision=revisions[0];let writes=0;let payload;
 const row={id:'db-id',slug:revision.slug,naver_blog_url:scenario==='wrong-source'?'other':revision.sourceUrl,representative_image_path:scenario==='already'?revision.after:scenario==='changed'?'edited':revision.before,status:scenario==='private'?'draft':'published',is_published:scenario!=='private',deleted_at:scenario==='deleted'?'date':null};
 const supabase={from(){return {select(){return {eq(){return {single:async()=>({data:row})}}}},update(data){writes++;payload=data;const q={eq(){return q},is(){return q},select(){return q},maybeSingle:async()=>({data:scenario==='race'?null:{id:'db-id'}})};return q;}}}};
 const m={exports:{}};vm.runInNewContext(code,{exports:m.exports,module:m,require(id){
 if(id==='next/cache')return {revalidatePath(){}};
 if(id==='@/lib/auth/require-admin')return {requireAdmin:async()=>({user:scenario==='unauthorized'?null:{id:'admin'},supabase})};
 if(id==='@/lib/data/cover-revisions.json')return [revision];
 if(id==='@/lib/works/blog-imports')return {naverPostKey:x=>x};throw Error(id);
 }});
 const result=await m.exports.applyCoverRevisions();assert.equal(writes,['valid','race'].includes(scenario)?1:0,scenario);
 if(payload)assert.deepEqual(Object.keys(payload),['representative_image_path']);
 if(scenario==='race')assert.ok(result.results[0].message.includes('저장되지'));
}
console.log('PASS: 18 source-linked photos, representative-photo-only updates, private/deleted/mismatched/edited cases preserved, idempotency, race and authorization checks.');
