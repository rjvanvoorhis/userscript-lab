import { exponentialBackoff } from '@core/concurrency/policies/exponential';
import { sleep } from '@core/concurrency/sleep';

export { exponentialBackoff };

export async function retry<T>(
  fn: () => Promise<T>,
  {
    attempts = 5,
    policy = exponentialBackoff(),
    shouldRetry = (_err: unknown): boolean => true,
  } = {},
): Promise<T> {
  let error: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      error = err;
      if (attempt < attempts - 1 && shouldRetry(err)) {
        await sleep(policy(attempt));
      } else if (!shouldRetry(err)) {
        throw err;
      }
    }
  }
  throw error;
}
