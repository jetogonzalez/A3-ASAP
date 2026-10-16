import { NextResponse, type NextRequest } from "next/server";
import {
  canvaCredentials,
  createDesign,
  exchangeCode,
  OAUTH_COOKIE,
  RETURN_COOKIE,
  SESSION_COOKIE,
  readSealed,
  writeSealed,
  clearSealed,
  type CanvaJob,
  type OAuthPending,
} from "@/server/canva";
import { withCanvaStatus } from "@/server/canva-redirect";

/* Paso 2: Canva devuelve a la persona con permiso. Se crea el lienzo y se abre el editor. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const credentials = canvaCredentials();
  const pending = credentials
    ? readSealed<OAuthPending>(request.cookies, OAUTH_COOKIE, credentials.clientSecret)
    : null;
  const back = pending?.back ?? "/producto/tarjetas-de-presentacion";
  const fail = (status: string) => {
    const response = NextResponse.redirect(new URL(withCanvaStatus(back, status), origin));
    clearSealed(response.cookies, OAUTH_COOKIE);
    return response;
  };

  const params = request.nextUrl.searchParams;
  if (!credentials || !pending) {
    console.error("canva_callback_missing", { credentials: Boolean(credentials), pending: Boolean(pending) });
    return fail("error");
  }
  if (params.get("error")) return fail("cancelado");
  const code = params.get("code");
  if (!code || params.get("state") !== pending.state) return fail("error");

  try {
    const session = await exchangeCode(credentials, code, pending.verifier, `${origin}/api/canva/callback`);
    const job: CanvaJob = {
      sizeId: pending.sizeId,
      sides: pending.sides,
      back: pending.back,
      correlation: pending.correlation,
    };
    const editUrl = await createDesign(session.accessToken, job);
    const response = NextResponse.redirect(editUrl);
    clearSealed(response.cookies, OAUTH_COOKIE);
    writeSealed(response.cookies, SESSION_COOKIE, session, credentials.clientSecret, 60 * 60 * 24 * 30);
    writeSealed(response.cookies, RETURN_COOKIE, job, credentials.clientSecret, 60 * 60 * 24);
    return response;
  } catch (error) {
    console.error("canva_callback_failed", error instanceof Error ? error.message : "unknown");
    return fail("error");
  }
}
