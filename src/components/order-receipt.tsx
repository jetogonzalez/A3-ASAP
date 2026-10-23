"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { readLastOrder } from "@/components/last-order";
import { WhatsappLogo } from "@/components/whatsapp-logo";
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
          <WhatsappLogo size={20} />
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
              {!item.artwork
                ? "Sin archivo: mándalo por WhatsApp."
                : item.artwork.source === "canva"
                  ? "Diseño en Canva: el enlace va en el mensaje."
                  : `Archivo recibido: ${item.artwork.filename}`}
            </p>
          </article>
        ))}
      </div>

      <dl className="mt-6 space-y-2 rounded-[24px] bg-paper-deep/80 p-5 text-sm">
        <Row label="Impresión" value={formatUsd(order.printingCents)} />
        <Row
          label={`Entrega ${order.delivery.name}`}
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
