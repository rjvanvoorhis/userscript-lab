export async function pool<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  { concurrency = 8 } = {},
) {
  const queue = [...items];
  const results = new Array<R>();
  const errors = new Array<{ item: T; error: Error }>();

  async function run() {
    while (queue.length) {
      const item = queue.shift();
      if (item === undefined) {
        break;
      }

      try {
        results.push(await worker(item));
      } catch (error) {
        errors.push({ item, error: error as Error });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }).map(() => run()));

  return { results, errors };
}
