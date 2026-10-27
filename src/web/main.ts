// Web de pedidos de Café Almendra: diseño propio sobre el núcleo de Carta Local (pedido, horarios,
// WhatsApp). Lo propio del café es "Armá tu desayuno / merienda" (src/combo.ts): los combos viajan en
// el carrito como ids y `localConCombos` los vuelve productos para que el núcleo los entienda.
import "../base.css";
import "./style.css";
import { animar, etiquetas, fotoODibujo, franjaDelDia, iniciarTema, mostrarAviso, mostrarEstado, mostrarMarca, urlDe } from "../comun";
import {
  idCombo,
  leerCombo,
  localConCombos,
  MAX_ACOMPANAMIENTOS,
  momentoDelDia,
  nombreCombo,
  opcionesCombo,
  partesDelNombre,
  precioCombo,
  resolverCombo,
  rotuloMomento,
  DESCUENTO,
  type Momento,
} from "../combo";
import { dibujoBebida, dibujoPieza, flor, grupoBebida, grupoBebidaParaLlevar, grupoPieza, grupoPiezaParaLlevar, ramaAlmendro, ramaCafe, ramita, tipoDeBebida, tipoDePieza } from "../dibujos";
import { guardarCarrito, leerCarrito } from "../nucleo/carrito";
import { cargarLocal, SLUG } from "../nucleo/datos";
import { $, crear, firma, movimientoReducido } from "../nucleo/dom";
import { formatearPesos } from "../nucleo/formato";
import { textoHorarios } from "../nucleo/horario";
import { armarMensaje, calcularTotal, cambiarCantidad, cantidadTotal, lineasValidas, linkWhatsApp } from "../nucleo/pedido";
import type { Carrito, Categoria, DatosCliente, Local, Producto } from "../nucleo/tipos";

iniciarTema();

const cargado = await cargarLocal();
if (!cargado) {
  document.body.replaceChildren(crear("p", { className: "sin-datos" }, "No pudimos cargar la carta. Probá de nuevo en un rato."));
  throw new Error("sin datos del local");
}
const L: Local = cargado;
const momento: Momento = momentoDelDia();
const franja = franjaDelDia();
document.documentElement.dataset.franja = franja;

let carrito: Carrito = leerCarrito(SLUG);
/** El local con los combos del carrito como productos: es el que se le pasa al núcleo. */
const conCombos = () => localConCombos(L, carrito, momento);

/** Categoría de cada producto (para elegir su dibujo). */
const categoriaDe = new Map<string, string>();
for (const c of L.categorias) for (const p of c.productos) categoriaDe.set(p.id, c.id);

const esDeSiempre = (c: Categoria) => c.id === "desayunos" || /desayuno|merienda/i.test(c.nombre);

// ---------- Avisos y carrito ----------
let temporizador = 0;
function tostada(texto: string) {
  const t = $("tostada");
  t.textContent = texto;
  t.classList.add("visible");
  clearTimeout(temporizador);
  temporizador = window.setTimeout(() => t.classList.remove("visible"), 2800);
}

function guardar() {
  const lx = conCombos();
  carrito = carrito.filter((l) => lineasValidas(lx, [l]).length);
  guardarCarrito(SLUG, carrito);
  pintarBarra();
  pintarControles();
  if (hoja.open) pintarHoja();
}

function sumar(id: string, cantidad = 1, aviso?: string) {
  carrito = cambiarCantidad(carrito, id, cantidad);
  guardar();
  if (aviso) tostada(aviso);
  if (cantidad > 0) animar($("barra"), "salto");
}

// ---------- Encabezado y portada ----------
mostrarMarca(L);
mostrarAviso(L);
const estado = mostrarEstado(L);
document.title = `${L.nombre} · Pedí tu ${momento === "merienda" ? "merienda" : "desayuno"}`;
for (const a of document.querySelectorAll<HTMLAnchorElement>("[data-carta]")) a.href = urlDe("carta");

