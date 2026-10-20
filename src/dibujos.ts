// Dibujos del café, vistos desde arriba ("flat lay"), como SVG en texto: las tazas y vasos, la
// pastelería en su plato, y las ramas de almendro en flor y de cafeto. Los colores salen de las
// variables --d-* de src/base.css, así cambian con el modo claro u oscuro. Sin DOM.
import type { Producto } from "./nucleo/tipos";

export type Bebida = "pocillo" | "cortado" | "latte" | "capuccino" | "taza-grande" | "cold-brew" | "limonada" | "jugo" | "agua" | "te";
export type Pieza =
  | "medialuna"
  | "medialunas"
  | "croissant"
  | "budin"
  | "scones"
  | "tostado"
  | "tostada-palta"
  | "cuernito"
  | "lemon-pie"
  | "chocotorta"
  | "cheesecake"
  | "alfajor";

const T = "var(--d-tinta)";
const LINEA = `stroke="${T}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const FINA = `stroke="${T}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"`;

const BEBIDA_POR_ID: Record<string, Bebida> = {
  espresso: "pocillo",
  cortado: "cortado",
  "flat-white": "latte",
  "cafe-con-leche": "taza-grande",
  capuccino: "capuccino",
  "cold-brew": "cold-brew",
  limonada: "limonada",
  "jugo-naranja": "jugo",
  agua: "agua",
  te: "te",
};

const PIEZA_POR_ID: Record<string, Pieza> = {
  medialuna: "medialuna",
  "medialunas-docena": "medialunas",
  croissant: "croissant",
  budin: "budin",
  scon: "scones",
  "tostado-jyq": "tostado",
  "tostado-palta": "tostada-palta",
  cuernito: "cuernito",
  "torta-limon": "lemon-pie",
  chocotorta: "chocotorta",
  cheesecake: "cheesecake",
  alfajor: "alfajor",
};

/** Qué recipiente dibujar para una bebida: por id y, si no se conoce, por categoría o nombre. */
export function tipoDeBebida(p: Pick<Producto, "id" | "nombre">, categoria?: string): Bebida {
  const conocido = BEBIDA_POR_ID[p.id];
  if (conocido) return conocido;
  const n = p.nombre.toLowerCase();
  if (/\bt[eé]\b|mate/.test(n)) return "te";
  if (/fr[ií]o|cold|limonada|jugo|licuado|agua|soda/.test(n)) return /jugo|naranja/.test(n) ? "jugo" : /limonada/.test(n) ? "limonada" : "cold-brew";
  if (/espresso|ristretto|pocillo/.test(n)) return "pocillo";
  return categoria === "bebidas" ? "agua" : "latte";
}

/** Qué pieza dibujar para un acompañamiento: por id y, si no se conoce, por categoría. */
export function tipoDePieza(p: Pick<Producto, "id" | "nombre">, categoria?: string): Pieza {
  const conocido = PIEZA_POR_ID[p.id];
  if (conocido) return conocido;
  const n = p.nombre.toLowerCase();
  if (/medialuna|croissant|cuernito/.test(n)) return "medialuna";
  if (/tostad|sandwich|s[aá]ndwich/.test(n)) return "tostado";
  if (/alfajor|galleta|cookie/.test(n)) return "alfajor";
  if (/bud[ií]n|pan /.test(n)) return "budin";
  if (/choco|brownie/.test(n)) return "chocotorta";
  if (categoria === "salado") return "tostado";
  if (categoria === "tortas") return "cheesecake";
  return "medialuna";
}

// ---------- Piezas sueltas (centradas en 0,0, más o menos de -50 a 50) ----------

/** Un platito de loza con borde. */
const plato = (r = 46) =>
  `<circle r="${r}" fill="var(--d-loza)" ${LINEA}/><circle r="${r - 7}" fill="none" stroke="var(--d-plato)" stroke-width="1.6"/>`;

/** Medialuna: media luna con sus capas marcadas y almíbar. */
function medialuna(x = 0, y = 0, rot = 0, escala = 1, color = "var(--d-dorado)") {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${escala})">
    <path d="M-34 10 C-30 -18 -10 -28 0 -28 C10 -28 30 -18 34 10 C28 4 22 -2 14 -6 C8 -8 4 -9 0 -9 C-4 -9 -8 -8 -14 -6 C-22 -2 -28 4 -34 10 Z" fill="${color}" ${LINEA}/>
    <path d="M-20 -14 C-17 -10 -15 -8 -14 -6 M-8 -24 C-7 -16 -6 -12 -6 -9 M8 -24 C7 -16 6 -12 6 -9 M20 -14 C17 -10 15 -8 14 -6" fill="none" ${FINA}/>
    <path d="M-12 -20 C-6 -23 6 -23 12 -20" fill="none" stroke="var(--d-brillo)" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
  </g>`;
}

