/**
 * Fuente única de verdad del diseño ("papel de carnicería"): crema, tinta
 * pimentón, café espresso y un sello dorado. Todos son hex planos para que los
 * modificadores de opacidad de Tailwind (bg-brand/20) sigan funcionando.
 * tailwind.config.ts importa este archivo; el test de contraste también.
 */

export const marca = {
  50: "#FBEFE9",
  100: "#F6DACE",
  600: "#BC4220", // Pimentón: primario
  700: "#9C3417", // hover
  800: "#7C2812", // presionado
} as const;

/** Neutros cálidos (nunca gris azulado). 500 es el texto más claro permitido. */
export const tinta = {
  50: "#FAF6EF",
  100: "#F3EDE1",
  200: "#E6DCCB", // líneas
  300: "#D2C4AE", // bordes
  500: "#76645B", // texto mínimo (AA sobre blanco y crema)
  600: "#6B5850", // texto secundario
  700: "#54413A",
  800: "#3B2B25",
  900: "#231815", // texto principal
} as const;

export const superficies = {
  papel: "#F8F3EA", // fondo de página
  blanco: "#FFFFFF",
  espresso: "#241915", // sidebar y encabezados
  espressoHover: "#32241F",
  espressoActivo: "#3F2F28",
} as const;

/** Dorado: solo relleno, siempre con texto tinta-900; nunca como texto. */
export const acento = "#E0A526";

export const semantica = {
  ok: "#2E6B3F",
  advertencia: "#F2B33D",
  info: "#1F5F8B",
  peligro: "#B3202A",
  okSuave: "#E6F2E9",
  advertenciaSuave: "#FFF3D6",
  infoSuave: "#E4EEF5",
  peligroSuave: "#FBE6E7",
  advertenciaTextoSuave: "#7A4B00",
} as const;

/**
 * Estados de pedido en insignias SÓLIDAS (legibles al sol). Cada una lleva
 * además ícono y etiqueta: el estado nunca se distingue solo por color.
 */
export const estadosPedido = {
  pendiente: { fondo: "#F2B33D", texto: tinta[900] },
  en_proceso: { fondo: "#1F5F8B", texto: "#FFFFFF" },
  confirmado: { fondo: "#2E6B3F", texto: "#FFFFFF" },
  en_reparto: { fondo: "#5B3F8C", texto: "#FFFFFF" },
  entregado: { fondo: "#5A4C45", texto: "#FFFFFF" },
  devuelto: { fondo: "#B45309", texto: "#FFFFFF" },
  cancelado: { fondo: "#B3202A", texto: "#FFFFFF" },
} as const;

