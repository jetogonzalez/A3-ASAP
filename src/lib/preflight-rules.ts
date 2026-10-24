/*
 * Revisión automática del archivo de diseño, la parte que decide. Recibe lo
 * que se leyó del archivo (lib/preflight.ts) y lo que se pidió (tamaño, lados)
 * y devuelve una lista de chequeo en palabras simples. No bloquea el pedido:
 * avisa para que el cliente corrija antes y la imprenta reciba menos sorpresas.
 * Está separada de la lectura para poder probarla sin navegador.
 */

export type ArtworkFacts = {
  /** Lo que dicen los primeros bytes, no la extensión. */
  kind: "pdf" | "postscript" | "unknown";
  /** Si el PDF se pudo abrir. Un EPS no se abre: se lee su encabezado. */
  readable: boolean;
  /** Tamaño de cada página en mm (en un EPS, el de su BoundingBox). */
  pages: Array<{ widthMm: number; heightMm: number }>;
  /** La imagen con menos resolución, en ppp a tamaño real. null = no hay imágenes (o no se pudo medir). */
  minImagePpi: number | null;
  /** Fuentes que el PDF usa sin llevarlas dentro. */
  missingFonts: string[];
};

export type ArtworkSpec = {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  /** Solo en tarjetas: cuántos lados se imprimen. */
  sides?: 1 | 2;
};

export type CheckStatus = "ok" | "warn" | "error" | "info";
export type PreflightCheck = { id: string; status: CheckStatus; title: string; detail?: string };

/** Resolución para imprenta: 300 ppp; desde 150 se nota, menos se ve pixelado. */
export const GOOD_PPI = 300;
const FAIR_PPI = 240;
const POOR_PPI = 150;
const TOLERANCE_MM = 1;

const mm = (value: number) => (Math.round(value * 10) / 10).toLocaleString("es-EC");
const size = (width: number, height: number) => `${mm(width)} × ${mm(height)} mm`;
const sorted = (a: number, b: number): [number, number] => (a >= b ? [a, b] : [b, a]);
const near = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) <= TOLERANCE_MM && Math.abs(a[1] - b[1]) <= TOLERANCE_MM;

type SizeFit = "bleed" | "trim" | "scaled" | "other";

function sizeFit(page: { widthMm: number; heightMm: number }, spec: ArtworkSpec): SizeFit {
  const actual = sorted(page.widthMm, page.heightMm);
  const trim = sorted(spec.widthMm, spec.heightMm);
  const bleed = sorted(spec.widthMm + spec.bleedMm * 2, spec.heightMm + spec.bleedMm * 2);
  if (near(actual, bleed)) return "bleed";
  if (near(actual, trim)) return "trim";
  const ratio = actual[0] / actual[1];
  return Math.abs(ratio - bleed[0] / bleed[1]) < 0.02 || Math.abs(ratio - trim[0] / trim[1]) < 0.02 ? "scaled" : "other";
}

