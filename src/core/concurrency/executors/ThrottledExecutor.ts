import { Err, Ok, Result } from '@core/result/Result';
import { sleep } from '@core/concurrency/sleep';
import { Executor } from './Executor';

export class ThrottledExecutor implements Executor {
  private readonly queue: Array<() => Promise<void>> = [];
  private readonly tasks: Promise<void>[] = [];
  private readonly errors: Error[] = [];
  private tokens: number;
  private lastRefill: number;
  private dispatchLoop: Promise<void> = Promise.resolve();
  private loopRunning = false;

  constructor(private readonly perSecond: number = 50) {
    this.tokens = perSecond;
    this.lastRefill = Date.now();
  }

  submit(task: () => Promise<void>): void {
    this.queue.push(task);
    if (!this.loopRunning) {
      this.loopRunning = true;
      this.dispatchLoop = this.runLoop().finally(() => {
        this.loopRunning = false;
      });
    }
  }

  async drain(): Promise<Result<void>> {
    await this.dispatchLoop;
    await Promise.allSettled(this.tasks.splice(0));

    const errors = this.errors.splice(0);
    if (errors.length > 0) {
      const msg = errors.map(e => e.message).join('; ');
      return Err.from(new Error(`executor failed with ${errors.length} error(s): ${msg}`));
    }
    return Ok.from(undefined);
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
        const task = this.queue.shift()!;
        this.tasks.push(
          task().catch(err =>
            this.errors.push(err instanceof Error ? err : new Error(String(err)))
          )
        );
      } else {
        await sleep(Math.max(1, ((1 - this.tokens) / this.perSecond) * 1000));
      }
    }
  }
}
