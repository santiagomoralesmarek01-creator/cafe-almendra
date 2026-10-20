// Copiado de Carta Local (src/ajustes.ts): el motor compartido de pedidos. Si cambia allá, se copia acá; no editar por separado.
// Cambios que el dueño hace desde el panel. Se guardan aparte de la carta base
// (public/locales/<slug>.json) y se aplican encima al cargar la página. Sin DOM: testeado.
import type { Envio, Local, Turno } from "./tipos";

export interface Ajustes {
  /** Precio por id de producto, en pesos enteros. */
  precios?: Record<string, number>;
  /** Agotado o disponible por id de producto (pisa al de la carta base). */
  agotados?: Record<string, boolean>;
  turnos?: Turno[];
  envio?: Envio;
  /** Aviso corto arriba de la página y la carta ("Hoy abrimos a las 20"). Vacío = sin aviso. */
  aviso?: string;
  /** Foto por id de producto: dirección https de Supabase Storage (o, en demostración, la imagen en el dispositivo). "" = sin foto. */
  fotos?: Record<string, string>;
}

/** Largo máximo de una foto guardada en el dispositivo (modo demostración), en caracteres. */
const LARGO_FOTO_DEMO = 400_000;
const fotoValida = (x: unknown): x is string =>
  typeof x === "string" &&
  (x === "" || /^https:\/\/[^\s"'<>]+$/.test(x) || (/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(x) && x.length <= LARGO_FOTO_DEMO));

export const LARGO_AVISO = 140;
const PRECIO_MAXIMO = 10_000_000;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const precioValido = (x: unknown): x is number => Number.isInteger(x) && (x as number) > 0 && (x as number) <= PRECIO_MAXIMO;

function turnoValido(x: unknown): x is Turno {
  if (!esObjeto(x) || !Array.isArray(x.dias) || x.dias.length === 0) return false;
  return (
    x.dias.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
    typeof x.abre === "string" && HORA.test(x.abre) &&
    typeof x.cierra === "string" && HORA.test(x.cierra)
  );
}

/**
 * Deja sólo lo que tiene la forma correcta. Los ajustes vienen de la base de datos o del
 * dispositivo: nunca se confía en ellos tal cual.
 */
export function limpiarAjustes(x: unknown): Ajustes {
  if (!esObjeto(x)) return {};
  const limpio: Ajustes = {};

  if (esObjeto(x.precios)) {
    const precios = Object.entries(x.precios).filter(([, v]) => precioValido(v)) as [string, number][];
    if (precios.length) limpio.precios = Object.fromEntries(precios);
  }
  if (esObjeto(x.agotados)) {
    const agotados = Object.entries(x.agotados).filter(([, v]) => typeof v === "boolean") as [string, boolean][];
    if (agotados.length) limpio.agotados = Object.fromEntries(agotados);
  }
  if (Array.isArray(x.turnos) && x.turnos.length && x.turnos.every(turnoValido)) {
    limpio.turnos = x.turnos.map((t) => ({ dias: [...new Set(t.dias)].sort(), abre: t.abre, cierra: t.cierra }));
  }
  if (esObjeto(x.envio) && typeof x.envio.disponible === "boolean") {
    const envio: Envio = { disponible: x.envio.disponible };
    if (Number.isInteger(x.envio.costo) && (x.envio.costo as number) >= 0 && (x.envio.costo as number) <= PRECIO_MAXIMO) envio.costo = x.envio.costo as number;
    if (typeof x.envio.zona === "string" && x.envio.zona.trim()) envio.zona = x.envio.zona.trim().slice(0, 60);
    limpio.envio = envio;
  }
  if (typeof x.aviso === "string" && x.aviso.trim()) limpio.aviso = x.aviso.trim().slice(0, LARGO_AVISO);
  if (esObjeto(x.fotos)) {
    const fotos = Object.entries(x.fotos).filter(([, v]) => fotoValida(v)) as [string, string][];
    if (fotos.length) limpio.fotos = Object.fromEntries(fotos);
  }

  return limpio;
}

/** El local tal como lo ve el cliente: carta base + ajustes del panel. No modifica el original. */
export function aplicarAjustes(local: Local, ajustes: Ajustes): Local {
  const resultado: Local = {
    ...local,
    categorias: local.categorias.map((c) => ({
      ...c,
      productos: c.productos.map((p) => {
        const precio = ajustes.precios?.[p.id];
        const agotado = ajustes.agotados?.[p.id];
        const foto = ajustes.fotos?.[p.id];
        const producto = {
          ...p,
          ...(precio !== undefined ? { precio } : {}),
          ...(agotado !== undefined ? { agotado } : {}),
          ...(foto ? { foto } : {}),
        };
        if (foto === "") delete producto.foto; // el dueño sacó la foto de la carta base
        return producto;
      }),
    })),
  };
  if (ajustes.turnos) {
    resultado.turnos = ajustes.turnos;
    delete resultado.horarios; // el texto a mano de la carta base ya no correspondería
  }
  if (ajustes.envio) resultado.envio = { ...ajustes.envio };
  if (ajustes.aviso) resultado.aviso = ajustes.aviso;
  return resultado;
}

/**
 * Ajustes que llevan de la carta base al local editado. Guarda sólo lo que cambió, así un
 * cambio posterior en la carta base (por ejemplo, un precio que corrijo yo) no queda tapado.
 */
export function diferencias(base: Local, editado: Local): Ajustes {
  const ajustes: Ajustes = {};
  const productosBase = new Map(base.categorias.flatMap((c) => c.productos).map((p) => [p.id, p]));
  for (const p of editado.categorias.flatMap((c) => c.productos)) {
    const original = productosBase.get(p.id);
    if (!original) continue;
    if (p.precio !== original.precio) (ajustes.precios ??= {})[p.id] = p.precio;
    if (!!p.agotado !== !!original.agotado) (ajustes.agotados ??= {})[p.id] = !!p.agotado;
    if ((p.foto ?? "") !== (original.foto ?? "")) (ajustes.fotos ??= {})[p.id] = p.foto ?? "";
  }
  if (JSON.stringify(editado.turnos ?? []) !== JSON.stringify(base.turnos ?? [])) ajustes.turnos = editado.turnos ?? [];
  if (JSON.stringify(editado.envio) !== JSON.stringify(base.envio)) ajustes.envio = editado.envio;
  if (editado.aviso?.trim()) ajustes.aviso = editado.aviso.trim();
  return limpiarAjustes(ajustes);
}