const PORTADA: Record<Momento | "noche", { saludo: string; a: string; b: string; cta: string; taza: Parameters<typeof dibujoBebida>[0]; plato: Parameters<typeof dibujoPieza>[0]; nota: string }> = {
  desayuno: { saludo: "Buen día", a: "El desayuno,", b: "a la vuelta de casa.", cta: "Armá tu desayuno", taza: "latte", plato: "medialunas", nota: "medialunas recién salidas" },
  combo: { saludo: "Buenas tardes", a: "Un café rico", b: "y algo para acompañar.", cta: "Armá tu combo", taza: "capuccino", plato: "croissant", nota: "croissant de almendras" },
  merienda: { saludo: "Buenas tardes", a: "La merienda,", b: "recién horneada.", cta: "Armá tu merienda", taza: "latte", plato: "lemon-pie", nota: "el lemon pie de hoy" },
  noche: { saludo: "Buenas noches", a: "Mañana temprano,", b: "el primer café.", cta: "Dejá armado tu desayuno", taza: "te", plato: "alfajor", nota: "para la última del día" },
};
const portada = PORTADA[franja === "noche" ? "noche" : momento];
$("saludo").textContent = portada.saludo;
const desde = L.cifras?.find((c) => /^\d{4}$/.test(c.valor))?.valor;
$("saludo-nota").textContent = desde ? `desde ${desde} en el pasaje` : "en el pasaje";
$("titular-a").textContent = portada.a;
$("titular-b").textContent = portada.b;
$("cta").textContent = portada.cta;
$("eslogan").textContent = [L.eslogan, L.descripcion].filter(Boolean).join(" ");
$("portada-direccion").textContent = L.direccion;
$("portada-envio").textContent = L.envio.disponible ? `Retiro o envío${L.envio.zona ? ` (${L.envio.zona.toLowerCase()})` : ""}` : "Para retirar en el local";
$("portada-taza").innerHTML = dibujoBebida(portada.taza);
$("portada-plato").innerHTML = dibujoPieza(portada.plato);
$("portada-nota").textContent = portada.nota;
for (const r of document.querySelectorAll("[data-rama]")) r.innerHTML = ramaAlmendro();
for (const r of document.querySelectorAll("[data-rama-cafe]")) r.innerHTML = ramaCafe();
for (const r of document.querySelectorAll("[data-ramita]")) r.innerHTML = ramita();

const rotulo = rotuloMomento(momento);
$("armador-momento").textContent = momento === "combo" ? "combo" : momento;
const navMomento = document.querySelector<HTMLAnchorElement>("[data-momento-nav]");
if (navMomento) navMomento.textContent = momento === "combo" ? "Armá tu combo" : `Armá tu ${momento}`;
$("armador-bajada").textContent = `Una bebida y uno o dos acompañamientos. Juntos, ${Math.round(DESCUENTO * 100)} % menos que por separado.`;

{
  const palabras = L.cinta?.length ? L.cinta : L.categorias.map((c) => c.nombre);
  const cinta = $("cinta");
  palabras.forEach((p, i) => {
    if (i) {
      const f = crear("span", { className: "cinta-flor" });
      f.innerHTML = `<svg viewBox="-12 -12 24 24">${flor(0, 0, 10, i * 20)}</svg>`;
      cinta.append(f);
    }
    cinta.append(crear("span", { className: "cinta-palabra" }, p));
  });
}

// ---------- Armá tu desayuno / merienda ----------
const opciones = opcionesCombo(L);
const eleccion: { bebida?: string; acomp: string[]; paraLlevar: boolean } = { acomp: [], paraLlevar: false };
const bebidaPorId = (id?: string) => opciones.bebidas.find((p) => p.id === id);
const acompPorId = (id: string) => opciones.acompanamientos.find((p) => p.id === id);

function opcionCombo(p: Producto, tipo: "radio" | "checkbox", dibujo: string) {
  const input = crear("input", { type: tipo, name: tipo === "radio" ? "bebida" : "acomp", value: p.id, disabled: !!p.agotado });
  const icono = crear("span", { className: "oc-dibujo" });
  icono.innerHTML = dibujo;
  return crear(
    "label",
    { className: `opcion-combo${p.agotado ? " agotado" : ""}` },
    input,
    icono,
    crear("span", { className: "oc-texto" }, crear("span", { className: "oc-nombre" }, p.nombre), crear("span", { className: "oc-precio" }, p.agotado ? "Hoy no hay" : formatearPesos(p.precio))),
  );
}

