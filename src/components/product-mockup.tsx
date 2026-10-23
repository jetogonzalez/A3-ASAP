/* eslint-disable @next/next/no-img-element -- el diseño es un archivo local (blob:) que next/image no optimiza */
import { ProductPhoto } from "@/components/product-photo";
import { MOCKUP_ZONES } from "@/lib/mockup-zones";

/*
 * Mockup: la foto de referencia con el diseño que subió el cliente puesto en
 * la zona que se imprime (lib/mockup-zones.ts). El diseño cubre la marca de
 * ejemplo de la foto y lleva una sombra interior suave para que se lea impreso,
 * no pegado encima.
 */
export function ProductMockup({
  slug,
  designUrl,
  alt,
  sizes,
}: {
  slug: string;
  designUrl: string;
  alt: string;
  sizes: string;
}) {
  const zone = MOCKUP_ZONES[slug];
  return (
    <span className="relative block h-full w-full">
      <ProductPhoto slug={slug} alt={alt} sizes={sizes} />
      {zone ? (
        <span
          className={`absolute overflow-hidden bg-white shadow-[inset_0_0_6px_rgba(0,0,0,0.18)] ${zone.round ? "rounded-full" : "rounded-[3px]"}`}
          style={{
            left: `${zone.left}%`,
            top: `${zone.top}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
            transform: zone.rotate ? `rotate(${zone.rotate}deg)` : undefined,
          }}
        >
          <img src={designUrl} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.22),transparent_45%,rgba(0,0,0,0.08))]" />
        </span>
      ) : null}
    </span>
  );
}
