import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const root = process.cwd();
const cache = new Map();
let authenticated = false;
let rows = new Map();
let reads = 0;
let writes = [];
let invalidations = [];
let race = false;
let failRead = false;
let failWrite = false;
const clone = value => JSON.parse(JSON.stringify(value));
const db = {
  from(table) {
    assert.equal(table, 'work_cases');
    let payload;
    let selectedColumns;
    const filters = [];
    const query = {
      select(value) { selectedColumns = value; return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      is(key, value) { filters.push([key, value]); return query; },
      update(value) { payload = value; writes.push({ payload: clone(value), filters }); return query; },
      async maybeSingle() {
        if (!payload) {
          reads++;
          if (failRead) return { data: null, error: new Error('test read failure') };
          assert.equal(filters[0][0], 'slug', 'lookup must use slug, not snapshot ID');
          for (const field of ['published_at', 'manufacturer', 'vehicle_brand']) assert.ok(selectedColumns.split(',').includes(field), `read trigger input ${field}`);
        } else {
          assert.deepEqual(Object.keys(payload), ['seo_description']);
          for (const key of ['id', 'slug', 'naver_blog_url', 'status', 'is_published', 'deleted_at', 'updated_at', 'seo_description']) {
            assert.ok(filters.some(([name]) => name === key), `CAS guard ${key}`);
          }
          if (failWrite) return { data: null, error: new Error('test write failure') };
          if (race) {
            const slug = filters.find(([key]) => key === 'slug')[1];
            rows.get(slug).updated_at = 'later concurrent edit';
          }
        }
        const row = [...rows.values()].find(item => filters.every(([key, value]) => (item[key] ?? null) === value));
        if (!row) return { data: null, error: null };
        if (payload) {
          Object.assign(row, clone(payload));
          // Emulate migration 006 for the published rows accepted by this action.
          row.updated_at = '2026-09-30T00:00:01Z';
          row.published_at ??= '2026-09-30T00:00:01Z';
          if ((row.manufacturer == null || /^ *$/.test(row.manufacturer)) && row.vehicle_brand != null) row.manufacturer = row.vehicle_brand;
          if (row.manufacturer != null && !/^ *$/.test(row.manufacturer)) row.vehicle_brand = row.manufacturer;
        }
        return { data: clone(row), error: null };
      },
    };
    return query;
  },
};

function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  if (relative.endsWith('.json')) {
    const json = JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
    cache.set(relative, json); return json;
  }
  const testModule = { exports: {} }; cache.set(relative, testModule.exports);
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports: testModule.exports, module: testModule, Set, require(id) {
    if (id === '@/lib/auth/require-admin') return { requireAdmin: async () => ({ user: authenticated ? { id: 'mock-admin' } : null, supabase: db }) };
    if (id === 'next/cache') return { revalidatePath: value => invalidations.push(value) };
    if (id.startsWith('@/')) return load('src/' + id.slice(2) + (id.endsWith('.json') ? '' : '.ts'));
    throw new Error(`Unexpected dependency: ${id}`);
  } });
  return testModule.exports;
}

