import { Err, Ok, type Result } from '@core/result';
import { sleep } from '@core/concurrency/sleep';
import { generateId } from '@core/utils';
import type { Executor, TaskId } from '@core/concurrency/executors/Executor';

export class ThrottledExecutor implements Executor {
  private readonly queue: Array<() => void> = [];
  private readonly results = new Map<TaskId, Promise<Result<unknown>>>();
  private tokens: number;
  private lastRefill: number;
  private loopRunning = false;
  private dispatchLoop: Promise<void> = Promise.resolve();

  constructor(private readonly perSecond: number = 50) {
    this.tokens = perSecond;
    this.lastRefill = Date.now();
  }

  submit<T>(task: () => Promise<T>): TaskId {
    const taskId = generateId();
    let resolve!: (value: Result<unknown>) => void;
    this.results.set(taskId, new Promise<Result<unknown>>(r => { resolve = r; }));

    this.queue.push(() => {
      task()
        .then(value => resolve(Ok.from(value)))
        .catch(err => resolve(Err.from(err instanceof Error ? err : new Error(String(err)))));
    });

    if (!this.loopRunning) {
      this.loopRunning = true;
      this.dispatchLoop = this.runLoop().finally(() => { this.loopRunning = false; });
    }

    return taskId;
  }

  async resultFor<T>(taskId: TaskId): Promise<Result<T>>{
    const promise = this.results.get(taskId);
    if (!promise) return Err.from<T>(new Error(`Unknown task: ${taskId}`));
    return promise as Promise<Result<T>>;
  }

  async drain(): Promise<Result<unknown>[]> {
    await this.dispatchLoop;
    return Promise.all([...this.results.values()]);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.perSecond, this.tokens + elapsed * this.perSecond);
    this.lastRefill = now;
  }

  private async runLoop(): Promise<void> {
    while (this.queue.length > 0) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        this.queue.shift()!();
      } else {
        await sleep(Math.max(1, ((1 - this.tokens) / this.perSecond) * 1000));
      }
    }
  }
}
