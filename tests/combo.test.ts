import { describe, expect, it } from "vitest";
import {
  CATEGORIA_COMBOS,
  idCombo,
  leerCombo,
  localConCombos,
  momentoDelDia,
  nombreCombo,
  opcionesCombo,
  partesDelNombre,
  precioCombo,
  productoCombo,
  resolverCombo,
} from "../src/combo";
import { armarMensaje, calcularTotal, cantidadTotal, lineasValidas } from "../src/nucleo/pedido";
import type { Local } from "../src/nucleo/tipos";

const cafe: Local = {
  slug: "cafe",
  nombre: "Café de Prueba",
  whatsapp: "5491100000000",
  direccion: "Pasaje 1",
  mediosDePago: ["Efectivo"],
  envio: { disponible: true, costo: 1200 },
  categorias: [
    {
      id: "cafe",
      nombre: "Café",
      productos: [
        { id: "flat-white", nombre: "Flat white", precio: 3800 },
        { id: "espresso", nombre: "Espresso", precio: 2600 },
      ],
    },
    {
      id: "panaderia",
      nombre: "Panadería",
      productos: [
        { id: "medialuna", nombre: "Medialuna de manteca", precio: 900 },
        { id: "medialunas-docena", nombre: "Docena de medialunas", precio: 9500 },
        { id: "scon", nombre: "Scones", precio: 3000, agotado: true },
      ],
    },
    { id: "salado", nombre: "Salado", productos: [{ id: "tostado-palta", nombre: "Tostada de palta", precio: 7400 }] },
    { id: "tortas", nombre: "Tortas", productos: [{ id: "chocotorta", nombre: "Chocotorta", precio: 5000 }] },
    {
      id: "bebidas",
      nombre: "Bebidas",
      productos: [
        { id: "limonada", nombre: "Limonada", precio: 3900 },
        { id: "agua", nombre: "Agua", precio: 1500 },
      ],
    },
  ],
};

// 10:00, 14:00 y 17:00 en Buenos Aires (UTC-3).
const manana = new Date("2026-10-20T13:00:00Z");
const mediodia = new Date("2026-10-20T17:00:00Z");
const tarde = new Date("2026-10-20T20:00:00Z");

describe("id del combo", () => {
  it("no depende del orden de los acompañamientos", () => {
    expect(idCombo("flat-white", ["tostado-palta", "medialuna"])).toBe("combo:flat-white+medialuna+tostado-palta");
    expect(idCombo("flat-white", ["medialuna", "tostado-palta"])).toBe(idCombo("flat-white", ["tostado-palta", "medialuna"]));
  });

  it("pide uno o dos acompañamientos", () => {
    expect(idCombo("flat-white", [])).toBeNull();
    expect(idCombo("flat-white", ["a", "b", "c"])).toBeNull();
    expect(idCombo("", ["medialuna"])).toBeNull();
    expect(idCombo("flat+white", ["medialuna"])).toBeNull();
  });

  it("se lee de vuelta", () => {
    expect(leerCombo("combo:flat-white+tostado-palta+medialuna")).toEqual({ bebida: "flat-white", acompanamientos: ["medialuna", "tostado-palta"] });
    expect(leerCombo("combo:espresso+medialuna+medialuna")).toEqual({ bebida: "espresso", acompanamientos: ["medialuna", "medialuna"] });
    expect(leerCombo("flat-white")).toBeNull();
    expect(leerCombo("combo:flat-white")).toBeNull();
    expect(leerCombo("combo:flat-white+a+b+c")).toBeNull();
    expect(leerCombo("combo:flat-white++a")).toBeNull();
  });
});

describe("momento del día", () => {
  it("desayuno antes de las 12, merienda desde las 16, combo en el medio", () => {
    expect(momentoDelDia(manana)).toBe("desayuno");
    expect(momentoDelDia(mediodia)).toBe("combo");
    expect(momentoDelDia(tarde)).toBe("merienda");
    expect(momentoDelDia(new Date("2026-10-20T15:00:00Z"))).toBe("combo"); // 12:00
    expect(momentoDelDia(new Date("2026-10-20T19:00:00Z"))).toBe("merienda"); // 16:00
  });
});

