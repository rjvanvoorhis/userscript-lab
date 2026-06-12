export interface IResult<T> {
  isOK(): this is Ok<T>;
  isErr(): this is Err<T>;
  map<U>(fn: (value: T) => U): IResult<U>;
  mapAsync<U>(fn: (value: T) => Promise<U>): Promise<IResult<U>>;
  chain<U>(fn: (value: T) => IResult<U>): IResult<U>;
  chainAsync<U>(fn: (value: T) => Promise<IResult<U>>): Promise<IResult<U>>;
  unwrap(): T;
  unwrapOr(value: T): T;
  toString(): string;
  match<U>(branches: { ok: (value: T) => U; err: (value: Error) => U }): U;
  tap(fn: (value: T) => void): IResult<T>;
  tapAsync(fn: (value: T) => Promise<void>): Promise<IResult<T>>;
  mapErr(fn: (error: Error) => Error): IResult<T>;
  tapErr(fn: (error: Error) => void): IResult<T>;
  tapErrAsync(fn: (error: Error) => Promise<void>): Promise<IResult<T>>;
}

export class Err<T> implements IResult<T> {
  private constructor(private readonly _error: Error) {}

  static from<T>(error: Error | string): IResult<T> {
    return new Err<T>(typeof error === 'string' ? new Error(error) : error);
  }

  isErr(): this is Err<T> {
    return true;
  }

  isOK(): this is Ok<T> {
    return false;
  }

  mapErr(fn: (error: Error) => Error): IResult<T> {
    try {
      return Err.from<T>(fn(this._error));
    } catch (err) {
      return Err.from<T>(err as Error);
    }
  }

  tapErr(fn: (error: Error) => void): IResult<T> {
    try {
      fn(this._error);
    } catch {
      // Swallow errors so calling .tapErr() never alters the outer Result or leaks exceptions to the caller.
    }
    return this;
  }

  async tapErrAsync(fn: (error: Error) => Promise<void>): Promise<IResult<T>> {
    try {
      await fn(this._error);
    } catch {
      // Swallow errors so calling .tapErrAsync() never alters the outer Result or leaks exceptions to the caller.
    }
    return this;
  }

  map<U>(_fn: (value: T) => U): IResult<U> {
    return Err.from<U>(this._error);
  }

  mapAsync<U>(_fn: (value: T) => Promise<U>): Promise<IResult<U>> {
    return Promise.resolve(Err.from<U>(this._error));
  }

  chain<U>(_fn: (value: T) => IResult<U>): IResult<U> {
    return Err.from<U>(this._error);
  }

  chainAsync<U>(_fn: (value: T) => Promise<IResult<U>>): Promise<IResult<U>> {
    return Promise.resolve(Err.from<U>(this._error));
  }

  unwrap(): T {
    throw this._error;
  }

  unwrapOr(value: T): T {
    return value;
  }

  toString(): string {
    return `Err(${this._error.message})`;
  }

  match<U>(branches: { ok: (value: T) => U; err: (value: Error) => U }): U {
    return branches.err(this._error);
  }

  tap(_fn: (value: T) => void): IResult<T> {
    return this;
  }

  tapAsync(_fn: (value: T) => Promise<void>): Promise<IResult<T>> {
    return Promise.resolve(this);
  }
}

export class Ok<T> implements IResult<T> {
  private constructor(private readonly _value: T) {}

  static from<T>(value: T): IResult<T> {
    return new Ok(value);
  }

  isErr(): this is Err<T> {
    return false;
  }

  isOK(): this is Ok<T> {
    return true;
  }

  mapErr(_fn: (error: Error) => Error): IResult<T> {
    return this;
  }

  tapErr(_fn: (error: Error) => void): IResult<T> {
    return this;
  }

  tapErrAsync(_fn: (error: Error) => Promise<void>): Promise<IResult<T>> {
    return Promise.resolve(this);
  }

  map<U>(fn: (value: T) => U): IResult<U> {
    try {
      return Ok.from(fn(this._value));
    } catch (err) {
      return Err.from<U>(err as Error);
    }
  }

  async mapAsync<U>(fn: (value: T) => Promise<U>): Promise<IResult<U>> {
    try {
      return Ok.from(await fn(this._value));
    } catch (err) {
      return Err.from<U>(err as Error);
    }
  }

  chain<U>(fn: (value: T) => IResult<U>): IResult<U> {
    try {
      return fn(this._value);
    } catch (err) {
      return Err.from<U>(err as Error);
    }
  }

  async chainAsync<U>(
    fn: (value: T) => Promise<IResult<U>>,
  ): Promise<IResult<U>> {
    try {
      const result = await fn(this._value);
      return result;
    } catch (err) {
      return Err.from<U>(err as Error);
    }
  }

  tap(fn: (value: T) => void): IResult<T> {
    try {
      fn(this._value);
    } catch {
      // Swallow errors so calling .tap() never alters the outer Result or leaks exceptions to the caller.
    }
    return this;
  }

  async tapAsync(fn: (value: T) => Promise<void>): Promise<IResult<T>> {
    try {
      await fn(this._value);
    } catch {
      // Swallow errors so calling .tapAsync() never alters the outer Result or leaks exceptions to the caller.
    }
    return this;
  }

  unwrap(): T {
    return this._value;
  }

  unwrapOr(_value: T): T {
    return this._value;
  }

  toString(): string {
    try {
      return `Ok(${JSON.stringify(this._value)})`;
    } catch {
      return `Ok([unserializable])`;
    }
  }

  match<U>(branches: { ok: (value: T) => U; err: (value: Error) => U }): U {
    return branches.ok(this._value);
  }
}

export type Result<T> = IResult<T>;

export const attempt = <T>(fn: () => T): Result<T> => {
  try {
    return Ok.from<T>(fn());
  } catch (err) {
    return Err.from<T>(err as Error);
  }
};

export const attemptAsync = async <T>(
  fn: () => Promise<T>,
): Promise<Result<T>> => {
  try {
    return Ok.from<T>(await fn());
  } catch (err) {
    return Err.from<T>(err as Error);
  }
};
