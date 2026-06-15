import type { IDocument } from "@application/shared/IDocument";

export class DocumentServiceAdapter implements IDocument {
  constructor(private readonly doc: Document = globalThis.document) {}

  getHref() {
    return this.doc.location.href;
  }

  containsText(text: string) {
    return this.doc.body.innerText.includes(text);
  }

  querySelector<T extends Element>(selector: string) {
    return this.doc.querySelector<T>(selector);
  }
}
