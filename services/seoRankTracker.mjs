export const trackedSearches = [
  { id: 'custom-plaques-uk', query: 'custom plaques uk', group: 'Core', weight: 5, target: '/custom-plaques' },
  { id: 'custom-plaques', query: 'custom plaques', group: 'Core', weight: 5, target: '/custom-plaques' },
  { id: 'engraved-plaques-uk', query: 'engraved plaques uk', group: 'Core', weight: 5, target: '/custom-plaques' },
  { id: 'personalised-plaques-uk', query: 'personalised plaques uk', group: 'Core', weight: 4, target: '/custom-plaques' },
  { id: 'metal-plaques-uk', query: 'metal plaques uk', group: 'Core', weight: 4, target: '/custom-plaques' },
  { id: 'custom-metal-plaques', query: 'custom metal plaques', group: 'Core', weight: 5, target: '/custom-plaques' },
  { id: 'brass-plaques-uk', query: 'brass plaques uk', group: 'Material', weight: 5, target: '/brass-plaques' },
  { id: 'engraved-brass-plaques', query: 'engraved brass plaques', group: 'Material', weight: 5, target: '/brass-plaques' },
  { id: 'custom-brass-plaques', query: 'custom brass plaques', group: 'Material', weight: 5, target: '/brass-plaques' },
  { id: 'stainless-steel-plaques-uk', query: 'stainless steel plaques uk', group: 'Material', weight: 5, target: '/stainless-steel-plaques' },
  { id: 'engraved-stainless-steel-plaques', query: 'engraved stainless steel plaques', group: 'Material', weight: 5, target: '/stainless-steel-plaques' },
  { id: 'memorial-plaques-uk', query: 'memorial plaques uk', group: 'Memorial', weight: 5, target: '/memorial-plaques' },
  { id: 'custom-memorial-plaques', query: 'custom memorial plaques', group: 'Memorial', weight: 5, target: '/memorial-plaques' },
  { id: 'brass-memorial-plaques', query: 'brass memorial plaques', group: 'Memorial', weight: 5, target: '/memorial-plaques' },
  { id: 'stainless-steel-memorial-plaques', query: 'stainless steel memorial plaques', group: 'Memorial', weight: 5, target: '/memorial-plaques' },
  { id: 'outdoor-memorial-plaques', query: 'outdoor memorial plaques', group: 'Memorial', weight: 4, target: '/memorial-plaques' },
  { id: 'bench-plaques-uk', query: 'bench plaques uk', group: 'Bench', weight: 5, target: '/bench-plaques' },
  { id: 'memorial-bench-plaques', query: 'memorial bench plaques', group: 'Bench', weight: 5, target: '/bench-plaques' },
  { id: 'engraved-bench-plaques', query: 'engraved bench plaques', group: 'Bench', weight: 5, target: '/bench-plaques' },
  { id: 'brass-bench-plaques', query: 'brass bench plaques', group: 'Bench', weight: 5, target: '/bench-plaques' },
  { id: 'garden-memorial-plaques', query: 'garden memorial plaques', group: 'Garden', weight: 4, target: '/garden-plaques' },
  { id: 'pet-memorial-plaques-uk', query: 'pet memorial plaques uk', group: 'Garden', weight: 4, target: '/memorial-plaques' },
  { id: 'tree-plaques-uk', query: 'tree plaques uk', group: 'Garden', weight: 4, target: '/garden-plaques' },
  { id: 'opening-plaques-uk', query: 'opening plaques uk', group: 'Opening', weight: 5, target: '/opening-plaques' },
  { id: 'commemorative-plaques-uk', query: 'commemorative plaques uk', group: 'Opening', weight: 4, target: '/opening-plaques' },
];

export const normalizeSearchQuery = (value) => String(value || '')
  .normalize('NFKC')
  .trim()
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/\s+/g, ' ');

