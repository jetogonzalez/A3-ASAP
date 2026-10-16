import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ARTWORK_TYPES, MAX_ARTWORK_BYTES } from "@/lib/artwork";
import { rateLimit } from "@/server/rate-limit";

/*
 * El navegador sube el archivo directo a Vercel Blob y esta ruta solo firma el
 * permiso. Así el arte no pasa por la función, que en Vercel corta a 4,5 MB.
 */
export async function POST(request: Request): Promise<Response> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "La subida de archivos no está activa." }, { status: 503 });
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  if (body.type === "blob.generate-client-token") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`upload:${ip}`, 20, 10 * 60 * 1000)) {
      return Response.json({ error: "Demasiados archivos seguidos. Espera unos minutos." }, { status: 429 });
    }
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^artes\/[\p{L}\p{N} ._()-]{1,80}$/u.test(pathname)) {
          throw new Error("Nombre de archivo no válido");
        }
        return {
          allowedContentTypes: [...ARTWORK_TYPES],
          maximumSizeInBytes: MAX_ARTWORK_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
      /* Vercel avisa al terminar. Si los bytes no son PDF, PNG o JPG de verdad, se borra. */
      onUploadCompleted: async ({ blob }) => {
        const head = await fetch(blob.url, { headers: { Range: "bytes=0-7" } });
        const bytes = new Uint8Array(await head.arrayBuffer());
        if (!looksLikeArtwork(bytes)) await del(blob.url);
      },
    });
    return Response.json(result);
  } catch {
    return Response.json({ error: "No pudimos preparar la subida. Inténtalo de nuevo." }, { status: 400 });
  }
}

function looksLikeArtwork(bytes: Uint8Array): boolean {
  const pdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return pdf || png || jpg;
}
