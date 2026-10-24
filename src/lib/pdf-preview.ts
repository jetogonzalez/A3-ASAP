/*
 * Vista previa de un PDF (o de un AI guardado con compatibilidad PDF) para
 * ponerla en el mockup. Dibuja en el navegador la primera página y, si hay,
 * la segunda: en una tarjeta a dos lados esa es el reverso. Nada se sube para
 * esto; el archivo original es el que va a imprenta.
 *
 * pdf.js pesa, así que se carga solo cuando alguien elige un archivo. Si el
 * archivo no se puede dibujar (un EPS, un AI viejo), devuelve una lista vacía
 * y el pedido sigue igual, solo que sin muestra.
 */

const PREVIEW_WIDTH = 1400;

let worker: Worker | null = null;

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!worker) {
    worker = new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), { type: "module" });
    pdfjs.GlobalWorkerOptions.workerPort = worker;
  }
  return pdfjs;
}

function canvasToUrl(canvas: HTMLCanvasElement): Promise<string | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null), "image/png");
  });
}

/** Devuelve hasta dos imágenes (frente y reverso) como URLs locales. Quien las pide las suelta. */
export async function renderArtworkPages(file: File, maxPages = 2): Promise<string[]> {
  try {
    const pdfjs = await loadPdfjs();
    const data = new Uint8Array(await file.arrayBuffer());
    const task = pdfjs.getDocument({ data, useSystemFonts: true });
    const document = await task.promise;
    const urls: string[] = [];
    try {
      for (let number = 1; number <= Math.min(document.numPages, maxPages); number += 1) {
        const page = await document.getPage(number);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: PREVIEW_WIDTH / base.width });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvas, viewport }).promise;
        const url = await canvasToUrl(canvas);
        if (url) urls.push(url);
        page.cleanup();
      }
    } finally {
      await task.destroy();
    }
    return urls;
  } catch {
    return [];
  }
}
