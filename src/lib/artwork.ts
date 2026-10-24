/*
 * Archivos de diseño: PDF, EPS o Illustrator (AI), hasta 50 MB. Es lo que se
 * decidió con el equipo: una imagen JPG o PNG suele llegar con poca
 * resolución y se descartó, igual que Corel. Canva entrega PDF, así que sigue
 * funcionando. Los AI y EPS pesan más, por eso el tope subió de 8 a 50 MB.
 */
export const MAX_ARTWORK_MB = 50;
export const MAX_ARTWORK_BYTES = MAX_ARTWORK_MB * 1024 * 1024;

/** Para los textos: «PDF, EPS o AI». */
export const ARTWORK_FORMATS_LABEL = "PDF, EPS o AI";

/*
 * El navegador casi nunca sabe el tipo de un .ai o un .eps (lo deja vacío o
 * pone cualquier cosa), así que el tipo se decide por la extensión. Un AI
 * moderno es un PDF por dentro; uno viejo, igual que el EPS, es PostScript.
 */
const EXTENSION_TYPES = {
  pdf: "application/pdf",
  ai: "application/postscript",
  eps: "application/postscript",
} as const;

export const ARTWORK_TYPES = ["application/pdf", "application/postscript"] as const;

/** Para el atributo accept del campo de archivo. */
export const ARTWORK_ACCEPT = ".pdf,.ai,.eps,application/pdf,application/postscript,application/illustrator";

function extensionOf(name: string): string {
  return name.toLowerCase().split(".").pop() ?? "";
}

/** El tipo con que se sube el archivo, o null si no es un formato aceptado. */
export function artworkContentType(file: { name: string }): (typeof ARTWORK_TYPES)[number] | null {
  const extension = extensionOf(file.name);
  return extension in EXTENSION_TYPES ? EXTENSION_TYPES[extension as keyof typeof EXTENSION_TYPES] : null;
}

/** Se puede dibujar en el mockup: un PDF, o un AI guardado con compatibilidad PDF (se intenta). */
export function mayPreviewArtwork(file: { name: string }): boolean {
  const extension = extensionOf(file.name);
  return extension === "pdf" || extension === "ai";
}

/**
 * Revisa los primeros bytes del archivo ya subido: PDF empieza con «%PDF»,
 * PostScript (EPS y AI antiguos) con «%!PS» y el EPS con vista previa de
 * Windows con C5 D0 D3 C6. Lo que no sea ninguno se borra.
 */
export function looksLikeArtwork(bytes: Uint8Array): boolean {
  const starts = (...expected: number[]) => expected.every((value, index) => bytes[index] === value);
  return starts(0x25, 0x50, 0x44, 0x46) || starts(0x25, 0x21, 0x50, 0x53) || starts(0xc5, 0xd0, 0xd3, 0xc6);
}

/**
 * Los archivos viven en Vercel Blob. Solo se aceptan enlaces de ahí, para que
 * nadie meta en el pedido un enlace a otro sitio haciéndolo pasar por el arte.
 */
export function isArtworkUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith("/artes/")
    );
  } catch {
    return false;
  }
}

export const CANVA_FILENAME = "Diseño en Canva";

/**
 * Un diseño compartido desde Canva: «Compartir → Copiar enlace». Llega como
 * canva.com/design/… o como enlace corto canva.link/….
 */
export function isCanvaUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    if (url.hostname === "canva.link") return url.pathname.length > 1;
    return (url.hostname === "www.canva.com" || url.hostname === "canva.com") && url.pathname.startsWith("/design/");
  } catch {
    return false;
  }
}

export type ArtworkSource = "archivo" | "canva";
