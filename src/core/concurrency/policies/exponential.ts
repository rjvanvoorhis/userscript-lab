import { BackoffPolicy } from './BackoffPolicy';

export const exponentialBackoff =
  ({ base = 1000, max = 8000, jitter = true } = {}): BackoffPolicy =>
  (attempt: number) => {
    const exp = Math.min(base * 2 ** attempt, max);
    if (!jitter) return exp;

    return exp * (0.75 + Math.random() * 0.5);
  };