const DIBUJOS_PIEZA: Record<Pieza, () => string> = {
  medialuna: () => plato() + medialuna(0, 6),
  medialunas: () =>
    plato() + medialuna(-12, -10, -12, 0.66) + medialuna(14, -2, 14, 0.66) + medialuna(-2, 20, -4, 0.66),
  croissant: () =>
    plato() +
    medialuna(0, 6, 0, 1.15, "var(--d-dorado-osc)") +
    `<g fill="var(--d-almendra)" ${FINA}><ellipse cx="-12" cy="-16" rx="5" ry="2.6" transform="rotate(-20 -12 -16)"/><ellipse cx="2" cy="-21" rx="5" ry="2.6" transform="rotate(8 2 -21)"/><ellipse cx="15" cy="-14" rx="5" ry="2.6" transform="rotate(30 15 -14)"/></g>
    <g fill="var(--d-loza)"><circle cx="-6" cy="-12" r="1.4"/><circle cx="8" cy="-10" r="1.2"/><circle cx="-18" cy="-6" r="1.1"/><circle cx="20" cy="-4" r="1.3"/></g>`,
  budin: () =>
    plato() +
    `<g transform="rotate(-8)"><rect x="-30" y="-18" width="60" height="36" rx="6" fill="var(--d-masa)" ${LINEA}/>
     <rect x="-30" y="-18" width="60" height="36" rx="6" fill="none" stroke="var(--d-dorado-osc)" stroke-width="5" opacity=".7"/>
     <g fill="var(--d-nuez)"><circle cx="-14" cy="-4" r="3"/><circle cx="6" cy="6" r="2.6"/><circle cx="16" cy="-6" r="2.4"/><circle cx="-4" cy="-10" r="2"/><circle cx="-18" cy="8" r="2.2"/></g></g>`,
  scones: () =>
    plato() +
    [[-16, -10], [14, -12], [0, 14]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="var(--d-dorado)" ${LINEA}/><circle cx="${x! - 3}" cy="${y! - 3}" r="5" fill="var(--d-brillo)" opacity=".6"/>`)
      .join(""),
  tostado: () =>
    plato() +
    `<g ${LINEA}><path d="M-30 -24 L24 -24 L-30 30 Z" fill="var(--d-dorado)"/><path d="M30 -18 L30 30 L-18 30 Z" fill="var(--d-dorado)" transform="translate(4 2)"/></g>
     <g stroke="var(--d-dorado-osc)" stroke-width="2.4" stroke-linecap="round" opacity=".75"><path d="M-22 -14 L4 -14 M-22 -2 L-8 -2 M-22 10 L-20 10 M24 6 L32 6 M12 20 L32 20"/></g>
     <path d="M-30 30 L24 -24" stroke="var(--d-jamon)" stroke-width="3" opacity=".9"/>`,
  "tostada-palta": () =>
    plato() +
    `<g transform="rotate(6)"><rect x="-34" y="-24" width="68" height="48" rx="12" fill="var(--d-masa)" ${LINEA}/>
     <rect x="-34" y="-24" width="68" height="48" rx="12" fill="none" stroke="var(--d-dorado-osc)" stroke-width="4" opacity=".7"/>
     <g fill="var(--d-palta)" ${FINA}><ellipse cx="-16" cy="-6" rx="13" ry="6" transform="rotate(-20 -16 -6)"/><ellipse cx="-14" cy="9" rx="13" ry="6" transform="rotate(-20 -14 9)"/><ellipse cx="2" cy="-12" rx="11" ry="5" transform="rotate(-20 2 -12)"/></g>
     <path d="M6 0 C10 -10 26 -10 28 2 C30 14 14 18 8 12 C4 8 4 4 6 0 Z" fill="var(--d-loza)" ${FINA}/><circle cx="17" cy="3" r="6" fill="var(--d-yema)"/>
     <g fill="${T}"><circle cx="-6" cy="2" r="1"/><circle cx="-22" cy="16" r="1"/><circle cx="-2" cy="16" r="1"/><circle cx="-26" cy="-14" r="1"/></g></g>`,
  cuernito: () =>
    plato() +
    `<g fill="var(--d-rucula)" ${FINA}><path d="M-26 2 C-30 -8 -18 -14 -14 -4 Z"/><path d="M24 2 C30 -8 18 -14 14 -4 Z"/></g>` +
    `<path d="M-26 0 C-14 -8 14 -8 26 0 C14 -2 -14 -2 -26 0 Z" fill="var(--d-jamon)" ${FINA}/>` +
    medialuna(0, 8, 0, 1.05, "var(--d-dorado-osc)"),
  "lemon-pie": () =>
    plato() +
    `<path d="M0 30 L-26 -22 A58 58 0 0 1 26 -22 Z" fill="var(--d-limon)" ${LINEA}/>
     <path d="M-26 -22 A58 58 0 0 1 26 -22" fill="none" stroke="var(--d-dorado-osc)" stroke-width="6" stroke-linecap="round"/>
     <g fill="var(--d-merengue)" ${FINA}><circle cx="-8" cy="-8" r="7"/><circle cx="8" cy="-10" r="7"/><circle cx="0" cy="6" r="6.5"/><circle cx="-12" cy="-22" r="5.5"/><circle cx="12" cy="-24" r="5.5"/></g>
     <g fill="var(--d-dorado-osc)"><circle cx="-7" cy="-11" r="2"/><circle cx="9" cy="-13" r="2"/><circle cx="1" cy="3" r="2"/></g>`,
  chocotorta: () =>
    plato() +
    `<g transform="rotate(-10)"><rect x="-26" y="-22" width="52" height="44" rx="4" fill="var(--d-choco)" ${LINEA}/>
     <g stroke="var(--d-dulce)" stroke-width="3" opacity=".9"><path d="M-22 -10 H22 M-22 2 H22 M-22 14 H22"/></g>
     <g fill="var(--d-choco-osc)"><circle cx="-12" cy="-16" r="1.6"/><circle cx="4" cy="-17" r="1.4"/><circle cx="14" cy="-15" r="1.6"/></g></g>`,
  cheesecake: () =>
    plato() +
    `<path d="M0 30 L-26 -22 A58 58 0 0 1 26 -22 Z" fill="var(--d-queso)" ${LINEA}/>
     <path d="M-24 -18 A58 58 0 0 1 24 -18 L14 4 L-14 4 Z" fill="var(--d-frutos)" opacity=".9"/>
     <path d="M-26 -22 A58 58 0 0 1 26 -22" fill="none" stroke="var(--d-masa-osc)" stroke-width="6" stroke-linecap="round"/>
     <g fill="var(--d-frutos-osc)" ${FINA}><circle cx="-8" cy="-12" r="4.5"/><circle cx="7" cy="-14" r="4"/><circle cx="0" cy="-4" r="3.5"/></g>`,
  alfajor: () =>
    plato() +
    `<circle r="26" fill="var(--d-dulce)" ${LINEA}/><circle r="22" fill="var(--d-masa)" ${FINA}/>
     <g fill="var(--d-loza)">${Array.from({ length: 16 }, (_, i) => {
       const a = (i / 16) * Math.PI * 2;
       return `<circle cx="${(Math.cos(a) * 25).toFixed(1)}" cy="${(Math.sin(a) * 25).toFixed(1)}" r="1.8"/>`;
     }).join("")}</g>
     <circle cx="-7" cy="-7" r="6" fill="var(--d-brillo)" opacity=".5"/>`,
};

/** Taza con platito vista desde arriba. `r`: radio de la taza. */
function taza(r: number, liquido: string, arte = "", platito = r + 14) {
  return `<circle r="${platito}" fill="var(--d-loza)" ${LINEA}/><circle r="${platito - 6}" fill="none" stroke="var(--d-plato)" stroke-width="1.5"/>
    <rect x="${r - 4}" y="-6" width="${r * 0.55 + 6}" height="12" rx="6" fill="var(--d-loza)" ${LINEA}/>
    <circle r="${r}" fill="var(--d-loza)" ${LINEA}/><circle r="${r - 5}" fill="${liquido}" ${FINA}/>${arte}`;
}

/** Corazón de latte art. */
const corazon = (s = 1) =>
  `<path transform="scale(${s})" d="M0 12 C-14 2 -16 -8 -8 -11 C-4 -12 -1 -10 0 -6 C1 -10 4 -12 8 -11 C16 -8 14 2 0 12 Z" fill="var(--d-crema)"/>`;

/** Roseta de latte art. */
const roseta = `<g fill="var(--d-crema)">${[12, 6, 0, -6]
  .map((y, i) => {
    const w = 13 - i * 2.2;
    return `<path d="M${-w} ${y - 4} Q0 ${y + 7} ${w} ${y - 4} Q0 ${y + 2} ${-w} ${y - 4} Z"/>`;
  })
  .join("")}<path d="M0 -7 C-6 -13 -5 -18 0 -15 C5 -18 6 -13 0 -7 Z"/><path d="M0 -14 L0 16" stroke="var(--d-cafe)" stroke-width="1.4"/></g>`;

/** Vaso visto desde arriba, con hielo y sorbete. */
function vaso(liquido: string, extra = "", hielo = true) {
  const cubos = hielo
    ? `<g fill="var(--d-hielo)" stroke="var(--d-loza)" stroke-width="1.2" opacity=".85"><rect x="-16" y="-14" width="13" height="13" rx="3" transform="rotate(12 -10 -8)"/><rect x="2" y="-4" width="12" height="12" rx="3" transform="rotate(-18 8 2)"/><rect x="-10" y="6" width="11" height="11" rx="3" transform="rotate(26 -4 12)"/></g>`
    : "";
  return `<circle r="30" fill="var(--d-loza)" opacity=".55" ${LINEA}/><circle r="25" fill="${liquido}" ${FINA}/>${cubos}${extra}
    <path d="M6 -6 L30 -34" stroke="var(--d-sorbete)" stroke-width="6" stroke-linecap="round"/><circle cx="6" cy="-6" r="3.4" fill="var(--d-sorbete)" ${FINA}/>`;
}

const rodaja = (x: number, y: number, color: string, r = 9) =>
  `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${color}" ${FINA}/><circle r="${r - 2.5}" fill="none" stroke="var(--d-loza)" stroke-width="1.4" opacity=".8"/>${[0, 60, 120]
    .map((a) => `<path d="M0 0 L${(Math.cos((a * Math.PI) / 180) * (r - 3)).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * (r - 3)).toFixed(1)}" stroke="var(--d-loza)" stroke-width="1" opacity=".8"/>`)
    .join("")}</g>`;

const DIBUJOS_BEBIDA: Record<Bebida, () => string> = {
  pocillo: () => taza(19, "var(--d-espresso)", `<circle r="10" fill="var(--d-crema-cafe)" opacity=".75"/><circle cx="-3" cy="-3" r="3" fill="var(--d-crema)" opacity=".6"/>`, 31),
  cortado: () => taza(20, "var(--d-crema-cafe)", `<circle r="8" fill="var(--d-crema)"/><circle cx="2" cy="1" r="4" fill="var(--d-crema-cafe)" opacity=".7"/>`, 32),
  latte: () => taza(28, "var(--d-cafe)", roseta),
  capuccino: () =>
    taza(28, "var(--d-crema)", `<circle r="17" fill="var(--d-cafe)" opacity=".25"/>${corazon(1.15)}<g fill="var(--d-cacao)">${Array.from({ length: 14 }, (_, i) => `<circle cx="${(Math.cos(i * 2.4) * (8 + (i % 5) * 3)).toFixed(1)}" cy="${(Math.sin(i * 2.4) * (8 + (i % 5) * 3)).toFixed(1)}" r="1.1"/>`).join("")}</g>`),
  "taza-grande": () => taza(32, "var(--d-cafe-leche)", corazon(1.2), 46),
  "cold-brew": () => vaso("var(--d-espresso)"),
  limonada: () =>
    vaso("var(--d-limonada)", rodaja(-12, 12, "var(--d-limon)") + `<g fill="var(--d-rucula)" ${FINA}><path d="M10 10 C16 4 24 8 22 14 C18 18 12 16 10 10 Z"/><path d="M4 18 C6 10 14 12 14 18 C12 24 6 24 4 18 Z"/></g>`),
  jugo: () => vaso("var(--d-naranja)", rodaja(-12, 12, "var(--d-naranja-osc)"), false),
  agua: () => vaso("var(--d-hielo)", `<circle cx="-8" cy="8" r="2" fill="var(--d-loza)"/><circle cx="10" cy="12" r="1.5" fill="var(--d-loza)"/>`, true),
  te: () =>
    `<g transform="translate(-10 -6)"><path d="M-46 4 L-30 -2 L-28 6 Z" fill="var(--d-tetera)" ${LINEA}/><rect x="26" y="-7" width="16" height="14" rx="7" fill="none" stroke="var(--d-tetera)" stroke-width="5"/><rect x="26" y="-7" width="16" height="14" rx="7" fill="none" ${FINA}/>
      <circle r="30" fill="var(--d-tetera)" ${LINEA}/><circle r="14" fill="var(--d-tetera-osc)" ${FINA}/><circle r="4.5" fill="var(--d-loza)" ${FINA}/>
      <path d="M-20 -14 C-14 -20 -6 -22 0 -22" stroke="var(--d-loza)" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/></g>
     <g transform="translate(30 30) scale(.62)">${taza(19, "var(--d-te)", "", 30)}</g>`,
};

const envolver = (contenido: string, vb = "-56 -56 112 112", clase = "dibujo") =>
  `<svg class="${clase}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${contenido}</svg>`;

// ---------- Para llevar ----------

const FRIAS: Bebida[] = ["cold-brew", "limonada", "jugo", "agua"];
const LIQUIDO: Partial<Record<Bebida, string>> = {
  "cold-brew": "var(--d-espresso)",
  limonada: "var(--d-limonada)",
  jugo: "var(--d-naranja)",
  agua: "var(--d-hielo)",
};

/**
 * Vaso para llevar visto desde arriba: las calientes con tapa de cartón y piquito; las frías con
 * tapa transparente (se ve la bebida) y sorbete. Una faja de papel madera con la marca.
 */
function vasoParaLlevar(tipo: Bebida) {
  const faja = `<circle r="38" fill="var(--d-kraft)" ${LINEA}/><circle r="38" fill="none" stroke="var(--d-kraft-osc)" stroke-width="5" stroke-dasharray="3 7" opacity=".55"/>`;
  if (FRIAS.includes(tipo)) {
    return `${faja}<circle r="31" fill="${LIQUIDO[tipo]}" opacity=".9" ${LINEA}/><circle r="31" fill="var(--d-loza)" opacity=".28"/>
      <circle r="24" fill="none" stroke="var(--d-loza)" stroke-width="2" opacity=".7"/>
      <path d="M8 -8 L34 -40" stroke="var(--d-sorbete)" stroke-width="6" stroke-linecap="round"/><circle cx="8" cy="-8" r="4" fill="var(--d-sorbete)" ${FINA}/>`;
  }
  return `${faja}<circle r="31" fill="var(--d-loza)" ${LINEA}/><circle r="25" fill="none" stroke="var(--d-plato)" stroke-width="2"/>
    <rect x="-9" y="-29" width="18" height="9" rx="4.5" fill="var(--d-tinta)" opacity=".85"/>
    <path d="M-14 6 C-6 12 6 12 14 6" fill="none" stroke="var(--d-plato)" stroke-width="2" stroke-linecap="round"/>
    <circle r="3" cx="0" cy="18" fill="var(--d-plato)"/>`;
}

/** Cajita de papel madera con la pieza adentro (sin el plato). */
function cajaParaLlevar(tipo: Pieza) {
  const pieza = DIBUJOS_PIEZA[tipo]().replace(plato(), "");
  return `<rect x="-50" y="-50" width="100" height="100" rx="8" fill="var(--d-kraft)" ${LINEA}/>
    <path d="M-50 -34 H50 M-50 34 H50" stroke="var(--d-kraft-osc)" stroke-width="2" opacity=".6"/>
    <rect x="-42" y="-42" width="84" height="84" rx="5" fill="var(--d-loza)" opacity=".35"/>
    <g transform="scale(.92)">${pieza}</g>`;
}

export const grupoBebidaParaLlevar = (tipo: Bebida) => vasoParaLlevar(tipo);
export const grupoPiezaParaLlevar = (tipo: Pieza) => cajaParaLlevar(tipo);

export const dibujoBebida = (tipo: Bebida) => envolver(DIBUJOS_BEBIDA[tipo]());
export const dibujoPieza = (tipo: Pieza) => envolver(DIBUJOS_PIEZA[tipo]());
/** El contenido sin el <svg>, para ubicarlo dentro de la bandeja. */
export const grupoBebida = (tipo: Bebida) => DIBUJOS_BEBIDA[tipo]();
export const grupoPieza = (tipo: Pieza) => DIBUJOS_PIEZA[tipo]();

// ---------- Flores y ramas ----------

/** Flor de almendro de cinco pétalos. */
export function flor(x: number, y: number, r = 9, rot = 0) {
  const petalos = Array.from({ length: 5 }, (_, i) => `<ellipse cx="0" cy="${-r * 0.62}" rx="${r * 0.5}" ry="${r * 0.62}" transform="rotate(${i * 72})"/>`).join("");
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><g fill="var(--d-flor)" stroke="var(--d-flor-borde)" stroke-width="1">${petalos}</g>
    <circle r="${r * 0.24}" fill="var(--d-flor-centro)"/>${[0, 72, 144, 216, 288]
      .map((a) => `<circle cx="${(Math.cos((a * Math.PI) / 180) * r * 0.36).toFixed(1)}" cy="${(Math.sin((a * Math.PI) / 180) * r * 0.36).toFixed(1)}" r="${(r * 0.07).toFixed(2)}" fill="var(--d-flor-centro)"/>`)
      .join("")}</g>`;
}

const capullo = (x: number, y: number, rot = 0, s = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C-5 -4 -4 -12 0 -15 C4 -12 5 -4 0 0 Z" fill="var(--d-flor-centro)" opacity=".75"/><path d="M0 0 C-3 -2 -3 -5 -2 -7 M0 0 C3 -2 3 -5 2 -7" stroke="var(--d-rama)" stroke-width="1.4" fill="none"/></g>`;

/** Rama de almendro en flor (portada, separadores). viewBox 0 0 400 260. */
export function ramaAlmendro(clase = "rama"): string {
  const ramas = `<g fill="none" stroke="var(--d-rama)" stroke-linecap="round">
    <path d="M6 240 C70 200 120 190 180 150 C240 110 300 90 392 30" stroke-width="5"/>
    <path d="M150 168 C150 130 170 100 200 70" stroke-width="3"/>
    <path d="M262 108 C280 120 310 130 350 128" stroke-width="3"/>
    <path d="M80 206 C70 180 74 160 92 140" stroke-width="2.6"/>
    <path d="M320 70 C318 50 326 34 340 20" stroke-width="2.2"/></g>`;
  const flores = [
    flor(200, 70, 15, 10), flor(178, 96, 12, 40), flor(240, 118, 14, -12), flor(296, 92, 13, 20), flor(350, 128, 12, 5),
    flor(330, 58, 11, 33), flor(92, 140, 13, 18), flor(120, 190, 11, -20), flor(370, 38, 10, 0), flor(152, 150, 9, 60), flor(60, 216, 10, 12),
  ].join("");
  const capullos = [capullo(214, 52, 20), capullo(160, 118, -30, 0.9), capullo(340, 20, 30, 0.8), capullo(272, 98, -40, 0.8), capullo(86, 128, -10, 0.9), capullo(318, 132, 100, 0.8)].join("");
  return `<svg class="${clase}" viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${ramas}${capullos}${flores}</svg>`;
}

/** Ramita chica de almendro (esquinas, separadores). viewBox 0 0 120 60. */
export function ramita(clase = "ramita"): string {
  return `<svg class="${clase}" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path d="M4 52 C30 44 60 36 116 10" fill="none" stroke="var(--d-rama)" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M58 37 C60 26 66 18 76 12" fill="none" stroke="var(--d-rama)" stroke-width="1.8" stroke-linecap="round"/>
    ${flor(76, 12, 8, 10)}${flor(98, 20, 7, -20)}${flor(40, 42, 7, 30)}${capullo(112, 10, 60, 0.6)}${capullo(22, 48, -40, 0.6)}</svg>`;
}

const hojaCafe = (x: number, y: number, rot: number, s = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C10 -10 34 -12 52 0 C34 12 10 10 0 0 Z" fill="var(--d-hoja)" stroke="var(--d-hoja-osc)" stroke-width="1.6"/><path d="M2 0 C18 -1 34 -1 50 0" stroke="var(--d-hoja-osc)" stroke-width="1.2" fill="none"/>
   ${[12, 22, 32].map((px) => `<path d="M${px} 0 L${px + 6} -6 M${px} 0 L${px + 6} 6" stroke="var(--d-hoja-osc)" stroke-width=".9" opacity=".7"/>`).join("")}</g>`;

const cerezas = (x: number, y: number) =>
  `<g transform="translate(${x} ${y})" stroke="var(--d-tinta)" stroke-width="1.2"><circle cx="-5" cy="2" r="5.5" fill="var(--d-cereza)"/><circle cx="5" cy="0" r="5.5" fill="var(--d-cereza-osc)"/><circle cx="0" cy="8" r="5" fill="var(--d-cereza)"/></g>`;

/** Rama de cafeto con hojas y cerezas. viewBox 0 0 300 200. */
export function ramaCafe(clase = "rama-cafe"): string {
  return `<svg class="${clase}" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path d="M10 180 C80 150 160 110 290 30" fill="none" stroke="var(--d-rama)" stroke-width="3.4" stroke-linecap="round"/>
    ${hojaCafe(40, 165, -110, 0.9)}${hojaCafe(44, 163, 40, 0.85)}${hojaCafe(110, 132, -100, 1)}${hojaCafe(114, 128, 50, 1)}
    ${hojaCafe(190, 86, -95, 0.95)}${hojaCafe(194, 84, 55, 0.9)}${hojaCafe(258, 48, -80, 0.75)}${hojaCafe(262, 46, 70, 0.7)}
    ${cerezas(78, 148)}${cerezas(152, 108)}${cerezas(226, 66)}</svg>`;
}

// ---------- Para las tarjetas sin foto ----------

/** Dibujo para un producto sin foto, según su categoría. */
export function dibujoDeProducto(p: Pick<Producto, "id" | "nombre">, categoria: string): string {
  if (categoria === "cafe" || categoria === "bebidas") return dibujoBebida(tipoDeBebida(p, categoria));
  if (categoria === "desayunos") return dibujoMesita(p.id);
  return dibujoPieza(tipoDePieza(p, categoria));
}

/** Composición de taza y pastelería para los desayunos y meriendas fijos. */
export function dibujoMesita(id: string): string {
  const dos = /dos|para-2/.test(id);
  const completo = /completo/.test(id);
  const g = (x: number, y: number, s: number, c: string) => `<g transform="translate(${x} ${y}) scale(${s})">${c}</g>`;
  const contenido = dos
    ? g(-26, -24, 0.52, grupoBebida("latte")) + g(28, 26, 0.52, grupoBebida("latte")) + g(26, -24, 0.5, grupoPieza("lemon-pie")) + g(-26, 28, 0.5, grupoPieza("chocotorta"))
    : completo
      ? g(-24, -20, 0.56, grupoBebida("taza-grande")) + g(28, -26, 0.46, grupoBebida("jugo")) + g(4, 28, 0.58, grupoPieza("tostado"))
      : g(-20, -16, 0.62, grupoBebida("taza-grande")) + g(24, 24, 0.56, grupoPieza("medialunas"));
  return envolver(contenido);
}
