export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Omit<Partial<HTMLElementTagNameMap[K]>, "style"> & { style?: string },
): HTMLElementTagNameMap[K] {
  const { style, ...rest } = props ?? {};
  const element = Object.assign(document.createElement(tag), rest);
  if (style) element.style.cssText = style;
  return element;
}

export function labelledRow(
  labelText: string,
  labelFor: string,
  control: HTMLElement,
): HTMLTableRowElement {
  const tr = document.createElement("tr");
  const tdLabel = el("td");
  const tdControl = el("td");
  const lbl = el("label");
  lbl.htmlFor = labelFor;
  lbl.textContent = labelText;
  tdLabel.appendChild(lbl);
  tdControl.appendChild(control);
  tr.appendChild(tdLabel);
  tr.appendChild(tdControl);
  return tr;
}

export function createPanel(title: string): HTMLDivElement {
  const panel = document.createElement("div");
  panel.style.cssText = [
    "position:fixed",
    "top:10px",
    "right:10px",
    "z-index:99999",
    "background:#fff",
    "border:2px solid #333",
    "border-radius:6px",
    "padding:12px",
    "max-width:300px",
    "font-family:sans-serif",
    "font-size:13px",
  ].join(";");

  const h = document.createElement("h3");
  h.textContent = title;
  h.style.margin = "0 0 8px";
  panel.appendChild(h);

  return panel;
}