function armarArmador() {
  if (!opciones.bebidas.length || !opciones.acompanamientos.length) {
    $("armador").hidden = true;
    return;
  }
  const cajaBebidas = $("opciones-bebida");
  for (const p of opciones.bebidas) cajaBebidas.append(opcionCombo(p, "radio", dibujoBebida(tipoDeBebida(p, categoriaDe.get(p.id)))));
  const cajaAcomp = $("opciones-acomp");
  for (const p of opciones.acompanamientos) cajaAcomp.append(opcionCombo(p, "checkbox", dibujoPieza(tipoDePieza(p, categoriaDe.get(p.id)))));

  document.querySelector(".modo-combo")!.addEventListener("change", (e) => {
    eleccion.paraLlevar = (e.target as HTMLInputElement).value === "llevar";
    pintarArmador(eleccion.bebida ? "todo" : undefined);
  });
  cajaBebidas.addEventListener("change", (e) => {
    eleccion.bebida = (e.target as HTMLInputElement).value;
    pintarArmador("bebida");
  });
  cajaAcomp.addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    if (input.checked) {
      if (eleccion.acomp.length >= MAX_ACOMPANAMIENTOS) {
        input.checked = false;
        tostada(`Hasta ${MAX_ACOMPANAMIENTOS} acompañamientos: sacá uno para cambiarlo.`);
        return;
      }
      eleccion.acomp.push(input.value);
      pintarArmador(`acomp-${eleccion.acomp.length - 1}`);
    } else {
      eleccion.acomp = eleccion.acomp.filter((id) => id !== input.value);
      pintarArmador();
    }
  });
  $("combo-vaciar").addEventListener("click", () => {
    eleccion.bebida = undefined;
    eleccion.acomp = [];
    pintarArmador();
    cajaBebidas.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
  });
  $("combo-sumar").addEventListener("click", () => {
    if (!eleccion.bebida) return;
    const id = idCombo(eleccion.bebida, eleccion.acomp, eleccion.paraLlevar);
    if (!id) return;
    sumar(id, 1, `${rotulo} sumado al pedido.`);
    animar($("bandeja"), "servido");
    eleccion.bebida = undefined;
    eleccion.acomp = [];
    window.setTimeout(() => pintarArmador(), movimientoReducido() ? 0 : 420);
  });
  pintarArmador();
  seguirArmado();
}

/**
 * En el celular, mientras se eligen las opciones, la mesa queda arriba y más chica (clase armando-combo
 * en el body, ver style.css). Se miden la cabecera y la mesa para saber dónde fijarla y cuánto lugar descontar.
 */
function seguirArmado() {
  if (!("IntersectionObserver" in window)) return;
  const raiz = document.documentElement.style;
  const panel = document.querySelector(".armador-panel")!;
  // Al fijar la mesa la página se corre unos 170 px, y eso podía volver a cruzar el umbral y hacer
  // titilar la pantalla. Por eso se entra cuando el panel pasa por el medio de la pantalla, se sale
  // cuando queda casi afuera, y después de salir no se vuelve a entrar hasta que el panel deje el medio.
  let bloqueado = false;
  new IntersectionObserver(
    ([e]) => {
      if (!e?.isIntersecting) {
        bloqueado = false;
        return;
      }
      if (bloqueado || document.body.classList.contains("armando-combo")) return;
      raiz.setProperty("--alto-mesa", `${$("bandeja").offsetHeight}px`);
      raiz.setProperty("--tope-mesa", `${document.querySelector<HTMLElement>(".cabecera")?.offsetHeight ?? 0}px`);
      document.body.classList.add("armando-combo");
    },
    { rootMargin: "-45% 0px -45% 0px" },
  ).observe(panel);
  new IntersectionObserver(
    ([e]) => {
      if (e?.isIntersecting || !document.body.classList.contains("armando-combo")) return;
      document.body.classList.remove("armando-combo");
      bloqueado = true;
    },
    { rootMargin: "-10% 0px -10% 0px" },
  ).observe(panel);
  // Un toque corto al elegir, donde el celular lo permite (Android; en iPhone no hace nada).
  $("armador").addEventListener("change", () => navigator.vibrate?.(8));
}

/** Lugar de cada cosa sobre la mesa (centro y escala), en el viewBox 0 0 560 400. */
const LUGARES = { bebida: { x: 168, y: 214, s: 1.85 }, "acomp-0": { x: 392, y: 124, s: 1.42 }, "acomp-1": { x: 404, y: 290, s: 1.42 } } as const;

