import template from "./panel.component.html";
import styles from "./panel.component.css";
import { mountComponent } from "../shared/framework";
import { Button } from "../shared/components/Button";
import { el } from "../shared/dom";
import { NeoPoint } from "@domain/shared/NeoPoint";
import type { Signal } from "@core/Signal";
import type { BestItem, RestockConfig } from "@application/Restocker/IRestockPanel";

export type RestockPanelProps = {
  shops: Record<string, string>;
  config: Signal<RestockConfig>;
  bestItem: Signal<BestItem | null>;
  onConfigChange: (config: RestockConfig) => void;
  onRefreshPrices: () => void;
};

export function RestockPanel(props: RestockPanelProps): HTMLElement {
  return mountComponent(template, styles, (refs) => {
    const autobuyEl = refs.get<HTMLInputElement>("autobuy");
    const autorefreshEl = refs.get<HTMLInputElement>("autorefresh");
    const frequencyEl = refs.get<HTMLInputElement>("frequency");
    const shopEl = refs.get<HTMLSelectElement>("shop");
    const marginEl = refs.get<HTMLInputElement>("margin");
    const refreshSlot = refs.get<HTMLTableCellElement>("refresh-slot");
    const bestItemEl = refs.get<HTMLDivElement>("best-item");

    const initial = props.config.value;

    for (const [id, name] of Object.entries(props.shops)) {
      shopEl.appendChild(
        el("option", { value: id, textContent: name, selected: id === initial.shopId }),
      );
    }

    autobuyEl.checked = initial.autobuyEnabled;
    autorefreshEl.checked = initial.autorefreshEnabled;
    frequencyEl.value = String(initial.refreshFrequencyMs);
    marginEl.value = String(initial.minProfitMargin.amount);

    refreshSlot.appendChild(
      Button({ label: "Refresh Prices", onClick: props.onRefreshPrices, style: "margin-top:4px;width:100%" }),
    );

    props.config.subscribe((c) => {
      autobuyEl.checked = c.autobuyEnabled;
      autorefreshEl.checked = c.autorefreshEnabled;
      frequencyEl.value = String(c.refreshFrequencyMs);
      marginEl.value = String(c.minProfitMargin.amount);
    });

    props.bestItem.subscribe((item) => {
      if (!item) return;
      bestItemEl.textContent = `Current Best Item: ${item.name}  ${item.value}`;
      bestItemEl.style.outline = item.profitable ? "2px solid #2a8a2a" : "2px solid #cc4444";
    });

    const emit = () => {
      const marginRaw = Number.parseInt(marginEl.value, 10);
      let minProfitMargin: NeoPoint;
      try {
        minProfitMargin = NeoPoint.from(Number.isNaN(marginRaw) ? 0 : marginRaw);
      } catch {
        return;
      }
      props.onConfigChange({
        autobuyEnabled: autobuyEl.checked,
        autorefreshEnabled: autorefreshEl.checked,
        refreshFrequencyMs: Math.max(1000, Number.parseInt(frequencyEl.value, 10) || 5000),
        shopId: shopEl.value,
        minProfitMargin,
      });
    };

    [autobuyEl, autorefreshEl, frequencyEl, shopEl, marginEl].forEach((e) =>
      e.addEventListener("change", emit),
    );
  });
}
