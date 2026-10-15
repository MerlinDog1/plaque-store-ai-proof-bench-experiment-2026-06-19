import assert from 'node:assert/strict';
import {
  buildKeywordRows,
  makeTrackerTemplateCsv,
  parseSearchConsoleCsv,
  snapshotSummary,
  trackedSearches,
} from '../services/seoRankTracker.mjs';

assert.equal(trackedSearches.length, 25, 'Tracker must contain exactly 25 searches.');
assert.equal(new Set(trackedSearches.map((search) => search.id)).size, 25, 'Tracked search ids must be unique.');
assert.equal(new Set(trackedSearches.map((search) => search.query)).size, 25, 'Tracked searches must be unique.');
assert.ok(trackedSearches.every((search) => search.weight >= 1 && search.weight <= 5), 'Search values must use the 1–5 scale.');
assert.ok(trackedSearches.every((search) => search.target.startsWith('/')), 'Every search needs an internal target page.');

const first = parseSearchConsoleCsv(`Top queries,Clicks,Impressions,CTR,Position
custom plaques uk,4,120,3.33%,12.4
"brass plaques uk",9,"1,200",0.75%,4.6
irrelevant query,99,900,11%,1.2`, '2026-08-01');

assert.equal(first.rows.length, 2, 'Only exact tracked searches should be imported.');
assert.equal(first.rows.find((row) => row.keywordId === 'custom-plaques-uk')?.position, 12.4);
assert.equal(first.rows.find((row) => row.keywordId === 'brass-plaques-uk')?.impressions, 1200);

const second = parseSearchConsoleCsv(`Query,Clicks,Impressions,CTR,Average position,Page
CUSTOM PLAQUES UK,7,180,3.89%,8.2,https://instaplaque.co.uk/custom-plaques
brass plaques uk,11,1400,0.79%,6.1,https://instaplaque.co.uk/brass-plaques`, '2026-08-08');

const rows = buildKeywordRows([first, second]);
const custom = rows.find((row) => row.id === 'custom-plaques-uk');
const brass = rows.find((row) => row.id === 'brass-plaques-uk');
assert.equal(custom.change, 4.2, 'Moving from 12.4 to 8.2 should be a positive 4.2-place gain.');
assert.equal(custom.best, 8.2);
assert.equal(brass.change, -1.5, 'Moving from 4.6 to 6.1 should be a 1.5-place loss.');

const summary = snapshotSummary(second);
assert.equal(summary.tracked, 2);
assert.equal(summary.top10, 2);
assert.equal(summary.clicks, 18);
assert.equal(summary.impressions, 1580);
assert.ok(summary.visibility > 0 && summary.visibility < 100);

assert.equal(makeTrackerTemplateCsv().split('\n').length, 26, 'Manual template should contain a header and 25 searches.');
assert.throws(
  () => parseSearchConsoleCsv('Query,Position\nunrelated search,2', '2026-08-08'),
  /None of the 25 tracked searches/,
);

console.log('SEO rank tracker checks passed: 25-search set, Search Console parsing, movement, summaries and template.');
