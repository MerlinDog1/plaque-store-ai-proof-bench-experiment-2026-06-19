import React, { useEffect, useRef, useState } from 'react';
import { preload } from 'react-dom';

// The 22-second promo film (owner msgs 6954 and 6977, 28 Oct 2026): the real designer laying out a plaque, then an
// example WhatsApp chat with a free PDF proof and an order link. Its 4:5 cut, re-encoded small for the web; the source
// is the Remotion project in projects/instaplaque-promo-video-20261028 (docs/promo-video-2026-10-28.md). It sits at the
// top of the homepage and the category pages, beside or under the two buttons, and the button for what it is showing
// glows (owner msg 6986: "the button for design online glows as video plays that and then the whats app one does").
const VIDEO = '/videos/instaplaque-design-in-seconds-20261028.mp4';
export const PROMO_POSTER = '/videos/instaplaque-design-in-seconds-20261028-poster.webp';
const DESCRIPTION = 'Silent 22-second video. Someone types a memorial inscription into the InstaPlaque designer as one line and taps Design my plaque; our AI lays it out on a brass plaque, which then switches between four finishes. Then a WhatsApp chat: a customer sends their wording, we reply with a free PDF proof and an order link, and they reply that it’s perfect.';

/** What the film is showing at a time, so the page can light the button for it: the designer until the WhatsApp chat
 * swipes in (frame 332 at 30 fps), the chat until the end card (frame 566), then both (the film's src/timeline.ts). */
export type PromoCue = 'design' | 'whatsapp' | 'both';
export const promoCueAt = (seconds: number): PromoCue => (seconds < 332 / 30 ? 'design' : seconds < 566 / 30 ? 'whatsapp' : 'both');

/** Reduced motion or Save-Data: show the poster and a play button instead of playing by itself. */
const quiet = () => {
  if (typeof window === 'undefined') return true;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !!connection?.saveData;
};

/** The silent looping film. The poster (55 kB, the film's own first second) is in the static HTML, so it paints with the
 * page; the 1.3 MB video is requested only after the page has finished loading and only once the film is near the
 * screen (a hidden copy, e.g. the computer one on a phone, never loads). It plays only while on screen and has its own
 * pause button (WCAG 2.2.2). While it plays, the page's .shopfront carries data-promo-cue for the buttons to glow. */
export function PromoFilm() {
  preload(PROMO_POSTER, { as: 'image', fetchPriority: 'high' });
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [stopped, setStopped] = useState<boolean | null>(null); // the visitor's choice; null until they make one
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    let cancelLoad = () => {};
    const ready = () => {
      if (document.readyState === 'complete') { setNear(true); return; }
      const loaded = () => setNear(true);
      window.addEventListener('load', loaded, { once: true });
      cancelLoad = () => window.removeEventListener('load', loaded);
    };
    if (typeof IntersectionObserver === 'undefined') {
      ready();
      return () => cancelLoad();
    }
    const approach = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        approach.disconnect();
        ready();
      }
    }, { rootMargin: '400px 0px' });
    const view = new IntersectionObserver(entries => setOnScreen(entries.some(entry => entry.intersectionRatio >= 0.35)), { threshold: [0, 0.35] });
    approach.observe(element);
    view.observe(element);
    return () => { approach.disconnect(); view.disconnect(); cancelLoad(); };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element || !near) return;
    element.muted = true; // the property, which autoplay rules check (React doesn't always set the attribute)
    const wanted = onScreen && (stopped === null ? !quiet() : !stopped);
    if (wanted) element.play().catch(() => setPlaying(false));
    else element.pause();
  }, [near, onScreen, stopped]);

  useEffect(() => {
    const element = video.current;
    const page = frame.current?.closest<HTMLElement>('.shopfront');
    if (!element || !page) return;
    const mark = () => {
      const cue = promoCueAt(element.currentTime);
      if (page.dataset.promoCue !== cue) page.dataset.promoCue = cue;
    };
    const tick = () => { if (!element.paused) mark(); };
    const clear = () => { delete page.dataset.promoCue; };
    element.addEventListener('playing', mark);
    element.addEventListener('timeupdate', tick);
    element.addEventListener('pause', clear);
    element.addEventListener('ended', clear);
    return () => {
      element.removeEventListener('playing', mark);
      element.removeEventListener('timeupdate', tick);
      element.removeEventListener('pause', clear);
      element.removeEventListener('ended', clear);
      clear();
    };
  }, []);

  return (
    <div className="promo-film" ref={frame}>
      <video
        ref={video}
        className="promo-film-player"
        width={1080}
        height={1350}
        src={near ? VIDEO : undefined}
        poster={PROMO_POSTER}
        preload="none"
        muted
        loop
        playsInline
        disablePictureInPicture
        aria-label={DESCRIPTION}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button type="button" className="promo-film-toggle" onClick={() => setStopped(playing)} aria-label={playing ? 'Pause the video' : 'Play the video'}>
        {playing ? (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5.2v13.6L19 12z" fill="currentColor" /></svg>
        )}
      </button>
    </div>
  );
}

/** The film with its small print, for a page's hero. Pages render it twice (beside the copy on computers, under the
 * buttons on phones), as they do their hero photos; CSS shows one. */
export function PromoFilmFigure({ className }: { className: string }) {
  return (
    <figure className={`promo-film-figure ${className}`}>
      <PromoFilm />
      {/* The rule is services/productionTime.mjs (owner msg 6947). */}
      <figcaption>
        Sped up: real layouts take about 30–60 seconds. The WhatsApp chat is an example. *Most plaques up to 600 × 400 mm,
        from proof approval and payment, plus delivery; aged brass 7 and wood-backed plaques 10–15 working days.
      </figcaption>
    </figure>
  );
}
