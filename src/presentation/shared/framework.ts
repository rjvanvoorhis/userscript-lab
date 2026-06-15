export class Refs {
  constructor(private readonly root: Element) {}

  get<T extends HTMLElement = HTMLElement>(name: string): T {
    const el = this.root.querySelector<T>(`[data-ref="${name}"]`);
    if (!el) throw new Error(`Ref not found: "${name}"`);
    return el;
  }
}

const _injected = new Set<string>();

export function mountComponent(
  template: string,
  styles: string,
  setup: (refs: Refs) => void,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template.trim();
  const root = wrapper.firstElementChild as HTMLElement;

  if (!_injected.has(styles)) {
    const styleEl = document.createElement("style");
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    _injected.add(styles);
  }

  setup(new Refs(root));
  return root;
}
