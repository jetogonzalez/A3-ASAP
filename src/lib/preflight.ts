import { looksLikeArtwork } from "@/lib/artwork";
import { loadPdfjs } from "@/lib/pdf-preview";
import { postscriptPageMm, type ArtworkFacts } from "@/lib/preflight-rules";

/*
 * Revisión automática del archivo, la parte que lee. Corre en el navegador al
 * elegir el archivo; nada sale del equipo para esto. De un PDF (o un AI con
 * compatibilidad PDF) saca el tamaño de cada página, la resolución real de cada
 * foto a tamaño impreso y las fuentes que no van incrustadas. De un EPS solo
 * se puede leer el tamaño del encabezado. Las reglas están en preflight-rules.
 */

const POINTS_PER_INCH = 72;
const MM_PER_POINT = 25.4 / POINTS_PER_INCH;
const MAX_PAGES = 4;

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

function multiply(m: Matrix, n: readonly number[]): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

/** Espera un objeto del PDF (imagen o fuente) sin colgarse si nunca llega. */
function objectOf(store: { get: (id: string, callback?: (value: unknown) => void) => unknown }, id: string): Promise<unknown> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), 3000);
    try {
      store.get(id, (value: unknown) => {
        window.clearTimeout(timer);
        resolve(value);
      });
    } catch {
      window.clearTimeout(timer);
      resolve(null);
    }
  });
}

export async function readArtworkFacts(file: File): Promise<ArtworkFacts> {
  const head = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
  if (!looksLikeArtwork(head)) return { kind: "unknown", readable: false, pages: [], minImagePpi: null, missingFonts: [] };

  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  if (!isPdf) {
    const header = new TextDecoder("latin1").decode(head);
    const page = postscriptPageMm(header);
    return { kind: "postscript", readable: false, pages: page ? [page] : [], minImagePpi: null, missingFonts: [] };
  }

  try {
    const pdfjs = await loadPdfjs();
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true });
    const document = await task.promise;
    const pages: ArtworkFacts["pages"] = [];
    const missingFonts = new Set<string>();
    let minImagePpi: number | null = null;
    const OPS = pdfjs.OPS;

    try {
      for (let number = 1; number <= Math.min(document.numPages, MAX_PAGES); number += 1) {
        const page = await document.getPage(number);
        const viewport = page.getViewport({ scale: 1 });
        pages.push({ widthMm: viewport.width * MM_PER_POINT, heightMm: viewport.height * MM_PER_POINT });

        const list = await page.getOperatorList();
        const stack: Matrix[] = [];
        let ctm: Matrix = IDENTITY;
        for (let index = 0; index < list.fnArray.length; index += 1) {
          const fn = list.fnArray[index];
          const args = list.argsArray[index] as unknown[] | null;
          if (fn === OPS.save) stack.push(ctm);
          else if (fn === OPS.restore) ctm = stack.pop() ?? IDENTITY;
          else if (fn === OPS.transform && args) ctm = multiply(ctm, args as number[]);
          else if (fn === OPS.paintFormXObjectBegin && args) {
            stack.push(ctm);
            if (Array.isArray(args[0])) ctm = multiply(ctm, args[0] as number[]);
          } else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() ?? IDENTITY;
          else if ((fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) && args) {
            const image =
              typeof args[0] === "string"
                ? ((await objectOf(args[0].startsWith("g_") ? page.commonObjs : page.objs, args[0])) as { width?: number; height?: number } | null)
                : (args[0] as { width?: number; height?: number });
            /* La imagen ocupa el cuadrado unidad: la matriz da cuánto mide impresa, en puntos. */
            const widthPt = Math.hypot(ctm[0], ctm[1]);
            const heightPt = Math.hypot(ctm[2], ctm[3]);
            if (image?.width && image.height && widthPt > 2 && heightPt > 2) {
              const ppi = Math.min(image.width / (widthPt / POINTS_PER_INCH), image.height / (heightPt / POINTS_PER_INCH));
              minImagePpi = minImagePpi === null ? ppi : Math.min(minImagePpi, ppi);
            }
          } else if (fn === OPS.setFont && args && typeof args[0] === "string") {
            const font = (await objectOf(page.commonObjs, args[0])) as { missingFile?: boolean; name?: string } | null;
            if (font?.missingFile) missingFonts.add((font.name ?? args[0]).replace(/^[A-Z]{6}\+/, ""));
          }
        }
        page.cleanup();
      }
    } finally {
      await task.destroy();
    }
    return { kind: "pdf", readable: true, pages, minImagePpi, missingFonts: [...missingFonts] };
  } catch {
    return { kind: "pdf", readable: false, pages: [], minImagePpi: null, missingFonts: [] };
  }
}