export function evaluateArtwork(facts: ArtworkFacts, spec?: ArtworkSpec): PreflightCheck[] {
  if (facts.kind === "unknown") {
    return [
      {
        id: "formato",
        status: "error",
        title: "No parece un PDF, EPS o AI",
        detail: "El contenido no corresponde a la extensión. Vuelve a exportarlo desde tu programa de diseño.",
      },
    ];
  }
  if (facts.kind === "pdf" && !facts.readable) {
    return [
      {
        id: "formato",
        status: "warn",
        title: "No pudimos abrir el PDF",
        detail: "Puede estar dañado o protegido con contraseña. Expórtalo de nuevo sin contraseña.",
      },
    ];
  }

  const checks: PreflightCheck[] = [];
  const first = facts.pages[0];

  /* Tamaño y sangrado */
  if (spec && first) {
    const trim = size(spec.widthMm, spec.heightMm);
    const bleed = size(spec.widthMm + spec.bleedMm * 2, spec.heightMm + spec.bleedMm * 2);
    const fit = sizeFit(first, spec);
    if (fit === "bleed") checks.push({ id: "tamano", status: "ok", title: `Tamaño correcto, con sangrado (${bleed})` });
    else if (fit === "trim")
      checks.push({
        id: "tamano",
        status: "warn",
        title: `Sin sangrado: mide ${trim}`,
        detail: `Agrega ${spec.bleedMm} mm por lado (${bleed}) y extiende el fondo hasta el borde, o pueden quedar filos blancos al cortar.`,
      });
    else if (fit === "scaled")
      checks.push({
        id: "tamano",
        status: "warn",
        title: `Mide ${size(first.widthMm, first.heightMm)}, no ${bleed}`,
        detail: "Tiene la proporción correcta y lo ajustamos al tamaño, pero revisa que nada importante quede pegado al borde.",
      });
    else
      checks.push({
        id: "tamano",
        status: "error",
        title: `Mide ${size(first.widthMm, first.heightMm)}`,
        detail: `Tu producto es de ${trim} (${bleed} con sangrado). Descarga la plantilla y arma el diseño sobre ella.`,
      });
  } else if (spec && !first) {
    checks.push({ id: "tamano", status: "info", title: "No pudimos leer el tamaño", detail: "La imprenta lo revisa antes de imprimir." });
  }

  /* Páginas y lados (solo PDF y tarjetas) */
  if (facts.kind === "pdf" && spec?.sides) {
    const count = facts.pages.length;
    if (spec.sides === 2 && count < 2)
      checks.push({
        id: "paginas",
        status: "warn",
        title: "Falta el reverso",
        detail: "Pediste dos lados y el PDF tiene una sola página. Agrega una segunda página con el reverso.",
      });
    else if (spec.sides === 1 && count > 1)
      checks.push({
        id: "paginas",
        status: "info",
        title: `Tiene ${count} páginas`,
        detail: "Pediste un lado: imprimimos la primera. Si la segunda es el reverso, elige dos lados.",
      });
    else checks.push({ id: "paginas", status: "ok", title: spec.sides === 2 ? "Frente y reverso, una página cada uno" : "Una página, un lado" });
  }

  /* Resolución de las imágenes */
  if (facts.kind === "pdf") {
    let ppi = facts.minImagePpi;
    /* Si la página no está a tamaño real, la imagen se imprime más grande o más chica. */
    if (ppi !== null && spec && first && sizeFit(first, spec) === "scaled") {
      const target = sorted(spec.widthMm + spec.bleedMm * 2, spec.heightMm + spec.bleedMm * 2)[0];
      ppi = (ppi * sorted(first.widthMm, first.heightMm)[0]) / target;
    }
    if (ppi === null)
      checks.push({ id: "resolucion", status: "ok", title: "Diseño vectorial", detail: "No lleva fotos: se imprime nítido a cualquier tamaño." });
    else if (ppi < POOR_PPI)
      checks.push({
        id: "resolucion",
        status: "error",
        title: `Hay una imagen a ${Math.round(ppi)} ppp`,
        detail: `Se verá pixelada. Para imprenta necesita ${GOOD_PPI} ppp al tamaño real.`,
      });
    else if (ppi < FAIR_PPI)
      checks.push({
        id: "resolucion",
        status: "warn",
        title: `Una imagen está a ${Math.round(ppi)} ppp`,
        detail: `Se puede imprimir, pero lo ideal son ${GOOD_PPI} ppp.`,
      });
    else checks.push({ id: "resolucion", status: "ok", title: `Imágenes con buena resolución (${Math.round(Math.min(ppi, 1200))} ppp o más)` });
  } else {
    checks.push({ id: "resolucion", status: "info", title: "Resolución y fuentes: las revisa la imprenta", detail: "En un EPS o AI antiguo no podemos medirlas desde aquí." });
  }

  /* Fuentes */
  if (facts.kind === "pdf") {
    if (facts.missingFonts.length > 0)
      checks.push({
        id: "fuentes",
        status: "warn",
        title: `Fuentes sin incrustar: ${facts.missingFonts.slice(0, 3).join(", ")}${facts.missingFonts.length > 3 ? "…" : ""}`,
        detail: "Al exportar, incrusta las fuentes o conviértelas a contornos, o el texto puede cambiar de letra.",
      });
    else checks.push({ id: "fuentes", status: "ok", title: "Fuentes incrustadas o en contornos" });
  }

  return checks;
}

/** Lo peor que encontró la revisión, para el resumen de una línea. */
export function worstStatus(checks: PreflightCheck[]): CheckStatus {
  if (checks.some((check) => check.status === "error")) return "error";
  if (checks.some((check) => check.status === "warn")) return "warn";
  return "ok";
}

/** Lee el tamaño de un EPS o AI antiguo desde su encabezado (%%HiResBoundingBox o %%BoundingBox, en puntos). */
export function postscriptPageMm(header: string): { widthMm: number; heightMm: number } | null {
  const match =
    /%%HiResBoundingBox:\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/.exec(header) ??
    /%%BoundingBox:\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/.exec(header);
  if (!match) return null;
  const [x1, y1, x2, y2] = match.slice(1, 5).map(Number);
  const toMm = (points: number) => (points * 25.4) / 72;
  const widthMm = toMm(Math.abs(x2 - x1));
  const heightMm = toMm(Math.abs(y2 - y1));
  return widthMm > 0 && heightMm > 0 ? { widthMm, heightMm } : null;
}
