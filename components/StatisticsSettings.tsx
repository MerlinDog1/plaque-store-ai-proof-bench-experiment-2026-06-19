import React, { useEffect, useState } from 'react';
import { STATISTICS_CHANGED, STATISTICS_KEY, setStatisticsEnabled, statisticsEnabled } from '../services/siteStatistics';

export function StatisticsSettings() {
  const [enabled, setEnabled] = useState(statisticsEnabled);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    setReady(true);
    const update = () => setEnabled(statisticsEnabled());
    const storage = (event: StorageEvent) => {
      if (event.key === STATISTICS_KEY || event.key === null) update();
    };
    update();
    window.addEventListener(STATISTICS_CHANGED, update);
    window.addEventListener('storage', storage);
    return () => {
      window.removeEventListener(STATISTICS_CHANGED, update);
      window.removeEventListener('storage', storage);
    };
  }, []);
  return <section className="statistics-settings" aria-labelledby="statistics-title">
    <div className="statistics-settings__row">
      <h2 id="statistics-title">Statistics</h2>
      <button type="button" role="switch" aria-label="Statistics" aria-checked={enabled}
        aria-describedby="statistics-description statistics-status" disabled={!ready}
        className="statistics-switch" onClick={() => setSaved(setStatisticsEnabled(!enabled))}>
        <span aria-hidden="true" className="statistics-switch__track"><span /></span>
        <span>{enabled ? 'On' : 'Off'}</span>
      </button>
    </div>
    <p id="statistics-description">Count anonymous visits to improve the site. Turn this off at any time, free of charge. This is separate from Accept or Reject for optional cookies.</p>
    <p id="statistics-status" role="status">{enabled ? 'On — anonymous visits are counted.' : 'Off — anonymous visit counting has stopped.'}
      {saved ? ' Your choice applies to this browser.' : ' Your browser blocked saving this choice; it applies to this page only.'}</p>
  </section>;
}
