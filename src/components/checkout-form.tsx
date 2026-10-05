"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { SERVICE_PLACES, shippingQuote } from "@/lib/ecuador";
import { cartGrams, formatWeight } from "@/lib/weight";
import { formatUsd } from "@/lib/money";
import { quote } from "@/lib/pricing";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/text";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/whatsapp";
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

  useEffect(() => {
    if (!state.orderId || sent.current) return;
    sent.current = true;
    cart.clear();
    router.push(`/pedido/${state.orderId}`);
  }, [state.orderId, cart, router]);

  const subtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + quote(item.configuration).totalCents, 0),
    [cart.items],
  );
  /* El peso sale del papel y la cantidad, así que el envío se puede mostrar aquí mismo. */
  const shipping = useMemo(
    () => shippingQuote(cartGrams(cart.items.map((item) => item.configuration))),
    [cart.items],
  );
  const total = subtotal + shipping.cents;
  const errors = state.fieldErrors ?? {};

  if (!cart.ready) return <p className="text-ink-soft">Cargando el pedido…</p>;
  if (cart.items.length === 0) {
    return (
      <p className="text-ink-soft">
        El pedido está vacío. Vuelve a{" "}
        <a href="/productos" className="underline underline-offset-4">
          productos
        </a>
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
            Entregamos en Quito y los valles. El envío cuesta {formatUsd(shipping.cents)} porque tu paquete pesa {formatWeight(shipping.grams)}: {formatUsd(350)} el primer kilo y {formatUsd(75)} por cada kilo adicional.
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
            El pago se cierra por WhatsApp. Al confirmar te abrimos el chat con el resumen y el total ya calculado, ahí te pasamos los datos de la cuenta.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <MethodOption
              name="paymentMethod"
              value="transfer"
              checked={payment === "transfer"}
              onChange={() => setPayment("transfer")}
              title={PAYMENT_LABELS.transfer}
              detail="Te pasamos la cuenta por el chat"
            />
            <MethodOption
              name="paymentMethod"
              value="deuna"
              checked={payment === "deuna"}
              onChange={() => setPayment("deuna")}
              title={PAYMENT_LABELS.deuna}
              detail="Te enviamos el código para pagar"
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
          className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-press px-6 font-medium text-white hover:bg-press-deep disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Guardando pedido…" : `Continuar por WhatsApp · ${formatUsd(total)}`}
        </button>
      </div>

      <aside className="rounded-[24px] border border-line bg-sheet p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl">Tu tanda</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="text-ink-soft">
                Tarjetas · {item.configuration.quantity} u.
              </span>
              <span>{formatUsd(quote(item.configuration).totalCents)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-t border-line pt-3">
            <span className="text-ink-soft">
              {shipping.label}
              <span className="block text-xs">{formatWeight(shipping.grams)}</span>
            </span>
            <span>{formatUsd(shipping.cents)}</span>
          </li>
        </ul>
        <p className="mt-4 font-display text-4xl">{formatUsd(total)}</p>
        <p className="mt-2 text-xs leading-5 text-ink-soft">
          Es el total en USD, con el envío ya incluido. El peso sale del papel y la cantidad que pediste.
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
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
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
    </label>
  );
}
