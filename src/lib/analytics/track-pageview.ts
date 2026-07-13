const DEDUP_MS = 5 * 60_000;
const recentTracks = new Map<string, number>();
const inflight = new Set<string>();

function trackKey(pathname: string) {
  return pathname;
}

function shouldTrack(pathname: string) {
  const key = trackKey(pathname);
  const now = Date.now();
  const lastTrackedAt = recentTracks.get(key);

  if (lastTrackedAt && now - lastTrackedAt < DEDUP_MS) {
    return false;
  }

  if (inflight.has(key)) {
    return false;
  }

  return true;
}

export function sendPageView(pathname: string) {
  if (!pathname || pathname.startsWith('/admin')) return;
  if (!shouldTrack(pathname)) return;

  const key = trackKey(pathname);
  inflight.add(key);

  const locale = pathname.startsWith('/en')
    ? 'en'
    : pathname.startsWith('/mk')
      ? 'mk'
      : null;

  fetch('/api/analytics/pageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: pathname, locale }),
    keepalive: true,
  })
    .catch(() => {})
    .finally(() => {
      inflight.delete(key);
      recentTracks.set(key, Date.now());
    });
}
