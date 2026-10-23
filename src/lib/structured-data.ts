import { PRODUCT, QUANTITIES, defaultConfiguration } from "@/lib/catalog";
import { COMPANY } from "@/lib/company";
import type { Faq } from "@/lib/faq";
import type { LaunchProduct } from "@/lib/launch-products";
import { quote } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/site";

/*
 * Datos estructurados (schema.org en JSON-LD). Le dicen a Google y a los
 * asistentes de IA qué es ASAP, dónde atiende y qué vende, sin que tengan que
 * adivinarlo del diseño. Solo datos reales: nada de precios inventados ni
 * reseñas. Los productos de lanzamiento no llevan oferta porque aún no tienen
 * precio público.
 */

type Json = Record<string, unknown>;

const ORG_ID = absoluteUrl("/#organizacion");

const areaServed = [
  { "@type": "City", name: "Quito" },
  { "@type": "Place", name: "Cumbayá" },
  { "@type": "Place", name: "Tumbaco" },
  { "@type": "Place", name: "Los Chillos" },
];

export function siteGraph(): Json {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "LocalBusiness"],
        "@id": ORG_ID,
        name: COMPANY.name,
        alternateName: ["ASAP", "Esto es ASAP"],
        ...(COMPANY.legalName ? { legalName: COMPANY.legalName } : {}),
        ...(COMPANY.ruc ? { taxID: COMPANY.ruc } : {}),
        ...(COMPANY.email ? { email: COMPANY.email } : {}),
        url: absoluteUrl("/"),
        logo: absoluteUrl("/icon.svg"),
        image: absoluteUrl("/opengraph-image"),
        description:
          "Tienda en línea de productos personalizados en Quito, Ecuador: tarjetas de presentación, promocionales, textil, empaque y papelería con tu marca.",
        telephone: "+593962956566",
        priceRange: "$",
        currenciesAccepted: "USD",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Quito",
          addressRegion: "Pichincha",
          addressCountry: "EC",
          ...(COMPANY.address ? { streetAddress: COMPANY.address } : {}),
        },
        areaServed,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: "+593962956566",
          availableLanguage: "es",
          areaServed: "EC",
        },
        knowsAbout: [
          "Tarjetas de presentación",
          "Impresión digital",
          "Productos promocionales",
          "Estampado DTF",
          "Sublimación",
          "Impresión UV DTF",
          "Etiquetas adhesivas",
          "Empaque personalizado",
        ],
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#sitio"),
        url: absoluteUrl("/"),
        name: COMPANY.name,
        inLanguage: "es-EC",
        publisher: { "@id": ORG_ID },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/productos")}?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

function breadcrumb(items: Array<[string, string]>): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

export function cardsProductGraph(): Json {
  const path = `/producto/${PRODUCT.slug}`;
  const prices = QUANTITIES.map((quantity) => quote({ ...defaultConfiguration("85x55"), quantity }).printingCents);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: PRODUCT.name,
        description: PRODUCT.summary,
        sku: "TPR",
        category: "Tarjetas de presentación",
        material: PRODUCT.material,
        image: absoluteUrl(`${path}/opengraph-image`),
        url: absoluteUrl(path),
        brand: { "@id": ORG_ID },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: (Math.min(...prices) / 100).toFixed(2),
          highPrice: (Math.max(...prices) / 100).toFixed(2),
          offerCount: prices.length,
          availability: "https://schema.org/InStock",
          seller: { "@id": ORG_ID },
          areaServed,
        },
      },
      breadcrumb([
        ["Productos", "/productos"],
        [PRODUCT.name, path],
      ]),
    ],
  };
}

export function launchProductGraph(product: LaunchProduct, familyLabel?: string): Json {
  const path = `/producto/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.summary,
        sku: product.id,
        ...(familyLabel ? { category: familyLabel } : {}),
        image: absoluteUrl(`${path}/opengraph-image`),
        url: absoluteUrl(path),
        brand: { "@id": ORG_ID },
        additionalProperty: product.options.map((option) => ({
          "@type": "PropertyValue",
          name: option.label,
          value: option.choices.join(", "),
        })),
      },
      breadcrumb([
        ["Productos", "/productos"],
        ...(familyLabel ? ([[familyLabel, `/productos/${product.family}`]] as Array<[string, string]>) : []),
        [product.name, path],
      ]),
    ],
  };
}

export function faqGraph(faqs: Faq[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/** Serializa sin dejar cerrar la etiqueta <script> desde los datos. */
export function jsonLd(data: Json): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
