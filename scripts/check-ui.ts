/**
 * Guardia del sistema de diseño: falla si reaparece algo que el rediseño retiró.
 * Uso: npm run check:ui
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const RAIZ = process.cwd();
const CARPETAS = ["app", "components", "lib"];

// Archivos donde está permitido (y por qué)
const EXCEPCIONES: Record<string, string[]> = {
  // Pinta el trazo de la palomita con animación (pathLength); no es un ícono suelto
  svg: ["app/tienda/carrito/CarritoCliente.tsx"],
  // Define los propios tokens
  colores: ["lib/design/tokens.ts"],
};

interface Regla {
  id: string;
  patron: RegExp;
  mensaje: string;
  excepciones?: string[];
}

const REGLAS: Regla[] = [
  {
    id: "gris-azulado",
    patron: /(?<![\w-])(?:[\w-]+:)*[a-z]+-gray-\d{2,3}\b/,
    mensaje: "usa la escala ink-* (neutros cálidos), no gray-*",
  },
  {
    id: "color-crudo",
    patron: /(?<![\w-])(?:[\w-]+:)*(?:bg|text|border|ring|divide)-(?:red|green|blue|amber|yellow|orange|emerald|purple|pink|slate|zinc|neutral|stone)-\d{2,3}\b/,
    mensaje: "usa los colores semánticos (ok, warn, info, danger, brand, accent)",
    excepciones: EXCEPCIONES.colores,
  },
  {
    id: "dialogo-nativo",
    patron: /(?<![\w.])(?:window\.)?(?:confirm|alert)\(/,
    mensaje: "usa useConfirmar/ConfirmDialog y Alert en lugar de confirm()/alert()",
  },
  {
    id: "svg-suelto",
    patron: /<svg\b/,
    mensaje: "los íconos salen de components/ui/icons.ts (lucide)",
    excepciones: EXCEPCIONES.svg,
  },
  {
    id: "radio-crudo",
    patron: /(?<![\w-])(?:[\w-]+:)*rounded-(?:xl|2xl|lg|md)\b/,
    mensaje: "usa rounded-control, rounded-card o rounded-sheet",
  },
];

function archivos(dir: string, salida: string[] = []): string[] {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) {
      if (nombre === "node_modules" || nombre === "__tests__") continue;
      archivos(ruta, salida);
    } else if (/\.(tsx?|css)$/.test(nombre)) {
      salida.push(ruta);
    }
  }
  return salida;
}

let fallos = 0;
for (const carpeta of CARPETAS) {
  for (const ruta of archivos(join(RAIZ, carpeta))) {
    const rel = relative(RAIZ, ruta).split(sep).join("/");
    const lineas = readFileSync(ruta, "utf8").split(/\r?\n/);
    lineas.forEach((linea, i) => {
      const t = linea.trim();
      // Los comentarios pueden mencionar lo retirado
      if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
      for (const regla of REGLAS) {
        if (regla.excepciones?.includes(rel)) continue;
        if (regla.patron.test(linea)) {
          fallos++;
          console.error(`${rel}:${i + 1}  [${regla.id}] ${regla.mensaje}\n    ${t.slice(0, 120)}`);
        }
      }
    });
  }
}

if (fallos > 0) {
  console.error(`\n${fallos} problema(s) de diseño.`);
  process.exit(1);
}
console.log("check:ui — sin problemas de diseño.");
