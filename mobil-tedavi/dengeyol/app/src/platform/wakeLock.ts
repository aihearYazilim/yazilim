/** Manevra sırasında ekranın kapanmasını önler (destekleyen tarayıcılarda). */
type Sentinel = { release: () => Promise<void> };

let sentinel: Sentinel | null = null;

export async function keepAwake(): Promise<boolean> {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock;
    if (!wl) return false;
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