function mesaSvg(nuevo?: string): string {
  const bebida = bebidaPorId(eleccion.bebida);
  const acomps = eleccion.acomp.map(acompPorId).filter((p): p is Producto => !!p);
  const vetas = Array.from({ length: 6 }, (_, i) => `<path d="M0 ${36 + i * 66} C140 ${30 + i * 66} 300 ${46 + i * 66} 560 ${34 + i * 66}" stroke="var(--d-veta)" stroke-width="2" fill="none"/>`).join("");
  const llevar = eleccion.paraLlevar;
  const servilleta = llevar
    ? // Papel madera con el sello del café, en vez de la servilleta.
      `<g transform="translate(104 236) rotate(-9)"><path d="M-118 -112 L118 -108 L114 112 L-116 110 Z" fill="var(--d-kraft)"/><path d="M-118 -112 L118 -108" stroke="var(--d-kraft-osc)" stroke-width="3" stroke-dasharray="2 5" fill="none"/><g transform="translate(-60 -64) rotate(-12)" class="sello-llevar"><circle r="38" fill="none" stroke="var(--d-kraft-osc)" stroke-width="2.4"/><circle r="31" fill="none" stroke="var(--d-kraft-osc)" stroke-width="1.2"/><text text-anchor="middle" dy="-2">para</text><text text-anchor="middle" dy="16">llevar</text></g></g>`
    : `<g transform="translate(104 236) rotate(-9)"><rect x="-118" y="-112" width="236" height="224" rx="6" fill="var(--d-servilleta)"/><rect x="-104" y="-98" width="208" height="196" rx="4" fill="none" stroke="var(--d-raya)" stroke-width="2" stroke-dasharray="7 6"/></g>`;
  const dibBebida = llevar ? grupoBebidaParaLlevar : grupoBebida;
  const dibPieza = llevar ? grupoPiezaParaLlevar : grupoPieza;
  const rama = `<g transform="translate(470 6) rotate(28)"><path d="M0 0 C10 30 6 60 30 92" stroke="var(--d-rama)" stroke-width="4" fill="none" stroke-linecap="round"/>${flor(6, 24, 12, 10)}${flor(22, 62, 10, 40)}${flor(30, 92, 9, 0)}</g>`;
  const hueco = (x: number, y: number, r: number, texto: string) =>
    `<g transform="translate(${x} ${y})" class="hueco"><circle r="${r}" fill="none" stroke="var(--d-tinta)" stroke-opacity=".35" stroke-width="2" stroke-dasharray="6 8"/><text text-anchor="middle" dy="6">${texto}</text></g>`;
  const ubicar = (clave: keyof typeof LUGARES, contenido: string) => {
    const l = LUGARES[clave];
    return `<g transform="translate(${l.x} ${l.y}) scale(${l.s})"><g class="objeto${(nuevo === clave || nuevo === "todo") && !movimientoReducido() ? " aparece" : ""}">${contenido}</g></g>`;
  };
  const partes = [
    bebida ? ubicar("bebida", dibBebida(tipoDeBebida(bebida, categoriaDe.get(bebida.id)))) : hueco(LUGARES.bebida.x, LUGARES.bebida.y, 74, "tu bebida"),
    acomps[0] ? ubicar("acomp-0", dibPieza(tipoDePieza(acomps[0], categoriaDe.get(acomps[0].id)))) : hueco(LUGARES["acomp-0"].x, LUGARES["acomp-0"].y, 62, "algo rico"),
    acomps[1] ? ubicar("acomp-1", dibPieza(tipoDePieza(acomps[1], categoriaDe.get(acomps[1].id)))) : hueco(LUGARES["acomp-1"].x, LUGARES["acomp-1"].y, 62, acomps[0] ? "¿y otro?" : ""),
  ];
  return `<svg viewBox="0 0 560 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="560" height="400" rx="28" fill="var(--d-mesa)"/>${vetas}${servilleta}${rama}${partes.join("")}</svg>`;
}

