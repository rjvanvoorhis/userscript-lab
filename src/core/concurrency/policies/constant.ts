import type { BackoffPolicy } from '@core/concurrency/policies/BackoffPolicy';

export const constantBackoff =
  (delay: number): BackoffPolicy =>
  () =>
    delay;
