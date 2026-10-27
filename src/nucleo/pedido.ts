// Copiado de Carta Local (src/pedido.ts): el motor compartido de pedidos. Si cambia allá, se copia acá; no editar por separado.
import { productoDocena } from "./docena";
import { formatearPesos } from "./formato";
import { productoMitades } from "./mitades";
import type { Carrito, DatosCliente, Local, Producto } from "./tipos";

export function buscarProducto(local: Local, id: string): Producto | undefined {
  const mitades = productoMitades(local, id);
  if (mitades) return mitades;
  const docena = productoDocena(local, id);
  if (docena) return docena;
  for (const categoria of local.categorias) {
    const producto = categoria.productos.find((p) => p.id === id);
    if (producto) return producto;
  }
  return undefined;
}

/** Suma `cantidad` del producto (o lo agrega). Una cantidad final de 0 o menos lo quita. */
export function cambiarCantidad(carrito: Carrito, productoId: string, cantidad: number): Carrito {
  const actual = carrito.find((l) => l.productoId === productoId);
  const nueva = (actual?.cantidad ?? 0) + cantidad;
  if (nueva <= 0) return carrito.filter((l) => l.productoId !== productoId);
  if (actual) return carrito.map((l) => (l.productoId === productoId ? { ...l, cantidad: nueva } : l));
  return [...carrito, { productoId, cantidad: nueva }];
}

/** Deja afuera lo que ya no existe en la carta o se agotó desde que se agregó. */
export function lineasValidas(local: Local, carrito: Carrito) {
  return carrito.flatMap((linea) => {
    const producto = buscarProducto(local, linea.productoId);
    if (!producto || producto.agotado || linea.cantidad <= 0) return [];
    return [{ ...linea, producto, subtotal: producto.precio * linea.cantidad }];
  });
}

export function cantidadTotal(local: Local, carrito: Carrito): number {
  return lineasValidas(local, carrito).reduce((suma, l) => suma + l.cantidad, 0);
}

export function calcularTotal(local: Local, carrito: Carrito, entrega: DatosCliente["entrega"] = "retiro"): number {
  const productos = lineasValidas(local, carrito).reduce((suma, l) => suma + l.subtotal, 0);
  const envio = entrega === "envio" && local.envio.disponible ? (local.envio.costo ?? 0) : 0;
  return productos + envio;
}

/** El texto que le llega al local: un solo mensaje, ordenado y con el total. */
export function armarMensaje(local: Local, carrito: Carrito, cliente: DatosCliente): string {
  const lineas = lineasValidas(local, carrito);
  const renglones = [`*Pedido para ${local.nombre}*`, ""];

  for (const l of lineas) {
    renglones.push(`${l.cantidad} x ${l.producto.nombre} — ${formatearPesos(l.subtotal)}`);
    if (l.nota) renglones.push(`   _${l.nota}_`);
  }

  const envio = cliente.entrega === "envio" && local.envio.disponible ? (local.envio.costo ?? 0) : 0;
  if (envio > 0) renglones.push(`Envío — ${formatearPesos(envio)}`);

  renglones.push("", `*Total: ${formatearPesos(calcularTotal(local, carrito, cliente.entrega))}*`, "");
  renglones.push(`Nombre: ${cliente.nombre}`);
  renglones.push(cliente.entrega === "envio" ? `Envío a: ${cliente.direccion ?? ""}` : "Retiro en el local");
  renglones.push(`Pago: ${cliente.pago}`);
  if (cliente.aclaraciones) renglones.push(`Aclaraciones: ${cliente.aclaraciones}`);

  return renglones.join("\n");
}

export function linkWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
}

/** El mensaje partido en tramos normales y en negrita (*así*), como lo muestra WhatsApp. */
export function negritasDeWhatsApp(texto: string): { texto: string; negrita: boolean }[] {
  const tramos: { texto: string; negrita: boolean }[] = [];
  let desde = 0;
  for (const m of texto.matchAll(/\*([^*\n]+)\*/g)) {
    if (m.index > desde) tramos.push({ texto: texto.slice(desde, m.index), negrita: false });
    tramos.push({ texto: m[1]!, negrita: true });
    desde = m.index + m[0].length;
  }
  if (desde < texto.length) tramos.push({ texto: texto.slice(desde), negrita: false });
  return tramos;
}

/** Si el local toma pedidos por la carta. El plan Carta muestra la carta sin carrito. */
export function tomaPedidos(local: Pick<Local, "plan">): boolean {
  return local.plan !== "carta";
}
