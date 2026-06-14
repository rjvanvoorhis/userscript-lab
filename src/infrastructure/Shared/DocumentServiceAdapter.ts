import type { IDocument } from "@application/shared/IDocument";

export class DocumentServiceAdapter implements IDocument {
  getHref() {
    return document.location.href;
  }

  containsText(text: string) {
    return document.body.innerText.includes(text);
  }

  querySelector<T extends Element>(selector: string) {
    return document.querySelector<T>(selector);
  }
}
