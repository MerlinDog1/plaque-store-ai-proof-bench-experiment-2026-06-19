import React, { useEffect, useRef, useState } from 'react';
import type { GenerationPhase } from '../services/geminiService';

// A percentage on the plaque while the AI designs the layout (owner msg 6884). Real layouts took 23–71 s, usually
// about 36 s (PostHog, 20–27 Oct 2026). The figure is an estimate: it follows the stage actually reached (spelling
// check, then layout, then the fit check) and the time elapsed, never goes backwards, stays below each stage's limit
// and only reaches 100 when the layout has arrived, so nothing is shown as finished before it is.
const STAGES: Record<string, { floor: number; cap: number }> = {
  concept: { floor: 2, cap: 24 }, // spelling and capitals check
  transcribe: { floor: 25, cap: 90 },
  composing: { floor: 28, cap: 90 }, // the AI lays out the words
  checking: { floor: 88, cap: 95 }, // local check that every word fits
  retrying: { floor: 0, cap: 96 },
  fallback: { floor: 0, cap: 97 },
  editing: { floor: 4, cap: 94 },
};
const BETWEEN_STAGES = { floor: 0, cap: 98 };
const byTime = (seconds: number) => 97 * (1 - Math.exp(-seconds / 22));

export interface LayoutProgressState {
  active: boolean;
  percent: number;
  seconds: number;
  phase: GenerationPhase;
}

/** One estimate per request: it restarts at 0 whenever a new request starts. */
export function useLayoutProgress(active: boolean, phase: GenerationPhase): LayoutProgressState {
  const [tick, setTick] = useState({ percent: 0, seconds: 0 });
  const started = useRef(0);
  const highest = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (!active) {
      highest.current = 0;
      setTick({ percent: 0, seconds: 0 });
      return;
    }
    started.current = Date.now();
    highest.current = 0;
    const update = () => {
      const seconds = (Date.now() - started.current) / 1000;
      const stage = (phaseRef.current && STAGES[phaseRef.current]) || BETWEEN_STAGES;
      const estimate = Math.min(stage.cap, Math.max(stage.floor, byTime(seconds)));
      highest.current = Math.max(highest.current, estimate);
      setTick({ percent: Math.floor(highest.current), seconds: Math.floor(seconds) });
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [active]);

  return { active, percent: tick.percent, seconds: tick.seconds, phase };
}

const stageText = (phase: GenerationPhase, seconds: number) => {
  const title = phase === 'concept' ? 'Checking your spelling'
    : phase === 'checking' ? 'Final checks'
    : phase === 'retrying' ? 'Taking another pass at your layout'
    : phase === 'fallback' ? 'Trying a simpler layout'
    : phase === 'editing' ? 'Applying your layout changes'
    : 'Designing your layout';
  const detail = seconds >= 45 ? 'Still working. Some layouts take a little longer.'
    : phase === 'concept' ? 'Fixing typos and stray capitals.'
    : phase === 'checking' ? 'Making sure every word fits.'
    : phase === 'retrying' ? 'The first try wasn’t quite right, so we’re trying again automatically.'
    : phase === 'editing' ? 'Making your change to the layout.'
    : 'Choosing the lettering, sizes and line breaks.';
  return { title, detail };
};

/** Shown over the plaque preview while a layout is being made or changed. */
export function LayoutProgressOverlay({ progress }: { progress: LayoutProgressState }) {
  const { title, detail } = stageText(progress.phase, progress.seconds);
  return (
    <div className="layout-progress-overlay no-print" data-testid="layout-progress">
      <div className="layout-progress-sheen" aria-hidden="true" />
      <div className="layout-progress-badge">
        <div className="layout-progress-top">
          <span className="layout-progress-percent" aria-hidden="true">{progress.percent}%</span>
          <div role="status" aria-live="polite" aria-atomic="true" className="layout-progress-words">
            <strong>{title}</strong>
            <p>{detail}</p>
          </div>
        </div>
        <div
          className="layout-progress-bar"
          role="progressbar"
          aria-label="Designing your plaque"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
        >
          <span style={{ width: `${progress.percent}%` }} />
        </div>
        <small>Usually 30–60 seconds. Keep this page open; no need to press again.</small>
      </div>
    </div>
  );
}
