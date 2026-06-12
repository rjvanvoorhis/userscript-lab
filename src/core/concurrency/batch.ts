export function* yieldBatches<T>(iterable: Iterable<T>, size: number) {
  let chunk = [];
  for (const item of iterable) {
    if (chunk.length === size) {
      yield chunk;
      chunk = [];
    }
    chunk.push(item);
  }
  if (chunk.length) {
    yield chunk;
  }
}

export function batch<T>(iterable: Iterable<T>, size: number) {
  return [...yieldBatches(iterable, size)];
}
