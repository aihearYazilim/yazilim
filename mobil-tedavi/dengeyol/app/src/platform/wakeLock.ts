/** Manevra sırasında ekranın kapanmasını önler (destekleyen tarayıcılarda). */
type Sentinel = { release: () => Promise<void> };

let sentinel: Sentinel | null = null;

export function wakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export async function keepAwake(): Promise<boolean> {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock;
    if (!wl) return false;
    // Sayfa gizlenince tarayıcı kilidi kendiliğinden bırakır; görünür olunca yeniden istenir.
    if (sentinel && !(sentinel as { released?: boolean }).released) return true;
    sentinel = await wl.request('screen');
    return true;
  } catch {
    return false;
  }
}

export async function releaseAwake(): Promise<void> {
  try {
    await sentinel?.release();
  } catch {
    /* yok say */
  }
  sentinel = null;
}
