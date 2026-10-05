"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { SERVICE_PLACES, shippingQuote, type ShippingMethod } from "@/lib/ecuador";
import { formatUsd } from "@/lib/money";
import { quote } from "@/lib/pricing";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/whatsapp";
import { initialOrderState } from "@/lib/schema";
import { placeOrder } from "@/server/actions";

const fieldClass =
  "mt-1.5 h-12 w-full rounded-xl border border-line bg-paper px-3.5 text-base text-ink outline-none transition-colors aria-invalid:border-alert aria-invalid:bg-alert-soft/60";
const labelClass = "block text-sm font-medium";

export function CheckoutForm() {
  const cart = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState(placeOrder, initialOrderState);
  const sent = useRef(false);
  /* Nada viene marcado: cómo lo recibe y cómo paga los elige la persona. */
  const [method, setMethod] = useState<ShippingMethod | null>(null);
  const [city, setCity] = useState("Quito");
  const [payment, setPayment] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (!state.orderId || sent.current) return;
    sent.current = true;
    cart.clear();
    router.push(`/pedido/${state.orderId}`);
  }, [state.orderId, cart, router]);

  const shipping = shippingQuote(method ?? "envio");
  const subtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + quote(item.configuration).totalCents, 0),
    [cart.items],
  );
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
          <div className="grid gap-2 sm:grid-cols-2">
            <MethodOption
              name="shippingMethod"
              value="envio"
              checked={method === "envio"}
              onChange={() => setMethod("envio")}
              title="Envío en Quito y valles"
              detail="A domicilio"
            />
            <MethodOption
              name="shippingMethod"
              value="retiro"
              checked={method === "retiro"}
              onChange={() => setMethod("retiro")}
              title="Retiro en Quito"
              detail="Sin costo"
            />
          </div>
          {errors.shippingMethod ? (
            <p className="mt-2 text-sm font-medium text-alert-deep">{errors.shippingMethod}</p>
          ) : null}
          {method === "envio" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <p className="text-sm leading-6 text-ink-soft sm:col-span-2">
                El costo del envío depende del peso del paquete. Te lo confirmamos por WhatsApp antes de que pagues.
              </p>
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
                <Field label="Dirección" name="address" error={errors.address} autoComplete="street-address" />
              </div>
              <div className="sm:col-span-2">
                <Field label="Referencia" name="reference" error={errors.reference} optional />
              </div>
            </div>
          ) : method === "retiro" ? (
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              El retiro es en el taller, en Quito, sin costo. Te avisamos cuando la tanda está lista: 4 días hábiles.
            </p>
          ) : null}
        </Section>

        <Section title="Contacto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nombre" name="name" error={errors.name} autoComplete="name" />
            </div>
            <Field label="Correo" name="email" type="email" error={errors.email} autoComplete="email" inputMode="email" />
            <Field label="Teléfono" name="phone" type="tel" error={errors.phone} autoComplete="tel" inputMode="tel" placeholder="0991234567" />
          </div>
        </Section>

        <Section title="Pago">
          <p className="mb-3 text-sm leading-6 text-ink-soft">
            El pago se cierra por WhatsApp. Al confirmar te abrimos el chat con el resumen listo, ahí te pasamos los datos y el costo del envío.
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
          <textarea id="notes" name="notes" maxLength={400} rows={3} className={`${fieldClass} h-auto py-3`} />
        </Section>

        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6">
            <input type="checkbox" name="terms" value="yes" className="mt-1 h-5 w-5 accent-ink" />
            <span>Revisé el formato, la cantidad y el total del pedido.</span>
          </label>
          {errors.terms ? <p className="mt-1 text-sm font-medium text-alert-deep">{errors.terms}</p> : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-press px-6 font-medium text-white hover:bg-press-deep disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Guardando pedido…" : `Continuar por WhatsApp · ${formatUsd(subtotal)}`}
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
            <span className="text-ink-soft">{method === null ? "Entrega" : shipping.label}</span>
            <span className={shipping.byWeight || method === null ? "text-sm text-ink-soft" : ""}>
              {method === null ? "Por elegir" : shipping.byWeight ? "Según el peso" : formatUsd(shipping.cents)}
            </span>
          </li>
        </ul>
        <p className="mt-4 font-display text-4xl">{formatUsd(subtotal)}</p>
        <p className="mt-2 text-xs leading-5 text-ink-soft">
          Es el total de la impresión, en USD. {method === "envio" ? "El envío se cotiza por peso y se suma en el chat." : method === "retiro" ? shipping.detail : "Elige cómo lo recibes para ver el plazo."}
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
      <span className="flex items-center gap-3">
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-4 w-4 accent-pick" />
        <span>
          <span className={`block ${checked ? "font-semibold" : "font-medium"}`}>{title}</span>
          <span className="block text-sm text-ink-soft">{detail}</span>
        </span>
      </span>
    </label>
  );
}
