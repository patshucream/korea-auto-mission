import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/lib/actions/blog-import.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
for(const state of ['published','draft','private','deleted','missing']){
 let inserts=0,updates=0;
 const work={id:'new-id',slug:'new-slug',service_id:'s',service_category:'정비',general_tags:[]};
 const source={postId:'123',url:'https://blog.naver.com/koreaautolife/123',publishedAt:'2026-01-01T00:00:00Z'};
 const existing=state==='missing'?[]:[{id:'existing-id',slug:work.slug,status:state,is_published:state==='published',deleted_at:state==='deleted'?'2026-01-01':null}];
 const supabase={from(table){return {
 select(){return table==='services'?Promise.resolve({data:[{id:'s',title:'정비'}]}):{or:async()=>({data:existing})};},
 insert(){inserts++;return {select(){return {single:async()=>({data:{id:work.id}})}}};},
 update(){updates++;throw Error('Existing records must not change');}
 };}};
 const moduleObject={exports:{}};
 vm.runInNewContext(code,{exports:moduleObject.exports,module:moduleObject,console,require(id){
 if(id==='next/cache')return {revalidatePath(){}};
 if(id==='@/lib/auth/require-admin')return {requireAdmin:async()=>({user:{id:'admin'},supabase})};
 if(id==='@/lib/works/blog-imports')return {getCurrentBlogImports:()=>[{source,work}],naverPostKey:url=>url};
 throw Error(id);
 }});
 const result=await moduleObject.exports.publishPreparedBlogCases();
 assert.equal(updates,0);assert.equal(inserts,state==='missing'?1:0);
 assert.equal(result.results[0].status,state==='missing'?'saved':'skipped');
}
console.log('PASS: published, draft, private and deleted cases preserved; only missing cases inserted.');
