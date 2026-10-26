import { ANALYTICS_STATE_CHANGED, publicPagePath, replayVisit } from './posthogAnalytics';

// Session recordings in PostHog EU (owner msg 6565, 26 Oct 2026: "can we set up recording for instaplaque also?").
// - Only for a visit replayVisit() allows: analytics accepted with the recording wording, a public page, and not the
//   owner's own browser. posthog-js is loaded from PostHog's EU CDN only then.
// - posthog-js is used for the recording alone: before_send lets nothing but recording data ($snapshot) through, so the
//   ip_* events in posthogAnalytics.ts stay our only analytics events, and nothing is autocaptured.
// - Privacy: everything typed is masked (maskAllInputs); elements with class ph-no-capture (the plaque preview and 3D
//   view, uploaded and generated images) are left out; text in elements with class ph-mask (the design request's
//   review and receipt) is masked; recorded network timings keep no query strings. Storage is localStorage, no cookies.
// - It shares the visit's ID (a UUIDv7) as its distinct ID and session ID, so ip_* events link to the recording.
// - Private pages (proof, order, checkout, admin) stop it before they render: the app pushes their URL before React
//   draws them, and the pushState wrapper below stops the recording first. A full page load of one never starts it.

const token = 'phc_txLFAUv88ttyLLTKgi3arQ7428Jy5XSQEtGFm6jYrYxJ';
const apiHost = 'https://eu.i.posthog.com';

type NetworkRequest = { name?: string; [key: string]: unknown };
type PostHog = {
  __SV?: number;
  init: (projectToken: string, config: Record<string, unknown>) => void;
  startSessionRecording: () => void;
  stopSessionRecording: () => void;
  opt_out_capturing: () => void;
  opt_in_capturing: () => void;
};
declare global { interface Window { posthog?: PostHog } }

let started = false;
let loaded = false;
let recording = false;
let optedOut = false;

const isUuidV7 = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);

/** The URL without its query or fragment, for recorded network timings. */
export function withoutQuery(url: string): string {
  return url.replace(/[?#].*$/, '');
}

export function replayConfig(visitId: string): Record<string, unknown> {
  return {
    api_host: apiHost,
    ui_host: 'https://eu.posthog.com',
    persistence: 'localStorage',
    person_profiles: 'identified_only',
    bootstrap: isUuidV7(visitId) ? { distinctID: visitId, sessionID: visitId } : { distinctID: visitId },
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    rageclick: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_exceptions: false,
    disable_surveys: true,
    disable_session_recording: true,
    session_recording: {
      maskAllInputs: true,
      maskTextClass: 'ph-mask',
      blockClass: 'ph-no-capture',
      recordCrossOriginIframes: false,
      maskCapturedNetworkRequestFn: (request: NetworkRequest) => (
        typeof request?.name === 'string' ? { ...request, name: withoutQuery(request.name) } : request),
    },
    before_send: (event: { event?: string } | null) => (event?.event === '$snapshot' ? event : null),
  };
}

// PostHog's standard loader: a stub that queues calls until its script (array.js) arrives from the EU CDN.
function loadLibrary(): PostHog {
  /* eslint-disable */
  // @ts-ignore
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  /* eslint-enable */
  return window.posthog as PostHog;
}

function stop(): void {
  if (!recording) return;
  recording = false;
  try { window.posthog?.stopSessionRecording(); } catch { /* Recording must never interrupt shopping. */ }
}

// Withdrawn consent: stop sending and remove PostHog's own storage, as the cookie policy says.
function forget(): void {
  if (loaded && !optedOut) {
    optedOut = true;
    try { window.posthog?.opt_out_capturing(); } catch { /* Best effort. */ }
  }
  for (const store of [localStorage, sessionStorage]) {
    try {
      for (let index = store.length - 1; index >= 0; index -= 1) {
        const key = store.key(index) || '';
        if (key.startsWith(`ph_${token}`) || key.startsWith(`__ph_opt_in_out_${token}`)) store.removeItem(key);
      }
    } catch { /* No storage access. */ }
  }
}

/** Start, keep or stop the recording to match consent and the current page. */
export function syncSessionReplay(): void {
  let visit: string | null = null;
  try { visit = replayVisit(); } catch { visit = null; }
  if (!visit) {
    stop();
    let consented = false;
    try { consented = localStorage.getItem('instaplaque-analytics-consent-v1') === 'yes'; } catch { /* Treat as withdrawn. */ }
    if (!consented) forget();
    return;
  }
  try {
    if (!loaded) {
      loaded = true;
      loadLibrary().init(token, replayConfig(visit));
    } else if (optedOut) {
      optedOut = false;
      window.posthog?.opt_in_capturing();
    }
    if (!recording) {
      recording = true;
      window.posthog?.startSessionRecording();
    }
  } catch { /* Recording must never interrupt shopping. */ }
}

export function startSessionReplay(): void {
  if (started) return;
  started = true;
  window.addEventListener(ANALYTICS_STATE_CHANGED, syncSessionReplay);
  window.addEventListener('popstate', syncSessionReplay);
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method];
    history[method] = function (this: History, data: unknown, unused: string, url?: string | URL | null) {
      let next: URL | null = null;
      try { next = url == null ? null : new URL(String(url), location.href); } catch { next = null; }
      // Stop before a private page renders: its URL arrives here before React draws it.
      if (next && !publicPagePath(next)) stop();
      const result = original.call(this, data, unused, url);
      syncSessionReplay();
      return result;
    };
  }
  syncSessionReplay();
}
