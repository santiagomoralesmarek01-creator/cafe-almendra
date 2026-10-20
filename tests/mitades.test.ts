import { describe, expect, it } from "vitest";
import { gustosDisponibles, idMitades, leerMitades, productoMitades } from "../src/nucleo/mitades";
import { armarMensaje, calcularTotal, cambiarCantidad, cantidadTotal, lineasValidas } from "../src/nucleo/pedido";
import type { Local } from "../src/nucleo/tipos";
import { localDePrueba } from "./fixtures";

const local: Local = {
  ...localDePrueba,
  categorias: [
    ...localDePrueba.categorias,
    {
      id: "pizzas",
      nombre: "Pizzas",
      armador: "mitades",
      productos: [
        { id: "muzza", nombre: "Muzzarella", precio: 13500 },
        { id: "napo", nombre: "Napolitana", precio: 15900, cubierta: ["tomate"] },
        { id: "fuga", nombre: "Fugazzeta", precio: 15200, cubierta: ["cebolla"] },
        { id: "agotada", nombre: "Agotada", precio: 9000, agotado: true },
      ],
    },
  ],
};

describe("idMitades", () => {
  it("no depende del orden y vuelve a leerse", () => {
    expect(idMitades("napo", "fuga")).toBe(idMitades("fuga", "napo"));
    expect(leerMitades(idMitades("napo", "fuga"))).toEqual(["fuga", "napo"]);
  });

  it("dos mitades iguales son la pizza entera", () => {
    expect(idMitades("napo", "napo")).toBe("napo");
    expect(leerMitades("napo")).toBeNull();
  });
});

describe("productoMitades", () => {
  it("se cobra la mitad más cara y se nombran las dos", () => {
    const p = productoMitades(local, idMitades("muzza", "napo"));
    expect(p?.precio).toBe(15900);
    expect(p?.nombre).toBe("Mitad Muzzarella y mitad Napolitana");
  });

  it("no existe si una mitad se agotó o no es de una categoría con armador", () => {
    expect(productoMitades(local, idMitades("muzza", "agotada"))).toBeUndefined();
    const deOtraCategoria = localDePrueba.categorias[0]!.productos[0]!.id;
    expect(productoMitades(local, idMitades("muzza", deOtraCategoria))).toBeUndefined();
    expect(productoMitades(local, "mitades:roto")).toBeUndefined();
  });

  it("los gustos disponibles dejan afuera los agotados y las categorías sin armador", () => {
    expect(gustosDisponibles(local.categorias.at(-1)!).map((p) => p.id)).toEqual(["muzza", "napo", "fuga"]);
    expect(gustosDisponibles(localDePrueba.categorias[0]!)).toEqual([]);
  });
});

describe("pedido con pizzas por mitades", () => {
  it("entra en el total, la cantidad y el mensaje como cualquier producto", () => {
    let carrito = cambiarCantidad([], idMitades("napo", "fuga"), 1);
    carrito = cambiarCantidad(carrito, idMitades("fuga", "napo"), 1);
    carrito = cambiarCantidad(carrito, "muzza", 1);
    expect(carrito).toHaveLength(2);
    expect(cantidadTotal(local, carrito)).toBe(3);
    expect(calcularTotal(local, carrito)).toBe(15900 * 2 + 13500);
    const mensaje = armarMensaje(local, carrito, { nombre: "Ana", entrega: "retiro", pago: "Efectivo" });
    expect(mensaje).toContain("2 x Mitad Fugazzeta y mitad Napolitana");
  });

  it("si una mitad se agota, la línea sale del pedido", () => {
    const carrito = cambiarCantidad([], idMitades("napo", "fuga"), 1);
    const sinNapo: Local = {
      ...local,
      categorias: local.categorias.map((c) => (c.id === "pizzas" ? { ...c, productos: c.productos.map((p) => (p.id === "napo" ? { ...p, agotado: true } : p)) } : c)),
    };
    expect(lineasValidas(sinNapo, carrito)).toEqual([]);
  });
});
