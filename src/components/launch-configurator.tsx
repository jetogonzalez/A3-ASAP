"use client";

import { useState } from "react";
import { ProductIllustration } from "@/components/product-illustration";
import { ProductPhoto } from "@/components/product-photo";
import { StickyColumn } from "@/components/sticky-column";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import {
  defaultSelection,
  formatUnits,
  launchRequestMessage,
  type LaunchProduct,
  type LaunchSelection,
} from "@/lib/launch-products";
import { whatsappHref } from "@/lib/whatsapp";

/*
 * Configurador de los productos de lanzamiento. Se eligen opciones, cantidad,
 * entrega y si ya hay diseño; el resumen se arma en vivo y el pedido sale por
 * WhatsApp con todo escrito. No muestra precio: la tienda lo confirma.
 */

const SPEEDS = [
  { id: "Standard", tone: "bg-speed-standard", detail: "Precio base de producción" },
  { id: "Priority", tone: "bg-speed-priority", detail: "Más rápido, con recargo" },
  { id: "Express", tone: "bg-speed-express", detail: "Para urgencias, tarifa premium" },
] as const;

const NOTES_LIMIT = 300;

export function LaunchConfigurator({ product }: { product: LaunchProduct }) {
  const [selection, setSelection] = useState<LaunchSelection>(() => defaultSelection(product));
  const [quantity, setQuantity] = useState(product.quantities[0]);
  const [speed, setSpeed] = useState<string>(SPEEDS[0].id);
  const [hasDesign, setHasDesign] = useState(true);
  const [notes, setNotes] = useState("");

  const choosable = product.options.filter((option) => option.choices.length > 1);
  const fixed = product.options.filter((option) => option.choices.length === 1);
  const message = launchRequestMessage({ product, selection, quantity, speed, hasDesign, notes });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
      <StickyColumn className="lg:sticky lg:self-start">
        <ProductViewer product={product} />
        {fixed.length > 0 ? (
          <dl className="mt-4 flex flex-wrap gap-2 text-sm">
            {fixed.map((option) => (
              <div key={option.id} className="inline-flex items-center gap-1.5 rounded-full bg-paper-deep px-3 py-1.5">
                <dt className="text-ink-soft">{option.label}</dt>
                <dd className="font-medium">{option.choices[0]}</dd>
              </div>
            ))}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-paper-deep px-3 py-1.5">
              <dt className="text-ink-soft">Producción</dt>
              <dd className="font-medium">{product.leadTime}</dd>
            </div>
          </dl>
        ) : null}
      </StickyColumn>

      <div className="flex flex-col gap-8 pb-28 lg:pb-0">
        {choosable.map((option) => (
          <ChoiceGroup
            key={option.id}
            legend={option.label}
            name={option.id}
            choices={option.choices}
            value={selection[option.id]}
            onChange={(value) => setSelection((current) => ({ ...current, [option.id]: value }))}
          />
        ))}

        <ChoiceGroup
          legend="Cantidad"
          hint="Unidades por pedido"
          name="cantidad"
          choices={product.quantities.map(String)}
          value={String(quantity)}
          format={(value) => Number(value).toLocaleString("es-EC")}
          onChange={(value) => setQuantity(Number(value))}
        />

        <fieldset>
          <legend className="text-base font-semibold">Entrega</legend>
          <p className="mt-1 text-sm leading-6 text-ink-soft">Producción normal: {product.leadTime}. Si lo necesitas antes, lo adelantamos.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Entrega">
            {SPEEDS.map((option) => {
              const checked = speed === option.id;
              return (
                <label
                  key={option.id}
                  className={`relative flex min-h-20 cursor-pointer flex-col justify-center rounded-2xl border-2 px-4 py-3 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                    checked ? "border-pick bg-pick-soft" : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"
                  }`}
                >
                  <input
                    type="radio"
                    name="entrega"
                    className="sr-only"
                    checked={checked}
                    onChange={() => setSpeed(option.id)}
                  />
                  <span className="flex items-center gap-2 font-semibold">
                    <span className={`size-2.5 rounded-full ${option.tone}`} aria-hidden="true" />
                    {option.id}
                  </span>
                  <span className="mt-0.5 text-sm leading-5 text-ink-soft">{option.detail}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <ChoiceGroup
          legend="Diseño"
          name="diseno"
          choices={["Ya tengo el diseño", "Necesito ayuda"]}
          value={hasDesign ? "Ya tengo el diseño" : "Necesito ayuda"}
          onChange={(value) => setHasDesign(value === "Ya tengo el diseño")}
        />

        <div>
          <label htmlFor="notas" className="text-base font-semibold">
            Notas <span className="font-normal text-ink-soft">(opcional)</span>
          </label>
          <textarea
            id="notas"
            rows={3}
            maxLength={NOTES_LIMIT}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Colores, fecha que lo necesitas, para qué evento…"
            className="field mt-2"
          />
        </div>

        <Summary product={product} selection={selection} quantity={quantity} speed={speed} hasDesign={hasDesign} message={message} />
      </div>

      {/* En el teléfono el botón queda siempre a mano. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <span className="min-w-0 text-sm">
            <span className="block truncate font-semibold">{product.name}</span>
            <span key={`${quantity}-${speed}`} className="price-tick block truncate text-ink-soft">
              {formatUnits(quantity)} · {speed}
            </span>
          </span>
          <OrderButton message={message} compact />
        </div>
      </div>
    </div>
  );
}

/*
 * Dos vistas del producto: la foto de referencia y el dibujo que marca dónde
 * va tu diseño. Cambian con un fundido (transición, así se puede interrumpir).
 */
function ProductViewer({ product }: { product: LaunchProduct }) {
  const [view, setView] = useState<"foto" | "diseno">("foto");
  const views = [
    { id: "foto", label: "Foto de referencia" },
    { id: "diseno", label: "Dónde va tu diseño" },
  ] as const;

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-paper-deep">
        <div className={`absolute inset-0 transition-opacity duration-300 ease-out ${view === "foto" ? "opacity-100" : "opacity-0"}`}>
          <ProductPhoto
            slug={product.slug}
            alt={`${product.name}, foto de referencia`}
            sizes="(min-width: 1024px) 560px, 100vw"
            preload
          />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ease-out ${view === "diseno" ? "opacity-100" : "opacity-0"}`}>
          <ProductIllustration productId={product.id} family={product.family} className="h-full w-full" />
        </div>
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink-soft backdrop-blur">
          {view === "foto" ? "Referencia: tu pedido lleva tu diseño" : "El color marca la zona que se personaliza"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Vistas del producto">
        {views.map((option) => {
          const active = view === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setView(option.id)}
              className={`press group flex cursor-pointer items-center gap-2 rounded-2xl border-2 p-1 pr-3 text-sm font-medium transition-colors duration-150 ${
                active ? "border-pick" : "border-line hover:border-pick-line"
              }`}
            >
              <span className="relative block h-11 w-14 overflow-hidden rounded-xl">
                {option.id === "foto" ? (
                  <ProductPhoto slug={product.slug} alt="" sizes="56px" />
                ) : (
                  <ProductIllustration productId={product.id} family={product.family} className="h-full w-full" />
                )}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChoiceGroup({
  legend,
  hint,
  name,
  choices,
  value,
  onChange,
  format = (choice) => choice,
}: {
  legend: string;
  hint?: string;
  name: string;
  choices: readonly string[];
  value: string;
  onChange: (value: string) => void;
  format?: (choice: string) => string;
}) {
  return (
    <fieldset>
      <legend className="text-base font-semibold">
        {legend}
        {hint ? <span className="ml-2 text-sm font-normal text-ink-soft">{hint}</span> : null}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {choices.map((choice) => {
          const checked = value === choice;
          return (
            <label
              key={choice}
              className={`press inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                checked
                  ? "border-pick bg-pick text-white"
                  : "border-line bg-sheet text-ink hover:border-pick-line hover:bg-pick-wash"
              }`}
            >
              <input type="radio" name={name} className="sr-only" checked={checked} onChange={() => onChange(choice)} />
              {format(choice)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Summary({
  product,
  selection,
  quantity,
  speed,
  hasDesign,
  message,
}: {
  product: LaunchProduct;
  selection: LaunchSelection;
  quantity: number;
  speed: string;
  hasDesign: boolean;
  message: string;
}) {
  const rows = [
    ...product.options
      .filter((option) => option.choices.length > 1)
      .map((option) => ({ label: option.label, value: selection[option.id] })),
    { label: "Cantidad", value: formatUnits(quantity) },
    { label: "Entrega", value: speed },
    { label: "Diseño", value: hasDesign ? "Ya lo tengo" : "Necesito ayuda" },
  ];

  return (
    <section aria-labelledby="resumen" className="rounded-[24px] border border-line bg-paper-deep p-5">
      <h2 id="resumen" className="text-lg font-semibold tracking-tight">
        Tu pedido
      </h2>
      <dl className="mt-3 divide-y divide-line text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-ink-soft">{row.label}</dt>
            <dd key={row.value} className="price-tick text-right font-medium">
              {row.value}
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-ink-soft">Precio</dt>
          <dd className="text-right font-medium">Te lo confirmamos por WhatsApp</dd>
        </div>
      </dl>
      <div className="mt-4 hidden lg:block">
        <OrderButton message={message} />
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        Se abre WhatsApp con este resumen ya escrito. Te respondemos con el precio con IVA y la fecha de entrega.
      </p>
    </section>
  );
}

function OrderButton({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <a
      href={whatsappHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`press inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-press font-semibold text-white hover:bg-press-deep ${
        compact ? "min-h-11 px-4 text-sm" : "min-h-12 w-full px-6"
      }`}
    >
      <WhatsappLogo size={compact ? 18 : 20} />
      Pedir por WhatsApp
    </a>
  );
}
