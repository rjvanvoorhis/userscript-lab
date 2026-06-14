export interface IDocument {
  getHref(): string;
  containsText(text: string): boolean;
  querySelector<T extends Element>(selector: string): T | null;
}
