import { Err, Ok, Result } from '@core/result/Result';
import { Executor } from './Executor';

export class PoolExecutor implements Executor {
  private readonly queue: Array<() => Promise<void>> = [];
  private readonly errors: Error[] = [];
  private running = 0;
  private pending = 0;
  private drainResolve: (() => void) | null = null;

  constructor(private readonly concurrency: number = 8) {}

  submit(task: () => Promise<void>): void {
    this.pending++;
    if (this.running < this.concurrency) {
      this.run(task);
    } else {
      this.queue.push(task);
    }
  }

  async drain(): Promise<Result<void>> {
    if (this.pending === 0) return this.buildResult();

    await new Promise<void>(resolve => {
      this.drainResolve = resolve;
    });

    return this.buildResult();
  }

  private run(task: () => Promise<void>): void {
    this.running++;
    task()
      .catch(err => this.errors.push(err instanceof Error ? err : new Error(String(err))))
      .finally(() => {
        this.running--;
        this.pending--;

        if (this.queue.length > 0) {
          this.run(this.queue.shift()!);
        }

        if (this.pending === 0 && this.drainResolve) {
          this.drainResolve();
          this.drainResolve = null;
        }
      });
  }

  private buildResult(): Result<void> {
    const errors = this.errors.splice(0);
    if (errors.length > 0) {
      const msg = errors.map(e => e.message).join('; ');
      return Err.from(new Error(`executor failed with ${errors.length} error(s): ${msg}`));
    }
    return Ok.from(undefined);
  }
}
