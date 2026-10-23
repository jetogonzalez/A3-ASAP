import type { Metadata } from "next";

/*
 * Dónde vive el sitio y si los buscadores deben indexarlo. Solo producción se
 * indexa: las vistas previas de Vercel llevan noindex para que Google no las
 * confunda con el sitio de verdad. El dominio canónico es www (el dominio sin
 * www redirige ahí).
 */

export const CANONICAL_ORIGIN = "https://www.estoesasap.com";

export function isProductionSite(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  if (isProductionSite()) return new URL(CANONICAL_ORIGIN);
  const deployment = process.env.VERCEL_URL;
  if (deployment) return new URL(`https://${deployment}`);
  return new URL("http://localhost:3000");
}

/** URL absoluta de una ruta del sitio, para sitemap, JSON-LD y llms.txt. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, siteUrl()).toString();
}

/**
 * Metadatos de una página pública: título, descripción, URL canónica y lo que
 * se ve al compartir el enlace. La imagen la ponen los opengraph-image.tsx.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path, types: { "text/markdown": "/llms.txt" } },
    openGraph: { type: "website", locale: "es_EC", siteName: "Esto es ASAP", title: `${title} · ASAP`, description, url: path },
    twitter: { card: "summary_large_image", title: `${title} · ASAP`, description },
  };
}
