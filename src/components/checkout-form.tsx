"use client";

import { WhatsappLogo } from "@/components/whatsapp-logo";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { rememberOrder } from "@/components/last-order";
import { EXTRA_KILO_CENTS, FIRST_KILO_CENTS, SERVICE_PLACES } from "@/lib/ecuador";
import { formatWeight } from "@/lib/weight";
import { formatUsd } from "@/lib/money";
import { orderTotals, PAYMENT_LABELS, type PaymentMethod } from "@/lib/order";
import { quote } from "@/lib/pricing";
import { IVA_LABEL } from "@/lib/tax";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/text";
import { initialOrderState } from "@/lib/schema";
import { placeOrder } from "@/server/actions";

const fieldClass = "field mt-1.5";
const labelClass = "block text-sm font-medium";

export function CheckoutForm() {
  const cart = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState(placeOrder, initialOrderState);
  const sent = useRef(false);
  /* El pago no viene marcado: lo elige la persona. */
  const [city, setCity] = useState("Quito");
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("cedula");
  const documentPlaceholder =
    DOCUMENT_TYPES.find((type) => type.id === documentType)?.placeholder ?? "";

  /* El servidor devuelve el pedido ya calculado: se guarda para el recibo y se vacía el carrito. */
  useEffect(() => {
    if (!state.order || sent.current) return;
    sent.current = true;
    rememberOrder(state.order);
    cart.clear();
    router.push("/pedido");
  }, [state.order, cart, router]);

  /* Es la misma cuenta que hace el servidor; aquí solo sirve para mostrarla antes de enviar. */
  const totals = useMemo(
    () => orderTotals(cart.items.map((item) => item.configuration), new Date().toISOString()),
    [cart.items],
  );
  const { shipping, delivery } = totals;
  const total = totals.totalCents;
  const errors = state.fieldErrors ?? {};

  if (!cart.ready) return <p className="text-ink-soft">Cargando el pedido…</p>;
  if (cart.items.length === 0) {
    return (
      <p className="text-ink-soft">
        El pedido está vacío. Vuelve a{" "}
        <Link href="/productos" className="underline underline-offset-4">
          productos
        </Link>
        .
      </p>
    );
  }

  return (
    <form
      className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => {
          action(data);
        });
      }}
    >
      <div className="space-y-8">
        <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
          <label>
            Sitio web
            <input name="company_website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <input type="hidden" name="cart" value={JSON.stringify(cart.items)} />

        {state.message ? (
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border border-alert-line bg-alert-soft px-4 py-3 text-sm font-medium text-alert-deep"
          >
            <AlertIcon />
            {state.message}
          </p>
        ) : null}
        {errors.cart ? (
          <p role="alert" className="text-sm font-medium text-alert-deep">
            {errors.cart}
          </p>
        ) : null}

        <Section title="Entrega">
          {/* Todo va a domicilio: no hay que elegir nada, solo decir a dónde. */}
          <p className="text-sm leading-6 text-ink-soft">
            Entregamos en Quito y los valles. El envío cuesta {formatUsd(shipping.cents)} porque tu paquete pesa {formatWeight(shipping.grams)}: {formatUsd(FIRST_KILO_CENTS)} el primer kilo y {formatUsd(EXTRA_KILO_CENTS)} por cada kilo adicional, con IVA.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="city">
                Sector
              </label>
              <select
                id="city"
                name="city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className={fieldClass}
                aria-invalid={Boolean(errors.city)}
              >
                <optgroup label="Quito">
                  {SERVICE_PLACES.filter((place) => place.group === "Quito").map((place) => (
                    <option key={place.name} value={place.name}>
                      {place.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Valles">
                  {SERVICE_PLACES.filter((place) => place.group === "Valles").map((place) => (
                    <option key={place.name} value={place.name}>
                      {place.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              {errors.city ? <p className="mt-1 text-sm font-medium text-alert-deep">{errors.city}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Dirección"
                name="address"
                error={errors.address}
                autoComplete="street-address"
                placeholder="Av. Amazonas N34-120 y Atahualpa…"
              />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Referencia"
                name="reference"
                error={errors.reference}
                optional
                placeholder="Edificio Torre Azul, piso 3, oficina 2…"
              />
            </div>
          </div>
        </Section>

        <Section title="Contacto">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombres" name="firstName" error={errors.firstName} autoComplete="given-name" placeholder="María Fernanda…" />
            <Field label="Apellidos" name="lastName" error={errors.lastName} autoComplete="family-name" placeholder="Pérez Andrade…" />
            <div>
              <label className={labelClass} htmlFor="documentType">
                Tipo de documento
              </label>
              <select
                id="documentType"
                name="documentType"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value as DocumentType)}
                className={fieldClass}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            {/* El formato cambia con el tipo, así que el ejemplo también. */}
            <Field
              label="Número de documento"
              name="documentNumber"
              error={errors.documentNumber}
              inputMode={documentType === "pasaporte" ? "text" : "numeric"}
              placeholder={`${documentPlaceholder}…`}
            />
            <Field
              label="Correo"
              name="email"
              type="email"
              error={errors.email}
              autoComplete="email"
              inputMode="email"
              placeholder="maria@correo.com…"
            />
            <Field
              label="Teléfono"
              name="phone"
              type="tel"
              error={errors.phone}
              autoComplete="tel"
              inputMode="tel"
              placeholder="0991234567…"
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            El documento es para la factura.
          </p>
        </Section>

        <Section title="Pago">
          <p className="mb-3 text-sm leading-6 text-ink-soft">
            El pago se cierra por WhatsApp. Al confirmar te dejamos el mensaje listo con el pedido, el total y tus datos de factura: lo envías y ahí te pasamos los datos para pagar.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <MethodOption
              name="paymentMethod"
              value="transfer"
              checked={payment === "transfer"}
              onChange={() => setPayment("transfer")}
              title={PAYMENT_LABELS.transfer}
              detail="Te pasamos la cuenta por el chat"
              logo={<BankLogo />}
            />
            <MethodOption
              name="paymentMethod"
              value="deuna"
              checked={payment === "deuna"}
              onChange={() => setPayment("deuna")}
              title={PAYMENT_LABELS.deuna}
              detail="Te enviamos el código para pagar"
              logo={<DeunaLogo />}
            />
          </div>
          {errors.paymentMethod ? (
            <p className="mt-2 text-sm font-medium text-alert-deep">{errors.paymentMethod}</p>
          ) : null}
        </Section>

        <Section title="Nota">
          <label className={labelClass} htmlFor="notes">
            Indicación para el taller <span className="font-normal text-ink-soft">(opcional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            maxLength={400}
            rows={3}
            placeholder="El logo va centrado y en blanco…"
            className={fieldClass}
          />
        </Section>

        <div>
          {/* El check del navegador salía negro y cuadrado. Este usa el verde de marca. */}
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6">
            <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
              <input
                type="checkbox"
                name="terms"
                value="yes"
                className="peer control control-check"
              />
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                className="pointer-events-none absolute hidden text-white peer-checked:block"
              >
                <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>Revisé el formato, la cantidad y el total del pedido</span>
          </label>
          {errors.terms ? <p className="mt-1 text-sm font-medium text-alert-deep">{errors.terms}</p> : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-press px-6 font-medium text-white hover:bg-press-deep disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? null : <WhatsappLogo size={20} />}
          {pending ? "Preparando el pedido…" : `Continuar a WhatsApp · ${formatUsd(total)}`}
        </button>
        <p className="-mt-5 text-sm text-ink-soft">
          En el siguiente paso finalizas el pedido en WhatsApp, con el mensaje ya escrito.
        </p>
      </div>

      <aside className="rounded-[24px] border border-line bg-sheet p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl">Tu tanda</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="text-ink-soft">
                Tarjetas · {item.configuration.quantity} u.
              </span>
              <span>{formatUsd(quote(item.configuration).printingCents)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-t border-line pt-3">
            <span className="text-ink-soft">
              Entrega {delivery.name}
              <span className="block text-xs">Una vez por pedido</span>
            </span>
            <span>{delivery.cents === 0 ? "Incluida" : formatUsd(delivery.cents)}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-ink-soft">
              {shipping.label}
              <span className="block text-xs">{formatWeight(shipping.grams)}</span>
            </span>
            <span>{formatUsd(shipping.cents)}</span>
          </li>
        </ul>
        <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">Subtotal sin IVA</dt>
            <dd>{formatUsd(totals.iva.baseCents)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">{IVA_LABEL}</dt>
            <dd>{formatUsd(totals.iva.ivaCents)}</dd>
          </div>
        </dl>
        <p className="mt-4 font-display text-4xl">{formatUsd(total)}</p>
        <p className="mt-2 text-xs leading-5 text-ink-soft">
          Total en USD con IVA y envío incluidos. El peso sale del papel y la cantidad que pediste.
        </p>
      </aside>
    </form>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
      <circle cx="9" cy="9" r="7.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 5.4v4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="12.4" r="0.95" fill="currentColor" />
    </svg>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-3xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  error,
  optional,
  type = "text",
  ...props
}: {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = name;
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label} {optional ? <span className="font-normal text-ink-soft">(opcional)</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm font-medium text-alert-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MethodOption({
  name,
  value,
  checked,
  onChange,
  title,
  detail,
  logo,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
  logo?: React.ReactNode;
}) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 transition-colors ${
        checked ? "border-pick bg-pick-soft" : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"
      }`}
    >
      <span className="flex items-start gap-3">
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="control control-radio mt-0.5" />
        <span>
          <span className={`block ${checked ? "font-semibold" : "font-medium"}`}>{title}</span>
          <span className="block text-sm text-ink-soft">{detail}</span>
        </span>
      </span>
      {logo ? <span className="method-logo shrink-0" aria-hidden="true">{logo}</span> : null}
    </label>
  );
}

/** El logo de Deuna, tal como lo entrega la marca. */
function DeunaLogo() {
  /* eslint-disable-next-line @next/next/no-img-element -- SVG fijo y pequeño */
  return <img src="/deuna.svg" alt="" width={40} height={40} className="size-10 rounded-xl shadow-[0_4px_10px_-4px_rgba(63,42,86,0.6)]" />;
}

/**
 * Transferencia: no es de un banco en particular (vale cualquiera), así que
 * va un edificio de banco propio, en el verde de la tienda.
 */
function BankLogo() {
  return (
    <span className="grid size-10 place-items-center rounded-xl bg-[linear-gradient(145deg,#1a8a4a,#0b4d2a)] text-white shadow-[0_4px_10px_-4px_rgba(11,77,42,0.7)]">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3 3.5 7.5v1.6h17V7.5L12 3Z" fill="currentColor" />
        <circle cx="12" cy="6.9" r="1.1" fill="#0b4d2a" />
        <path d="M6 10.6v6.2M10 10.6v6.2M14 10.6v6.2M18 10.6v6.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <path d="M4 19.2h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
