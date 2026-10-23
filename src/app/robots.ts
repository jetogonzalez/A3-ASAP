import type { MetadataRoute } from "next";
import { absoluteUrl, isProductionSite } from "@/lib/site";

/*
 * Buscadores y asistentes de IA son bienvenidos: queremos aparecer en Google,
 * Bing y también cuando alguien le pregunta a ChatGPT, Gemini, Claude o
 * Perplexity dónde imprimir en Quito. Se nombran los bots de IA a propósito
 * para que quede claro que pueden leer el sitio. Lo privado del cliente
 * (carrito, checkout, pedido, proforma compartida) y la API no se rastrean.
 * Las vistas previas de Vercel no se indexan.
 */

const PRIVATE = ["/api/", "/carrito", "/checkout", "/pedido", "/proforma"];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Google-Extended",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  if (!isProductionSite()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: ["/", "/llms.txt"], disallow: PRIVATE },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
