# Café Almendra

Web de pedidos (`index.html`) y carta del salón (`carta.html`, a la que lleva el QR de las mesas)
de Café Almendra, con diseño propio. TypeScript + Vite, sin framework.

## Datos y panel

- La carta base y los cambios del dueño viven en **Carta Local** (otro repo): el JSON en
  `carta-local-pi.vercel.app/locales/cafe-almendra.json` y los ajustes del panel (precios, agotados,
  horarios, envío, aviso, fotos) en Supabase. `src/nucleo/datos.ts` los carga; si el JSON no responde
  usa la copia de `public/datos/`. Para cambiar la carta base se edita en Carta Local y se copia acá.
- `src/nucleo/` es una copia del motor de Carta Local (pedido, horarios, ajustes…). No editarlo por
  separado: si cambia allá, se copia acá con sus tests.

## Reglas

- Lógica sin DOM en archivos propios con tests en `tests/`.
- Textos en español rioplatense (vos), sin emojis en la interfaz.
- Revisar modo claro y oscuro, celular (390 px) y escritorio.
- Las dos páginas llevan al pie la firma "Hecho por MrK" (`firma()` en `src/nucleo/dom.ts`).

## Comandos

```bash
npm test
npm run build   # typecheck + build
npm run dev     # / = web de pedidos, /carta.html = carta del salón
```
