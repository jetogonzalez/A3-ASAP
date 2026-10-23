"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckMark,
  Chevron,
  CornerTag,
  FeatureCheck,
  Note,
  OptionGroup,
  glideTo,
  type StepState,
} from "@/components/configurator";
import { ProductIllustration } from "@/components/product-illustration";
import { ProductPhoto } from "@/components/product-photo";
import { StickyColumn } from "@/components/sticky-column";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { formatUnits, launchRequestMessage, type LaunchProduct, type LaunchSelection } from "@/lib/launch-products";
import { whatsappHref } from "@/lib/whatsapp";

/*
 * Configurador de los productos de lanzamiento. Sigue la misma estructura que
 * el de tarjetas: galería y ficha a la izquierda; «Tu diseño», pasos numerados
 * que se abren en orden y el resumen a la derecha; barra fija abajo. Usa sus
 * mismas piezas (OptionGroup, Note, CornerTag…). La diferencia es el final:
 * como aún no hay precio, el pedido sale por WhatsApp con todo escrito.
 */

const SPEEDS = [
  { id: "Standard", tone: "bg-speed-standard", detail: "Precio base de producción", note: "Incluido" },
  { id: "Priority", tone: "bg-speed-priority", detail: "Lo adelantamos, con recargo", note: "Con recargo" },
  { id: "Express", tone: "bg-speed-express", detail: "Para urgencias, tarifa premium", note: "Premium" },
] as const;

const DESIGN_METHODS = [
  { id: "propio", label: "Ya lo tengo", title: "Tu propio diseño", hint: "Lo adjuntas en el chat de WhatsApp al pedir." },
  { id: "ayuda", label: "Necesito ayuda", title: "Te ayudamos", hint: "Nos cuentas la idea y te mandamos una propuesta." },
] as const;

type DesignMethod = (typeof DESIGN_METHODS)[number]["id"];

const NOTES_LIMIT = 300;

