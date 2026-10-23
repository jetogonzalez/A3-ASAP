import type { Metadata } from "next";
import { QuoteBuilder } from "@/components/quote-builder";
import { decodeQuote, quoteNumber } from "@/lib/quote";

type QuotePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/* Una proforma compartida muestra al pegar el enlace su número, cliente y total. */
export async function generateMetadata({ searchParams }: QuotePageProps): Promise<Metadata> {
  const { c } = await searchParams;
  const shared = typeof c === "string" ? decodeQuote(c) : null;
  const title = shared ? `Proforma ${quoteNumber(shared)}` : "Proforma";
  const description = shared
    ? `Proforma de Esto es ASAP${shared.client.name ? ` para ${shared.client.name}` : ""}. Ábrela para verla, guardarla en PDF o convertirla en pedido.`
    : "Proforma de tarjetas de presentación en USD, para guardar en PDF, compartir o pedir por WhatsApp.";
  const image = { url: shared && typeof c === "string" ? `/proforma/og?c=${c}` : "/proforma/og", width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { type: "website", siteName: "Esto es ASAP", locale: "es_EC", title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const { c } = await searchParams;
  const shared = typeof c === "string" ? decodeQuote(c) : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-16 print:p-0">
      <div className="print:hidden">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Proforma</h1>
        <p className="mt-3 max-w-2xl text-balance leading-7 text-ink-soft">
          {shared
            ? "Te compartieron esta proforma. Los precios salen de la tabla de hoy y puedes convertirla en pedido."
            : "Pon el nombre de tu empresa y guárdala en PDF o compártela para que la aprueben. Si prefieres, te la enviamos nosotros."}
        </p>
      </div>
      <div className="mt-8 print:mt-0">
        <QuoteBuilder shared={shared} />
      </div>
    </div>
  );
}
