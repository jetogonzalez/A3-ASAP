import { NextResponse, type NextRequest } from "next/server";

/*
 * Canva devuelve a la persona a la «Return URL» de la app con ?correlation_jwt.
 * Si esa dirección quedó mal escrita en Canva (por ejemplo, solo el dominio),
 * la persona caía en el inicio y el diseño se perdía. Aquí se reenvía siempre
 * a /api/canva/regreso, que es la que sabe traer el diseño.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/api/canva/regreso";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    {
      source: "/((?!api/canva/regreso|_next/|favicon.ico).*)",
      has: [{ type: "query", key: "correlation_jwt" }],
    },
  ],
};
