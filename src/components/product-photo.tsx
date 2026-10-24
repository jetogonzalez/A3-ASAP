import Image, { type StaticImageData } from "next/image";
import calendarios from "@/assets/productos/calendarios.webp";
import camisetasHoodies from "@/assets/productos/camisetas-hoodies.webp";
import catalogos from "@/assets/productos/catalogos.webp";
import cuadernos from "@/assets/productos/cuadernos.webp";
import esferos from "@/assets/productos/esferos.webp";
import etiquetas from "@/assets/productos/etiquetas.webp";
import gorras from "@/assets/productos/gorras.webp";
import granFormato from "@/assets/productos/gran-formato.webp";
import papelRegalo from "@/assets/productos/papel-regalo.webp";
import pegatinas from "@/assets/productos/pegatinas.webp";
import tarjetasDePresentacion from "@/assets/productos/tarjetas-de-presentacion.webp";
import tarjetasDeRegalo from "@/assets/productos/tarjetas-de-regalo.webp";
import tazasMugs from "@/assets/productos/tazas-mugs.webp";
import tomaTodos from "@/assets/productos/toma-todos.webp";
import toteBags from "@/assets/productos/tote-bags.webp";
import { SEASON_IDS } from "@/lib/seasons";
import navTazasMugs from "@/assets/productos/navidad/tazas-mugs.webp";
import navTarjetasDePresentacion from "@/assets/productos/navidad/tarjetas-de-presentacion.webp";
import navGorras from "@/assets/productos/navidad/gorras.webp";
import navEtiquetas from "@/assets/productos/navidad/etiquetas.webp";
import navCuadernos from "@/assets/productos/navidad/cuadernos.webp";
import quitoTazasMugs from "@/assets/productos/fiestas-quito/tazas-mugs.webp";
import quitoTarjetasDePresentacion from "@/assets/productos/fiestas-quito/tarjetas-de-presentacion.webp";
import quitoGorras from "@/assets/productos/fiestas-quito/gorras.webp";
import quitoEtiquetas from "@/assets/productos/fiestas-quito/etiquetas.webp";
import quitoCuadernos from "@/assets/productos/fiestas-quito/cuadernos.webp";
import reyesTazasMugs from "@/assets/productos/reyes/tazas-mugs.webp";
import reyesTarjetasDePresentacion from "@/assets/productos/reyes/tarjetas-de-presentacion.webp";
import reyesGorras from "@/assets/productos/reyes/gorras.webp";
import reyesEtiquetas from "@/assets/productos/reyes/etiquetas.webp";
import reyesCuadernos from "@/assets/productos/reyes/cuadernos.webp";
import carnavalTazasMugs from "@/assets/productos/carnaval/tazas-mugs.webp";
import carnavalTarjetasDePresentacion from "@/assets/productos/carnaval/tarjetas-de-presentacion.webp";
import carnavalGorras from "@/assets/productos/carnaval/gorras.webp";
import carnavalEtiquetas from "@/assets/productos/carnaval/etiquetas.webp";
import carnavalCuadernos from "@/assets/productos/carnaval/cuadernos.webp";
import valentinTazasMugs from "@/assets/productos/san-valentin/tazas-mugs.webp";
import valentinTarjetasDePresentacion from "@/assets/productos/san-valentin/tarjetas-de-presentacion.webp";
import valentinGorras from "@/assets/productos/san-valentin/gorras.webp";
import valentinEtiquetas from "@/assets/productos/san-valentin/etiquetas.webp";
import valentinCuadernos from "@/assets/productos/san-valentin/cuadernos.webp";

/*
 * Fotos de referencia de cada producto (y de las familias que aún no tienen): mockups de estudio generados con
 * Figma AI, sin marcas ajenas, con la tinta de su familia de fondo. Muestran
 * cómo se ve el producto; el pedido lleva el diseño del cliente.
 * Para cambiar una foto, reemplaza el .webp con el mismo nombre (el slug).
 */
