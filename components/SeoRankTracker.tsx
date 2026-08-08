import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildKeywordRows,
  makeTrackerTemplateCsv,
  parseSearchConsoleCsv,
  snapshotSummary,
  trackedSearches,
} from '../services/seoRankTracker.mjs';

type RankingRow = {
  keywordId: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  page?: string;
};

type RankingSnapshot = {
  date: string;
  importedAt: string;
  source: string;
  rows: RankingRow[];
};

type TrackerFilter = 'all' | 'gains' | 'losses' | 'top10' | 'missing';

const STORAGE_KEY = 'instaplaque-seo-rank-snapshots-v1';
const siteBaseUrl = 'https://instaplaque.co.uk';

const loadSnapshots = (): RankingSnapshot[] => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((snapshot) => (
      snapshot
      && typeof snapshot.date === 'string'
      && Array.isArray(snapshot.rows)
    ));
  } catch {
    return [];
  }
};

const downloadText = (filename: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const formatPosition = (position: number | null | undefined) => (
  Number.isFinite(position) ? Number(position).toFixed(position! % 1 === 0 ? 0 : 1) : '—'
);

const formatCompact = (value: number) => new Intl.NumberFormat('en-GB', {
  notation: value >= 10_000 ? 'compact' : 'standard',
  maximumFractionDigits: 1,
}).format(value);

function VisibilityChart({ snapshots }: { snapshots: RankingSnapshot[] }) {
  const history = snapshots
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12)
    .map((snapshot) => ({ date: snapshot.date, score: snapshotSummary(snapshot).visibility }));

  if (!history.length) {
    return <div className="seo-rank-tracker__chart-empty">Import the first Search Console snapshot to start the visibility chart.</div>;
  }

  const width = 760;
  const height = 180;
  const paddingX = 28;
  const paddingY = 24;
  const xFor = (index: number) => history.length === 1
    ? width / 2
    : paddingX + ((index / (history.length - 1)) * (width - (paddingX * 2)));
  const yFor = (score: number) => height - paddingY - ((score / 100) * (height - (paddingY * 2)));
  const points = history.map((item, index) => `${xFor(index)},${yFor(item.score)}`).join(' ');

  return (
    <div className="seo-rank-tracker__chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weighted search visibility history">
        {[25, 50, 75].map((score) => (
          <line key={score} x1={paddingX} x2={width - paddingX} y1={yFor(score)} y2={yFor(score)} />
        ))}
        {history.length > 1 && <polyline points={points} />}
        {history.map((item, index) => (
          <g key={`${item.date}-${index}`}>
            <circle cx={xFor(index)} cy={yFor(item.score)} r="5" />
            <title>{`${item.date}: ${item.score}% visibility`}</title>
          </g>
        ))}
      </svg>
      <div className="seo-rank-tracker__chart-labels">
        <span>{history[0].date}</span>
        <strong>{history.at(-1)?.score}% visibility</strong>
        <span>{history.at(-1)?.date}</span>
      </div>
    </div>
  );
}