function pintarArmador(nuevo?: string) {
  const bebida = bebidaPorId(eleccion.bebida);
  const acomps = eleccion.acomp.map(acompPorId).filter((p): p is Producto => !!p);
  $("bandeja").innerHTML = mesaSvg(nuevo);

  for (const input of document.querySelectorAll<HTMLInputElement>("#opciones-bebida input")) input.checked = input.value === eleccion.bebida;
  const lleno = acomps.length >= MAX_ACOMPANAMIENTOS;
  for (const input of document.querySelectorAll<HTMLInputElement>("#opciones-acomp input")) {
    const p = acompPorId(input.value);
    input.checked = eleccion.acomp.includes(input.value);
    input.closest("label")!.classList.toggle("tope", lleno && !input.checked && !p?.agotado);
  }

  const enMesa = $("en-la-mesa");
  enMesa.replaceChildren();
  const chip = (p: Producto, quitar: () => void) => {
    const b = crear("button", { type: "button", className: "chip-quitar", ariaLabel: `Sacar ${p.nombre}` }, p.nombre, crear("span", { ariaHidden: "true" }, "×"));
    b.addEventListener("click", () => {
      quitar();
      pintarArmador();
      (enMesa.querySelector("button") ?? document.querySelector<HTMLInputElement>("#opciones-bebida input:not(:disabled)"))?.focus();
    });
    return crear("li", {}, b);
  };
  if (bebida) enMesa.append(chip(bebida, () => (eleccion.bebida = undefined)));
  for (const p of acomps) enMesa.append(chip(p, () => (eleccion.acomp = eleccion.acomp.filter((id) => id !== p.id))));

  $("mesa-pista").textContent = !bebida
    ? acomps.length
      ? "Falta la bebida"
      : "Elegí una bebida para empezar"
    : !acomps.length
      ? "¿Y para acompañar?"
      : acomps.length < MAX_ACOMPANAMIENTOS
        ? "Podés sumar uno más"
        : eleccion.paraLlevar
          ? "Listo para llevar"
          : "Mesa lista";

  const listo = !!bebida && acomps.length > 0;
  const nombre = $("combo-nombre");
  const lista = $("combo-lista");
  const ahorro = $("combo-ahorro");
  if (bebida || acomps.length) {
    const todos = [...(bebida ? [bebida] : []), ...acomps];
    const precio = precioCombo(todos);
    if (listo) {
      const { titulo, detalle } = partesDelNombre(nombreCombo(bebida, acomps, momento, eleccion.paraLlevar));
      nombre.replaceChildren(crear("strong", {}, `${titulo}: `), detalle);
      $("combo-precio").textContent = formatearPesos(precio.total);
      lista.textContent = formatearPesos(precio.lista);
      lista.hidden = precio.ahorro <= 0;
      ahorro.textContent = `Ahorrás ${formatearPesos(precio.ahorro)}`;
      ahorro.hidden = precio.ahorro <= 0;
    } else {
      nombre.textContent = todos.map((p) => p.nombre).join(" + ");
      $("combo-precio").textContent = formatearPesos(precio.lista);
      lista.hidden = true;
      ahorro.hidden = true;
    }
  } else {
    nombre.textContent = "Todavía no elegiste nada.";
    $("combo-precio").textContent = formatearPesos(0);
    lista.hidden = true;
    ahorro.hidden = true;
  }
  if (nuevo) animar($("combo-precio"), "cambio");
  ($("combo-sumar") as HTMLButtonElement).disabled = !listo;
  ($("combo-vaciar") as HTMLButtonElement).disabled = !bebida && !acomps.length;
}

// ---------- Carta ----------
const controles = new Map<string, HTMLElement>();
const productoPorId = new Map<string, Producto>();
for (const c of L.categorias) for (const p of c.productos) productoPorId.set(p.id, p);

const NOTAS: Record<string, string> = {
  cafe: "tostado acá, cada semana",
  panaderia: "salen a las 7:30",
  salado: "para el hambre de verdad",
  tortas: "recién cortadas a la tarde",
  bebidas: "exprimido en el momento",
};

function tarjeta(p: Producto, categoria: Categoria, clase = "producto"): HTMLElement {
  const caja = crear("div", { className: "controles" });
  controles.set(p.id, caja);
  const imagen = fotoODibujo(p, categoria.id);
  if (p.agotado) imagen.append(crear("span", { className: "sello-agotado mano" }, "Hoy no hay"));
  return crear(
    "li",
    { className: `${clase}${p.agotado ? " agotado" : ""}` },
    imagen,
    crear(
      "div",
      { className: "producto-texto" },
      crear("h4", { className: "producto-nombre" }, p.nombre),
      ...(p.descripcion ? [crear("p", { className: "producto-desc" }, p.descripcion)] : []),
      ...etiquetas(p),
      crear("div", { className: "producto-pie" }, crear("p", { className: "precio" }, p.agotado ? crear("s", {}, formatearPesos(p.precio)) : formatearPesos(p.precio)), caja),
    ),
  );
}

