// Copiado de Carta Local (src/docena.ts): el motor compartido de pedidos. Si cambia allá, se copia acá; no editar por separado.
// "Armá tu docena": empanadas surtidas de una categoría con armador "docena" en una sola línea
// del pedido. Se cobra la combinación más barata de docenas, medias docenas y unidades. Sin DOM: testeado.
import type { Categoria, Local, Producto } from "./tipos";

const PREFIJO = "docena:";
export const DOCENA = 12;
export const MEDIA = 6;

/** Cuántas de cada gusto: { "emp-carne": 6, "emp-humita": 4 }. */
export type Cantidades = Record<string, number>;

export interface Desglose {
  /** Cantidad total de empanadas. */
  unidades: number;
  docenas: number;
  medias: number;
  /** Las que se cobran a precio por unidad. */
  sueltas: number;
  /** Lo que se paga. */
  total: number;
  /** Lo que saldrían todas a precio por unidad. */
  sinPromo: number;
  /** sinPromo - total (0 si no hay ahorro). */
  ahorro: number;
}

/** Los gustos que se pueden elegir: los de la categoría que no están agotados. */
export function gustosDocena(categoria: Categoria): Producto[] {
  return categoria.armador === "docena" && categoria.docena ? categoria.productos.filter((p) => !p.agotado) : [];
}

/** Deja sólo cantidades enteras positivas. */
function limpiar(cantidades: Cantidades): [string, number][] {
  return Object.entries(cantidades).filter(([id, n]) => id && Number.isInteger(n) && n > 0);
}

/** Id de la línea del pedido: no depende del orden en que se eligieron los gustos. "" si está vacía. */
export function idDocena(cantidades: Cantidades): string {
  const partes = limpiar(cantidades).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return partes.length ? `${PREFIJO}${partes.map(([id, n]) => `${id}*${n}`).join("+")}` : "";
}

/** Las cantidades de un id armado con idDocena, o null si no es una docena armada. */
export function leerDocena(id: string): Cantidades | null {
  if (!id.startsWith(PREFIJO)) return null;
  const cantidades: Cantidades = {};
  for (const parte of id.slice(PREFIJO.length).split("+")) {
    const m = /^([^*+]+)\*(\d{1,3})$/.exec(parte);
    if (!m || cantidades[m[1]!] !== undefined || Number(m[2]) <= 0) return null;
    cantidades[m[1]!] = Number(m[2]);
  }
  return Object.keys(cantidades).length ? cantidades : null;
}

/**
 * La forma más barata de cobrar estas empanadas: prueba todas las combinaciones de docenas y
 * medias docenas; las que quedan sueltas son las de precio por unidad más bajo (las más caras
 * conviene meterlas en la docena).
 */
export function desglosarDocena(precios: number[], docena: { precio: number; media?: number }): Desglose {
  const ordenados = [...precios].sort((a, b) => a - b);
  const unidades = ordenados.length;
  const sinPromo = ordenados.reduce((s, p) => s + p, 0);
  // acumulado[k] = lo que suman las k más baratas.
  const acumulado = [0];
  for (const p of ordenados) acumulado.push(acumulado.at(-1)! + p);

  let mejor: Desglose = { unidades, docenas: 0, medias: 0, sueltas: unidades, total: sinPromo, sinPromo, ahorro: 0 };
  for (let d = 0; d * DOCENA <= unidades; d++) {
    const maxMedias = docena.media ? Math.floor((unidades - d * DOCENA) / MEDIA) : 0;
    for (let m = 0; m <= maxMedias; m++) {
      const sueltas = unidades - d * DOCENA - m * MEDIA;
      const total = d * docena.precio + m * (docena.media ?? 0) + acumulado[sueltas]!;
      if (total < mejor.total) mejor = { unidades, docenas: d, medias: m, sueltas, total, sinPromo, ahorro: sinPromo - total };
    }
  }
  return mejor;
}

/** El desglose de las cantidades elegidas en una categoría (los gustos que no están se ignoran). */
export function precioDocena(categoria: Categoria, cantidades: Cantidades): Desglose {
  const gustos = gustosDocena(categoria);
  const precios = limpiar(cantidades).flatMap(([id, n]) => {
    const p = gustos.find((g) => g.id === id);
    return p ? Array<number>(n).fill(p.precio) : [];
  });
  return desglosarDocena(precios, categoria.docena ?? { precio: 0 });
}

/** "Docena", "Media docena", "2 docenas", "18 empanadas", "1 empanada". */
export function rotuloCantidad(unidades: number): string {
  if (unidades === DOCENA) return "Docena";
  if (unidades === MEDIA) return "Media docena";
  if (unidades > 0 && unidades % DOCENA === 0) return `${unidades / DOCENA} docenas`;
  return unidades === 1 ? "1 empanada" : `${unidades} empanadas`;
}

/** "Docena: 6 Carne cortada a cuchillo, 4 Humita, 2 Jamón y queso" (de más a menos; empate, orden de la carta). */
export function nombreDocena(categoria: Categoria, cantidades: Cantidades): string {
  const elegidos = categoria.productos
    .map((p, i) => ({ p, i, n: cantidades[p.id] ?? 0 }))
    .filter((x) => Number.isInteger(x.n) && x.n > 0)
    .sort((a, b) => b.n - a.n || a.i - b.i);
  const total = elegidos.reduce((s, x) => s + x.n, 0);
  return `${rotuloCantidad(total)}: ${elegidos.map((x) => `${x.n} ${x.p.nombre}`).join(", ")}`;
}

/**
 * La docena armada como un producto más, para que el pedido, el total y el mensaje la traten igual
 * que al resto. `undefined` si algún gusto no existe, se agotó o no es de una misma categoría con
 * armador "docena".
 */
export function productoDocena(local: Local, id: string): Producto | undefined {
  const cantidades = leerDocena(id);
  if (!cantidades) return undefined;
  for (const categoria of local.categorias) {
    const gustos = gustosDocena(categoria);
    if (!Object.keys(cantidades).every((g) => gustos.some((p) => p.id === g))) continue;
    return { id, nombre: nombreDocena(categoria, cantidades), precio: precioDocena(categoria, cantidades).total };
  }
  return undefined;
}
