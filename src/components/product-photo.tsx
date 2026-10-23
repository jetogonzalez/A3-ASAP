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
