import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isSizeId } from "@/lib/catalog";
import {
  authorizeUrl,
  canvaCredentials,
  canvaEnabled,
  createDesign,
  freshSession,
  newPkce,
  OAUTH_COOKIE,
  RETURN_COOKIE,
  safeBackPath,
  SESSION_COOKIE,
  readSealed,
  writeSealed,
  clearSealed,
  type CanvaJob,
  type CanvaSession,
} from "@/server/canva";
import { withCanvaStatus } from "@/server/canva-redirect";

/*
 * Paso 1: el botón «Diseñar en Canva» llega aquí. Si la persona ya entró a
 * Canva desde ASAP, se abre directo un lienzo nuevo; si no, primero inicia
 * sesión en Canva y vuelve por /api/canva/callback.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const back = safeBackPath(params.get("volver"));
  const credentials = canvaCredentials();
  if (!credentials || !canvaEnabled()) {
    return NextResponse.redirect(new URL(withCanvaStatus(back, "apagado"), request.nextUrl.origin));
  }

  const size = params.get("tamano") ?? "";
  const job: CanvaJob = {
    sizeId: isSizeId(size) ? size : "85x55",
    sides: params.get("lados") === "2" ? 2 : 1,
    back,
    correlation: randomBytes(12).toString("base64url"),
  };

  const saved = readSealed<CanvaSession>(request.cookies, SESSION_COOKIE, credentials.clientSecret);
  if (saved) {
    try {
      const session = await freshSession(credentials, saved);
      const editUrl = await createDesign(session.accessToken, job);
      const response = NextResponse.redirect(editUrl);
      writeSealed(response.cookies, SESSION_COOKIE, session, credentials.clientSecret, 60 * 60 * 24 * 30);
      writeSealed(response.cookies, RETURN_COOKIE, job, credentials.clientSecret, 60 * 60 * 24);
      return response;
    } catch {
      /* La sesión venció o se revocó: se vuelve a entrar a Canva. */
    }
  }

  const pkce = newPkce();
  const redirectUri = `${request.nextUrl.origin}/api/canva/callback`;
  const response = NextResponse.redirect(authorizeUrl(credentials, pkce.challenge, pkce.state, redirectUri));
  writeSealed(response.cookies, OAUTH_COOKIE, { ...job, verifier: pkce.verifier, state: pkce.state }, credentials.clientSecret, 60 * 15);
  clearSealed(response.cookies, SESSION_COOKIE);
  return response;
}