export function SeoRankTracker() {
  const [snapshots, setSnapshots] = useState<RankingSnapshot[]>(loadSnapshots);
  const [snapshotDate, setSnapshotDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [filter, setFilter] = useState<TrackerFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  }, [snapshots]);

  const orderedSnapshots = useMemo(
    () => snapshots.slice().sort((a, b) => a.date.localeCompare(b.date)),
    [snapshots],
  );
  const latest = orderedSnapshots.at(-1) || null;
  const previous = orderedSnapshots.at(-2) || null;
  const summary = snapshotSummary(latest);
  const previousSummary = snapshotSummary(previous);
  const rows = buildKeywordRows(orderedSnapshots);
  const filteredRows = rows.filter((row: ReturnType<typeof buildKeywordRows>[number]) => {
    const query = searchTerm.trim().toLowerCase();
    if (query && !`${row.query} ${row.group} ${row.target}`.toLowerCase().includes(query)) return false;
    if (filter === 'gains') return row.change !== null && row.change > 0;
    if (filter === 'losses') return row.change !== null && row.change < 0;
    if (filter === 'top10') return row.current && row.current.position <= 10;
    if (filter === 'missing') return !row.current;
    return true;
  });

  const importCsv = async (file: File) => {
    setImportError(null);
    setNotice(null);
    try {
      const snapshot = parseSearchConsoleCsv(await file.text(), snapshotDate) as RankingSnapshot;
      setSnapshots((current) => [
        ...current.filter((item) => item.date !== snapshot.date),
        snapshot,
      ].sort((a, b) => a.date.localeCompare(b.date)));
      setNotice(`Saved ${snapshot.rows.length} matching searches for ${snapshot.date}.`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not read this Search Console CSV.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportBackup = () => {
    downloadText(
      `instaplaque-search-rank-history-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ version: 1, searches: trackedSearches, snapshots: orderedSnapshots }, null, 2),
      'application/json',
    );
  };

  const restoreBackup = async (file: File) => {
    setImportError(null);
    setNotice(null);
    try {
      const backup = JSON.parse(await file.text());
      if (backup?.version !== 1 || !Array.isArray(backup.snapshots)) {
        throw new Error('This is not an InstaPlaque rank-tracker backup.');
      }
      const restored = backup.snapshots.filter((snapshot: RankingSnapshot) => (
        snapshot
        && typeof snapshot.date === 'string'
        && Array.isArray(snapshot.rows)
      ));
      setSnapshots(restored.sort((a: RankingSnapshot, b: RankingSnapshot) => a.date.localeCompare(b.date)));
      setNotice(`Restored ${restored.length} ranking snapshots.`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not restore this tracker backup.');
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  const removeLatest = () => {
    if (!latest || !window.confirm(`Remove the ${latest.date} ranking snapshot from this browser?`)) return;
    setSnapshots((current) => current.filter((snapshot) => snapshot !== latest));
    setNotice(`Removed the ${latest.date} snapshot.`);
  };

  return (
    <section className="seo-rank-tracker" aria-labelledby="seo-rank-tracker-title">
      <div className="seo-rank-tracker__intro">
        <div>
          <p>Organic search</p>
          <h2 id="seo-rank-tracker-title">25-search position tracker</h2>
          <span>
            Commercial UK searches selected for likely order value and relevance to the current product range.
          </span>
        </div>
        <div className="seo-rank-tracker__connection">
          <strong>Google Search Console import</strong>
          <span>Private browser storage · API automation not connected</span>
        </div>
      </div>

      <div className="seo-rank-tracker__import">
        <label>
          Snapshot date
          <input type="date" value={snapshotDate} onChange={(event) => setSnapshotDate(event.target.value)} />
        </label>
        <label className="seo-rank-tracker__file-button">
          Import Queries CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) importCsv(file);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => downloadText('instaplaque-25-search-template.csv', makeTrackerTemplateCsv(), 'text/csv')}
        >
          Download manual template
        </button>
        <button type="button" disabled={!snapshots.length} onClick={exportBackup}>Export history</button>
        <label className="seo-rank-tracker__restore-button">
          Restore history
          <input
            ref={backupInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) restoreBackup(file);
            }}
          />
        </label>
        <button type="button" disabled={!latest} onClick={removeLatest}>Remove latest</button>
      </div>

      <details className="seo-rank-tracker__instructions">
        <summary>How to update the tracker</summary>
        <ol>
          <li>In Search Console, open Performance → Search results and choose a consistent date range, such as the last 28 days.</li>
          <li>Choose Export → CSV, unzip it if needed, then import the file named Queries.csv here.</li>
          <li>Repeat on the same schedule. Exact matches from the 25-search set are stored as a dated snapshot.</li>
        </ol>
        <p>Search Console position is Google’s average for real impressions, so it is more honest than a personalised spot check.</p>
      </details>

      {importError && <div className="commerce-warning">{importError}</div>}
      {notice && <div className="commerce-success">{notice}</div>}

      <div className="seo-rank-tracker__stats">
        <div>
          <span>Weighted visibility</span>
          <strong>{latest ? `${summary.visibility}%` : '—'}</strong>
          <small>{previous ? `${summary.visibility - previousSummary.visibility >= 0 ? '+' : ''}${(summary.visibility - previousSummary.visibility).toFixed(1)} since prior` : 'Needs two snapshots for change'}</small>
        </div>
        <div><span>Top 3</span><strong>{latest ? summary.top3 : '—'}</strong><small>of 25 searches</small></div>
        <div><span>Top 10</span><strong>{latest ? summary.top10 : '—'}</strong><small>{latest ? `${summary.top20} in top 20` : 'No snapshot yet'}</small></div>
        <div><span>GSC coverage</span><strong>{latest ? `${summary.tracked}/25` : '—'}</strong><small>queries with impressions</small></div>
        <div><span>Clicks</span><strong>{latest ? formatCompact(summary.clicks) : '—'}</strong><small>{latest ? `${formatCompact(summary.impressions)} impressions` : 'From imported rows'}</small></div>
      </div>

      <VisibilityChart snapshots={orderedSnapshots} />

      <div className="seo-rank-tracker__toolbar">
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Filter search, group or target page"
        />
        <select value={filter} onChange={(event) => setFilter(event.target.value as TrackerFilter)}>
          <option value="all">All 25 searches</option>
          <option value="gains">Gains</option>
          <option value="losses">Losses</option>
          <option value="top10">Top 10</option>
          <option value="missing">No GSC row</option>
        </select>
        <span>{latest ? `Latest: ${latest.date}` : 'No data imported yet'}</span>
      </div>

      <div className="seo-rank-tracker__table-wrap">
        <table>
          <thead>
            <tr>
              <th>Value</th>
              <th>Search</th>
              <th>Target</th>
              <th>Position</th>
              <th>Change</th>
              <th>Best</th>
              <th>Clicks</th>
              <th>Impressions</th>
              <th>CTR</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row: ReturnType<typeof buildKeywordRows>[number]) => (
              <tr key={row.id} className={!row.current ? 'is-missing' : ''}>
                <td><span className={`seo-rank-tracker__priority is-${row.weight}`}>{row.weight}</span></td>
                <td><strong>{row.query}</strong><small>{row.group}</small></td>
                <td><a href={`${siteBaseUrl}${row.target}`} target="_blank" rel="noreferrer">{row.target}</a></td>
                <td><strong>{formatPosition(row.current?.position)}</strong></td>
                <td>
                  {row.change === null ? <span>—</span> : (
                    <mark className={row.change > 0 ? 'is-gain' : row.change < 0 ? 'is-loss' : ''}>
                      {row.change > 0 ? '↑' : row.change < 0 ? '↓' : '–'} {Math.abs(row.change).toFixed(1)}
                    </mark>
                  )}
                </td>
                <td>{formatPosition(row.best)}</td>
                <td>{row.current ? formatCompact(row.current.clicks) : '—'}</td>
                <td>{row.current ? formatCompact(row.current.impressions) : '—'}</td>
                <td>{row.current ? `${row.current.ctr.toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="seo-rank-tracker__footnote">
        “No GSC row” means the exact search had no reportable impressions in that export; it does not prove the site is absent from Google.
      </p>
    </section>
  );
}
