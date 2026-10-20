// Carta del salón de Café Almendra: se abre desde el QR de la mesa. Sólo para mirar y pedirle al
// mozo (sin carrito). Precios, agotados, fotos y aviso salen del panel del dueño.
import "../base.css";
import "./style.css";
import { etiquetas, fotoODibujo, franjaDelDia, iniciarTema, mostrarAviso, mostrarEstado, mostrarMarca, urlDe } from "../comun";
import { dibujoMesita, ramaAlmendro, ramita } from "../dibujos";
import { cargarLocal } from "../nucleo/datos";
import { $, crear, firma } from "../nucleo/dom";
import { formatearPesos } from "../nucleo/formato";
import { textoHorarios } from "../nucleo/horario";
import type { Categoria, Local, Producto } from "../nucleo/tipos";

iniciarTema();

const cargado = await cargarLocal();
if (!cargado) {
  document.body.replaceChildren(crear("p", { className: "sin-datos" }, "No pudimos cargar la carta. Pedile la carta impresa al mozo."));
  throw new Error("sin datos del local");
}
const local: Local = cargado;
document.documentElement.dataset.franja = franjaDelDia();

mostrarMarca(local);
mostrarAviso(local);
mostrarEstado(local);
document.title = `Carta · ${local.nombre}`;

// "Café Almendra" → "Café" + "Almendra" en itálica.
{
  const [primera, ...resto] = local.nombre.split(" ");
  $("nombre-a").textContent = resto.length ? primera! : "";
  $("nombre-b").textContent = resto.length ? resto.join(" ") : local.nombre;
}
const desde = local.cifras?.find((c) => /^\d{4}$/.test(c.valor))?.valor;
$("tapa-sub").textContent = [local.descripcion?.split(",")[0] ?? "Café", desde ? `desde ${desde}` : ""].filter(Boolean).join(" · ");
for (const r of document.querySelectorAll("[data-rama]")) r.innerHTML = ramaAlmendro();
for (const r of document.querySelectorAll("[data-ramita]")) r.innerHTML = ramita();

const esDestacada = (c: Categoria) => c.id === "desayunos" || /desayuno|merienda/i.test(c.nombre);

const NOTAS: Record<string, string> = {
  cafe: "tostado acá, cada semana",
  panaderia: "salen a las 7:30",
  salado: "para el hambre de verdad",
  tortas: "recién cortadas a la tarde",
  desayunos: "para empezar o cortar el día",
  bebidas: "exprimido en el momento",
};

function plato(p: Producto, categoria: Categoria): HTMLElement {
  const imagen = fotoODibujo(p, categoria.id, 240);
  return crear(
    "li",
    { className: `plato${p.agotado ? " agotado" : ""}` },
    imagen,
    crear(
      "div",
      { className: "plato-texto" },
      crear(
        "h3",
        { className: "plato-linea" },
        crear("span", { className: "plato-nombre" }, p.nombre),
        crear("span", { className: "plato-precio" }, p.agotado ? crear("s", {}, formatearPesos(p.precio)) : formatearPesos(p.precio)),
      ),
      ...(p.descripcion ? [crear("p", { className: "plato-desc" }, p.descripcion)] : []),
      ...etiquetas(p, true),
    ),
  );
}

// ---------- Categorías y pestañas ----------
const pestanas = $("pestanas");
const enlaces = new Map<string, HTMLAnchorElement>();
const categorias = local.categorias.filter((c) => c.productos.length);
categorias.forEach((categoria, i) => {
  const enlace = crear("a", { href: `#cat-${categoria.id}` }, categoria.nombre);
  enlaces.set(categoria.id, enlace);
  pestanas.append(enlace);
  const destacada = esDestacada(categoria);
  const cabeza = crear(
    "header",
    { className: "categoria-cabeza" },
    crear("span", { className: "categoria-numero" }, String(i + 1).padStart(2, "0")),
    crear("h2", { className: "categoria-titulo" }, categoria.nombre),
    ...(NOTAS[categoria.id] ? [crear("p", { className: "categoria-nota mano" }, NOTAS[categoria.id]!)] : []),
  );
  const seccion = crear("section", { className: `categoria${destacada ? " categoria-destacada" : ""}`, id: `cat-${categoria.id}`, ariaLabel: categoria.nombre }, cabeza);
  if (destacada) seccion.append(crear("p", { className: "destacada-nota" }, "Armados como nos gustan. Si querés cambiar algo, decile al mozo."));
  seccion.append(crear("ul", { className: "platos" }, ...categoria.productos.map((p) => plato(p, categoria))));
  $("carta").append(seccion);
});

// La pestaña de la categoría que se está mirando queda marcada (y a la vista en la barra).
function marcar(id: string) {
  for (const [cat, a] of enlaces) {
    const activa = cat === id;
    a.classList.toggle("activa", activa);
    if (activa) {
      a.setAttribute("aria-current", "true");
      pestanas.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
    } else a.removeAttribute("aria-current");
  }
}
const visibles = new Map<string, boolean>();
const observador = new IntersectionObserver(
  (entradas) => {
    for (const e of entradas) visibles.set(e.target.id.replace(/^cat-/, ""), e.isIntersecting);
    const primera = categorias.find((c) => visibles.get(c.id));
    if (primera) marcar(primera.id);
  },
  { rootMargin: "-120px 0px -55% 0px" },
);
for (const s of document.querySelectorAll(".categoria")) observador.observe(s);
if (categorias[0]) marcar(categorias[0].id);

// ---------- Para llevar y pie ----------
($("enlace-web") as HTMLAnchorElement).href = urlDe("web");
$("a-casa-dibujo").innerHTML = dibujoMesita("desayuno-clasico");
if (local.envio.disponible) {
  const envio = [local.envio.zona?.toLowerCase(), local.envio.costo ? formatearPesos(local.envio.costo) : "sin cargo"].filter(Boolean).join(", ");
  $("a-casa-texto").textContent = `Armá tu pedido y mandalo por WhatsApp: retirás acá o te lo llevamos (${envio}).`;
}
$("pie-nombre").textContent = local.nombre;
$("pie-dato").textContent = local.direccion;
$("pie-horarios").append(...textoHorarios(local).map((h) => crear("li", {}, h)));
if (local.demo) $("demo").hidden = false;
document.querySelector(".pie")!.append(firma());
