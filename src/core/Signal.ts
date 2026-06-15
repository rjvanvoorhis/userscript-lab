export class Signal<T> {
  private _value: T;
  private readonly _subs = new Set<(v: T) => void>();

  constructor(init: T) {
    this._value = init;
  }

  get value(): T {
    return this._value;
  }

  set(v: T): void {
    this._value = v;
    this._subs.forEach((fn) => fn(v));
  }

  subscribe(fn: (v: T) => void): () => void {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  }
}
