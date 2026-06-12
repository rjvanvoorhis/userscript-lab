import type { Result } from '@core/result';

export type TaskId = string;

export interface Executor {
  /** Queue a task for dispatch subject to the executor's constraints. Returns a TaskId immediately. */
  submit<T>(task: () => Promise<T>): TaskId;
  /** Await the result of a previously submitted task. */
  resultFor<T>(taskId: TaskId): Promise<Result<T>>;
  /** Wait for all submitted tasks and return their results. */
  drain(): Promise<Result<unknown>[]>;
}
