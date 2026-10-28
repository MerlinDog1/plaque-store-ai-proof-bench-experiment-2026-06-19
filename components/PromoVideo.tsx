import React, { useEffect, useRef, useState } from 'react';

// The 22-second promo film (owner msgs 6954 and 6977, 28 Oct 2026): the real designer laying out a plaque, then an
// example WhatsApp chat with a free PDF proof and an order link. Its 4:5 cut, re-encoded small for the web; the source
// is the Remotion project in projects/instaplaque-promo-video-20261028 (docs/promo-video-2026-10-28.md).
const VIDEO = '/videos/instaplaque-design-in-seconds-20261028.mp4';
const POSTER = '/videos/instaplaque-design-in-seconds-20261028-poster.webp';
const DESCRIPTION = 'Silent 22-second video. Someone types a memorial inscription into the InstaPlaque designer as one line and taps Design my plaque; our AI lays it out on a brass plaque, which then switches between four finishes. Then a WhatsApp chat: a customer sends their wording, we reply with a free PDF proof and an order link, and they reply that it’s perfect.';

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** A silent looping demo that costs nothing until it is near the screen: nothing is requested before then (the
 * poster and source are added by an IntersectionObserver and preload is none), it plays only while it is on screen,
 * never by itself for visitors who ask for reduced motion, and it has its own pause button (WCAG 2.2.2). */
function PromoVideo() {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [stopped, setStopped] = useState<boolean | null>(null); // the visitor's choice; null until they make one
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const approach = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNear(true);
        approach.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    const view = new IntersectionObserver(entries => setOnScreen(entries.some(entry => entry.intersectionRatio >= 0.35)), { threshold: [0, 0.35] });
    approach.observe(element);
    view.observe(element);
    return () => { approach.disconnect(); view.disconnect(); };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element || !near) return;
    element.muted = true; // the property, which autoplay rules check (React doesn't always set the attribute)
    const wanted = onScreen && (stopped === null ? !reducedMotion() : !stopped);
    if (wanted) element.play().catch(() => setPlaying(false));
    else element.pause();
  }, [near, onScreen, stopped]);

  return (
    <div className="shop-video-frame" ref={frame}>
      <video
        ref={video}
        className="shop-video-player"
        width={1080}
        height={1350}
        src={near ? VIDEO : undefined}
        poster={near ? POSTER : undefined}
        preload="none"
        muted
        loop
        playsInline
        disablePictureInPicture
        aria-label={DESCRIPTION}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button type="button" className="shop-video-toggle" onClick={() => setStopped(playing)} aria-label={playing ? 'Pause the video' : 'Play the video'}>
        {playing ? (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5.2v13.6L19 12z" fill="currentColor" /></svg>
        )}
      </button>
    </div>
  );
}

/** "See it in 20 seconds", right after the hero on the homepage and the category pages Google ads lead to (owner msg
 * 6977). The film's small print is repeated in the page, where it is readable at any size. */
export function PromoVideoSection({ id = 'see-it-work' }: { id?: string }) {
  return (
    <section className="shop-section shop-video" id={id} aria-labelledby={`${id}-heading`}>
      <div className="shop-video-head">
        <p className="shop-kicker">See it in 20 seconds</p>
        <h2 id={`${id}-heading`}>Design your plaque in seconds.</h2>
      </div>
      <PromoVideo />
      <div className="shop-video-body">
        <p>Type your words any way you like and our AI designer lays them out for you. Or send them on WhatsApp and we’ll design it for you. Either way, you see a free proof before you pay.</p>
        {/* The rule is services/productionTime.mjs (owner msg 6947). */}
        <p className="shop-smallprint">
          *5 working days is the estimated production time for most plaques up to 600 × 400 mm, from proof approval and
          payment, plus delivery. Aged brass is 7 working days and wood-backed plaques 10–15. The video is sped up: real
          layouts take about 30–60 seconds. The WhatsApp chat is an example.
        </p>
      </div>
    </section>
  );
}
