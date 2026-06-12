import { Err, Ok, type Result } from '@core/result';
import { generateId } from '@core/utils';
import type { Executor, TaskId } from '@core/concurrency/executors/Executor';

export class PoolExecutor implements Executor {
  private readonly queue: Array<() => void> = [];
  private readonly results = new Map<TaskId, Promise<Result<unknown>>>();
  private running = 0;

  constructor(private readonly concurrency: number = 8) {}

  submit<T>(task: () => Promise<T>): TaskId {
    const taskId = generateId();
    let resolve!: (value: Result<unknown>) => void;
    this.results.set(taskId, new Promise<Result<unknown>>(r => { resolve = r; }));

    const run = () => {
      this.running++;
      task()
        .then(value => resolve(Ok.from(value)))
        .catch(err => resolve(Err.from(err instanceof Error ? err : new Error(String(err)))))
        .finally(() => {
          this.running--;
          if (this.queue.length > 0) this.queue.shift()!();
        });
    };

    if (this.running < this.concurrency) {
      run();
    } else {
      this.queue.push(run);
    }

    return taskId;
  }

  async resultFor<T>(taskId: TaskId): Promise<Result<T>> {
    const promise = this.results.get(taskId);
    if (!promise) return Err.from<T>(new Error(`Unknown task: ${taskId}`));
    return promise as Promise<Result<T>>;
  }

  async drain(): Promise<Result<unknown>[]> {
    return Promise.all([...this.results.values()]);
  }
}