const parseCsv = (input) => {
  const text = String(input || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  row.push(field.replace(/\r$/, ''));
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
};

const headerIndex = (headers, candidates) => {
  const normalized = headers.map((header) => normalizeSearchQuery(header).replace(/[^a-z0-9]+/g, ''));
  return normalized.findIndex((header) => candidates.includes(header));
};

const parseNumber = (value) => {
  const normalized = String(value ?? '').trim().replace(/,/g, '').replace(/%$/, '');
  if (!normalized || normalized === '-' || normalized === '—') return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

export const parseSearchConsoleCsv = (csvText, snapshotDate = new Date().toISOString().slice(0, 10)) => {
  const rows = parseCsv(csvText);
  if (rows.length < 2) throw new Error('This CSV does not contain any Search Console rows.');

  const headers = rows[0];
  const queryIndex = headerIndex(headers, ['query', 'queries', 'topqueries', 'keyword', 'searchterm']);
  const clicksIndex = headerIndex(headers, ['clicks']);
  const impressionsIndex = headerIndex(headers, ['impressions']);
  const ctrIndex = headerIndex(headers, ['ctr', 'clickthroughrate']);
  const positionIndex = headerIndex(headers, ['position', 'averageposition', 'avgposition']);
  const pageIndex = headerIndex(headers, ['page', 'landingpage', 'url']);

  if (queryIndex < 0 || positionIndex < 0) {
    throw new Error('Use the Search Console Queries CSV, with Query and Position columns.');
  }

  const trackedByQuery = new Map(trackedSearches.map((search) => [normalizeSearchQuery(search.query), search]));
  const matched = new Map();

  for (const values of rows.slice(1)) {
    const search = trackedByQuery.get(normalizeSearchQuery(values[queryIndex]));
    if (!search) continue;
    const position = parseNumber(values[positionIndex]);
    if (position === null || position <= 0) continue;
    const clicks = clicksIndex >= 0 ? parseNumber(values[clicksIndex]) || 0 : 0;
    const impressions = impressionsIndex >= 0 ? parseNumber(values[impressionsIndex]) || 0 : 0;
    const ctrRaw = ctrIndex >= 0 ? parseNumber(values[ctrIndex]) : null;
    matched.set(search.id, {
      keywordId: search.id,
      position: Number(position.toFixed(2)),
      clicks,
      impressions,
      ctr: ctrRaw === null ? (impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0) : ctrRaw,
      page: pageIndex >= 0 ? String(values[pageIndex] || '').trim() : '',
    });
  }

  if (!matched.size) {
    throw new Error('None of the 25 tracked searches appeared in this export. Try a longer Search Console date range.');
  }

  return {
    date: snapshotDate,
    importedAt: new Date().toISOString(),
    source: 'Google Search Console CSV',
    rows: [...matched.values()],
  };
};

export const positionVisibility = (position) => {
  if (!Number.isFinite(position) || position <= 0) return 0;
  if (position <= 1) return 100;
  if (position <= 3) return 94 - ((position - 2) * 7);
  if (position <= 10) return 76 - ((position - 4) * 7);
  if (position <= 20) return 25 - ((position - 11) * 1.5);
  if (position <= 50) return Math.max(1, 10 - ((position - 21) * 0.3));
  return 0;
};

export const snapshotSummary = (snapshot) => {
  const rowMap = new Map((snapshot?.rows || []).map((row) => [row.keywordId, row]));
  const totalWeight = trackedSearches.reduce((total, search) => total + search.weight, 0);
  const visibility = trackedSearches.reduce((total, search) => {
    const row = rowMap.get(search.id);
    return total + (positionVisibility(row?.position) * search.weight);
  }, 0) / totalWeight;
  const ranked = [...rowMap.values()].filter((row) => Number.isFinite(row.position));
  return {
    visibility: Number(visibility.toFixed(1)),
    tracked: ranked.length,
    top3: ranked.filter((row) => row.position <= 3).length,
    top10: ranked.filter((row) => row.position <= 10).length,
    top20: ranked.filter((row) => row.position <= 20).length,
    clicks: ranked.reduce((total, row) => total + (Number(row.clicks) || 0), 0),
    impressions: ranked.reduce((total, row) => total + (Number(row.impressions) || 0), 0),
  };
};

export const buildKeywordRows = (snapshots) => {
  const ordered = [...(snapshots || [])].sort((a, b) => a.date.localeCompare(b.date));
  const current = ordered.at(-1) || null;
  const previous = ordered.at(-2) || null;
  const currentRows = new Map((current?.rows || []).map((row) => [row.keywordId, row]));
  const previousRows = new Map((previous?.rows || []).map((row) => [row.keywordId, row]));

  return trackedSearches.map((search) => {
    const currentRow = currentRows.get(search.id) || null;
    const previousRow = previousRows.get(search.id) || null;
    const historicPositions = ordered
      .flatMap((snapshot) => snapshot.rows || [])
      .filter((row) => row.keywordId === search.id && Number.isFinite(row.position))
      .map((row) => row.position);
    return {
      ...search,
      current: currentRow,
      previous: previousRow,
      change: currentRow && previousRow ? Number((previousRow.position - currentRow.position).toFixed(2)) : null,
      best: historicPositions.length ? Math.min(...historicPositions) : null,
    };
  });
};

export const makeTrackerTemplateCsv = () => [
  'Query,Clicks,Impressions,CTR,Position,Page',
  ...trackedSearches.map((search) => `"${search.query}",0,0,0,,"https://instaplaque.co.uk${search.target}"`),
].join('\n');
