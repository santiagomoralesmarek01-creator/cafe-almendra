// Copiado de Carta Local (src/formato.ts): el motor compartido de pedidos. Si cambia allá, se copia acá; no editar por separado.
/** 1500 → "$1.500". Formato fijo para que el mensaje de WhatsApp sea igual en todos los navegadores. */
export function formatearPesos(monto: number): string {
  const signo = monto < 0 ? "-" : "";
  const entero = Math.round(Math.abs(monto)).toString();
  return `${signo}$${entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
