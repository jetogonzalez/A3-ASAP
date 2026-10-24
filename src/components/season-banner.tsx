import Link from "next/link";
import { SEASONS } from "@/lib/seasons";

/*
 * Franja de temporada bajo el encabezado. Se pintan todas y el CSS muestra
 * solo la de la temporada activa (data-season en <html>), así no parpadea.
 */
export function SeasonBanner() {
  return (
    <>
      {SEASONS.filter((season) => season.banner).map((season) => (
        <aside key={season.id} data-season-only={season.id} aria-label={`Temporada: ${season.name}`} className="season-banner print:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm font-medium md:px-8">
            <span>{season.banner?.text}</span>
            {season.banner ? (
              <Link href={season.banner.link.href} className="rounded-sm font-semibold underline underline-offset-4">
                {season.banner.link.label}
              </Link>
            ) : null}
          </div>
        </aside>
      ))}
    </>
  );
}
