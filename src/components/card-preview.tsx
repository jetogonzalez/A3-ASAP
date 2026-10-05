import { SIZES, type Configuration } from "@/lib/catalog";

export function CardPreview({
  config,
  face = "front",
  compact = false,
  pair = false,
  artworkUrl = null,
}: {
  config: Configuration;
  face?: "front" | "back";
  compact?: boolean;
  /** Las dos caras juntas: cabe menos, así que el contenido va en tamaño chico. */
  pair?: boolean;
  artworkUrl?: string | null;
}) {
  const size = SIZES[config.sizeId];
  const square = config.sizeId === "55x55";
  const small = compact || pair;
  /*
   * El laminado manda sobre el papel: uno mate apaga el brillo del couche
   * brillante. Antes se pintaban los dos y la muestra quedaba rarísima.
   */
  const glossy =
    config.laminate === "brillante" || (config.laminate === "none" && config.paper === "brillante");

  return (
    <div
      className={`relative inline-flex max-w-full ${
        compact
          ? "w-[168px]"
          : pair
            ? square
              ? "w-[min(100%,200px)]"
              : "w-[min(100%,250px)]"
            : square
              ? "w-[min(100%,280px)]"
              : "w-[min(100%,440px)]"
      }`}
    >
      {small ? null : (
        <>
          <span className="pointer-events-none absolute -left-3 -top-3 h-4 w-4 border-l border-t border-ink/40" />
          <span className="pointer-events-none absolute -right-3 -top-3 h-4 w-4 border-r border-t border-ink/40" />
          <span className="pointer-events-none absolute -bottom-3 -left-3 h-4 w-4 border-b border-l border-ink/40" />
          <span className="pointer-events-none absolute -bottom-3 -right-3 h-4 w-4 border-r border-b border-ink/40" />
        </>
      )}
      <article
        className={`relative w-full overflow-hidden border border-ink/10 bg-sheet shadow-[0_28px_50px_-36px_rgba(28,23,18,0.7)] transition-[border-radius] duration-200 ${
          square ? "aspect-square" : "aspect-[85/55]"
        } ${config.rounded ? "rounded-[22px]" : "rounded-[3px]"} ${
          config.paper === "mate" && config.laminate !== "brillante" ? "bg-[#f7f3ec]" : "bg-white"
        }`}
        aria-label={
          artworkUrl && face === "front"
            ? `Tu diseño en la muestra de ${size.sizeLabel}`
            : `Muestra de tarjeta ${size.sizeLabel}, ${face === "front" ? "frente" : "reverso"}`
        }
      >
        {artworkUrl ? (
          <>
            <img key={`${face}-${artworkUrl}`} src={artworkUrl} alt="" className="artwork-in absolute inset-0 h-full w-full object-cover" />
            <span className="artwork-sheen pointer-events-none absolute inset-y-0 left-0 w-1/2" aria-hidden="true" />
          </>
        ) : face === "front" ? (
          <div className={`flex h-full flex-col justify-between ${small ? "p-3.5" : square ? "p-5" : "p-6 sm:p-7"}`}>
            <div>
              <p className={`font-display leading-none tracking-tight ${small ? "text-base" : "text-2xl sm:text-3xl"}`}>Estudio Norte</p>
              <p className={`uppercase tracking-[0.16em] text-ink-soft ${small ? "mt-1 text-[9px]" : "mt-2 text-[11px]"}`}>Quito</p>
            </div>
            <div className={small ? "text-[11px] leading-4" : "text-sm leading-5"}>
              <p className="font-medium">Tu nombre</p>
              <p className="text-ink-soft">Cargo</p>
            </div>
          </div>
        ) : (
          <div className={`flex h-full flex-col items-center justify-center gap-2 text-center ${small ? "p-3.5" : "p-6"}`}>
            <p className={`font-display italic ${small ? "text-lg" : "text-3xl"}`}>ASAP</p>
            <p className={`uppercase tracking-[0.18em] text-ink-soft ${small ? "text-[9px]" : "text-xs"}`}>Couche 300 g</p>
          </div>
        )}
        {glossy ? (
          /* Un reflejo, no una franja pintada: en screen levanta la luz sin blanquear el arte. */
          <span
            className="pointer-events-none absolute inset-0 mix-blend-screen bg-[linear-gradient(112deg,transparent_40%,rgba(255,255,255,0.26)_48%,rgba(255,255,255,0.08)_53%,transparent_62%)]"
            aria-hidden="true"
          />
        ) : null}
        {config.laminate === "mate" ? (
          <span className="pointer-events-none absolute inset-0 bg-[rgba(88,72,48,0.05)]" aria-hidden="true" />
        ) : null}
        {config.uv ? (
          /*
           * El barniz no es una pastilla blanca pegada: se nota por el reflejo.
           * Van dos capas porque el truco cambia según el fondo: sobre papel claro
           * se ve el tinte gris; sobre un arte oscuro, el brillo en screen.
           */
          <span
            className="pointer-events-none absolute bottom-[13%] right-[11%] h-[21%] w-[29%] overflow-hidden rounded-[2px] ring-1 ring-ink/10"
            aria-hidden="true"
          >
            <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(90,95,110,0.12),rgba(90,95,110,0.02)_46%,rgba(90,95,110,0.11))]" />
            <span className="absolute inset-0 mix-blend-screen bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.36)_46%,rgba(255,255,255,0.07))]" />
          </span>
        ) : null}
      </article>
    </div>
  );
}
