// Los datos del café viven en Carta Local: la carta base (su JSON) y los cambios del panel
// (precios, agotados, horarios, envío, aviso y fotos, en Supabase). Así el dueño usa un solo panel.
import { aplicarAjustes, limpiarAjustes, type Ajustes } from "./ajustes";
import type { Local } from "./tipos";

export const SLUG = "cafe-almendra";
/** De dónde sale la carta base. Si no responde (sin conexión, desarrollo local), se usa la copia de public/datos. */
export const CARTA_LOCAL = "https://carta-local-pi.vercel.app";

const SUPABASE_URL: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_CLAVE: string | undefined = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

async function json<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const respuesta = await fetch(url, init);
    return respuesta.ok ? ((await respuesta.json()) as T) : null;
  } catch {
    return null;
  }
}

/** La carta base: la de Carta Local y, si no se puede leer, la copia que viaja con el sitio. */
export async function cargarBase(): Promise<Local | null> {
  return (await json<Local>(`${CARTA_LOCAL}/locales/${SLUG}.json`)) ?? (await json<Local>(`/datos/${SLUG}.json`));
}

/** Los cambios del panel. Sin Supabase configurado, ninguno (se ve la carta base). */
export async function cargarAjustes(): Promise<Ajustes> {
  if (!SUPABASE_URL || !SUPABASE_CLAVE) return {};
  const filas = await json<{ datos: unknown }[]>(`${SUPABASE_URL}/rest/v1/carta_ajustes?slug=eq.${SLUG}&select=datos`, { headers: { apikey: SUPABASE_CLAVE } });
  return limpiarAjustes(filas?.[0]?.datos);
}

/** El café como lo ve el cliente: carta base + cambios del panel. */
export async function cargarLocal(): Promise<Local | null> {
  const [base, ajustes] = await Promise.all([cargarBase(), cargarAjustes()]);
  return base && aplicarAjustes(base, ajustes);
}
