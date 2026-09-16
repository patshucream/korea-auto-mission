import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const project=fileURLToPath(new URL('../', import.meta.url));
const code=ts.transpileModule(fs.readFileSync(project+'/src/lib/works/blog-imports.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const env={};
const servicesModule={exports:{}};
const servicesCode=ts.transpileModule(fs.readFileSync(project+'/src/lib/works/services.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(servicesCode,{exports:servicesModule.exports,module:servicesModule});
const moduleObject={exports:{}};
vm.runInNewContext(code,{exports:moduleObject.exports,module:moduleObject,process:{env},URL,require:id=>{
  if(id==='@/lib/works/services')return servicesModule.exports;
  if(id==='@/lib/data/blog-drafts.json')return JSON.parse(fs.readFileSync(project+'/src/lib/data/blog-drafts.json','utf8'));
  throw Error('Unexpected import: '+id);
}});
const api=moduleObject.exports;
assert.equal(api.getBlogPreviewWorks().length,0,'Drafts must be hidden by default');
env.BLOG_IMPORT_PREVIEW='true';
assert.equal(api.getBlogPreviewWorks().length,0,'Only explicit 1 enables preview');
env.BLOG_IMPORT_PREVIEW='1';
const drafts=api.getBlogPreviewWorks();
assert.equal(drafts.length,10);
assert.equal(new Set(drafts.map(w=>w.id)).size,10);
assert.equal(new Set(drafts.map(w=>w.slug)).size,10);
for(const w of drafts){
  assert.equal(w.status,'draft');assert.equal(w.is_published,false);assert.equal(w.noindex,true);assert.equal(w.published_at,null);
  assert.ok(w.content_html.includes(w.naver_blog_url));
  const images=[w.representative_image_path,...w.gallery_image_paths,...Array.from(w.content_html.matchAll(/<img src="([^"]+)"/g),m=>m[1])];
  for(const image of images){assert.ok(image.startsWith('/blog-imports/'));assert.ok(fs.existsSync(path.join(project,'public',image)));}
}
const first=drafts[0];
const stored={...first,id:'existing',slug:'existing-slug',title:'Edited existing case',is_published:true,status:'published',naver_blog_url:`https://blog.naver.com/PostView.naver?blogId=97ga074&logNo=224348859508&redirect=Dlog`};
const merged=api.mergeBlogPreviewWorks([stored]);
assert.equal(merged.length,10,'A different Naver URL form must still deduplicate');
assert.equal(merged.find(w=>w.id==='existing').title,'Edited existing case');
const bmw=api.paginateBlogPreview(drafts,[],{q:'슬립',brand:'BMW'});
assert.equal(bmw.total,1);assert.equal(bmw.items[0].vehicle_model,'325CI');
const cleaningServices=[
  {id:'48e02a71-0e47-43c3-803f-dadf181d7cd1',title:'흡기 클리닝',total:4},
  {id:'60fd5e9f-4995-4a77-ab0b-7a20f9c4a8c7',title:'인젝터 클리닝',total:3},
  {id:'8b322363-aca4-4eea-b4b4-581643ab0884',title:'DPF 클리닝',total:3},
];
for(const service of cleaningServices){
  const filtered=api.paginateBlogPreview(drafts,cleaningServices,{service:service.id});
  assert.equal(filtered.total,service.total,service.title+' includes secondary services');
  assert.ok(filtered.items.some(w=>w.slug==='naver-224327070200'),'Maxcruz appears in every cleaning category');
  assert.equal(api.paginateBlogPreview(drafts,[],{category:service.title}).total,service.total);
  assert.ok(servicesModule.exports.workServiceFilter(service).includes('general_tags.cs.'));
}
const maxcruz=drafts.find(w=>w.slug==='naver-224327070200');
assert.equal(servicesModule.exports.getWorkServiceLabels(maxcruz).join(', '),'흡기 클리닝, 인젝터 클리닝, DPF 클리닝');
assert.equal(api.paginateBlogPreview(drafts,cleaningServices,{service:cleaningServices[2].id,q:'맥스크루즈'}).total,1);
const page1=api.paginateBlogPreview(drafts,[],{page:1,pageSize:3});
const page2=api.paginateBlogPreview(drafts,[],{page:2,pageSize:3});
assert.equal(page1.total,10);assert.equal(page1.totalPages,4);assert.equal(page2.items.length,3);
assert.ok(!page1.items.some(a=>page2.items.some(b=>a.id===b.id)));
assert.equal(api.paginateBlogPreview(drafts,[],{q:'no-such-car'}).total,0);
delete env.BLOG_IMPORT_PREVIEW;
assert.equal(api.mergeBlogPreviewWorks([stored]).length,1,'Production list cannot receive draft additions');
console.log('PASS: default-off privacy, 10 draft records, local assets, source links, source-URL deduplication, existing-content preservation, search, multi-service categories (intake 4 / injector 3 / DPF 3), Maxcruz in all three, pagination.');
