import { Result } from '@core/result/Result';

export interface Executor {
  /** Queue a task for immediate dispatch subject to the executor's constraints. */
  submit(task: () => Promise<void>): void;
  /** Wait for all submitted tasks to complete and return any accumulated errors. */
  drain(): Promise<Result<void>>;
}