const PHOTOS: Record<string, StaticImageData> = {
  "calendarios": calendarios,
  "camisetas-hoodies": camisetasHoodies,
  "catalogos": catalogos,
  "cuadernos": cuadernos,
  "esferos": esferos,
  "etiquetas": etiquetas,
  "gorras": gorras,
  "gran-formato": granFormato,
  "papel-regalo": papelRegalo,
  "pegatinas": pegatinas,
  "tarjetas-de-presentacion": tarjetasDePresentacion,
  "tarjetas-de-regalo": tarjetasDeRegalo,
  "tazas-mugs": tazasMugs,
  "toma-todos": tomaTodos,
  "tote-bags": toteBags,
};

export function hasProductPhoto(slug: string): boolean {
  return slug in PHOTOS;
}

export function ProductPhoto({
  slug,
  alt,
  sizes,
  className = "",
  preload = false,
}: {
  slug: string;
  alt: string;
  /** Ancho que ocupa en pantalla, para que el navegador baje el tamaño justo. */
  sizes: string;
  className?: string;
  /** Solo para la foto principal visible al cargar. */
  preload?: boolean;
}) {
  const photo = PHOTOS[slug];
  if (!photo) return null;
  return (
    <Image
      src={photo}
      alt={alt}
      sizes={sizes}
      placeholder="blur"
      preload={preload}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

/*
 * Fotos de temporada (Figma AI, archivo «ASAP · Fotos de temporada»): la misma
 * toma de estudio con los detalles de cada temporada. Para sumar
 * una, agrega el .webp en assets/productos/<temporada>/ y su línea aquí.
 */
const SEASON_PHOTOS: Record<string, Record<string, StaticImageData>> = {
  "reyes": {
    "tazas-mugs": reyesTazasMugs,
    "tarjetas-de-presentacion": reyesTarjetasDePresentacion,
    "gorras": reyesGorras,
    "etiquetas": reyesEtiquetas,
    "cuadernos": reyesCuadernos,
  },
  "carnaval": {
    "tazas-mugs": carnavalTazasMugs,
    "tarjetas-de-presentacion": carnavalTarjetasDePresentacion,
    "gorras": carnavalGorras,
    "etiquetas": carnavalEtiquetas,
    "cuadernos": carnavalCuadernos,
  },
  "san-valentin": {
    "tazas-mugs": valentinTazasMugs,
    "tarjetas-de-presentacion": valentinTarjetasDePresentacion,
    "gorras": valentinGorras,
    "etiquetas": valentinEtiquetas,
    "cuadernos": valentinCuadernos,
  },
  "navidad": {
    "tazas-mugs": navTazasMugs,
    "tarjetas-de-presentacion": navTarjetasDePresentacion,
    "gorras": navGorras,
    "etiquetas": navEtiquetas,
    "cuadernos": navCuadernos,
  },
  "fiestas-quito": {
    "tazas-mugs": quitoTazasMugs,
    "tarjetas-de-presentacion": quitoTarjetasDePresentacion,
    "gorras": quitoGorras,
    "etiquetas": quitoEtiquetas,
    "cuadernos": quitoCuadernos,
  },
};

/**
 * La foto normal y, si existen, las de cada temporada. El CSS deja ver solo
 * la de la temporada activa (data-season en <html>); las ocultas no se
 * descargan porque cargan en diferido.
 */
export function SeasonalProductPhoto(props: Parameters<typeof ProductPhoto>[0]) {
  const seasons = Object.entries(SEASON_PHOTOS).filter(([, photos]) => props.slug in photos);
  if (seasons.length === 0) return <ProductPhoto {...props} />;
  /* La foto normal también se ve en las temporadas que aún no tienen foto propia. */
  const withPhoto = new Set(seasons.map(([season]) => season));
  const normalIn = SEASON_IDS.filter((id) => !withPhoto.has(id)).join(" ");
  return (
    <>
      <div data-season-only={normalIn} className="h-full w-full">
        <ProductPhoto {...props} />
      </div>
      {seasons.map(([season, photos]) => (
        <div key={season} data-season-only={season} className="h-full w-full">
          <Image src={photos[props.slug]} alt={props.alt} sizes={props.sizes} placeholder="blur" className={`h-full w-full object-cover ${props.className ?? ""}`} />
        </div>
      ))}
    </>
  );
}
