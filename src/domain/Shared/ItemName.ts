export class ItemName {
  private constructor(readonly value: string) {}

  static from(raw: string): ItemName {
    const trimmed = raw.trim().toLowerCase();
    if (trimmed.length === 0) throw new Error('ItemName cannot be empty');
    return new ItemName(trimmed);
  }

  equals(other: ItemName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
