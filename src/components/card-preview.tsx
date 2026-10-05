import { SIZES, type Configuration } from "@/lib/catalog";

export function CardPreview({
  config,
  face = "front",
  compact = false,
  artworkUrl = null,
}: {
  config: Configuration;
  face?: "front" | "back";
  compact?: boolean;
  artworkUrl?: string | null;
}) {
  const size = SIZES[config.sizeId];
  const square = config.sizeId === "55x55";
  const glossy = config.paper === "brillante" || config.laminate !== "none";

  return (
    <div
      className={`relative inline-flex max-w-full ${
        compact ? "w-[168px]" : square ? "w-[min(100%,280px)]" : "w-[min(100%,440px)]"
      }`}
    >
      {compact ? null : (
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
          <div className={`flex h-full flex-col justify-between ${compact ? "p-3" : square ? "p-5" : "p-6 sm:p-7"}`}>
            <div>
              <p className={`font-display leading-none tracking-tight ${compact ? "text-base" : "text-2xl sm:text-3xl"}`}>Estudio Norte</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-ink-soft">Quito</p>
            </div>
            <div className="text-sm leading-5">
              <p className="font-medium">Tu nombre</p>
              <p className="text-ink-soft">Cargo</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <p className={`font-display italic ${compact ? "text-lg" : "text-3xl"}`}>ASAP</p>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">Couche 300 g</p>
          </div>
        )}
        {glossy ? (
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_32%,rgba(255,255,255,0.42)_48%,transparent_64%)]" />
        ) : null}
        {config.laminate === "mate" ? (
          <span className="pointer-events-none absolute inset-0 bg-[rgba(88,72,48,0.06)]" />
        ) : null}
        {config.uv ? (
          <span
            className="pointer-events-none absolute bottom-4 right-4 h-9 w-14 rounded-sm bg-[linear-gradient(145deg,rgba(255,255,255,0.2),rgba(255,255,255,0.92)_45%,rgba(255,255,255,0.25))] ring-1 ring-ink/15"
            aria-hidden="true"
          />
        ) : null}
      </article>
    </div>
  );
}
