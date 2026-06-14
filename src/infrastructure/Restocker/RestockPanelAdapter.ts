import { NeoPoint } from "@domain/shared/NeoPoint";
import type { IRestockPanel, RestockConfig } from "@application/Restocker/IRestockPanel";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Omit<Partial<HTMLElementTagNameMap[K]>, "style"> & { style?: string },
): HTMLElementTagNameMap[K] {
  const { style, ...rest } = props ?? {};
  const element = Object.assign(document.createElement(tag), rest);
  if (style) element.style.cssText = style;
  return element;
}

function labelledRow(labelText: string, labelFor: string, control: HTMLElement): HTMLTableRowElement {
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

export class RestockPanelAdapter implements IRestockPanel {
  private handler: ((config: RestockConfig) => void) | null = null;
  private refreshHandler: (() => void) | null = null;

  mount(shops: Record<string, string>, initial: RestockConfig): void {
    const autobuyEl     = el("input",  { type: "checkbox", id: "rp-autobuy",     checked: initial.autobuyEnabled });
    const autorefreshEl = el("input",  { type: "checkbox", id: "rp-autorefresh", checked: initial.autorefreshEnabled });
    const frequencyEl   = el("input",  { type: "number",   id: "rp-frequency",   value: String(initial.refreshFrequencyMs), min: "1000", style: "width:70px" });
    const marginEl      = el("input",  { type: "number",   id: "rp-margin",      value: String(initial.minProfitMargin.amount), min: "0", style: "width:70px" });
    const shopEl        = el("select", { id: "rp-shop" });
    const refreshBtn    = el("button", { textContent: "Refresh Prices", style: "margin-top:4px;width:100%" });

    for (const [id, name] of Object.entries(shops)) {
      shopEl.appendChild(el("option", { value: id, textContent: name, selected: id === initial.shopId }));
    }

    const table = el("table", { style: "margin-top:8px;border-spacing:4px 6px" });
    table.appendChild(labelledRow("Autobuy",        "rp-autobuy",     autobuyEl));
    table.appendChild(labelledRow("Autorefresh",    "rp-autorefresh", autorefreshEl));
    table.appendChild(labelledRow("Frequency (ms)", "rp-frequency",   frequencyEl));
    table.appendChild(labelledRow("Shop",           "rp-shop",        shopEl));
    table.appendChild(labelledRow("Min Profit (NP)", "rp-margin",     marginEl));

    const btnRow = el("tr");
    const btnCell = el("td");
    btnCell.colSpan = 2;
    btnCell.appendChild(refreshBtn);
    btnRow.appendChild(btnCell);
    table.appendChild(btnRow);

    const title = el("strong", { textContent: "Restocker" });

    const panel = el("div", { id: "restocker-panel" });
    panel.style.cssText = [
      "position:fixed", "top:10px", "right:10px",
      "background:#fff", "border:1px solid #999",
      "padding:12px", "z-index:9999",
      "font-size:13px", "min-width:220px",
      "box-shadow:0 2px 6px rgba(0,0,0,.2)",
    ].join(";");
    panel.appendChild(title);
    panel.appendChild(table);
    document.body.appendChild(panel);

    const emit = () => {
      const autobuyEnabled     = autobuyEl.checked;
      const autorefreshEnabled = autorefreshEl.checked;
      const refreshFrequencyMs = Math.max(1000, Number.parseInt(frequencyEl.value, 10) || 5000);
      const shopId             = shopEl.value;
      const marginRaw          = Number.parseInt(marginEl.value, 10);

      let minProfitMargin: NeoPoint;
      try {
        minProfitMargin = NeoPoint.from(Number.isNaN(marginRaw) ? 0 : marginRaw);
      } catch {
        return;
      }

      this.handler?.({ autobuyEnabled, autorefreshEnabled, refreshFrequencyMs, shopId, minProfitMargin });
    };

    [autobuyEl, autorefreshEl, frequencyEl, shopEl, marginEl].forEach((e) =>
      e.addEventListener("change", emit),
    );

    refreshBtn.addEventListener("click", () => this.refreshHandler?.());
  }

  onConfigChange(handler: (config: RestockConfig) => void): void {
    this.handler = handler;
  }

  onRefreshPrices(handler: () => void): void {
    this.refreshHandler = handler;
  }
}
