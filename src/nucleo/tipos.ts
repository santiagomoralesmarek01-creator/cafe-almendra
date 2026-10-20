// Copiado de Carta Local (src/tipos.ts): el motor compartido de pedidos. Si cambia allá, se copia acá; no editar por separado.
/** Nombre de un dibujo de las páginas genéricas de Carta Local (acá no se usa). */
type Ilustracion = string;

// Datos de un local: se cargan desde public/locales/<slug>.json.
// Los precios son enteros en pesos argentinos (sin centavos).

export type Etiqueta = "vegano" | "vegetariano" | "sin-tacc";

/** Lo que se dibuja arriba de una pizza en el armador por mitades (ver src/mitades.ts). */
export type Cubierta = "tomate" | "jamon" | "morron" | "aceitunas" | "cebolla" | "calabresa" | "rucula" | "huevo";

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  agotado?: boolean;
  etiquetas?: Etiqueta[];
  /** Foto del producto (la sube el dueño desde el panel, o una ruta de public/). */
  foto?: string;
  /** Sólo en categorías con armador "mitades": lo que se dibuja arriba (la muzzarella va siempre). */
  cubierta?: Cubierta[];
}

export interface Categoria {
  id: string;
  nombre: string;
  /** Dibujo para la página del local (ver ILUSTRACIONES en src/ilustraciones.ts). */
  ilustracion?: Ilustracion;
  /**
   * "mitades": arriba de la categoría aparece "Armala por mitades" (dos gustos de la misma
   * categoría en una pizza, se cobra el más caro). La lista de siempre queda abajo para pedir entera.
   * "docena": "Armá tu docena" (empanadas). El cliente elige cuántas de cada gusto (los productos de
   * la categoría, a precio por unidad) y se cobra la combinación más barata de docenas, medias
   * docenas y unidades (ver src/docena.ts). Necesita `docena`.
   */
  armador?: "mitades" | "docena";
  /**
   * Sólo con armador "docena": precio de la docena surtida y, si se vende, de la media docena
   * (enteros en pesos). Ej.: { "precio": 14000, "media": 7500 }.
   */
  docena?: { precio: number; media?: number };
  productos: Producto[];
}

export interface Envio {
  disponible: boolean;
  costo?: number;
  zona?: string;
}

/** Un turno de atención. `dias`: 0 = domingo … 6 = sábado. Horas en formato "HH:MM", hora argentina. */
export interface Turno {
  dias: number[];
  abre: string;
  cierra: string;
}

/** Rutas a los archivos de la marca (en public/). */
export interface Marca {
  logo: string;
  logoOscuro?: string;
  isotipo: string;
  /** Color de la marca para botones y detalles (texto blanco encima: contraste 4.5:1 o más). */
  color?: string;
  /** El mismo color, más claro, para el modo oscuro (texto oscuro encima). */
  colorOscuro?: string;
}

export interface Local {
  slug: string;
  nombre: string;
  descripcion?: string;
  /** Dominio propio del local (https://…, sin barra final). El QR apunta siempre ahí. */
  sitio?: string;
  /**
   * Carpeta del diseño propio del local en sitios/ y su dirección en el dominio compartido:
   * carta-local-pi.vercel.app/<ruta> (web de pedidos) y /<ruta>/carta (carta del salón).
   * Con dominio propio (`sitio`) se usa ese. Sin `ruta`, el local usa las páginas genéricas viejas.
   */
  ruta?: string;
  /** Sitio de demostración: muestra el aviso de datos ficticios. */
  demo?: boolean;
  /**
   * Plan contratado. "carta": carta para mirar, sin pedidos ni página propia (la dirección / lleva
   * a la carta). Por defecto, "local" (página + carta con pedidos por WhatsApp).
   * En una demo se puede probar con ?plan=carta.
   */
  plan?: "carta" | "local" | "plus";
  marca?: Marca;
  /** Dibujo grande de la portada. Por defecto, la caja de empanadas ("mesa" para una cafetería). */
  portada?: Ilustracion;
  /** Dibujo del llamado final de la página ("¿Pedimos?"). Por defecto, el horno. */
  llamado?: Ilustracion;
  /** Texto del cartel en el dibujo del frente. Por defecto, el nombre sin el rubro (ej. "LA ESQUINA"). */
  cartel?: string;
  /** Aviso del día, cargado desde el panel (ver src/ajustes.ts). */
  aviso?: string;
  /** Frase principal de la página del local. */
  eslogan?: string;
  /** Párrafos de "Nuestra historia". */
  historia?: string[];
  /** Ids de productos que se muestran en la página del local. */
  destacados?: string[];
  instagram?: string;
  /** Cifras destacadas de la página: { valor: "1987", texto: "abrimos en esta esquina" }. */
  cifras?: { valor: string; texto: string }[];
  /** Palabras de la cinta que se desplaza en la página. Si falta, se usan las categorías. */
  cinta?: string[];
  /** Turnos de atención: calculan "Abierto ahora" y el texto de horarios. */
  turnos?: Turno[];
  /** Número de WhatsApp con código de país, sólo dígitos (ej. 5491123456789). */
  whatsapp: string;
  direccion: string;
  /** Texto de horarios a mano. Si falta, se arma solo desde `turnos` (recomendado). */
  horarios?: string[];
  mediosDePago: string[];
  envio: Envio;
  categorias: Categoria[];
}

export interface LineaPedido {
  productoId: string;
  cantidad: number;
  nota?: string;
}

export type Carrito = LineaPedido[];

export interface DatosCliente {
  nombre: string;
  entrega: "retiro" | "envio";
  direccion?: string;
  pago: string;
  aclaraciones?: string;
}
