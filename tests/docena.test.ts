import { describe, expect, it } from "vitest";
import { desglosarDocena, gustosDocena, idDocena, leerDocena, nombreDocena, precioDocena, productoDocena, rotuloCantidad } from "../src/nucleo/docena";
import { armarMensaje, calcularTotal, cambiarCantidad, cantidadTotal, lineasValidas } from "../src/nucleo/pedido";
import type { Categoria, Local } from "../src/nucleo/tipos";
import { localDePrueba } from "./fixtures";

const empanadas: Categoria = {
  id: "empanadas",
  nombre: "Empanadas",
  armador: "docena",
  docena: { precio: 14000, media: 7500 },
  productos: [
    { id: "carne", nombre: "Carne cortada a cuchillo", precio: 1300 },
    { id: "humita", nombre: "Humita", precio: 1200 },
    { id: "jyq", nombre: "Jamón y queso", precio: 1200 },
    { id: "picante", nombre: "Carne picante", precio: 1400 },
    { id: "agotada", nombre: "Agotada", precio: 1200, agotado: true },
  ],
};

const local: Local = { ...localDePrueba, categorias: [empanadas, ...localDePrueba.categorias.slice(1)] };

describe("idDocena", () => {
  it("no depende del orden y vuelve a leerse", () => {
    const id = idDocena({ jyq: 2, carne: 6, humita: 4 });
    expect(id).toBe(idDocena({ carne: 6, humita: 4, jyq: 2 }));
    expect(id).toBe("docena:carne*6+humita*4+jyq*2");
    expect(leerDocena(id)).toEqual({ carne: 6, humita: 4, jyq: 2 });
  });

  it("deja afuera cantidades en cero y no lee ids rotos", () => {
    expect(idDocena({ carne: 12, humita: 0 })).toBe("docena:carne*12");
    expect(idDocena({})).toBe("");
    expect(leerDocena("carne")).toBeNull();
    expect(leerDocena("docena:")).toBeNull();
    expect(leerDocena("docena:carne*0")).toBeNull();
    expect(leerDocena("docena:carne*2+carne*3")).toBeNull();
    expect(leerDocena("docena:carne")).toBeNull();
  });
});

describe("desglosarDocena", () => {
  it("una docena se cobra al precio de la docena y muestra el ahorro", () => {
    const d = precioDocena(empanadas, { carne: 6, humita: 4, jyq: 2 });
    expect(d).toMatchObject({ unidades: 12, docenas: 1, medias: 0, sueltas: 0, total: 14000 });
    expect(d.sinPromo).toBe(6 * 1300 + 6 * 1200);
    expect(d.ahorro).toBe(15000 - 14000);
  });

  it("media docena sólo si conviene", () => {
    expect(precioDocena(empanadas, { carne: 6 })).toMatchObject({ medias: 1, total: 7500, ahorro: 300 });
    // 6 de 1200 = 7200: más barato que la media docena.
    expect(precioDocena(empanadas, { humita: 6 })).toMatchObject({ medias: 0, sueltas: 6, total: 7200, ahorro: 0 });
  });

  it("combina docenas, medias y sueltas, y deja sueltas las más baratas", () => {
    // 19: docena + media + 1 suelta; la suelta es la de 1200.
    const d = desglosarDocena([...Array(18).fill(1400), 1200], { precio: 14000, media: 7500 });
    expect(d).toMatchObject({ docenas: 1, medias: 1, sueltas: 1, total: 14000 + 7500 + 1200 });
    expect(d.ahorro).toBe(18 * 1400 + 1200 - d.total);
  });

  it("sin media docena definida no la usa", () => {
    expect(desglosarDocena(Array(6).fill(1400), { precio: 14000 })).toMatchObject({ medias: 0, sueltas: 6, total: 8400 });
  });

  it("pocas unidades: precio por unidad", () => {
    expect(precioDocena(empanadas, { carne: 2, humita: 1 })).toMatchObject({ unidades: 3, total: 3800, ahorro: 0 });
    expect(desglosarDocena([], { precio: 14000 })).toMatchObject({ unidades: 0, total: 0 });
  });

  it("ignora gustos agotados o de otra categoría", () => {
    expect(precioDocena(empanadas, { carne: 1, agotada: 3, mila: 2 })).toMatchObject({ unidades: 1, total: 1300 });
  });
});

describe("nombres", () => {
  it("lista los gustos de más a menos", () => {
    expect(nombreDocena(empanadas, { jyq: 2, carne: 6, humita: 4 })).toBe("Docena: 6 Carne cortada a cuchillo, 4 Humita, 2 Jamón y queso");
    expect(nombreDocena(empanadas, { humita: 3, carne: 3 })).toBe("Media docena: 3 Carne cortada a cuchillo, 3 Humita");
  });

  it("rótulos por cantidad", () => {
    expect([1, 5, 6, 12, 18, 24].map(rotuloCantidad)).toEqual(["1 empanada", "5 empanadas", "Media docena", "Docena", "18 empanadas", "2 docenas"]);
  });

  it("los gustos disponibles dejan afuera los agotados y las categorías sin armador", () => {
    expect(gustosDocena(empanadas).map((p) => p.id)).toEqual(["carne", "humita", "jyq", "picante"]);
    expect(gustosDocena(localDePrueba.categorias[0]!)).toEqual([]);
    expect(gustosDocena({ ...empanadas, docena: undefined })).toEqual([]);
  });
});

describe("pedido con docenas armadas", () => {
  const id = idDocena({ carne: 6, humita: 4, jyq: 2 });

  it("es un producto con el nombre de los gustos y el precio de la docena", () => {
    expect(productoDocena(local, id)).toEqual({ id, nombre: "Docena: 6 Carne cortada a cuchillo, 4 Humita, 2 Jamón y queso", precio: 14000 });
    expect(productoDocena(local, "docena:carne*6+mila*6")).toBeUndefined();
    expect(productoDocena(local, "carne")).toBeUndefined();
  });

  it("entra en el total, la cantidad y el mensaje como cualquier producto", () => {
    let carrito = cambiarCantidad([], id, 1);
    carrito = cambiarCantidad(carrito, idDocena({ jyq: 2, humita: 4, carne: 6 }), 1);
    carrito = cambiarCantidad(carrito, "mila", 1);
    expect(carrito).toHaveLength(2);
    expect(cantidadTotal(local, carrito)).toBe(3);
    expect(calcularTotal(local, carrito)).toBe(14000 * 2 + 9800);
    const mensaje = armarMensaje(local, carrito, { nombre: "Ana", entrega: "retiro", pago: "Efectivo" });
    expect(mensaje).toContain("2 x Docena: 6 Carne cortada a cuchillo, 4 Humita, 2 Jamón y queso — $28.000");
  });

  it("si un gusto se agota, la línea sale del pedido", () => {
    const carrito = cambiarCantidad([], id, 1);
    const sinHumita: Local = {
      ...local,
      categorias: local.categorias.map((c) => (c.id === "empanadas" ? { ...c, productos: c.productos.map((p) => (p.id === "humita" ? { ...p, agotado: true } : p)) } : c)),
    };
    expect(lineasValidas(sinHumita, carrito)).toEqual([]);
  });
});