export function LaunchConfigurator({ product }: { product: LaunchProduct }) {
  const choosable = product.options.filter((option) => option.choices.length > 1);
  const fixed = product.options.filter((option) => option.choices.length === 1);
  const steps = [...choosable.map((option) => option.id), "cantidad", "entrega"];
  const stepNames: Record<string, string> = {
    ...Object.fromEntries(choosable.map((option) => [option.id, `${option.label.toLowerCase()}`])),
    cantidad: "la cantidad",
    entrega: "la entrega",
  };

  const [selection, setSelection] = useState<LaunchSelection>(() =>
    Object.fromEntries(product.options.map((option) => [option.id, option.choices[0]])),
  );
  const [quantity, setQuantity] = useState(product.quantities[0]);
  const [speed, setSpeed] = useState<string>(SPEEDS[0].id);
  const [design, setDesign] = useState<DesignMethod>("propio");
  const [notes, setNotes] = useState("");
  /* Como en tarjetas: nada se ve elegido hasta que la persona lo toca. */
  const [picked, setPicked] = useState<Set<string>>(() => new Set());

  const missing = steps.filter((step) => !picked.has(step));
  const firstMissing = steps.findIndex((step) => !picked.has(step));
  const message = launchRequestMessage({ product, selection, quantity, speed, hasDesign: design === "propio", notes });

  /* La barra de abajo se retira en escritorio cuando el resumen entra en pantalla. */
  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryOnScreen, setSummaryOnScreen] = useState(false);
  useEffect(() => {
    const node = summaryRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setSummaryOnScreen(entry.isIntersecting), {
      rootMargin: "0px 0px -96px 0px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function stepState(step: string): StepState {
    const index = steps.indexOf(step);
    const status = picked.has(step) ? "done" : index === firstMissing ? "current" : "locked";
    return { number: index + 1, status, waitFor: index > 0 ? stepNames[steps[index - 1]] : "" };
  }

  /* Elegir también avanza al siguiente paso, igual que en tarjetas. */
  function choose(step: string, apply: () => void) {
    apply();
    setPicked((current) => (current.has(step) ? current : new Set(current).add(step)));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    window.setTimeout(() => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-step]"));
      const next = nodes[nodes.findIndex((node) => node.dataset.step === step) + 1];
      if (!next) return;
      const header = document.querySelector("header");
      const top = next.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight ?? 0) - 16;
      if (top <= window.scrollY + 8) return;
      glideTo(top);
    }, 90);
  }

  function on(step: string, value: boolean): boolean {
    return picked.has(step) && value;
  }

  function goToMissing() {
    const node = document.querySelector<HTMLElement>(`[data-step="${missing[0]}"]`);
    if (!node) return;
    const header = document.querySelector("header");
    glideTo(node.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight ?? 0) - 16);
  }

  const caption = [...fixed.map((option) => option.choices[0]), `producción ${product.leadTime}`].join(" · ");

  return (
    <>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <StickyColumn className="space-y-8 lg:col-start-1 lg:row-start-1">
          <div>
            <LaunchGallery product={product} />
            <p className="mt-4 text-sm text-ink-soft">{caption}</p>
          </div>
          <div className="hidden lg:block">
            <LaunchNotes product={product} />
          </div>
        </StickyColumn>

        <div className="space-y-8 pb-28 lg:col-start-2 lg:row-start-1 lg:pb-0">
          <DesignPanel method={design} onMethod={setDesign} notes={notes} onNotes={setNotes} />

          {choosable.map((option) => (
            <OptionGroup
              key={option.id}
              step={option.id}
              state={stepState(option.id)}
              legend={option.label}
              value={picked.has(option.id) ? selection[option.id] : undefined}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {option.choices.map((choice) => (
                  <ChoiceTile
                    key={choice}
                    name={option.id}
                    title={choice}
                    checked={on(option.id, selection[option.id] === choice)}
                    onChange={() => choose(option.id, () => setSelection((current) => ({ ...current, [option.id]: choice })))}
                  />
                ))}
              </div>
            </OptionGroup>
          ))}

          <OptionGroup
            step="cantidad"
            state={stepState("cantidad")}
            legend="Cantidad"
            value={picked.has("cantidad") ? `${quantity.toLocaleString("es-EC")} u.` : undefined}
            hint="Unidades por pedido. Mientras más pides, menos cuesta cada una: el precio te lo confirmamos por WhatsApp."
          >
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Cantidad">
              {product.quantities.map((amount, index) => {
                const checked = on("cantidad", quantity === amount);
                return (
                  <label
                    key={amount}
                    className={`relative flex min-h-16 cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl border-2 px-4 py-3 transition-colors has-[:focus-visible]:border-pick has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pick-line ${
                      checked ? "border-pick bg-pick-soft" : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"
                    }`}
                  >
                    {index === 0 ? <CornerTag>Mínimo</CornerTag> : null}
                    <span className="flex min-w-0 items-center gap-3">
                      <input
                        type="radio"
                        name="cantidad"
                        checked={checked}
                        onChange={() => choose("cantidad", () => setQuantity(amount))}
                        className="control control-radio"
                      />
                      <span className={`whitespace-nowrap ${checked ? "font-semibold" : "font-medium"}`}>
                        {amount.toLocaleString("es-EC")} u.
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </OptionGroup>

          <OptionGroup
            step="entrega"
            state={stepState("entrega")}
            legend="Entrega"
            value={picked.has("entrega") ? speed : undefined}
            hint={`Producción normal: ${product.leadTime}. Si lo necesitas antes, lo adelantamos.`}
          >
            <div className="grid gap-2" role="radiogroup" aria-label="Entrega">
              {SPEEDS.map((option, index) => {
                const checked = on("entrega", speed === option.id);
                return (
                  <label
                    key={option.id}
                    className={`relative flex min-h-20 cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl border-2 px-4 py-3 transition-colors has-[:focus-visible]:border-pick has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pick-line ${
                      checked ? "border-pick bg-pick-soft" : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <input
                        type="radio"
                        name="entrega"
                        checked={checked}
                        onChange={() => choose("entrega", () => setSpeed(option.id))}
                        className="control control-radio"
                      />
                      <span className="min-w-0">
                        <span className={`flex items-center gap-2 ${checked ? "font-semibold" : "font-medium"}`}>
                          <span className={`size-2.5 rounded-full ${option.tone}`} aria-hidden="true" />
                          {option.id}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-soft">{option.detail}</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {index === SPEEDS.length - 1 ? (
                        <span className="rounded-full bg-flag px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-flag-ink">
                          Más rápida
                        </span>
                      ) : null}
                      <span className={`text-sm font-medium ${index === 0 ? "text-moss" : ""}`}>{option.note}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </OptionGroup>

          <div ref={summaryRef} data-step="resumen" className="scroll-mt-4">
            <LaunchSummary
              product={product}
              rows={[
                ...choosable.map((option) => ({ label: option.label, value: selection[option.id] })),
                { label: "Entrega", value: speed },
                { label: "Diseño", value: design === "propio" ? "Ya lo tengo" : "Necesito ayuda" },
              ]}
              quantity={quantity}
              missing={missing.map((step) => stepNames[step])}
              message={message}
            />
          </div>
        </div>

        <div className="lg:hidden">
          <LaunchNotes product={product} />
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur-md ${
          summaryOnScreen ? "lg:hidden" : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 pb-[env(safe-area-inset-bottom)]">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-soft">
              {product.name} · precio por confirmar
              <span className="hidden lg:inline"> · {caption}</span>
            </p>
            <p key={`${quantity}-${speed}`} className="price-tick font-display text-2xl leading-none" aria-live="polite">
              {missing.length === steps.length ? product.name : `${formatUnits(quantity)} · ${speed}`}
            </p>
          </div>
          {missing.length > 0 ? (
            <button
              type="button"
              onClick={goToMissing}
              className="min-h-12 shrink-0 cursor-pointer rounded-full bg-press px-5 text-sm font-medium text-white opacity-60 transition hover:opacity-80"
            >
              Falta {stepNames[missing[0]]}
            </button>
          ) : (
            <OrderLink message={message} className="inline-flex min-h-12 px-5 text-sm" />
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- Galería: misma forma que la de tarjetas (escena grande, miniaturas y contador). ---------- */

function LaunchGallery({ product }: { product: LaunchProduct }) {
  const [index, setIndex] = useState(0);
  const swipeStart = useRef<number | null>(null);
  const slides = [
    {
      id: "foto",
      label: "Foto de referencia",
      scene: (
        <ProductPhoto slug={product.slug} alt={`${product.name}, foto de referencia`} sizes="(min-width: 1024px) 520px, 100vw" preload />
      ),
      thumb: <ProductPhoto slug={product.slug} alt="" sizes="76px" />,
    },
    {
      id: "diseno",
      label: "Dónde va tu diseño",
      scene: <ProductIllustration productId={product.id} family={product.family} className="h-full w-full" />,
      thumb: <ProductIllustration productId={product.id} family={product.family} className="h-full w-full" />,
    },
  ];

  function go(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  return (
    <div>
      <div
        className="group/gallery relative aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-[28px] bg-paper-deep"
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") swipeStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (swipeStart.current === null) return;
          const distance = event.clientX - swipeStart.current;
          swipeStart.current = null;
          if (Math.abs(distance) > 48) go(index + (distance < 0 ? 1 : -1));
        }}
        aria-roledescription="carrusel"
        aria-label="Fotos del producto"
      >
        {slides.map((slide, position) => (
          <div
            key={slide.id}
            className={`gallery-slide absolute inset-0 ${index === position ? "is-active" : ""}`}
            aria-hidden={index !== position}
          >
            {slide.scene}
          </div>
        ))}
        <GalleryArrow side="left" onClick={() => go(index - 1)} />
        <GalleryArrow side="right" onClick={() => go(index + 1)} />
      </div>

      <div className="mt-3 flex items-center gap-2" role="group" aria-label="Elegir foto">
        {slides.map((slide, position) => {
          const active = position === index;
          return (
            <button
              key={slide.id}
              type="button"
              aria-pressed={active}
              aria-label={slide.label}
              onClick={() => go(position)}
              className={`gallery-thumb relative h-[57px] w-[76px] shrink-0 cursor-pointer overflow-hidden rounded-xl ring-offset-2 ring-offset-sheet ${
                active ? "ring-2 ring-pick" : "ring-1 ring-line hover:ring-ink/30"
              }`}
            >
              {slide.thumb}
            </button>
          );
        })}
        <p className="ml-auto text-sm text-ink-soft" aria-live="polite">
          <span className="hidden font-medium text-ink sm:inline">{slides[index].label} · </span>
          {index + 1}/{slides.length}
        </p>
      </div>
    </div>
  );
}

function GalleryArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Foto anterior" : "Foto siguiente"}
      className={`gallery-arrow absolute top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 text-ink shadow-[0_4px_14px_-6px_rgba(20,20,20,0.45)] backdrop-blur ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={side === "left" ? "rotate-180" : ""}>
        <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ---------- «Tu diseño»: mismo panel y control segmentado que en tarjetas. ---------- */

function DesignPanel({
  method,
  onMethod,
  notes,
  onNotes,
}: {
  method: DesignMethod;
  onMethod: (next: DesignMethod) => void;
  notes: string;
  onNotes: (next: string) => void;
}) {
  const activeIndex = Math.max(0, DESIGN_METHODS.findIndex((option) => option.id === method));
  const active = DESIGN_METHODS[activeIndex];
  const [direction, setDirection] = useState<1 | -1>(1);

  return (
    <section id="tu-diseno" aria-labelledby="tu-diseno-titulo" className="scroll-mt-28 rounded-[28px] border border-line bg-sheet p-5">
      <h2 id="tu-diseno-titulo" className="text-lg font-semibold tracking-tight">
        Tu diseño
      </h2>
      <p className="mt-0.5 text-sm leading-6 text-ink-soft">Cuéntanos si ya tienes el arte. Puedes cambiarlo cuando quieras.</p>

      <div
        role="radiogroup"
        aria-label="Tu diseño"
        className="relative mt-4 grid rounded-2xl bg-paper-deep p-1"
        style={{ gridTemplateColumns: `repeat(${DESIGN_METHODS.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          className="segment-thumb absolute bottom-1 left-1 top-1 rounded-xl bg-sheet shadow-[0_1px_2px_rgba(26,29,33,0.08),0_6px_16px_-8px_rgba(26,29,33,0.35)]"
          style={{
            width: `calc((100% - 0.5rem) / ${DESIGN_METHODS.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {DESIGN_METHODS.map((option, position) => {
          const checked = method === option.id;
          return (
            <label
              key={option.id}
              className={`segment-option relative z-10 flex min-h-[3.75rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pick-line ${
                checked ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name="metodo-diseno"
                checked={checked}
                onChange={() => {
                  setDirection(position >= activeIndex ? 1 : -1);
                  onMethod(option.id);
                }}
                className="sr-only"
              />
              <span className="grid size-6 place-items-center" aria-hidden="true">
                {option.id === "propio" ? <WhatsappLogo brand /> : <BrushGlyph />}
              </span>
              <span className={`text-xs leading-4 sm:text-[13px] ${checked ? "font-semibold" : "font-medium"}`}>{option.label}</span>
            </label>
          );
        })}
      </div>

      <div key={method} className={`segment-panel mt-4 ${direction === 1 ? "from-right" : "from-left"}`}>
        <p className="mb-3 text-sm leading-6">
          <span className="font-semibold">{active.title}</span>
          <span className="text-ink-soft"> · {active.hint}</span>
        </p>
        <label htmlFor="notas" className="block text-sm font-medium">
          {method === "propio" ? "Notas para la imprenta" : "¿Qué tienes en mente?"} <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <textarea
          id="notas"
          rows={3}
          maxLength={NOTES_LIMIT}
          value={notes}
          onChange={(event) => onNotes(event.target.value)}
          placeholder={method === "propio" ? "Colores, ubicación del logo, fecha que lo necesitas…" : "Tu logo, colores, una frase, para qué evento es…"}
          className="field mt-2"
        />
      </div>
    </section>
  );
}

function BrushGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-2.1.9H6v-3.4a3 3 0 0 1 .9-2.1L14 4Z" />
      <path d="M12 6l6 6" />
    </svg>
  );
}

/* ---------- Opción en recuadro: mismo borde, check y estados que los de tarjetas. ---------- */

function ChoiceTile({ name, title, checked, onChange }: { name: string; title: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={`relative flex min-h-16 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 px-3 py-4 text-center transition-colors has-[:focus-visible]:border-pick has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pick-line ${
        checked ? "border-pick bg-pick-soft" : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {checked ? <CheckMark /> : null}
      <span className={`text-sm leading-5 ${checked ? "font-semibold" : "font-medium"}`}>{title}</span>
    </label>
  );
}

/* ---------- Resumen: misma tarjeta que «Tu pedido» de tarjetas. ---------- */

function LaunchSummary({
  product,
  rows,
  quantity,
  missing,
  message,
}: {
  product: LaunchProduct;
  rows: { label: string; value: string }[];
  quantity: number;
  missing: string[];
  message: string;
}) {
  const open = missing.length > 0;
  return (
    <section aria-label="Resumen del pedido" className="overflow-hidden rounded-[28px] border border-line bg-sheet shadow-[0_18px_44px_-28px_rgba(20,20,20,0.5)]">
      <div className="px-5 pt-5">
        <p className="text-sm text-ink-soft">Tu pedido</p>
        <h2 className="mt-1 text-[1.65rem] font-medium leading-tight tracking-tight">
          {open ? product.name : `${formatUnits(quantity)} · ${product.name.toLowerCase()}`}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-ink-soft">
          {open ? "El resumen se arma mientras eliges." : rows.map((row) => row.value).join(" · ")}
        </p>
      </div>

      <ul className="mt-4 space-y-2.5 border-t border-line px-5 py-4 text-sm">
        {open
          ? missing.map((step) => (
              <li key={step} className="flex items-center gap-2.5 text-ink-soft">
                <span className="size-1.5 shrink-0 rounded-full bg-line" aria-hidden="true" />
                Falta {step}
              </li>
            ))
          : rows.map((row) => (
              <li key={row.label} className="flex items-baseline justify-between gap-4">
                <span className="text-ink-soft">{row.label}</span>
                <span key={row.value} className="price-tick shrink-0 text-right font-medium">
                  {row.value}
                </span>
              </li>
            ))}
      </ul>

      <div className="border-t border-line bg-paper-deep/70 px-5 py-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-base font-semibold">Precio</p>
            <p className="mt-0.5 text-sm text-ink-soft">Con IVA, por WhatsApp</p>
          </div>
          <p className="text-right text-xl font-medium leading-tight tracking-tight">Te lo confirmamos</p>
        </div>
        <p className="mt-2 text-xs leading-5 text-ink-soft">
          Se abre WhatsApp con este resumen ya escrito. Te respondemos con el precio y la fecha de entrega.
        </p>
        {open ? (
          <p className="mt-5 hidden min-h-12 w-full items-center justify-center rounded-full bg-press px-5 text-base font-medium text-white opacity-60 lg:flex">
            Falta elegir {missing[0]}
          </p>
        ) : (
          <OrderLink message={message} className="mt-5 hidden min-h-12 w-full px-5 text-base lg:inline-flex" />
        )}
      </div>
    </section>
  );
}

function OrderLink({ message, className }: { message: string; className: string }) {
  return (
    <a
      href={whatsappHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`press shrink-0 items-center justify-center gap-2 rounded-full bg-press font-medium text-white transition hover:bg-press-deep ${className}`}
    >
      <WhatsappLogo size={18} />
      Pedir por WhatsApp
    </a>
  );
}

/* ---------- Ficha debajo de la galería: mismo acordeón que tarjetas. ---------- */

function LaunchNotes({ product }: { product: LaunchProduct }) {
  const highlights = [
    ...product.options.filter((option) => option.choices.length === 1).map((option) => `${option.label}: ${option.choices[0]}`),
    `Producción: ${product.leadTime}`,
    "Envío en Quito y los valles",
  ];
  const faq = [
    {
      q: "¿Cuándo sé el precio?",
      a: "Al pedir se abre WhatsApp con todo lo que elegiste. Te respondemos con el precio con IVA y la fecha de entrega.",
    },
    {
      q: "¿Cómo envío mi diseño?",
      a: "Lo adjuntas en el mismo chat de WhatsApp, en PDF, PNG o JPG. Si no lo tienes, te ayudamos a armarlo.",
    },
    {
      q: "¿Puedo pedir menos del mínimo?",
      a: `El mínimo para ${product.name.toLowerCase()} es de ${formatUnits(product.quantities[0])}. Si necesitas otra cantidad, escríbenos y lo vemos.`,
    },
  ];
  return (
    <div className="border-t border-line">
      <Note title="Descripción" open>
        <p className="text-ink">{product.summary} Eliges las opciones y la cantidad en esta página, y el pedido se cierra por WhatsApp.</p>
        <ul className="mt-5 space-y-3">
          {highlights.map((item) => (
            <li key={item} className="flex items-center gap-3 text-ink">
              <FeatureCheck />
              {item}
            </li>
          ))}
        </ul>
      </Note>
      <Note title="Especificaciones del producto">
        <dl className="overflow-hidden rounded-lg border border-line text-ink">
          {[
            ...product.options.map((option) => [option.label, option.choices.join(" / ")] as const),
            ["Cantidades", product.quantities.map((amount) => amount.toLocaleString("es-EC")).join(" / ")] as const,
            ["Producción", product.leadTime] as const,
          ].map(([label, value], index) => (
            <div key={label} className={`grid grid-cols-[9.5rem_minmax(0,1fr)] gap-4 px-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] ${index % 2 === 0 ? "bg-paper-deep" : "bg-sheet"}`}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </Note>
      <Note title="Preguntas frecuentes">
        <div>
          {faq.map((item) => (
            <details key={item.q} className="border-b border-line last:border-b-0">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium text-ink">
                <span>{item.q}</span>
                <Chevron />
              </summary>
              <p className="pb-3 pr-8 text-sm leading-6 text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </Note>
    </div>
  );
}
