import type { Local } from "../src/nucleo/tipos";

export const localDePrueba: Local = {
  slug: "prueba",
  nombre: "Rotisería de Prueba",
  whatsapp: "+54 9 11 2345-6789",
  direccion: "Calle Falsa 123",
  horarios: ["Lun a Sáb 11 a 15 y 19 a 23"],
  mediosDePago: ["Efectivo", "Transferencia"],
  envio: { disponible: true, costo: 1500, zona: "Hasta 20 cuadras" },
  categorias: [
    {
      id: "empanadas",
      nombre: "Empanadas",
      productos: [
        { id: "carne", nombre: "Empanada de carne", precio: 1200 },
        { id: "jyq", nombre: "Empanada de jamón y queso", precio: 1100 },
      ],
    },
    {
      id: "minutas",
      nombre: "Minutas",
      productos: [
        { id: "mila", nombre: "Milanesa con papas", precio: 9800 },
        { id: "tarta", nombre: "Tarta de verdura", precio: 6500, agotado: true },
      ],
    },
  ],
};
