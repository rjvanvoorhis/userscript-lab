import { sleep } from '@core/concurrency/sleep';

export async function throttle<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  { perSecond = 50 } = {}
): Promise<R[]> {
  let tokens = perSecond;
  let lastRefill = Date.now();

  const refill = () => {
    const now = Date.now();
    const elapsed = (now - lastRefill) / 1000;
    tokens = Math.min(perSecond, tokens + elapsed * perSecond);
    lastRefill = now;
  };

  const waitForToken = async () => {
    while (true) {
      refill();
      if (tokens >= 1) {
        tokens -= 1;
        return;
      }
      await sleep(Math.max(1, ((1 - tokens) / perSecond) * 1000));
    }
  };

  const pending: Promise<R>[] = [];

  for (const item of items) {
    await waitForToken();
    pending.push(worker(item));
  }

  return Promise.all(pending);
}
