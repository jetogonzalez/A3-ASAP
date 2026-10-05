import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUsd } from "@/lib/money";
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

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-moss">Pedido guardado en este equipo</p>
      <h1 className="mt-3 font-display text-5xl">{order.number}</h1>
      <p className="mt-3 text-ink-soft">{placed}</p>

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
        <Row label={order.shipping.label} value={formatUsd(order.shipping.cents)} />
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
          <p>{order.shipping.detail}</p>
        </Info>
        <Info title="Pago">
          <p>{order.payment.label}</p>
          {order.payment.method === "transfer" ? (
            <p className="mt-2 text-ink-soft">
              Cuenta de demostración: Banco Pliego · 0000000000. No es una cuenta real. Usa {order.number} como referencia.
            </p>
          ) : (
            <p className="mt-2 text-ink-soft">No guardamos el número completo ni el código de seguridad.</p>
          )}
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
