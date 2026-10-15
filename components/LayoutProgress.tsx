import React, { useEffect, useState } from 'react';
import type { GenerationPhase } from '../services/geminiService';

/** Mounted for one request only: time is elapsed time, never invented completion. */
export function LayoutProgress({ phase }: { phase: GenerationPhase }) {
  const [started] = useState(() => Date.now());
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [started]);
  const title = phase === 'retrying' ? 'Taking another pass at your layout'
    : phase === 'checking' ? 'Checking the wording and fit'
    : phase === 'fallback' ? 'Trying a simpler layout'
    : phase === 'editing' ? 'Applying your layout changes'
    : 'Creating your lettering layout';
  const detail = seconds >= 30
    ? 'Still working. Some layouts take longer, especially when another pass is needed.'
    : phase === 'retrying'
      ? 'The first attempt wasn’t ready. We’re trying again automatically.'
      : 'Usually around 10–30 seconds. A second pass can take longer.';
  return (
    <aside className="layout-progress-card no-print" aria-label="Layout generation progress" data-testid="layout-progress">
      <div className="layout-progress-heading">
        <span className="layout-progress-spinner" aria-hidden="true" />
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>{title}</strong>
          <p>{detail}</p>
        </div>
      </div>
      <div className="layout-progress-footer">
        <span>Keep this page open — no need to press again.</span>
        <span aria-hidden="true">{seconds}s elapsed</span>
      </div>
    </aside>
  );
}