describe("opciones y precio", () => {
  it("separa bebidas y acompañamientos y deja afuera lo que no es para uno", () => {
    const { bebidas, acompanamientos } = opcionesCombo(cafe);
    expect(bebidas.map((p) => p.id)).toEqual(["flat-white", "espresso", "limonada"]);
    expect(acompanamientos.map((p) => p.id)).toEqual(["medialuna", "scon", "tostado-palta", "chocotorta"]);
  });

  it("10 % menos, redondeado para abajo a $100", () => {
    // 3800 + 900 + 7400 = 12100 → 10890 → 10800
    expect(precioCombo([{ id: "a", nombre: "a", precio: 3800 }, { id: "b", nombre: "b", precio: 900 }, { id: "c", nombre: "c", precio: 7400 }])).toEqual({
      lista: 12100,
      total: 10800,
      ahorro: 1300,
    });
  });

  it("no se arma con agotados, productos que no existen o de otra categoría", () => {
    expect(resolverCombo(cafe, { bebida: "flat-white", acompanamientos: ["scon"] })).toBeNull();
    expect(resolverCombo(cafe, { bebida: "flat-white", acompanamientos: ["nada"] })).toBeNull();
    expect(resolverCombo(cafe, { bebida: "medialuna", acompanamientos: ["medialuna"] })).toBeNull();
    expect(resolverCombo(cafe, { bebida: "flat-white", acompanamientos: ["medialunas-docena"] })).toBeNull();
    expect(resolverCombo(cafe, { bebida: "flat-white", acompanamientos: ["medialuna"] })?.bebida.nombre).toBe("Flat white");
  });
});

describe("nombre", () => {
  const [fw, ml, tp] = [cafe.categorias[0]!.productos[0]!, cafe.categorias[1]!.productos[0]!, cafe.categorias[2]!.productos[0]!];

  it("lleva el rótulo del momento, fuera del id", () => {
    expect(nombreCombo(fw, [ml, tp], "desayuno")).toBe("Desayuno: Flat white + Medialuna de manteca + Tostada de palta");
    expect(nombreCombo(fw, [ml], "merienda")).toBe("Merienda: Flat white + Medialuna de manteca");
    expect(nombreCombo(fw, [ml], "combo")).toBe("Combo: Flat white + Medialuna de manteca");
    expect(productoCombo(cafe, "combo:flat-white+medialuna", "desayuno")?.id).toBe("combo:flat-white+medialuna");
  });

  it("dos iguales se cuentan", () => {
    expect(nombreCombo(fw, [ml, ml], "desayuno")).toBe("Desayuno: Flat white + 2 Medialuna de manteca");
  });

  it("se separa para mostrar", () => {
    expect(partesDelNombre("Desayuno: Flat white + Medialuna de manteca")).toEqual({ titulo: "Desayuno", detalle: "Flat white + Medialuna de manteca" });
    expect(partesDelNombre("Espresso")).toEqual({ titulo: "Espresso", detalle: "" });
  });
});

describe("local con combos y el núcleo", () => {
  const id = "combo:flat-white+medialuna+tostado-palta";

  it("agrega una categoría oculta con los combos del carrito", () => {
    const l = localConCombos(cafe, [{ productoId: id, cantidad: 2 }, { productoId: "espresso", cantidad: 1 }], "desayuno");
    const oculta = l.categorias.find((c) => c.id === CATEGORIA_COMBOS)!;
    expect(oculta.productos).toEqual([{ id, nombre: "Desayuno: Flat white + Medialuna de manteca + Tostada de palta", precio: 10800 }]);
    expect(cafe.categorias.some((c) => c.id === CATEGORIA_COMBOS)).toBe(false); // no toca el original
  });

  it("sin combos no agrega nada", () => {
    expect(localConCombos(cafe, [{ productoId: "espresso", cantidad: 1 }], "desayuno").categorias).toHaveLength(cafe.categorias.length);
  });

  it("no duplica ni se acumula si se aplica dos veces", () => {
    const carrito = [{ productoId: id, cantidad: 1 }];
    const l = localConCombos(localConCombos(cafe, carrito, "desayuno"), carrito, "desayuno");
    expect(l.categorias.filter((c) => c.id === CATEGORIA_COMBOS)).toHaveLength(1);
    expect(l.categorias.at(-1)!.productos).toHaveLength(1);
  });

  it("saltea combos con agotados o productos que ya no están", () => {
    const carrito = [
      { productoId: "combo:flat-white+scon", cantidad: 1 },
      { productoId: "combo:cortado+medialuna", cantidad: 1 },
    ];
    const l = localConCombos(cafe, carrito, "desayuno");
    expect(l.categorias.some((c) => c.id === CATEGORIA_COMBOS)).toBe(false);
    expect(lineasValidas(l, carrito)).toEqual([]);
  });

  it("totales y mensaje de WhatsApp funcionan con el núcleo", () => {
    const carrito = [
      { productoId: id, cantidad: 2 },
      { productoId: "espresso", cantidad: 1 },
    ];
    const l = localConCombos(cafe, carrito, "merienda");
    expect(cantidadTotal(l, carrito)).toBe(3);
    expect(calcularTotal(l, carrito)).toBe(2 * 10800 + 2600);
    expect(calcularTotal(l, carrito, "envio")).toBe(2 * 10800 + 2600 + 1200);
    const mensaje = armarMensaje(l, carrito, { nombre: "Ana", entrega: "retiro", pago: "Efectivo" });
    expect(mensaje).toContain("2 x Merienda: Flat white + Medialuna de manteca + Tostada de palta — $21.600");
    expect(mensaje).toContain("*Total: $24.200*");
  });
});