function armarCarta() {
  const categorias = L.categorias.filter((c) => !esDeSiempre(c) && c.productos.length);
  const indice = $("indice");
  categorias.forEach((c, i) => {
    indice.append(crear("li", {}, crear("a", { href: `#cat-${c.id}` }, c.nombre)));
    const cabeza = crear(
      "header",
      { className: "categoria-cabeza" },
      crear("span", { className: "categoria-numero" }, String(i + 1).padStart(2, "0")),
      crear("h3", { className: "categoria-titulo" }, c.nombre),
      ...(NOTAS[c.id] ? [crear("p", { className: "categoria-nota mano" }, NOTAS[c.id]!)] : []),
    );
    $("categorias").append(
      crear("section", { className: "categoria", id: `cat-${c.id}`, ariaLabel: c.nombre }, cabeza, crear("ul", { className: "productos" }, ...c.productos.map((p) => tarjeta(p, c)))),
    );
  });

  const deSiempre = L.categorias.find(esDeSiempre);
  if (deSiempre?.productos.length) {
    $("de-siempre").hidden = false;
    $("de-siempre-bajada").textContent = `${deSiempre.nombre}, armados como en el salón. Para uno o para compartir.`;
    $("de-siempre-lista").append(...deSiempre.productos.map((p) => tarjeta(p, deSiempre, "producto producto-ancho")));
  }
  pintarControles();
}

function pintarControles() {
  for (const [id, caja] of controles) {
    const p = productoPorId.get(id)!;
    const n = carrito.find((l) => l.productoId === id)?.cantidad ?? 0;
    const conFoco = (caja.querySelector(":focus") as HTMLElement | null)?.dataset.rol;
    caja.replaceChildren();
    if (p.agotado) {
      caja.append(crear("span", { className: "no-hay" }, "Agotado"));
      continue;
    }
    if (n === 0) {
      const b = crear("button", { type: "button", className: "boton boton-chico boton-sumar", ariaLabel: `Sumar ${p.nombre} al pedido` }, crear("span", { ariaHidden: "true" }, "+"), " Sumar");
      b.dataset.rol = "mas";
      b.addEventListener("click", () => sumar(id, 1, `${p.nombre}: sumado al pedido.`));
      caja.append(b);
    } else caja.append(pasos(p.nombre, n, () => sumar(id, -1), () => sumar(id, 1)));
    if (conFoco) (caja.querySelector<HTMLElement>(`[data-rol="${conFoco}"]`) ?? caja.querySelector("button"))?.focus();
  }
}

function pasos(nombre: string, n: number, menos: () => void, mas: () => void, foco?: string): HTMLElement {
  const bMenos = crear("button", { type: "button", className: "paso-boton", ariaLabel: `Uno menos de ${nombre}` }, "−");
  const bMas = crear("button", { type: "button", className: "paso-boton", ariaLabel: `Uno más de ${nombre}` }, "+");
  bMenos.dataset.rol = "menos";
  bMas.dataset.rol = "mas";
  if (foco) {
    bMenos.dataset.foco = `menos:${foco}`;
    bMas.dataset.foco = `mas:${foco}`;
  }
  bMenos.addEventListener("click", menos);
  bMas.addEventListener("click", mas);
  return crear("div", { className: "pasos", role: "group", ariaLabel: `Cantidad de ${nombre}` }, bMenos, crear("span", { className: "pasos-n" }, String(n)), bMas);
}

// ---------- Historia y datos ----------
function armarHistoria() {
  if (!L.historia?.length && !L.cifras?.length) return;
  $("historia").hidden = false;
  $("historia-parrafos").append(...(L.historia ?? []).map((p) => crear("p", {}, p)));
  for (const c of L.cifras ?? []) $("cifras").append(crear("li", { className: "cifra" }, crear("span", { className: "cifra-valor" }, c.valor), crear("span", { className: "cifra-texto mano" }, c.texto)));
}

