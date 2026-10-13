// Google decorates normal anchors, but React's pushState routes ignore the
// decorated href. Keep only its click/linker parameters across public routes.
// No cookie/localStorage is created, and no private references are copied.
const clickKeys = ['gclid', 'dclid', 'gclsrc', '_gl', 'wbraid', 'gbraid'];
const privatePath = /^\/(admin|proof|order|order-confirmed|checkout)(\/|$)/;
function isPublic(url: URL): boolean {
  return !privatePath.test(url.pathname)
    && !['proof', 'order', 'session_id'].some(key => url.searchParams.has(key))
    && !['admin', 'checkout', 'order'].includes(url.searchParams.get('view') || '');
}

export function publicRouteWithGoogleClick(route: string, sourceHref = window.location.href): string {
  const source = new URL(sourceHref);
  const target = new URL(route, source.origin);
  if (source.protocol !== 'https:' || !['instaplaque.co.uk', 'www.instaplaque.co.uk'].includes(source.hostname)
    || target.origin !== source.origin || !isPublic(source) || !isPublic(target)) return route;
  for (const key of clickKeys) {
    const value = source.searchParams.get(key);
    if (value && value.length <= 4096 && /^[A-Za-z0-9._*~-]+$/.test(value) && !target.searchParams.has(key)) {
      target.searchParams.set(key, value);
    }
  }
  return target.pathname + target.search + target.hash;
}
