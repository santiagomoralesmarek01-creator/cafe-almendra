// "Armá tu desayuno / merienda": una bebida y uno o dos acompañamientos, con descuento por combo,
// para tomar en la mesa o para llevar. Sin DOM. El combo viaja en el carrito como un id
// (combo:<bebida>+<a1>+<a2>, o combo-llevar:… para llevar) y, para que el núcleo
// (totales y mensaje de WhatsApp) lo entienda sin tocarlo, `localConCombos` agrega una categoría
// oculta con un producto armado por cada combo del carrito.
import type { Carrito, Categoria, Local, Producto } from "./nucleo/tipos";

/** De qué categorías sale la bebida y de cuáles los acompañamientos. */
export const CATEGORIAS_BEBIDA = ["cafe", "bebidas"];
export const CATEGORIAS_ACOMPANAMIENTO = ["panaderia", "salado", "tortas"];
/** Productos que no entran en el combo (no son para una persona). */
export const FUERA_DEL_COMBO = ["medialunas-docena", "agua"];
export const MIN_ACOMPANAMIENTOS = 1;
export const MAX_ACOMPANAMIENTOS = 2;
/** Descuento sobre la suma de lo elegido, redondeado para abajo a múltiplos de REDONDEO. */
export const DESCUENTO = 0.1;
export const REDONDEO = 100;
/** Categoría oculta que agrega `localConCombos` (no se muestra en la carta). */
export const CATEGORIA_COMBOS = "combos-armados";

const PREFIJO = "combo:";
/** Mismo combo, pero para llevar (vaso de cartón y cajitas): otra línea del pedido. */
const PREFIJO_LLEVAR = "combo-llevar:";

export interface Combo {
  bebida: string;
  /** Ordenados, para que el mismo combo tenga siempre el mismo id. Se pueden repetir (dos medialunas). */
  acompanamientos: string[];
  /** Para llevar en vez de para tomar en la mesa. */
  paraLlevar?: boolean;
}

export type Momento = "desayuno" | "merienda" | "combo";

const ROTULOS: Record<Momento, string> = { desayuno: "Desayuno", merienda: "Merienda", combo: "Combo" };

/** El id del combo, o null si no es válido. El orden de los acompañamientos no importa. */
export function idCombo(bebida: string, acompanamientos: string[], paraLlevar = false): string | null {
  const validos = (s: string) => !!s && !/[+:]/.test(s);
  if (!validos(bebida) || !acompanamientos.every(validos)) return null;
  if (acompanamientos.length < MIN_ACOMPANAMIENTOS || acompanamientos.length > MAX_ACOMPANAMIENTOS) return null;
  return `${paraLlevar ? PREFIJO_LLEVAR : PREFIJO}${[bebida, ...[...acompanamientos].sort()].join("+")}`;
}

/** Lee un id de combo. null si no es un combo o está mal armado. */
export function leerCombo(id: string): Combo | null {
  const paraLlevar = id.startsWith(PREFIJO_LLEVAR);
  if (!paraLlevar && !id.startsWith(PREFIJO)) return null;
  const [bebida, ...acompanamientos] = id.slice((paraLlevar ? PREFIJO_LLEVAR : PREFIJO).length).split("+");
  if (!bebida || acompanamientos.some((a) => !a)) return null;
  if (acompanamientos.length < MIN_ACOMPANAMIENTOS || acompanamientos.length > MAX_ACOMPANAMIENTOS) return null;
  return { bebida, acompanamientos: [...acompanamientos].sort(), paraLlevar };
}

/** Hora (0–23) en Argentina. */
function horaArgentina(fecha: Date): number {
  const h = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", hourCycle: "h23" }).format(fecha);
  return Number(h);
}

/** Antes de las 12, desayuno; desde las 16, merienda; en el medio, combo. Hora argentina. */
export function momentoDelDia(fecha: Date = new Date()): Momento {
  const hora = horaArgentina(fecha);
  if (hora < 12) return "desayuno";
  if (hora >= 16) return "merienda";
  return "combo";
}

export const rotuloMomento = (momento: Momento) => ROTULOS[momento];

