// Leave room for validation and a JSON error before the 120s Vercel deadline.
// These limits are application-owned, never accepted from public requests.
export const TEXT_GENERATION_TIMEOUT_MS = 110_000;
export const TEXT_PROXY_TIMEOUT_MS = 125_000;
export const GENERATION_TIMEOUT_MESSAGE = 'The layout service took too long to respond. Your wording has not been changed. Please try again.';