const manifest = load('src/lib/data/work-seo-revisions.json');
const actions = load('src/lib/actions/work-seo-revisions.ts');
const rules = load('src/lib/works/seo-revisions.ts');
const entries = manifest.entries;
assert.equal(manifest.applyEnabled, true, 'checked-in application is enabled by user approval');
assert.equal(manifest.approval.status, 'approved');
assert.equal(manifest.approval.userQuote, '좋네 진행해봐');
const approvedApplyEnabled = manifest.applyEnabled;
assert.equal(entries.length, 35);
assert.equal(new Set(entries.map(e => e.slug)).size, 35);
assert.equal(entries.filter(e => e.decision === 'revise').length, 32);
assert.equal(entries.filter(e => e.decision === 'keep').length, 3);
assert.equal(entries.filter(e => e.publicVerification.status === 'observed').length, 11);
for (const e of entries) {
  assert.equal(e.before.title, e.after.title); assert.equal(e.before.seo_title, e.after.seo_title);
  assert.ok(e.after.seo_description.length <= 160);
  assert.deepEqual(e.changedFields, e.decision === 'keep' ? [] : ['seo_description']);
}
const target = entries.find(e => e.slug === 'naver-224409409390');
function reset() {
  rows = new Map(entries.map(e => [e.slug, { ...e.before, ...e.evidence.workFields,
    id: e.id, slug: e.slug, naver_blog_url: e.sourceUrl,
    status: 'published', is_published: true, deleted_at: null, updated_at: '2026-09-30T00:00:00Z',
    published_at: '2026-09-01T00:00:00Z', manufacturer: e.evidence.workFields.vehicle_brand,
    content_html: 'original body', canonical_url: null,
  }]));
  reads = 0; writes = []; invalidations = []; race = false; failRead = false; failWrite = false;
}
function selectedResult(response) { return response.results.find(r => r.slug === target.slug); }

reset();
// Exercise the disabled branch in memory even though the reviewed manifest is now approved.
manifest.applyEnabled = false;
assert.ok((await actions.previewWorkSeoRevisions()).error);
assert.ok((await actions.applyWorkSeoRevisions([target.slug])).error);
assert.equal(reads, 0); assert.equal(writes.length, 0);
authenticated = true;
let result = await actions.previewWorkSeoRevisions();
assert.equal(result.results.filter(r => r.status === 'ready').length, 32);
assert.equal(result.results.filter(r => r.status === 'keep').length, 3);
assert.equal(reads, 35); assert.equal(writes.length, 0); assert.equal(invalidations.length, 0);
reset();
result = await actions.applyWorkSeoRevisions([target.slug]);
assert.equal(selectedResult(result).status, 'locked'); assert.equal(reads, 0); assert.equal(writes.length, 0);

// Enable only this in-memory fixture: execute the real server-action write branch with a mock DB.
manifest.applyEnabled = true;
assert.ok((await actions.applyWorkSeoRevisions(['unknown-slug'])).error);
assert.equal(reads, 0); assert.equal(writes.length, 0);
const before = clone([...rows.values()]);
result = await actions.applyWorkSeoRevisions([target.slug, target.slug]);
assert.equal(selectedResult(result).status, 'saved');
assert.equal(result.results.filter(r => r.status === 'unselected').length, 34);
assert.equal(reads, 1); assert.equal(writes.length, 1);
for (const old of before) {
  const current = rows.get(old.slug);
  assert.deepEqual(current, old.slug === target.slug ? { ...old, seo_description: target.after.seo_description, updated_at: '2026-09-30T00:00:01Z' } : old);
}
assert.ok(invalidations.includes(`/works/${target.slug}`));
result = await actions.applyWorkSeoRevisions([target.slug]);
assert.equal(selectedResult(result).status, 'already-applied'); assert.equal(writes.length, 1);

