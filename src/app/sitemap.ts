import type { MetadataRoute } from "next";
import { PRODUCT } from "@/lib/catalog";
import { FAMILIES } from "@/lib/families";
import { LAUNCH_PRODUCTS } from "@/lib/launch-products";
import { absoluteUrl } from "@/lib/site";

/* Todas las páginas públicas. Sale del catálogo: un producto nuevo entra solo. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "weekly") => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("/", 1),
    page("/productos", 0.9),
    page(`/producto/${PRODUCT.slug}`, 0.9),
    ...LAUNCH_PRODUCTS.map((product) => page(`/producto/${product.slug}`, 0.8)),
    ...FAMILIES.filter((family) => !family.live).map((family) => page(`/productos/${family.slug}`, 0.7)),
    page("/ayuda", 0.6, "monthly"),
    page("/envio", 0.6, "monthly"),
    page("/terminos", 0.2, "yearly"),
    page("/privacidad", 0.2, "yearly"),
  ];
}
