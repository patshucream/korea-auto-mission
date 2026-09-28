import assert from "node:assert/strict";
import { listingSearchPage, isIndexableWork } from "../src/lib/search-pages.ts";

const site = "https://koreauto.co.kr";
assert.equal(listingSearchPage("/works", {}).canonicalPath, "/works");
assert.equal(listingSearchPage("/works", { page: "2" }).canonicalPath, "/works?page=2");
assert.equal(listingSearchPage("/works", { page: "2", utm_source: "google" }).canonicalPath, "/works?page=2");
assert.equal(listingSearchPage("/works", { q: "매연", page: "2" }).filtered, true);
assert.equal(listingSearchPage("/works", { brand: "기아" }).canonicalPath, "/works");
for (const page of ["-2", "1.5", "Infinity", "oops"]) assert.equal(listingSearchPage("/works", { page }).page, 1);
assert.equal(isIndexableWork({ slug: "real-case", status: "published" }, site), true);
for (const status of ["draft", "private", "trash"]) assert.equal(isIndexableWork({ slug: "real-case", status }, site), false);
assert.equal(isIndexableWork({ slug: "real-case", noindex: true }, site), false);
assert.equal(isIndexableWork({ slug: "real-case", canonical_url: `${site}/works/real-case` }, site), true);
assert.equal(isIndexableWork({ slug: "real-case", canonical_url: "/works/real-case" }, site), true);
assert.equal(isIndexableWork({ slug: "real-case", canonical_url: `${site}/` }, site), false);
assert.equal(isIndexableWork({ slug: "real-case", canonical_url: "https://example.org/copied" }, site), false);
console.log("Search canonical, pagination and publication regression checks passed.");
