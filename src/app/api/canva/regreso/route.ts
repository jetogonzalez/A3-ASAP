import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import {
  canvaCredentials,
  cookieOptions,
  exportDesign,
  freshSession,
  RETURN_COOKIE,
  seal,
  SESSION_COOKIE,
  unseal,
  verifyReturn,
  type CanvaJob,
  type CanvaSession,
} from "@/server/canva";
import { withCanvaStatus, withCanvaDesign } from "@/server/canva-redirect";

/* Exportar desde Canva toma unos segundos por formato. */
export const maxDuration = 60;

/*
 * Paso 3: la persona toca «Volver» en Canva. Se baja el diseño en PDF (para
 * imprimir) y en PNG (para la muestra), se guarda en Vercel Blob y se vuelve
 * al configurador con el arte ya puesto.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const credentials = canvaCredentials();
  const job = credentials
    ? unseal<CanvaJob>(request.cookies.get(RETURN_COOKIE)?.value, credentials.clientSecret)
    : null;
  const back = job?.back ?? "/producto/tarjetas-de-presentacion";
  const fail = (status: string) => NextResponse.redirect(new URL(withCanvaStatus(back, status), origin));

  const token = request.nextUrl.searchParams.get("correlation_jwt");
  const saved = credentials
    ? unseal<CanvaSession>(request.cookies.get(SESSION_COOKIE)?.value, credentials.clientSecret)
    : null;
  if (!credentials || !job || !token || !saved) return fail("error");

  try {
    const { designId, correlation } = await verifyReturn(credentials, token);
    if (correlation !== job.correlation) return fail("error");
    const session = await freshSession(credentials, saved);

    const [pdfUrls, pngUrls] = await Promise.all([
      exportDesign(session.accessToken, designId, { type: "pdf", export_quality: "regular" }),
      exportDesign(session.accessToken, designId, { type: "png", export_quality: "regular" }),
    ]);

    const store = async (url: string, name: string, contentType: string) => {
      const file = await fetch(url, { cache: "no-store" });
      if (!file.ok) throw new Error("canva_download_failed");
      const blob = await put(`artes/${name}`, await file.arrayBuffer(), {
        access: "public",
        addRandomSuffix: true,
        contentType,
      });
      return blob.url;
    };

    const [pdf, front, back2] = await Promise.all([
      store(pdfUrls[0], "diseno-canva.pdf", "application/pdf"),
      store(pngUrls[0], "diseno-canva-frente.png", "image/png"),
      pngUrls[1] ? store(pngUrls[1], "diseno-canva-reverso.png", "image/png") : Promise.resolve(null),
    ]);

    const response = NextResponse.redirect(
      new URL(withCanvaDesign(back, { pdf, front, back: back2 }), origin),
    );
    response.cookies.set(SESSION_COOKIE, seal(session, credentials.clientSecret), cookieOptions(60 * 60 * 24 * 30));
    response.cookies.delete(RETURN_COOKIE);
    return response;
  } catch (error) {
    console.error("canva_return_failed", error instanceof Error ? error.message : "unknown");
    return fail("exportar");
  }
}