const enCategorias = (local: Local, ids: string[]) =>
  local.categorias.filter((c) => ids.includes(c.id)).flatMap((c) => c.productos.filter((p) => !FUERA_DEL_COMBO.includes(p.id)));

/** Lo que se puede elegir (agotados incluidos, para mostrarlos marcados). */
export function opcionesCombo(local: Local): { bebidas: Producto[]; acompanamientos: Producto[] } {
  return { bebidas: enCategorias(local, CATEGORIAS_BEBIDA), acompanamientos: enCategorias(local, CATEGORIAS_ACOMPANAMIENTO) };
}

/** Los productos del combo, o null si alguno ya no existe, está agotado o no es de su categoría. */
export function resolverCombo(local: Local, combo: Combo): { bebida: Producto; acompanamientos: Producto[] } | null {
  const { bebidas, acompanamientos } = opcionesCombo(local);
  const bebida = bebidas.find((p) => p.id === combo.bebida);
  const acomp = combo.acompanamientos.map((id) => acompanamientos.find((p) => p.id === id));
  if (!bebida || bebida.agotado) return null;
  if (acomp.length < MIN_ACOMPANAMIENTOS || acomp.length > MAX_ACOMPANAMIENTOS) return null;
  if (acomp.some((p) => !p || p.agotado)) return null;
  return { bebida, acompanamientos: acomp as Producto[] };
}

/** Precio de lista (la suma), precio del combo y lo que se ahorra. */
export function precioCombo(productos: Producto[]): { lista: number; total: number; ahorro: number } {
  const lista = productos.reduce((s, p) => s + p.precio, 0);
  const total = Math.floor((lista * (1 - DESCUENTO)) / REDONDEO) * REDONDEO;
  return { lista, total, ahorro: lista - total };
}

/** "Desayuno: Flat white + Medialuna de manteca + Tostada de palta" (o "2 Medialuna de manteca"); "Desayuno para llevar: …". */
export function nombreCombo(bebida: Producto, acompanamientos: Producto[], momento: Momento, paraLlevar = false): string {
  const [a, b] = acompanamientos;
  const partes = a && b && a.id === b.id ? [`2 ${a.nombre}`] : acompanamientos.map((p) => p.nombre);
  return `${ROTULOS[momento]}${paraLlevar ? " para llevar" : ""}: ${[bebida.nombre, ...partes].join(" + ")}`;
}

/** El producto que representa un combo (para el carrito y el mensaje), o undefined si ya no se puede armar. */
export function productoCombo(local: Local, id: string, momento: Momento): Producto | undefined {
  const combo = leerCombo(id);
  const partes = combo && resolverCombo(local, combo);
  if (!partes) return undefined;
  const todos = [partes.bebida, ...partes.acompanamientos];
  return { id, nombre: nombreCombo(partes.bebida, partes.acompanamientos, momento, combo.paraLlevar), precio: precioCombo(todos).total };
}

/**
 * Copia del local con una categoría oculta que tiene un producto por cada combo del carrito, para
 * usar con las funciones del núcleo (lineasValidas, calcularTotal, armarMensaje…). Los combos que
 * ya no se pueden armar quedan afuera, así el núcleo los descarta como cualquier agotado.
 */
export function localConCombos(local: Local, carrito: Carrito, momento: Momento = momentoDelDia()): Local {
  const productos: Producto[] = [];
  for (const { productoId } of carrito) {
    if (productos.some((p) => p.id === productoId)) continue;
    const p = productoCombo(local, productoId, momento);
    if (p) productos.push(p);
  }
  const base = local.categorias.filter((c) => c.id !== CATEGORIA_COMBOS);
  if (!productos.length) return { ...local, categorias: base };
  const oculta: Categoria = { id: CATEGORIA_COMBOS, nombre: "Combos armados", productos };
  return { ...local, categorias: [...base, oculta] };
}

/** Detalle de un combo armado para mostrarlo en el pedido: el rótulo y lo elegido por separado. */
export function partesDelNombre(nombre: string): { titulo: string; detalle: string } {
  const i = nombre.indexOf(": ");
  return i < 0 ? { titulo: nombre, detalle: "" } : { titulo: nombre.slice(0, i), detalle: nombre.slice(i + 2) };
}
