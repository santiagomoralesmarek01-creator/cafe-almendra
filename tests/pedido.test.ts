import { describe, expect, it } from "vitest";
import { formatearPesos } from "../src/nucleo/formato";
import { armarMensaje, calcularTotal, cambiarCantidad, cantidadTotal, linkWhatsApp, negritasDeWhatsApp } from "../src/nucleo/pedido";
import type { Carrito } from "../src/nucleo/tipos";
import { localDePrueba as local } from "./fixtures";

describe("formatearPesos", () => {
  it("separa miles con punto", () => {
    expect(formatearPesos(0)).toBe("$0");
    expect(formatearPesos(950)).toBe("$950");
    expect(formatearPesos(1500)).toBe("$1.500");
    expect(formatearPesos(1234567)).toBe("$1.234.567");
  });
});

describe("cambiarCantidad", () => {
  it("agrega, suma y quita", () => {
    let carrito: Carrito = [];
    carrito = cambiarCantidad(carrito, "carne", 6);
    carrito = cambiarCantidad(carrito, "carne", 6);
    carrito = cambiarCantidad(carrito, "mila", 1);
    expect(carrito).toEqual([
      { productoId: "carne", cantidad: 12 },
      { productoId: "mila", cantidad: 1 },
    ]);
    carrito = cambiarCantidad(carrito, "mila", -1);
    expect(carrito).toEqual([{ productoId: "carne", cantidad: 12 }]);
  });

  it("no deja cantidades negativas", () => {
    expect(cambiarCantidad([], "carne", -3)).toEqual([]);
  });
});

describe("calcularTotal", () => {
  const carrito: Carrito = [
    { productoId: "carne", cantidad: 6 },
    { productoId: "mila", cantidad: 1 },
  ];

  it("suma los productos", () => {
    expect(calcularTotal(local, carrito)).toBe(6 * 1200 + 9800);
  });

  it("suma el envío sólo si se pide envío", () => {
    expect(calcularTotal(local, carrito, "envio")).toBe(6 * 1200 + 9800 + 1500);
  });

  it("ignora productos agotados o que ya no están en la carta", () => {
    const conProblemas: Carrito = [...carrito, { productoId: "tarta", cantidad: 2 }, { productoId: "borrado", cantidad: 1 }];
    expect(calcularTotal(local, conProblemas)).toBe(6 * 1200 + 9800);
    expect(cantidadTotal(local, conProblemas)).toBe(7);
  });
});

describe("armarMensaje", () => {
  it("arma un pedido claro con el total", () => {
    const mensaje = armarMensaje(
      local,
      [
        { productoId: "carne", cantidad: 6, nota: "bien cocidas" },
        { productoId: "mila", cantidad: 1 },
      ],
      { nombre: "Ana", entrega: "envio", direccion: "Mitre 456", pago: "Efectivo", aclaraciones: "Tocar timbre B" },
    );
    expect(mensaje).toBe(
      [
        "*Pedido para Rotisería de Prueba*",
        "",
        "6 x Empanada de carne — $7.200",
        "   _bien cocidas_",
        "1 x Milanesa con papas — $9.800",
        "Envío — $1.500",
        "",
        "*Total: $18.500*",
        "",
        "Nombre: Ana",
        "Envío a: Mitre 456",
        "Pago: Efectivo",
        "Aclaraciones: Tocar timbre B",
      ].join("\n"),
    );
  });

  it("con retiro no cobra envío", () => {
    const mensaje = armarMensaje(local, [{ productoId: "carne", cantidad: 1 }], {
      nombre: "Ana",
      entrega: "retiro",
      pago: "Transferencia",
    });
    expect(mensaje).toContain("Retiro en el local");
    expect(mensaje).not.toContain("Envío —");
    expect(mensaje).toContain("*Total: $1.200*");
  });
});

describe("linkWhatsApp", () => {
  it("limpia el número y codifica el texto", () => {
    expect(linkWhatsApp(local.whatsapp, "Hola & chau\n¿2?")).toBe(
      "https://wa.me/5491123456789?text=Hola%20%26%20chau%0A%C2%BF2%3F",
    );
  });
});

describe("negritasDeWhatsApp", () => {
  it("separa los tramos en negrita como WhatsApp", () => {
    expect(negritasDeWhatsApp("*Pedido* para Ana\n*Total: $1.000*")).toEqual([
      { texto: "Pedido", negrita: true },
      { texto: " para Ana\n", negrita: false },
      { texto: "Total: $1.000", negrita: true },
    ]);
  });
  it("deja igual lo que no tiene asteriscos o los tiene sueltos", () => {
    expect(negritasDeWhatsApp("2 x Empanada")).toEqual([{ texto: "2 x Empanada", negrita: false }]);
    expect(negritasDeWhatsApp("a * b")).toEqual([{ texto: "a * b", negrita: false }]);
    expect(negritasDeWhatsApp("")).toEqual([]);
  });
});
