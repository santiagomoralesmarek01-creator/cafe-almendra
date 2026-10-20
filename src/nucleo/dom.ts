// Ayudas del DOM que comparten la web de pedidos y la carta del salón.

export const movimientoReducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export function crear<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...hijos: (Node | string)[]): HTMLElementTagNameMap[K] {
  const el: HTMLElementTagNameMap[K] = Object.assign(document.createElement(tag), props);
  el.append(...hijos);
  return el;
}

/** Firma del autor al pie de las dos páginas. Va siempre. */
export function firma(): HTMLElement {
  return crear("p", { className: "firma" }, "Hecho por ", crear("strong", {}, "MrK"));
}
