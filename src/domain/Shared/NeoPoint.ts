export class NeoPoint {
  private constructor(readonly amount: number) {}

  static from(amount: number): NeoPoint {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(`NeoPoint must be a non-negative integer, got ${amount}`);
    }
    return new NeoPoint(amount);
  }

  static zero(): NeoPoint {
    return new NeoPoint(0);
  }

  add(other: NeoPoint): NeoPoint {
    return new NeoPoint(this.amount + other.amount);
  }

  subtract(other: NeoPoint): NeoPoint {
    const result = this.amount - other.amount;
    if (result < 0) throw new Error('NeoPoint subtraction would produce a negative value');
    return new NeoPoint(result);
  }

  isGreaterThan(other: NeoPoint): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: NeoPoint): boolean {
    return this.amount < other.amount;
  }

  equals(other: NeoPoint): boolean {
    return this.amount === other.amount;
  }

  toString(): string {
    return `${this.amount.toLocaleString()} NP`;
  }
}
