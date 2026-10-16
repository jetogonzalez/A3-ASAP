import type { Metadata } from "next";
import { QuoteBuilder } from "@/components/quote-builder";
import { decodeQuote } from "@/lib/quote";

export const metadata: Metadata = {
  title: "Proforma",
  description: "Proforma de tarjetas de presentación en USD, para guardar en PDF, compartir o pedir por WhatsApp.",
  robots: { index: false, follow: false },
};

type QuotePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const { c } = await searchParams;
  const shared = typeof c === "string" ? decodeQuote(c) : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-16 print:p-0">
      <div className="print:hidden">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Proforma</h1>
        <p className="mt-3 max-w-xl leading-7 text-ink-soft">
          {shared
            ? "Te compartieron esta proforma. Los precios salen de la tabla de hoy y puedes convertirla en pedido."
            : "Ponle el nombre de tu empresa, guárdala en PDF o compártela para que la aprueben. También te la podemos enviar."}
        </p>
      </div>
      <div className="mt-8 print:mt-0">
        <QuoteBuilder shared={shared} />
      </div>
    </div>
  );
}
