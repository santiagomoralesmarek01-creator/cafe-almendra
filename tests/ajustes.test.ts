import { describe, expect, it } from "vitest";
import { aplicarAjustes, diferencias, limpiarAjustes } from "../src/nucleo/ajustes";
import { aumentarPrecios } from "../src/nucleo/precios";
import { localDePrueba as local } from "./fixtures";

describe("limpiarAjustes", () => {
  it("descarta lo que no tiene la forma correcta", () => {
    expect(
      limpiarAjustes({
        precios: { carne: 1500, jyq: -3, mila: 12.5, tarta: "100" },
        agotados: { carne: true, jyq: "si" },
        turnos: [{ dias: [3, 1, 1], abre: "11:00", cierra: "15:00" }],
        envio: { disponible: true, costo: 2000, zona: "  Hasta 10 cuadras  " },
        aviso: "  Hoy abrimos a las 20  ",
        otra: "cosa",
      }),
    ).toEqual({
      precios: { carne: 1500 },
      agotados: { carne: true },
      turnos: [{ dias: [1, 3], abre: "11:00", cierra: "15:00" }],
      envio: { disponible: true, costo: 2000, zona: "Hasta 10 cuadras" },
      aviso: "Hoy abrimos a las 20",
    });
  });

  it("si un turno está mal, ignora todos los turnos", () => {
    expect(limpiarAjustes({ turnos: [{ dias: [1], abre: "11:00", cierra: "15:00" }, { dias: [9], abre: "x", cierra: "y" }] })).toEqual({});
  });

  it("acepta cualquier cosa sin romperse", () => {
    for (const basura of [null, undefined, 3, "hola", [], { precios: [] }]) expect(limpiarAjustes(basura)).toEqual({});
  });

  it("recorta el aviso largo", () => {
    expect(limpiarAjustes({ aviso: "a".repeat(500) }).aviso).toHaveLength(140);
  });
});

describe("aplicarAjustes", () => {
  it("pisa precios, agotados, turnos, envío y aviso sin tocar el original", () => {
    const resultado = aplicarAjustes(
      { ...local, horarios: ["texto a mano"] },
      {
        precios: { carne: 1500, inexistente: 99 },
        agotados: { tarta: false, mila: true },
        turnos: [{ dias: [1], abre: "12:00", cierra: "16:00" }],
        envio: { disponible: false },
        aviso: "Cerramos temprano",
      },
    );
    const productos = resultado.categorias.flatMap((c) => c.productos);
    expect(productos.find((p) => p.id === "carne")?.precio).toBe(1500);
    expect(productos.find((p) => p.id === "tarta")?.agotado).toBe(false);
    expect(productos.find((p) => p.id === "mila")?.agotado).toBe(true);
    expect(resultado.turnos).toEqual([{ dias: [1], abre: "12:00", cierra: "16:00" }]);
    expect(resultado.horarios).toBeUndefined();
    expect(resultado.envio).toEqual({ disponible: false });
    expect(resultado.aviso).toBe("Cerramos temprano");
    expect(local.categorias[0]!.productos[0]!.precio).toBe(1200);
  });

  it("sin ajustes, queda igual", () => {
    expect(aplicarAjustes(local, {})).toEqual(local);
  });
});

describe("diferencias", () => {
  it("guarda sólo lo que cambió y vuelve a dar el mismo local", () => {
    const editado = structuredClone(aumentarPrecios(local, 10, { categoriaId: "empanadas" }));
    editado.categorias[1]!.productos[1]!.agotado = false; // tarta vuelve a estar disponible
    editado.aviso = "Hoy hay pastelitos";
    const ajustes = diferencias(local, editado);
    expect(ajustes).toEqual({ precios: { carne: 1300, jyq: 1200 }, agotados: { tarta: false }, aviso: "Hoy hay pastelitos" });
    expect(aplicarAjustes(local, ajustes)).toEqual(editado);
  });

  it("sin cambios, vacío", () => {
    expect(diferencias(local, structuredClone(local))).toEqual({});
  });
});

describe("fotos", () => {
  it("acepta direcciones https, imágenes de demostración chicas y \"\" para sacar la foto", () => {
    const limpio = limpiarAjustes({
      fotos: { a: "https://x.supabase.co/storage/v1/object/public/carta-fotos/demo/a.webp", b: "data:image/webp;base64,AAAA", c: "", d: "javascript:alert(1)", e: 3, f: "http://inseguro.com/x.jpg" },
    });
    expect(Object.keys(limpio.fotos ?? {})).toEqual(["a", "b", "c"]);
  });

  it("se aplican sobre la carta base y se guardan sólo si cambiaron", () => {
    const base = local;
    const id = base.categorias[0]!.productos[0]!.id;
    const conFoto = aplicarAjustes(base, { fotos: { [id]: "https://x.co/f.webp" } });
    expect(conFoto.categorias[0]!.productos[0]!.foto).toBe("https://x.co/f.webp");
    expect(diferencias(base, conFoto)).toEqual({ fotos: { [id]: "https://x.co/f.webp" } });
    expect(diferencias(base, aplicarAjustes(base, {}))).toEqual({});
  });

  it("\"\" saca una foto que venía en la carta base", () => {
    const base = structuredClone(local);
    const producto = base.categorias[0]!.productos[0]!;
    producto.foto = "/locales/demo/fotos/a.webp";
    const sinFoto = aplicarAjustes(base, { fotos: { [producto.id]: "" } });
    expect(sinFoto.categorias[0]!.productos[0]!.foto).toBeUndefined();
    expect(diferencias(base, sinFoto)).toEqual({ fotos: { [producto.id]: "" } });
  });
});
