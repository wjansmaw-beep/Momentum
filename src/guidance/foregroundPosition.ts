export type PositionSample = { latitude: number; longitude: number; accuracy: number | null; timestamp: number };
type Subscription = { remove: () => void };
export type ForegroundPositionPort = {
  permission: () => Promise<boolean>;
  watch: (receive: (sample: PositionSample) => void, fail: () => void) => Promise<Subscription>;
};

// One explicit request, one sample. A late native subscription is also removed
// when permission, cancellation or timeout races with subscription creation.
export function readForegroundPosition(port: ForegroundPositionPort, signal: AbortSignal, timeoutMs = 15000): Promise<PositionSample> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: Subscription | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (sample?: PositionSample, reason = 'unavailable') => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription?.remove();
      signal.removeEventListener('abort', abort);
      if (sample) resolve(sample); else reject(new Error(reason));
    };
    const abort = () => finish(undefined, 'cancelled');
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    void port.permission().then(async granted => {
      if (settled) return;
      if (!granted) { finish(undefined, 'denied'); return; }
      timer = setTimeout(() => finish(undefined, 'timeout'), timeoutMs);
      const active = await port.watch(sample => {
        if (!Number.isFinite(sample.latitude) || Math.abs(sample.latitude) > 90 ||
            !Number.isFinite(sample.longitude) || Math.abs(sample.longitude) > 180 ||
            !Number.isFinite(sample.timestamp) || sample.timestamp <= 0) {
          finish(undefined, 'unavailable'); return;
        }
        finish(sample);
      }, () => finish());
      if (settled) active.remove(); else subscription = active;
    }).catch(() => finish());
  });
}
