"use client";

import { BrandLogo } from "@/components/brand-logo";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { Configuration } from "@/lib/catalog";
import { DELIVERY_OPTIONS } from "@/lib/delivery";
import { formatUsd } from "@/lib/money";
import { IVA_LABEL } from "@/lib/tax";
import { orderTotals } from "@/lib/order";
import { describeConfiguration, quote } from "@/lib/pricing";
import { encodeQuote, quoteNumber, quoteValidUntil, QUOTE_VALID_DAYS, type QuotePayload } from "@/lib/quote";
import { cleanText } from "@/lib/text";
import { customQuoteMessage, quoteRequestMessage, whatsappHref } from "@/lib/whatsapp";
import { formatWeight } from "@/lib/weight";

/* Una proforma es un documento: la fecha lleva el año. */
const formatLongDate = (iso: string, timeZone = "UTC") =>
  new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "long", year: "numeric", timeZone }).format(new Date(iso));

const actionClass =
  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-sheet px-5 text-sm font-semibold text-ink transition-colors hover:border-ink/30";

/**
 * Una proforma se arma desde el carrito o llega armada en un enlace que
 * alguien compartió. En los dos casos los precios salen de la tabla actual.
 */
export function QuoteBuilder({ shared }: { shared: QuotePayload | null }) {
  const cart = useCart();
  const router = useRouter();
  /* La hora de abrir la página: fecha de emisión al cotizar desde el carrito y vara para saber si una compartida venció. */
  const [issued] = useState(() => new Date().toISOString());
  const [clientName, setClientName] = useState(shared?.client.name ?? "");
  const [clientDocument, setClientDocument] = useState(shared?.client.document ?? "");
  const [notice, setNotice] = useState<string | null>(null);

  const items: Configuration[] = useMemo(
    () => shared?.items ?? cart.items.map((item) => item.configuration),
    [shared, cart.items],
  );
  const payload: QuotePayload = useMemo(
    () => ({
      v: 1,
      issued: shared?.issued ?? issued,
      client: { name: cleanText(clientName, 120), document: cleanText(clientDocument, 20) },
      items,
    }),
    [shared, issued, clientName, clientDocument, items],
  );
  const totals = useMemo(() => orderTotals(items, payload.issued), [items, payload.issued]);

  if (!shared && !cart.ready) return <p className="text-ink-soft">Cargando…</p>;
  if (items.length === 0) return <EmptyQuote />;

  const number = quoteNumber(payload);
  const validUntil = quoteValidUntil(payload.issued);
  const expired = new Date(validUntil).getTime() < new Date(issued).getTime();
  const link = () => `${window.location.origin}/proforma?c=${encodeQuote(payload)}`;
  const summary = items.map(
    (config) => `${describeConfiguration(config)} — ${formatUsd(quote(config).printingCents)}`,
  );

  async function share() {
    const url = link();
    const text = `Proforma ${number} de ASAP por ${formatUsd(totals.totalCents)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Proforma ${number}`, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNotice("Enlace copiado. Pégalo donde quieras compartirlo.");
    } catch {
      /* Si la persona cierra el menú de compartir no pasa nada. */
    }
  }

  function askStore() {
    const message = quoteRequestMessage({
      number,
      clientName: payload.client.name,
      clientDocument: payload.client.document,
      items: summary,
      total: formatUsd(totals.totalCents),
      link: link(),
    });
    window.open(whatsappHref(message), "_blank", "noopener,noreferrer");
  }

  function mailHref() {
    const body = [`Te comparto la proforma ${number} de ASAP.`, "", ...summary, "", `Total: ${formatUsd(totals.totalCents)}`, "", link()].join("\n");
    return `mailto:?subject=${encodeURIComponent(`Proforma ${number} · ASAP`)}&body=${encodeURIComponent(body)}`;
  }

  function order() {
    if (shared) cart.replaceItems(shared.items);
    router.push("/checkout");
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <article
        aria-label={`Proforma ${number}`}
        className="rounded-[20px] border border-line bg-sheet p-6 sm:p-10 print:rounded-none print:border-0 print:p-0"
      >
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-6">
          <div>
            <BrandLogo className="h-12 w-auto text-ink [print-color-adjust:exact]" />
            <p className="mt-2 text-sm text-ink-soft">Productos personalizados · Quito, Ecuador · estoesasap.com</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink-soft">Proforma</p>
            <p className="text-lg font-semibold tabular-nums">{number}</p>
          </div>
        </header>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-ink-soft">Cliente</dt>
            <dd className="mt-0.5 font-medium">{payload.client.name || "Sin nombre"}</dd>
            {payload.client.document ? <dd className="text-ink-soft">{payload.client.document}</dd> : null}
          </div>
          <div>
            <dt className="text-ink-soft">Emitida</dt>
            <dd className="mt-0.5 font-medium">{formatLongDate(payload.issued, "America/Guayaquil")}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Válida hasta</dt>
            <dd className={`mt-0.5 font-medium ${expired ? "text-alert-deep" : ""}`}>
              {formatLongDate(validUntil)}
              {expired ? " (vencida)" : ""}
            </dd>
          </div>
        </dl>

        <table className="mt-8 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-soft">
              <th scope="col" className="py-2 pr-4 font-medium">Detalle</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Cantidad</th>
              <th scope="col" className="py-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {items.map((config, index) => {
              const priced = quote(config);
              return (
                <tr key={index} className="border-b border-line/70 align-top">
                  <td className="py-3 pr-4">
                    <p className="font-medium">Tarjetas de presentación</p>
                    <p className="text-ink-soft">{describeConfiguration(config)}</p>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">{config.quantity.toLocaleString("es-EC")}</td>
                  <td className="py-3 text-right tabular-nums">{formatUsd(priced.printingCents)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <dl className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
          <Row label="Impresión" value={formatUsd(totals.printingCents)} />
          <Row
            label={`Entrega ${totals.delivery.name}`}
            value={totals.delivery.cents === 0 ? "Incluida" : formatUsd(totals.delivery.cents)}
          />
          <Row label={`Envío Quito y valles · ${formatWeight(totals.shipping.grams)}`} value={formatUsd(totals.shipping.cents)} />
          <div className="space-y-2 border-t border-line pt-2">
            <Row label="Subtotal sin IVA" value={formatUsd(totals.iva.baseCents)} />
            <Row label={IVA_LABEL} value={formatUsd(totals.iva.ivaCents)} />
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink pt-3">
            <dt className="font-semibold">Total con IVA</dt>
            <dd className="text-2xl font-semibold tabular-nums">{formatUsd(totals.totalCents)}</dd>
          </div>
        </dl>

        {/* Lo que toda proforma tiene que decir: cómo se paga, cuándo llega y que no es factura. */}
        <dl className="mt-10 grid gap-x-8 gap-y-3 border-t border-line pt-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-soft">Forma de pago</dt>
            <dd className="mt-0.5">Transferencia bancaria o Deuna, 100 % al confirmar el pedido.</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Tiempo de entrega</dt>
            <dd className="mt-0.5">
              {speedDays(totals.delivery.id)} días hábiles desde el pago y el arte aprobado, en Quito y los valles.
            </dd>
          </div>
          <div>
            <dt className="text-ink-soft">Validez</dt>
            <dd className="mt-0.5">{QUOTE_VALID_DAYS} días hábiles. Precios en USD con IVA, de la tabla PVP de ASAP.</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Factura</dt>
            <dd className="mt-0.5">Se emite a nombre del cliente al confirmar el pago.</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs leading-5 text-ink-soft">Este documento es una proforma y no es válido como factura.</p>
      </article>

      <aside className="space-y-5 lg:sticky lg:top-24 print:hidden">
        <section className="rounded-[20px] border border-line bg-sheet p-5">
          <h2 className="text-lg font-semibold">A nombre de</h2>
          <div className="mt-3 space-y-3">
            <label className="block text-sm font-medium" htmlFor="quote-name">
              Nombre o empresa
              <input
                id="quote-name"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                maxLength={120}
                autoComplete="organization"
                placeholder="Estudio Norte Cía. Ltda.…"
                className="field mt-1.5"
              />
            </label>
            <label className="block text-sm font-medium" htmlFor="quote-document">
              RUC o cédula <span className="font-normal text-ink-soft">(opcional)</span>
              <input
                id="quote-document"
                value={clientDocument}
                onChange={(event) => setClientDocument(event.target.value)}
                maxLength={20}
                inputMode="numeric"
                placeholder="1790012345001…"
                className="field mt-1.5"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[20px] border border-line bg-sheet p-5">
          <h2 className="text-lg font-semibold">Llévatela</h2>
          <div className="mt-3 grid gap-2">
            <button type="button" onClick={() => window.print()} className={actionClass}>
              Guardar en PDF
            </button>
            <button type="button" onClick={share} className={actionClass}>
              Compartir enlace
            </button>
            <a href={mailHref()} className={actionClass}>
              Enviar por correo
            </a>
          </div>
          {notice ? (
            <p role="status" className="mt-3 text-sm text-moss">
              {notice}
            </p>
          ) : null}
        </section>

        <section className="rounded-[20px] border border-moss/30 bg-moss-soft p-5">
          <h2 className="text-lg font-semibold">¿Te la enviamos nosotros?</h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            Te escribimos por WhatsApp con la proforma formal a nombre de tu empresa.
          </p>
          <button
            type="button"
            onClick={askStore}
            className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-press px-5 text-sm font-semibold text-white hover:bg-press-deep gap-2"
          >
            <WhatsappLogo />
            Pedir proforma por WhatsApp
          </button>
        </section>

        <button
          type="button"
          onClick={order}
          className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-on-ink hover:bg-ink/85"
        >
          {shared ? "Hacer este pedido" : "Hacer el pedido"}
        </button>
      </aside>
    </div>
  );
}

function EmptyQuote() {
  return (
    <div className="rounded-[20px] border border-line bg-sheet px-6 py-10">
      <h2 className="text-2xl font-semibold tracking-tight">Arma lo que quieres cotizar</h2>
      <p className="mt-2 max-w-lg leading-7 text-ink-soft">
        Agrega tarjetas al carrito y aquí sale la proforma con número, fecha y validez. Si buscas otro producto, pídela por WhatsApp.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/producto/tarjetas-de-presentacion"
          className="inline-flex min-h-12 items-center rounded-full bg-press px-5 font-semibold text-white hover:bg-press-deep"
        >
          Armar tarjetas
        </Link>
        <a
          href={whatsappHref(customQuoteMessage("un producto personalizado"))}
          target="_blank"
          rel="noopener noreferrer"
          className={actionClass}
        >
          <WhatsappLogo brand />
          Cotizar otro producto por WhatsApp
        </a>
      </div>
    </div>
  );
}

function speedDays(id: string): string {
  const option = DELIVERY_OPTIONS.find((candidate) => candidate.id === id) ?? DELIVERY_OPTIONS[0];
  return `${option.earliestDays} a ${option.latestDays}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
