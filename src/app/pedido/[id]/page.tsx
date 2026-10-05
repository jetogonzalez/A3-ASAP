import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatWeight } from "@/lib/weight";
import { formatUsd } from "@/lib/money";
import { orderMessage, whatsappHref } from "@/lib/whatsapp";
import { getOrder } from "@/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

type ReceiptProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceiptPage({ params }: ReceiptProps) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const placed = new Intl.DateTimeFormat("es-EC", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  const chat = whatsappHref(
    orderMessage({
      number: order.number,
      name: order.customer.name,
      printing: formatUsd(order.subtotalCents),
      shipping: `${formatUsd(order.shipping.cents)} · ${formatWeight(order.shipping.grams)}`,
      total: formatUsd(order.totalCents),
      payment: order.payment.method,
      items: order.items.map((item) => `${item.description} — ${formatUsd(item.totalCents)}`),
    }),
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-moss">Pedido guardado</p>
      <h1 className="mt-3 font-display text-5xl">{order.number}</h1>
      <p className="mt-3 text-ink-soft">{placed}</p>

      {/* El pedido todavía no está cerrado: se confirma en el chat. Por eso manda este bloque. */}
      <div className="mt-6 rounded-[24px] border border-press/25 bg-moss-soft p-5">
        <h2 className="font-medium">Falta un paso: confirmar por WhatsApp</h2>
        <p className="mt-1 text-sm leading-6 text-ink-soft">
          Ahí te pasamos los datos para pagar con {order.payment.label}. El mensaje va escrito, solo tienes que enviarlo.
        </p>
        <a
          href={chat}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-press px-5 text-sm font-semibold text-white hover:bg-press-deep"
        >
          <WhatsappIcon />
          Abrir el chat con el pedido {order.number}
        </a>
      </div>

      <div className="mt-8 space-y-4">
        {order.items.map((item, index) => (
          <article key={`${item.description}-${index}`} className="rounded-[24px] border border-line bg-sheet p-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-medium leading-6">{item.description}</h2>
              <p className="font-display text-2xl">{formatUsd(item.totalCents)}</p>
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
              {item.artwork ? `Archivo recibido: ${item.artwork.filename}` : "Sin archivo. Puedes enviarlo al taller después."}
            </p>
          </article>
        ))}
      </div>

      <dl className="mt-6 space-y-2 rounded-[24px] bg-paper-deep/80 p-5 text-sm">
        <Row label="Impresión" value={formatUsd(order.subtotalCents)} />
        <Row
          label={order.shipping.label}
          value={formatUsd(order.shipping.cents)}
        />
        <div className="flex items-end justify-between gap-4 border-t border-line pt-3">
          <dt>Total</dt>
          <dd className="font-display text-4xl">{formatUsd(order.totalCents)}</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info title="Entrega">
          <p>{order.customer.name}</p>
          <p>{order.customer.address}</p>
          <p>
            {order.customer.city}, {order.customer.province}
          </p>
          <p>{order.customer.phone}</p>
          <p>
            {order.customer.document.label} {order.customer.document.number}
          </p>
          <p>
            {order.shipping.detail} El paquete pesa {formatWeight(order.shipping.grams)}.
          </p>
        </Info>
        <Info title="Pago">
          <p>{order.payment.label}</p>
          <p className="mt-2">
            Se confirma por WhatsApp. Usa {order.number} como referencia cuando pagues.
          </p>
        </Info>
      </div>

      {order.notes ? (
        <p className="mt-6 text-sm leading-6 text-ink-soft">Nota: {order.notes}</p>
      ) : null}

      <Link href="/productos" className="mt-8 inline-flex min-h-12 items-center text-sm underline-offset-4 hover:underline">
        Armar otro pedido
      </Link>
    </div>
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
