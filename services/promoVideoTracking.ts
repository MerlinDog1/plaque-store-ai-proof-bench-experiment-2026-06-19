// How far visitors watch the promo film (owner msg 7004, 28 Oct 2026: "track video views percentage in posthog").
// PostHog gets ip_video_started when the film starts playing, then ip_video_progress at 25, 50, 75 and 100%, each once
// per visit and page. They go through trackSiteEvent (services/posthogAnalytics.ts), so only with analytics consent, only
// on public pages, never to GA4, and marked is_test from the owner's own browsers. The film plays only while it is on
// screen and the tab is showing, and it has no seek bar, so how far it has played is how far it was watched.

/** Watch milestones, in percent of the film. */
export const PROMO_MILESTONES = [25, 50, 75, 100] as const;

type Send = (event: 'video_started' | 'video_progress', properties: Record<string, string | number | boolean>, onceKey: string) => void;

/** The milestones a film of `duration` seconds has reached at `seconds`. The end counts from its last half second, the
 * still end card, because the loop can restart the film before another time update arrives. */
export function promoMilestonesAt(seconds: number, duration: number): number[] {
  if (!(duration > 0) || !Number.isFinite(duration)) return [];
  return PROMO_MILESTONES.filter(percent => seconds >= (percent === 100 ? duration - 0.5 : (duration * percent) / 100));
}

/** Reports how far `video` plays until the returned function is called. `tapped` says whether the visitor pressed play
 * (with reduced motion or Save-Data the film waits for that) rather than the film starting by itself. */
export function watchPromoFilm(video: HTMLVideoElement, id: string, send: Send, tapped: () => boolean): () => void {
  const sent = new Set<number>();
  let started = false;
  let furthest = 0;
  let last = 0;
  // Once per visit and page: posthogAnalytics keeps the visit's keys.
  const key = (what: string | number) => `video:${location.pathname}:${what}`;
  const reach = (seconds: number) => {
    if (Number.isFinite(seconds)) furthest = Math.max(furthest, seconds);
    for (const percent of promoMilestonesAt(furthest, video.duration)) {
      if (sent.has(percent)) continue;
      sent.add(percent);
      send('video_progress', { video: id, percent }, key(percent));
    }
  };
  const onPlaying = () => {
    if (started) return;
    started = true;
    send('video_started', { video: id, autoplay: !tapped() }, key('started'));
  };
  const onTime = () => {
    const now = video.currentTime;
    if (video.paused || video.seeking || !Number.isFinite(now)) return;
    // The film loops: back at the start from its last seconds means it played to the end.
    if (now + 1 < last && last >= video.duration - 1.5) reach(video.duration);
    last = now;
    reach(now);
  };
  const onEnded = () => reach(video.duration);
  video.addEventListener('playing', onPlaying);
  video.addEventListener('timeupdate', onTime);
  video.addEventListener('ended', onEnded);
  return () => {
    video.removeEventListener('playing', onPlaying);
    video.removeEventListener('timeupdate', onTime);
    video.removeEventListener('ended', onEnded);
  };
}