function armarDatos() {
  const horarios = textoHorarios(L);
  $("horarios").append(...horarios.map((h) => crear("li", {}, h)));
  $("direccion").textContent = L.direccion;
  ($("como-llegar") as HTMLAnchorElement).href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(L.direccion)}`;
  $("envio-texto").textContent = L.envio.disponible
    ? `${L.envio.zona ?? "Al barrio"}. ${L.envio.costo ? `El envío cuesta ${formatearPesos(L.envio.costo)}.` : "Sin cargo."} También podés pasar a buscarlo.`
    : "Por ahora, sólo para retirar en el café.";
  $("pagos-texto").textContent = `Pagás con ${L.mediosDePago.map((m) => (m.includes(" ") ? m : m.toLowerCase())).join(", ").replace(/, ([^,]*)$/, " o $1")}.`;
  $("pie-nombre").textContent = L.nombre;
  $("pie-dato").textContent = [L.direccion, horarios[0]].filter(Boolean).join(" · ");
  if (L.demo) $("demo").hidden = false;
  document.querySelector(".pie")!.append(firma());
}

// ---------- Barra y pedido ----------
function pintarBarra() {
  const lx = conCombos();
  const n = cantidadTotal(lx, carrito);
  $("barra").hidden = n === 0;
  document.body.classList.toggle("con-barra", n > 0);
  $("barra-cantidad").textContent = n === 1 ? "1 cosa en tu pedido" : `${n} cosas en tu pedido`;
  $("barra-total").textContent = formatearPesos(calcularTotal(lx, carrito));
}

const hoja = $("hoja") as HTMLDialogElement;
const form = $("form-pedido") as HTMLFormElement;
const entregaElegida = (): DatosCliente["entrega"] => ((form.elements.namedItem("entrega") as RadioNodeList).value === "envio" ? "envio" : "retiro");

/** Miniatura de la línea: el dibujo de la bebida del combo, o la foto/dibujo del producto. */
function miniatura(id: string): HTMLElement {
  const combo = leerCombo(id);
  const caja = crear("span", { className: "linea-mini", ariaHidden: "true" });
  if (combo) {
    const b = bebidaPorId(combo.bebida);
    caja.innerHTML = b ? dibujoBebida(tipoDeBebida(b, categoriaDe.get(b.id))) : "";
    return caja;
  }
  const p = productoPorId.get(id);
  if (p) caja.append(fotoODibujo({ ...p, nombre: "" }, categoriaDe.get(id) ?? "", 96));
  return caja;
}

function pintarHoja() {
  const lx = conCombos();
  const lineas = lineasValidas(lx, carrito);
  const lista = $("lineas");
  const enfocado = (document.activeElement as HTMLElement | null)?.dataset.foco;
  lista.replaceChildren();
  for (const l of lineas) {
    const combo = leerCombo(l.productoId);
    const { titulo, detalle } = combo ? partesDelNombre(l.producto.nombre) : { titulo: l.producto.nombre, detalle: "" };
    const partes = combo && resolverCombo(L, combo);
    const ahorro = partes ? precioCombo([partes.bebida, ...partes.acompanamientos]).ahorro * l.cantidad : 0;
    const quitar = crear("button", { type: "button", className: "quitar", ariaLabel: `Quitar ${l.producto.nombre}` }, "Quitar");
    quitar.addEventListener("click", () => {
      sumar(l.productoId, -l.cantidad);
      (lista.querySelector<HTMLButtonElement>("button") ?? $("cerrar-hoja")).focus();
    });
    lista.append(
      crear(
        "li",
        { className: `linea${combo ? " linea-combo" : ""}` },
        miniatura(l.productoId),
        crear(
          "div",
          { className: "linea-texto" },
          crear("p", { className: "linea-titulo" }, titulo),
          ...(detalle ? [crear("p", { className: "linea-detalle" }, detalle)] : []),
          ...(ahorro > 0 ? [crear("p", { className: "linea-ahorro" }, `Ahorrás ${formatearPesos(ahorro)}`)] : []),
          quitar,
        ),
        crear(
          "div",
          { className: "linea-lado" },
          crear("p", { className: "linea-precio" }, formatearPesos(l.subtotal)),
          pasos(titulo, l.cantidad, () => sumar(l.productoId, -1), () => sumar(l.productoId, 1), l.productoId),
        ),
      ),
    );
  }
  if (enfocado) lista.querySelector<HTMLElement>(`[data-foco="${CSS.escape(enfocado)}"]`)?.focus();
  $("hoja-vacia").hidden = lineas.length > 0;

  const entrega = entregaElegida();
  $("campo-direccion").hidden = entrega !== "envio";
  const productos = lineas.reduce((s, l) => s + l.subtotal, 0);
  const cuentas = $("cuentas");
  cuentas.replaceChildren(crear("div", {}, crear("dt", {}, "Productos"), crear("dd", {}, formatearPesos(productos))));
  if (entrega === "envio") cuentas.append(crear("div", {}, crear("dt", {}, "Envío"), crear("dd", {}, L.envio.costo ? formatearPesos(L.envio.costo) : "Sin cargo")));
  $("hoja-total").textContent = formatearPesos(calcularTotal(lx, carrito, entrega));
  ($("enviar") as HTMLButtonElement).disabled = lineas.length === 0;
}

function armarHoja() {
  $("retiro-dato").textContent = L.direccion;
  if (L.envio.disponible) $("envio-dato").textContent = [L.envio.zona, L.envio.costo ? formatearPesos(L.envio.costo) : "sin cargo"].filter(Boolean).join(" · ");
  else $("opcion-envio").remove();
  L.mediosDePago.forEach((m, i) => {
    $("pagos").append(crear("label", { className: "opcion opcion-chica" }, crear("input", { type: "radio", name: "pago", value: m, checked: i === 0 }), crear("span", {}, m)));
  });
  if (estado && !estado.abierto) {
    const c = $("hoja-cerrado");
    c.textContent = `${estado.texto}. Podés mandar el pedido igual: lo preparamos cuando abramos.`;
    c.hidden = false;
  }
  try {
    const datos = JSON.parse(localStorage.getItem(`cliente:${SLUG}`) ?? "{}") as Partial<Record<"nombre" | "direccion", string>>;
    if (datos.nombre) ($("nombre-cliente") as HTMLInputElement).value = datos.nombre;
    if (datos.direccion) ($("direccion-cliente") as HTMLInputElement).value = datos.direccion;
  } catch {
    /* sin datos guardados */
  }

  let anterior: HTMLElement = $("abrir-pedido");
  $("abrir-pedido").addEventListener("click", () => {
    anterior = (document.activeElement as HTMLElement | null) ?? $("abrir-pedido");
    $("enviado").hidden = true;
    pintarHoja();
    hoja.showModal();
    document.body.classList.add("hoja-abierta");
    $("cerrar-hoja").focus();
  });
  $("cerrar-hoja").addEventListener("click", () => hoja.close());
  hoja.addEventListener("click", (e) => {
    if (e.target === hoja) hoja.close(); // tocar afuera cierra
  });
  hoja.addEventListener("close", () => {
    document.body.classList.remove("hoja-abierta");
    (document.contains(anterior) && anterior.offsetParent ? anterior : $("arriba")).focus();
  });
  form.addEventListener("change", (e) => {
    if ((e.target as HTMLInputElement).name === "entrega") pintarHoja();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = ($("nombre-cliente") as HTMLInputElement).value.trim();
    const direccion = ($("direccion-cliente") as HTMLInputElement).value.trim();
    const entrega = entregaElegida();
    const faltaNombre = !nombre;
    const faltaDireccion = entrega === "envio" && !direccion;
    $("error-nombre").hidden = !faltaNombre;
    $("error-direccion").hidden = !faltaDireccion;
    $("nombre-cliente").setAttribute("aria-invalid", String(faltaNombre));
    $("direccion-cliente").setAttribute("aria-invalid", String(faltaDireccion));
    if (faltaDireccion) return $("direccion-cliente").focus();
    if (faltaNombre) return $("nombre-cliente").focus();
    const lx = conCombos();
    if (!lineasValidas(lx, carrito).length) return;

    const cliente: DatosCliente = {
      nombre,
      entrega,
      direccion: entrega === "envio" ? direccion : undefined,
      pago: (form.elements.namedItem("pago") as RadioNodeList).value || L.mediosDePago[0]!,
      aclaraciones: ($("aclaraciones") as HTMLTextAreaElement).value.trim() || undefined,
    };
    try {
      localStorage.setItem(`cliente:${SLUG}`, JSON.stringify({ nombre, direccion }));
    } catch {
      /* sin almacenamiento */
    }
    window.open(linkWhatsApp(L.whatsapp, armarMensaje(lx, carrito, cliente)), "_blank", "noopener");
    $("enviado").hidden = false;
  });
  $("nuevo-pedido").addEventListener("click", () => {
    carrito = [];
    guardar();
    ($("aclaraciones") as HTMLTextAreaElement).value = "";
    hoja.close();
    tostada("Listo, pedido vacío.");
  });
}

// ---------- Arranque ----------
armarArmador();
armarCarta();
armarHistoria();
armarDatos();
armarHoja();
guardar();
