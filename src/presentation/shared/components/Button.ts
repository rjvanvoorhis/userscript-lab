export type ButtonProps = {
  label: string;
  onClick: () => void;
  style?: string;
};

export function Button({ label, onClick, style }: ButtonProps): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = label;
  if (style) btn.style.cssText = style;
  btn.addEventListener("click", onClick);
  return btn;
}
