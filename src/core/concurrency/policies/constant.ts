import { BackoffPolicy } from './BackoffPolicy';

export const constantBackoff =
  (delay: number): BackoffPolicy =>
  () =>
    delay;
