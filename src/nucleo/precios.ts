// Copiado de Carta Local (src/precios.ts): el motor compartido de pedidos. Si cambia allá, se copia acá; no editar por separado.
import type { Local } from "./tipos";

/**
 * Aumento en masa para el panel ("subir 10 % toda la carta").
 * Redondea al múltiplo de `redondeo` más cercano para que queden precios de carta ($1.650, no $1.637).
 * Devuelve un local nuevo; no modifica el original.
 */
export function aumentarPrecios(
  local: Local,
  porcentaje: number,
  opciones: { redondeo?: number; categoriaId?: string } = {},
): Local {
  const redondeo = opciones.redondeo ?? 50;
  if (!Number.isFinite(porcentaje) || porcentaje <= -100) {
    throw new RangeError("El porcentaje tiene que ser un número mayor a -100.");
  }
  if (!Number.isInteger(redondeo) || redondeo < 1) {
    throw new RangeError("El redondeo tiene que ser un entero positivo.");
  }

  return {
    ...local,
    categorias: local.categorias.map((categoria) => {
      if (opciones.categoriaId && categoria.id !== opciones.categoriaId) return categoria;
      return {
        ...categoria,
        productos: categoria.productos.map((p) => ({
          ...p,
          precio: Math.max(redondeo, Math.round((p.precio * (1 + porcentaje / 100)) / redondeo) * redondeo),
        })),
      };
    }),
  };
}
