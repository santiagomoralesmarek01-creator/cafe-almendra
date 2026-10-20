import { describe, expect, it } from "vitest";
import { describirTurnos, estadoDelLocal } from "../src/nucleo/horario";
import type { Turno } from "../src/nucleo/tipos";

// Lunes a sábado de 11 a 15 y de 19 a 23; domingo de 11 a 15. Argentina es UTC-3 todo el año.
const turnos: Turno[] = [
  { dias: [1, 2, 3, 4, 5, 6], abre: "11:00", cierra: "15:00" },
  { dias: [1, 2, 3, 4, 5, 6], abre: "19:00", cierra: "23:00" },
  { dias: [0], abre: "11:00", cierra: "15:00" },
];
// 2026-10-14 es miércoles.
const hora = (iso: string) => new Date(`${iso}-03:00`);

describe("estadoDelLocal", () => {
  it("abierto en el turno del mediodía", () => {
    expect(estadoDelLocal(turnos, hora("2026-10-14T12:30"))).toEqual({ abierto: true, texto: "Abierto · cierra a las 15" });
  });

  it("cerrado entre turnos: abre hoy a la noche", () => {
    expect(estadoDelLocal(turnos, hora("2026-10-14T16:00"))).toEqual({ abierto: false, texto: "Cerrado · abre hoy a las 19" });
  });

  it("a la hora exacta de cierre ya está cerrado", () => {
    expect(estadoDelLocal(turnos, hora("2026-10-14T15:00")).abierto).toBe(false);
  });

  it("de noche tarde: abre mañana", () => {
    expect(estadoDelLocal(turnos, hora("2026-10-14T23:30")).texto).toBe("Cerrado · abre mañana a las 11");
  });

  it("domingo a la tarde: abre mañana (lunes)", () => {
    expect(estadoDelLocal(turnos, hora("2026-10-18T16:00")).texto).toBe("Cerrado · abre mañana a las 11");
  });

  it("si mañana no abre, nombra el día", () => {
    const soloLunes: Turno[] = [{ dias: [1], abre: "09:30", cierra: "13:00" }];
    expect(estadoDelLocal(soloLunes, hora("2026-10-14T10:00")).texto).toBe("Cerrado · abre el lunes a las 9:30");
  });

  it("usa la hora argentina aunque el dispositivo esté en otra zona", () => {
    // 15:30 UTC = 12:30 en Argentina.
    expect(estadoDelLocal(turnos, new Date("2026-10-14T15:30:00Z")).abierto).toBe(true);
  });

  it("cierre a medianoche", () => {
    const hastaTarde: Turno[] = [{ dias: [3], abre: "20:00", cierra: "00:00" }];
    expect(estadoDelLocal(hastaTarde, hora("2026-10-14T23:10"))).toEqual({ abierto: true, texto: "Abierto · cierra a medianoche" });
  });

  it("sin turnos, cerrado", () => {
    expect(estadoDelLocal([], hora("2026-10-14T12:00"))).toEqual({ abierto: false, texto: "Cerrado" });
  });
});

describe("describirTurnos", () => {
  it("agrupa los días con los mismos horarios", () => {
    expect(describirTurnos(turnos)).toEqual(["Lunes a sábado de 11 a 15 y de 19 a 23", "Domingos de 11 a 15"]);
  });

  it("días sueltos y todos los días", () => {
    expect(describirTurnos([{ dias: [5, 1, 3], abre: "08:30", cierra: "13:00" }])).toEqual(["Lunes, miércoles y viernes de 8:30 a 13"]);
    expect(describirTurnos([{ dias: [0, 1, 2, 3, 4, 5, 6], abre: "12:00", cierra: "00:00" }])).toEqual(["Todos los días de 12 a 24"]);
    expect(describirTurnos([{ dias: [6, 0], abre: "20:00", cierra: "23:30" }])).toEqual(["Sábado y domingo de 20 a 23:30"]);
  });
});
