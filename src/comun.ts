// Lo que comparten la web de pedidos y la carta del salón: marca, tema claro/oscuro, aviso del día,
// estado (abierto/cerrado), la foto o el dibujo de cada producto y el momento del día.
import { dibujoDeProducto } from "./dibujos";
import { $, crear } from "./nucleo/dom";
import { estadoDelLocal, type Estado } from "./nucleo/horario";
import type { Etiqueta, Local, Producto } from "./nucleo/tipos";

export const ETIQUETAS: Record<Etiqueta, string> = { vegano: "Vegano", vegetariano: "Vegetariano", "sin-tacc": "Sin TACC" };

/** Reinicia una animación de CSS sacando y poniendo la clase. */
export function animar(el: Element, clase = "cambio") {
  el.classList.remove(clase);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(clase);
}

// ---------- Modo claro / oscuro ----------
type Tema = "claro" | "oscuro";
const sistemaOscuro = matchMedia("(prefers-color-scheme: dark)");

function temaActual(): Tema {
  const elegido = document.documentElement.dataset.tema;
  if (elegido === "claro" || elegido === "oscuro") return elegido;
  return sistemaOscuro.matches ? "oscuro" : "claro";
}

function pintarBotonTema() {
  const oscuro = temaActual() === "oscuro";
  const boton = document.getElementById("boton-tema");
  if (boton) {
    boton.setAttribute("aria-pressed", String(oscuro));
    boton.setAttribute("aria-label", oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  }
  const fondo = getComputedStyle(document.documentElement).getPropertyValue("--fondo").trim();
  if (fondo) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", fondo);
}

/** Sin elección guardada sigue al sistema; el botón la fija y se recuerda en el dispositivo. */
export function iniciarTema() {
  pintarBotonTema();
  sistemaOscuro.addEventListener("change", pintarBotonTema);
  document.getElementById("boton-tema")?.addEventListener("click", () => {
    const nuevo: Tema = temaActual() === "oscuro" ? "claro" : "oscuro";
    document.documentElement.dataset.tema = nuevo;
    try {
      localStorage.setItem("tema", nuevo);
    } catch {
      /* sin almacenamiento: vale sólo para esta visita */
    }
    pintarBotonTema();
  });
}

// ---------- Marca, aviso y estado ----------
export function mostrarMarca(local: Local) {
  const marca = local.marca;
  if (!marca) return;
  const raiz = document.documentElement.style;
  if (marca.color) raiz.setProperty("--marca-claro", marca.color);
  if (marca.colorOscuro) raiz.setProperty("--marca-oscuro", marca.colorOscuro);
  for (const img of document.querySelectorAll<HTMLImageElement>("img[data-logo]")) {
    const tipo = img.dataset.logo;
    img.src = tipo === "oscuro" ? (marca.logoOscuro ?? marca.logo) : tipo === "isotipo" ? marca.isotipo : marca.logo;
    img.alt = img.dataset.alt ?? local.nombre;
    img.hidden = false;
  }
  document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute("href", marca.isotipo);
}

export function mostrarAviso(local: Local) {
  if (!local.aviso) return;
  const aviso = $("aviso-dia");
  aviso.append(crear("strong", {}, "Hoy"), crear("span", {}, local.aviso));
  aviso.hidden = false;
}

export function mostrarEstado(local: Local): Estado | null {
  if (!local.turnos?.length) return null;
  const estado = estadoDelLocal(local.turnos);
  for (const e of document.querySelectorAll<HTMLElement>("[data-estado]")) {
    e.textContent = estado.texto;
    e.classList.add(estado.abierto ? "abierto" : "cerrado");
    e.hidden = false;
  }
  return estado;
}

// ---------- Foto o dibujo ----------
/** La foto del producto (si el dueño la subió) o su dibujo visto desde arriba. */
export function fotoODibujo(p: Producto, categoria: string, ancho = 480): HTMLElement {
  const marco = crear("div", { className: `imagen imagen-${categoria}` });
  if (p.foto) {
    marco.classList.add("con-foto");
    marco.append(crear("img", { src: p.foto, alt: p.nombre, loading: "lazy", decoding: "async", width: ancho, height: Math.round((ancho * 4) / 5) }));
  } else {
    marco.classList.add("con-dibujo");
    marco.setAttribute("role", "img");
    marco.setAttribute("aria-label", p.nombre);
    marco.innerHTML = dibujoDeProducto(p, categoria);
  }
  return marco;
}

export function etiquetas(p: Producto, agotado = false): HTMLElement[] {
  if (!p.etiquetas?.length && !(agotado && p.agotado)) return [];
  return [
    crear(
      "ul",
      { className: "etiquetas", ariaLabel: "Características" },
      ...(agotado && p.agotado ? [crear("li", { className: "etiqueta etiqueta-agotado" }, "Hoy no hay")] : []),
      ...(p.etiquetas ?? []).map((e) => crear("li", { className: `etiqueta etiqueta-${e}` }, ETIQUETAS[e])),
    ),
  ];
}

// ---------- Momento del día ----------
export type Franja = "manana" | "tarde" | "noche";

/** Mañana hasta las 12, tarde hasta las 20, noche después. Hora argentina. */
export function franjaDelDia(fecha = new Date()): Franja {
  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", hourCycle: "h23" }).format(fecha));
  if (hora >= 5 && hora < 12) return "manana";
  if (hora >= 12 && hora < 20) return "tarde";
  return "noche";
}

/** La dirección de la otra página: en Vercel con cleanUrls (/carta), en desarrollo con .html. */
export const urlDe = (pagina: "web" | "carta") => {
  const desarrollo = import.meta.env.DEV;
  if (pagina === "web") return "/";
  return desarrollo ? "/carta.html" : "/carta";
};
