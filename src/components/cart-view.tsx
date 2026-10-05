"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { productHref } from "@/lib/catalog";
import { formatUsd } from "@/lib/money";
import { describeConfiguration, quote } from "@/lib/pricing";

export function CartView() {
  const { ready, items, removeItem } = useCart();

  if (!ready) {
    return <p className="text-ink-soft">Cargando el pedido…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[28px] border border-line bg-sheet px-6 py-12">
        <h2 className="font-display text-3xl">Todavía no hay piezas.</h2>
        <p className="mt-3 max-w-md text-ink-soft">
          Elige un formato, arma la cantidad y los acabados. El precio se ve antes de agregarlo.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-press px-5 font-medium text-white hover:bg-press-deep"
        >
          Ver tarjetas
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + quote(item.configuration).totalCents, 0);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <ul className="space-y-4">
        {items.map((item) => {
          const priced = quote(item.configuration);
          return (
            <li key={item.id} className="rounded-[24px] border border-line bg-sheet p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium">Tarjetas de presentación</h2>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    {describeConfiguration(item.configuration)}
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    {item.artwork ? `Archivo: ${item.artwork.filename}` : "Sin archivo adjunto"}
                  </p>
                </div>
                <p className="font-display text-2xl">{formatUsd(priced.totalCents)}</p>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <Link href={productHref(item.configuration, item.id)} className="underline-offset-4 hover:underline">
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="cursor-pointer text-ink-soft underline-offset-4 hover:underline"
                >
                  Quitar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="rounded-[24px] border border-line bg-sheet p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl">Resumen</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Impresión</dt>
            <dd>{formatUsd(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Envío</dt>
            <dd>En el siguiente paso</dd>
          </div>
        </dl>
        <p className="mt-4 border-t border-line pt-4 font-display text-4xl">{formatUsd(subtotal)}</p>
        <p className="mt-2 text-xs leading-5 text-ink-soft">USD, sin el envío. El total final se confirma al guardar el pedido.</p>
        <Link
          href="/checkout"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-press px-5 font-medium text-white hover:bg-press-deep"
        >
          Continuar
        </Link>
      </aside>
    </div>
  );
}
