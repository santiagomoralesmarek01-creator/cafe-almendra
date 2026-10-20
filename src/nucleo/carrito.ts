// Copiado de Carta Local (src/carrito.ts): el motor compartido de pedidos. Si cambia allá, se copia acá; no editar por separado.
// El carrito de la web de pedidos se guarda en el dispositivo; si el navegador no deja, se trabaja sólo en memoria.
import type { Carrito } from "./tipos";

export function leerCarrito(slug: string): Carrito {
  try {
    const guardado = JSON.parse(localStorage.getItem(`carrito:${slug}`) ?? "[]");
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

export function guardarCarrito(slug: string, carrito: Carrito) {
  try {
    localStorage.setItem(`carrito:${slug}`, JSON.stringify(carrito));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}
