import { NextResponse, type NextRequest } from "next/server";

export const CANVA_BETA_COOKIE = "asap_canva_beta";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  /*
   * Mientras Canva no apruebe la app, solo la cuenta que la creó puede usarla.
   * El botón queda oculto para los clientes; quien prueba entra una vez con
   * ?canva_beta=1 (o lo apaga con ?canva_beta=0) y queda recordado 90 días.
   */
  const beta = url.searchParams.get("canva_beta");
  if (beta !== null) {
    url.searchParams.delete("canva_beta");
    const response = NextResponse.redirect(url);
    if (beta === "1") {
      response.cookies.set(CANVA_BETA_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 90, sameSite: "lax" });
    } else {
      response.cookies.delete(CANVA_BETA_COOKIE);
    }
    return response;
  }

  /*
   * Canva devuelve a la persona a la «Return URL» de la app con ?correlation_jwt.
   * Si esa dirección quedó mal escrita en Canva (por ejemplo, solo el dominio),
   * la persona caía en el inicio y el diseño se perdía. Aquí se reenvía siempre
   * a /api/canva/regreso, que es la que sabe traer el diseño.
   */
  url.pathname = "/api/canva/regreso";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    {
      source: "/((?!api/canva/regreso|_next/|favicon.ico).*)",
      has: [{ type: "query", key: "correlation_jwt" }],
    },
    {
      source: "/((?!api/|_next/|favicon.ico).*)",
      has: [{ type: "query", key: "canva_beta" }],
    },
  ],
};