for (const patch of [
  { naver_blog_url: 'https://blog.naver.com/other/224409409390' },
  { seo_description: 'later administrator edit' }, { title: 'changed title' },
  { symptoms: 'changed evidence' }, { updated_at: null },
]) {
  reset(); Object.assign(rows.get(target.slug), patch);
  result = await actions.applyWorkSeoRevisions([target.slug]);
  assert.equal(selectedResult(result).status, 'conflict'); assert.equal(writes.length, 0);
}
// Null/blank and disagreement cases exercise migration 006, not merely payload allowlisting.
for (const patch of [{ published_at: null }, { manufacturer: null }, { manufacturer: '' }, { manufacturer: '   ' }, { manufacturer: '현대' }]) {
  reset(); Object.assign(rows.get(target.slug), patch);
  result = await actions.applyWorkSeoRevisions([target.slug]);
  assert.equal(selectedResult(result).status, 'conflict');
  assert.ok(selectedResult(result).message.includes('자동 보정'));
  assert.equal(writes.length, 0);
}
const stablePublication = { published_at: '2026-09-01T00:00:00Z', manufacturer: '기아', vehicle_brand: '기아' };
for (const [values, expectedChanges] of [
  [{}, []],
  [{ manufacturer: null, vehicle_brand: null }, []],
  [{ manufacturer: '', vehicle_brand: null }, []],
  [{ manufacturer: '', vehicle_brand: '' }, []],
  [{ manufacturer: ' ', vehicle_brand: '' }, ['manufacturer']],
  [{ manufacturer: null, vehicle_brand: '' }, ['manufacturer']],
  [{ manufacturer: '기아', vehicle_brand: null }, ['vehicle_brand']],
  [{ manufacturer: ' 기아 ', vehicle_brand: '기아' }, ['vehicle_brand']],
  [{ manufacturer: '\t', vehicle_brand: '\t' }, []],
  [{ manufacturer: '\t', vehicle_brand: '기아' }, ['vehicle_brand']],
  [{ manufacturer: undefined }, ['manufacturer', 'vehicle_brand']],
]) {
  assert.deepEqual(Array.from(rules.publicationNormalizationChanges({ ...stablePublication, ...values })), expectedChanges);
}
// Both-null values are stable under SQL but must still match the reviewed evidence.
const nullBrandRevision = clone(target);
nullBrandRevision.evidence.workFields.vehicle_brand = null;
reset();
const nullBrandRow = { ...rows.get(target.slug), manufacturer: null, vehicle_brand: null };
assert.equal(rules.reviewSeoRevision(nullBrandRevision, nullBrandRow).status, 'ready');
assert.equal(rules.reviewSeoRevision(target, nullBrandRow).status, 'conflict');
for (const patch of [{ id: '' }, { status: 'draft' }, { is_published: false }, { deleted_at: '2026-09-30' }]) {
  reset(); Object.assign(rows.get(target.slug), patch);
  result = await actions.applyWorkSeoRevisions([target.slug]);
  assert.equal(selectedResult(result).status, 'unavailable'); assert.equal(writes.length, 0);
}
reset(); race = true;
result = await actions.applyWorkSeoRevisions([target.slug]);
assert.equal(selectedResult(result).status, 'conflict');
assert.equal(rows.get(target.slug).seo_description, target.before.seo_description);
assert.equal(invalidations.length, 0);
reset(); rows.get(target.slug).id = 'verified-live-row-id';
result = await actions.applyWorkSeoRevisions([target.slug]);
assert.equal(selectedResult(result).status, 'saved');
assert.equal(writes[0].filters.find(([key]) => key === 'id')[1], 'verified-live-row-id', 'write must use the real DB ID despite a different snapshot UUID');
reset(); failWrite = true;
assert.equal(selectedResult(await actions.applyWorkSeoRevisions([target.slug])).status, 'error');
reset(); failRead = true;
assert.equal(selectedResult(await actions.applyWorkSeoRevisions([target.slug])).status, 'error'); assert.equal(writes.length, 0);
reset(); const keep = entries.find(e => e.decision === 'keep');
result = await actions.applyWorkSeoRevisions([keep.slug]);
assert.equal(result.results.find(r => r.slug === keep.slug).status, 'keep'); assert.equal(writes.length, 0);
manifest.applyEnabled = approvedApplyEnabled;
console.log('PASS: user-approved enabled manifest; both disabled gate and enabled save branches tested in memory; 35 cases, 32 description changes/3 keeps, 11 public observations; auth, read-only preview, description-only payload with normal updated_at change, migration-006 publication/manufacturer/brand guards and null/space/tab boundaries, actual DB ID, selection, repeat no-op, exact-source/evidence conflicts, CAS race, DB errors and cache invalidation verified with mock DB. No external DB calls.');
