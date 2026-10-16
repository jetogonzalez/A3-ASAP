"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { readLastOrder } from "@/components/last-order";
import { formatLongDate, formatShortDate } from "@/lib/delivery";
import { formatUsd } from "@/lib/money";
import { IVA_LABEL } from "@/lib/tax";
import { orderMessage, whatsappHref } from "@/lib/whatsapp";
import { formatWeight } from "@/lib/weight";

const noSubscribe = () => () => {};

export function OrderReceipt() {
  /* El recibo sale de este navegador; en el servidor todavía no hay nada que mostrar. */
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  const order = useMemo(() => (ready ? readLastOrder() : null), [ready]);

  if (!ready) return <p className="text-ink-soft">Cargando el pedido…</p>;
  if (!order) {
    return (
      <div>
        <h1 className="font-display text-4xl">No encontramos un pedido reciente</h1>
        <p className="mt-3 leading-7 text-ink-soft">
          El resumen se guarda solo en el navegador donde hiciste el pedido. Si ya lo mandaste por WhatsApp, la tienda lo tiene en el chat.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-press px-5 font-medium text-white hover:bg-press-deep"
        >
          Armar un pedido
        </Link>
      </div>
    );
  }

  const placed = new Intl.DateTimeFormat("es-EC", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Guayaquil",
  }).format(new Date(order.createdAt));
  const chat = whatsappHref(orderMessage(order));
  const missingArtwork = order.items.some((item) => !item.artwork);

  return (
    <>
      <p className="text-sm font-semibold text-moss">Último paso</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Finaliza tu pedido en WhatsApp</h1>
      <p className="mt-3 text-ink-soft">
        Pedido <span className="font-medium text-ink tabular-nums">{order.number}</span> · {placed}
      </p>

      {/* El pedido todavía no está cerrado: se cierra en el chat. Por eso este bloque va primero. */}
      <div className="mt-6 rounded-[24px] border border-press/25 bg-moss-soft p-5">
        <p className="text-sm leading-6 text-ink-soft">
          El mensaje ya va escrito con el pedido, el total y tus datos de factura. Lo envías y ahí te pasamos los datos para pagar con {order.payment.method === "deuna" ? "Deuna" : "transferencia bancaria"}.
          {missingArtwork ? " Adjunta en el mismo chat el archivo de diseño que te falta." : ""}
        </p>
        <a
          href={chat}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-press px-5 text-sm font-semibold text-white hover:bg-press-deep"
        >
          <WhatsappIcon />
          Finalizar pedido en WhatsApp
        </a>
      </div>

      <div className="mt-8 space-y-4">
        {order.items.map((item, index) => (
          <article key={`${item.description}-${index}`} className="rounded-[24px] border border-line bg-sheet p-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-medium leading-6">{item.description}</h2>
              <p className="font-display text-2xl">{formatUsd(item.printingCents)}</p>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-ink-soft">
              {item.lines.map((line) => (
                <li key={line.label} className="flex justify-between gap-4">
                  <span>{line.label}</span>
                  <span>{line.included ? "Incluido" : formatUsd(line.cents)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-soft">
              {item.artwork ? `Archivo recibido: ${item.artwork.filename}` : "Sin archivo: mándalo por WhatsApp."}
            </p>
          </article>
        ))}
      </div>

      <dl className="mt-6 space-y-2 rounded-[24px] bg-paper-deep/80 p-5 text-sm">
        <Row label="Impresión" value={formatUsd(order.printingCents)} />
        <Row
          label={`Entrega ${order.delivery.name.toLowerCase()}`}
          value={order.delivery.cents === 0 ? "Incluida" : formatUsd(order.delivery.cents)}
        />
        <Row label={`${order.shipping.label} · ${formatWeight(order.shipping.grams)}`} value={formatUsd(order.shipping.cents)} />
        <div className="space-y-2 border-t border-line pt-3">
          <Row label="Subtotal sin IVA" value={formatUsd(order.iva.baseCents)} />
          <Row label={IVA_LABEL} value={formatUsd(order.iva.ivaCents)} />
        </div>
        <div className="flex items-end justify-between gap-4 border-t border-line pt-3">
          <dt>Total con IVA</dt>
          <dd className="font-display text-4xl">{formatUsd(order.totalCents)}</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info title="Entrega">
          <p>{order.customer.name}</p>
          <p>{order.customer.address}</p>
          <p>{order.customer.city}</p>
          {order.customer.reference ? <p>{order.customer.reference}</p> : null}
          <p>{order.customer.phone}</p>
          <p className="mt-2">
            Llega entre el {formatLongDate(order.delivery.earliest)} y el {formatShortDate(order.delivery.latest)}, contando desde que confirmamos el pago y tenemos el archivo.
          </p>
        </Info>
        <Info title="Pago y factura">
          <p>{order.payment.label}</p>
          <p>
            {order.customer.document.label} {order.customer.document.number}
          </p>
          <p>{order.customer.email}</p>
          <p className="mt-2">Se confirma por WhatsApp. Usa {order.number} como referencia cuando pagues.</p>
        </Info>
      </div>

      {order.notes ? <p className="mt-6 text-sm leading-6 text-ink-soft">Nota: {order.notes}</p> : null}

      <Link href="/productos" className="mt-8 inline-flex min-h-12 items-center text-sm underline-offset-4 hover:underline">
        Armar otro pedido
      </Link>
    </>
  );
}

function WhatsappIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M9 1.5a7.4 7.4 0 0 0-6.35 11.22L1.5 16.5l3.9-1.1A7.4 7.4 0 1 0 9 1.5Zm0 1.6a5.8 5.8 0 1 1-3 10.77l-.27-.17-2.1.6.6-2.05-.18-.28A5.8 5.8 0 0 1 9 3.1Zm-2.5 2.6c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.7s.74 1.97.84 2.1c.1.14 1.42 2.26 3.5 3.08 1.74.68 2.1.55 2.47.51.38-.03 1.2-.48 1.37-.96.17-.47.17-.88.12-.96-.05-.09-.19-.14-.4-.24-.2-.1-1.19-.59-1.38-.65-.18-.07-.32-.1-.45.1-.14.2-.52.65-.64.78-.12.14-.23.15-.43.05-.2-.1-.85-.31-1.62-1-.6-.53-1-1.19-1.12-1.39-.11-.2-.01-.3.09-.4.09-.09.2-.23.3-.35.1-.12.13-.2.2-.34.06-.13.03-.25-.02-.35-.05-.1-.44-1.09-.61-1.49-.16-.38-.32-.33-.44-.34h-.5Z" />
    </svg>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-line bg-sheet p-5 text-sm leading-6">
      <h2 className="font-medium">{title}</h2>
      <div className="mt-2 text-ink-soft">{children}</div>
    </section>
  );
}
