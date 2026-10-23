import { BrandLogo } from "@/components/brand-logo";
import { GRAIN } from "@/components/finish-swatch";
import { SIZES, type Configuration } from "@/lib/catalog";

export function CardPreview({
  config,
  face = "front",
  compact = false,
  pair = false,
  fill = false,
  artworkUrl = null,
  company = "Estudio Norte",
  name = "Tu nombre",
  role = "Cargo",
}: {
  config: Configuration;
  face?: "front" | "back";
  compact?: boolean;
  /** Las dos caras juntas: cabe menos, así que el contenido va en tamaño chico. */
  pair?: boolean;
  /** Solo la cara, ocupando todo el padre: para montarla sobre una tarjeta 3D. */
  fill?: boolean;
  artworkUrl?: string | null;
  company?: string;
  name?: string;
  role?: string;
}) {
  const size = SIZES[config.sizeId];
  const square = config.sizeId === "55x55";
  const small = compact || pair || fill;
  /*
   * El laminado manda sobre el papel: uno mate apaga el brillo del couche
   * brillante. Antes se pintaban los dos y la muestra quedaba rarísima.
   */
  const glossy =
    config.laminate === "brillante" || (config.laminate === "none" && config.paper === "brillante");

  return (
    <div
      className={`relative inline-flex max-w-full ${
        fill
          ? "h-full w-full"
          : compact
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
        className={`relative w-full overflow-hidden ${
          fill
            ? "@container h-full"
            : `light-card border border-ink/10 shadow-[0_28px_50px_-36px_rgba(28,23,18,0.7)] transition-[border-radius] duration-200 ${
                square ? "aspect-square" : "aspect-[85/55]"
              } ${config.rounded ? "rounded-[22px]" : "rounded-[3px]"}`
        } ${
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
          /*
           * Montada en una escena o una miniatura, la cara se mide en unidades del
           * contenedor (cqw): el texto se achica con la tarjeta y no la desborda.
           */
          <div className={`flex h-full flex-col justify-between ${fill ? "p-[7cqw]" : small ? "p-3.5" : square ? "p-5" : "p-6 sm:p-7"}`}>
            <div>
              <p className={`font-display leading-none tracking-tight break-words ${fill ? "text-[7.5cqw]" : small ? "text-base" : "text-2xl sm:text-3xl"}`}>{company}</p>
              <p className={`uppercase tracking-[0.16em] text-ink-soft ${fill ? "mt-[1.5cqw] text-[2.6cqw]" : small ? "mt-1 text-[9px]" : "mt-2 text-[11px]"}`}>Quito</p>
            </div>
            <div className={fill ? "text-[3.4cqw] leading-[1.35]" : small ? "text-[11px] leading-4" : "text-sm leading-5"}>
              <p className="font-medium break-words">{name}</p>
              <p className="text-ink-soft break-words">{role}</p>
            </div>
          </div>
        ) : (
          <div className={`flex h-full flex-col items-center justify-center text-center ${fill ? "gap-[2cqw] p-[7cqw]" : small ? "gap-2 p-3.5" : "gap-2 p-6"}`}>
            <BrandLogo className={`w-auto text-ink ${fill ? "h-[10cqw]" : small ? "h-6" : "h-10"}`} />
            <p className={`uppercase tracking-[0.18em] text-ink-soft ${fill ? "text-[2.6cqw]" : small ? "text-[9px]" : "text-xs"}`}>Couche 300 g</p>
          </div>
        )}
        {config.paper === "mate" && config.laminate === "none" ? (
          /* El couche mate tiene grano: se nota de cerca y es lo que lo separa del brillante. */
          <span className="pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply" style={{ backgroundImage: GRAIN }} aria-hidden="true" />
        ) : null}
        {glossy ? (
          /*
           * Un reflejo, no una franja pintada: en screen levanta la luz sin blanquear
           * el arte. Dentro de LightStage el punto de luz sigue al cursor.
           */
          <>
            <span
              className="pointer-events-none absolute inset-0 mix-blend-screen bg-[linear-gradient(112deg,transparent_40%,rgba(255,255,255,0.26)_48%,rgba(255,255,255,0.08)_53%,transparent_62%)]"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute inset-0 mix-blend-screen"
              style={{ background: "radial-gradient(circle at var(--lx, 30%) var(--ly, 22%), rgba(255,255,255,0.55), rgba(255,255,255,0.12) 18%, transparent 38%)" }}
              aria-hidden="true"
            />
          </>
        ) : null}
        {config.laminate === "mate" ? (
          <>
            <span className="pointer-events-none absolute inset-0 bg-[rgba(88,72,48,0.05)]" aria-hidden="true" />
            {/* El laminado mate brilla poco y sin borde: un resplandor ancho, como terciopelo. */}
            <span
              className="pointer-events-none absolute inset-0 mix-blend-screen"
              style={{ background: "radial-gradient(60% 70% at var(--lx, 30%) var(--ly, 22%), rgba(255,255,255,0.22), transparent 70%)" }}
              aria-hidden="true"
            />
          </>
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
            <span
              className="absolute inset-0 mix-blend-screen"
              style={{ background: "radial-gradient(circle at var(--lx, 30%) var(--ly, 22%), rgba(255,255,255,0.7), transparent 60%)" }}
            />
          </span>
        ) : null}
      </article>
    </div>
  );
}
