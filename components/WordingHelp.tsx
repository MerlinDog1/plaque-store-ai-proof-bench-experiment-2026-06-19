import React, { useCallback, useEffect, useRef, useState } from 'react';

const VISIT_KEY = 'instaplaque-wording-explainer-v1';
const CLIP = '/videos/instaplaque-wording-explainer-20261110.mp4';
const POSTER = '/videos/instaplaque-wording-explainer-20261110.webp';
type Mode = 'play' | 'still' | null;
// A denied storage API must not prevent typing, or replay on every step change.
let seenWithoutStorage = false;
export function useWordingHelp(active: boolean, wording: string, hasLayout: boolean) {
  const [mode, setMode] = useState<Mode>(null);
  const [playId, setPlayId] = useState(0);
  const stop = useCallback(() => setMode(null), []);
  useEffect(() => {
    if (!active || wording || hasLayout) { setMode(null); return; }
    let seen = seenWithoutStorage;
    try { seen = sessionStorage.getItem(VISIT_KEY) === 'yes'; } catch { /* optional UI memory */ }
    if (seen) return;
    seenWithoutStorage = true;
    try { sessionStorage.setItem(VISIT_KEY, 'yes'); } catch { /* keep memory fallback */ }
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setMode(matchMedia('(prefers-reduced-motion: reduce)').matches || saveData ? 'still' : 'play');
  }, [active, wording, hasLayout]);
  // Manual replay is allowed with existing words; the next edit dismisses it.
  const replay = useCallback(() => { setPlayId(id => id + 1); setMode('play'); }, []);
  return { mode: active ? mode : null, playId, stop, replay };
}

export function WordingHelp({ mode, onStop }: { mode: Exclude<Mode, null>; onStop: () => void }) {
  const [ending, setEnding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (mode === 'play') void video.current?.play().catch(onStop);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [mode, onStop]);
  return <div className={`wording-help${ending ? ' is-ending' : ''}`} data-testid="wording-help">
    <button type="button" className="wording-help-media" onClick={onStop}
      aria-label="Short demo: type your words as one line, tap Design my plaque, and our AI lays out the plaque">
      {mode === 'play' ? <video ref={video} src={CLIP} poster={POSTER} muted playsInline preload="auto"
        onError={onStop} onEnded={() => { setEnding(true); timer.current = setTimeout(onStop, 180); }} />
        : <img src={POSTER} alt="Finished Arthur Bell plaque, laid out by our AI" onError={onStop} />}
    </button>
    <button type="button" className="wording-help-skip" onClick={onStop}>Skip</button>
  </div>;
}

/** Lift the existing action bar only for a focused wording field + a real touch keyboard. */
export function useWordingKeyboard(active: boolean) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport || navigator.maxTouchPoints === 0) return;
    let input: HTMLTextAreaElement | null = null;
    let bar: HTMLElement | null = null;
    let scroll: HTMLElement | null = null;
    let frame = 0;
    const restore = () => {
      if (!input || !bar || !scroll) return;
      bar.removeAttribute('data-keyboard-open');
      bar.parentElement?.classList.remove('wording-keyboard-active');
      for (const key of ['--wording-bar-top','--wording-bar-left','--wording-bar-width']) bar.style.removeProperty(key);
      scroll.classList.remove('wording-keyboard-scroll');
      for (const key of ['--wording-scroll-top','--wording-scroll-height','--wording-scroll-left','--wording-scroll-width']) scroll.style.removeProperty(key);
      input.style.removeProperty('max-height');
    };
    const update = () => {
      input = document.getElementById('inscription-wording-input') as HTMLTextAreaElement | null;
      bar = document.querySelector<HTMLElement>('.designer-step-footer');
      scroll = document.querySelector<HTMLElement>('.proofbench-control-scroll');
      if (!input || !bar || !scroll) return;
      restore();
      const layoutHeight = document.documentElement.clientHeight;
      if (document.activeElement !== input || viewport.scale !== 1 || layoutHeight - viewport.height < 120) return;
      const rect = bar.getBoundingClientRect();
      const bottom = viewport.offsetTop + viewport.height;
      const top = bottom - rect.height;
      bar.style.setProperty('--wording-bar-top', `${top}px`);
      bar.style.setProperty('--wording-bar-left', `${rect.left}px`);
      bar.style.setProperty('--wording-bar-width', `${rect.width}px`);
      bar.dataset.keyboardOpen = 'true';
      bar.parentElement?.classList.add('wording-keyboard-active');
      // The designer's entrance animation retains an identity transform, so its
      // board is a fixed-position containing block. Correct to viewport coordinates.
      const placedBar = bar.getBoundingClientRect();
      bar.style.setProperty('--wording-bar-top', `${top - (placedBar.top - top)}px`);
      bar.style.setProperty('--wording-bar-left', `${rect.left - (placedBar.left - rect.left)}px`);
      // Safari may pan the visual viewport. Keep a usable part of the existing controls
      // scroller above the bar even if the preview/header now sit behind the keyboard.
      const area = scroll.getBoundingClientRect();
      const scrollTop = Math.max(viewport.offsetTop, Math.min(area.top, top - Math.min(240, viewport.height - rect.height)));
      scroll.style.setProperty('--wording-scroll-top', `${scrollTop}px`);
      scroll.style.setProperty('--wording-scroll-height', `${Math.max(80, top - scrollTop)}px`);
      scroll.style.setProperty('--wording-scroll-left', `${area.left}px`);
      scroll.style.setProperty('--wording-scroll-width', `${area.width}px`);
      scroll.classList.add('wording-keyboard-scroll');
      const placedScroll = scroll.getBoundingClientRect();
      scroll.style.setProperty('--wording-scroll-top', `${scrollTop - (placedScroll.top - scrollTop)}px`);
      scroll.style.setProperty('--wording-scroll-left', `${area.left - (placedScroll.left - area.left)}px`);
      input.style.maxHeight = `${Math.max(60, top - scrollTop - 20)}px`;
      const field = input.getBoundingClientRect();
      if (field.top < scrollTop + 8 || field.bottom > top - 8) scroll.scrollTop += field.top - scrollTop - 8;
      // The browser keeps the selection in the textarea's own scrollport on input.
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const keepFocus = (event: PointerEvent) => { if (bar?.dataset.keyboardOpen && (event.target as HTMLElement).closest('.designer-step-footer button')) event.preventDefault(); };
    document.addEventListener('focusin', schedule); document.addEventListener('focusout', schedule); document.addEventListener('input', schedule);
    viewport.addEventListener('resize', schedule); viewport.addEventListener('scroll', schedule);
    document.addEventListener('pointerdown', keepFocus); schedule();
    return () => {
      cancelAnimationFrame(frame); restore();
      document.removeEventListener('focusin', schedule); document.removeEventListener('focusout', schedule); document.removeEventListener('input', schedule);
      viewport.removeEventListener('resize', schedule); viewport.removeEventListener('scroll', schedule); document.removeEventListener('pointerdown', keepFocus);
    };
  }, [active]);
}
