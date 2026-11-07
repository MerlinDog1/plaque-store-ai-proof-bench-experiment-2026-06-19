import { captureArrivalAttribution } from './orderAttribution.mjs';

// Evaluated once when the application loads, before React can change routes.
// Deliberately memory-only even after consent: reloads/new tabs start a new arrival.
const arrival = typeof window === 'undefined' ? null
  : captureArrivalAttribution(window.location.href, document.referrer);
if (arrival) Object.freeze(arrival);
export function getArrivalAttribution() { return arrival; }
