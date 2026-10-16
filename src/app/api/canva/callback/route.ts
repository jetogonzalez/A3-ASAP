import { NextResponse, type NextRequest } from "next/server";
import {
  canvaCredentials,
  cookieOptions,
  createDesign,
  exchangeCode,
  OAUTH_COOKIE,
  RETURN_COOKIE,
  seal,
  SESSION_COOKIE,
  unseal,
  type CanvaJob,
  type OAuthPending,
} from "@/server/canva";
import { withCanvaStatus } from "@/server/canva-redirect";

/* Paso 2: Canva devuelve a la persona con permiso. Se crea el lienzo y se abre el editor. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const credentials = canvaCredentials();
  const pending = credentials
    ? unseal<OAuthPending>(request.cookies.get(OAUTH_COOKIE)?.value, credentials.clientSecret)
    : null;
  const back = pending?.back ?? "/producto/tarjetas-de-presentacion";
  const fail = (status: string) => {
    const response = NextResponse.redirect(new URL(withCanvaStatus(back, status), origin));
    response.cookies.delete(OAUTH_COOKIE);
    return response;
  };

  const params = request.nextUrl.searchParams;
  if (!credentials || !pending) return fail("error");
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
    response.cookies.delete(OAUTH_COOKIE);
    response.cookies.set(SESSION_COOKIE, seal(session, credentials.clientSecret), cookieOptions(60 * 60 * 24 * 30));
    response.cookies.set(RETURN_COOKIE, seal(job, credentials.clientSecret), cookieOptions(60 * 60 * 24));
    return response;
  } catch (error) {
    console.error("canva_callback_failed", error instanceof Error ? error.message : "unknown");
    return fail("error");
  }
}
