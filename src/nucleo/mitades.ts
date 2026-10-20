// Copiado de Carta Local (src/mitades.ts): el motor compartido de pedidos. Si cambia allá, se copia acá; no editar por separado.
// Pizza por mitades: dos gustos de una misma categoría con armador "mitades" en una sola línea
// del pedido. Se cobra la mitad más cara, como en cualquier pizzería.
import type { Categoria, Cubierta, Local, Producto } from "./tipos";

export const CUBIERTAS: readonly Cubierta[] = ["tomate", "jamon", "morron", "aceitunas", "cebolla", "calabresa", "rucula", "huevo"];

const PREFIJO = "mitades:";

/** Id de la línea del pedido. El orden de las mitades no importa; dos mitades iguales son la pizza entera. */
export function idMitades(a: string, b: string): string {
  if (a === b) return a;
  const [x, y] = [a, b].sort();
  return `${PREFIJO}${x}+${y}`;
}

/** Las dos mitades de un id armado con idMitades, o null si no es una pizza por mitades. */
export function leerMitades(id: string): [string, string] | null {
  if (!id.startsWith(PREFIJO)) return null;
  const partes = id.slice(PREFIJO.length).split("+");
  return partes.length === 2 && partes[0] && partes[1] ? [partes[0], partes[1]] : null;
}

/** Los gustos que se pueden elegir para una mitad: los de la categoría que no están agotados. */
export function gustosDisponibles(categoria: Categoria): Producto[] {
  return categoria.armador === "mitades" ? categoria.productos.filter((p) => !p.agotado) : [];
}

export function nombreMitades(a: Producto, b: Producto): string {
  return `Mitad ${a.nombre} y mitad ${b.nombre}`;
}

export function precioMitades(a: Producto, b: Producto): number {
  return Math.max(a.precio, b.precio);
}

/**
 * La pizza por mitades como un producto más, para que el pedido, el total y el mensaje la traten
 * igual que al resto. `undefined` si alguna mitad no existe, se agotó o no es de una misma categoría
 * con armador "mitades".
 */
export function productoMitades(local: Local, id: string): Producto | undefined {
  const mitades = leerMitades(id);
  if (!mitades) return undefined;
  for (const categoria of local.categorias) {
    const gustos = gustosDisponibles(categoria);
    const a = gustos.find((p) => p.id === mitades[0]);
    const b = gustos.find((p) => p.id === mitades[1]);
    if (a && b) return { id, nombre: nombreMitades(a, b), precio: precioMitades(a, b) };
  }
  return undefined;
}
