"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useRef, useState } from "react";
import {
  CanvaMark,
  CheckMark,
  Chevron,
  CornerTag,
  FeatureCheck,
  FileDrop,
  Note,
  OptionGroup,
  PreflightList,
  UploadGlyph,
  glideTo,
  type StepState,
} from "@/components/configurator";
import { DeliveryIcon } from "@/components/delivery-icon";
import { ProductMockup } from "@/components/product-mockup";
import { ProductPhoto } from "@/components/product-photo";
import { StickyColumn } from "@/components/sticky-column";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { formatUnits, launchRequestMessage, type LaunchProduct, type LaunchSelection } from "@/lib/launch-products";
import { ARTWORK_FORMATS_LABEL, MAX_ARTWORK_BYTES, MAX_ARTWORK_MB, artworkContentType, isCanvaUrl, mayPreviewArtwork } from "@/lib/artwork";
import { leadHours, leadLabel, leadRanges, rangeLabel, type LeadLevel } from "@/lib/lead-times";
import { renderArtworkPages } from "@/lib/pdf-preview";
import { readArtworkFacts } from "@/lib/preflight";
import { evaluateArtwork, type ArtworkFacts } from "@/lib/preflight-rules";
import { explain } from "@/lib/glossary";
import { safeFilename } from "@/lib/text";
import { whatsappHref } from "@/lib/whatsapp";

/*
 * Configurador de los productos de lanzamiento. Sigue la misma estructura que
 * el de tarjetas: galería y ficha a la izquierda; «Tu diseño», pasos numerados
 * que se abren en orden y el resumen a la derecha; barra fija abajo. Usa sus
 * mismas piezas (OptionGroup, Note, CornerTag…). La diferencia es el final:
 * como aún no hay precio, el pedido sale por WhatsApp con todo escrito.
 */

const SPEEDS = [
  { id: "Standard", detail: "Precio base de producción", note: "Incluido" },
  { id: "Priority", detail: "Lo adelantamos, con recargo", note: "Con recargo" },
  { id: "Express", detail: "Para urgencias, tarifa premium", note: "Premium" },
] as const;

/* Las mismas formas de mandar el arte que en tarjetas, más pedir ayuda. */
const DESIGN_METHODS = [
  { id: "archivo", label: "Archivo", title: "Sube tu archivo", hint: "Se sube al elegirlo y el enlace va en el pedido." },
  { id: "enlace", label: "Canva", title: "Enlace de Canva", hint: "Pega el enlace para compartir tu diseño." },
  { id: "whatsapp", label: "WhatsApp", title: "Por WhatsApp", hint: "Lo adjuntas en el chat al pedir." },
  { id: "ayuda", label: "Ayuda", title: "Te ayudamos", hint: "Nos cuentas la idea y te mandamos una propuesta." },
] as const;

type DesignMethod = (typeof DESIGN_METHODS)[number]["id"];

type UploadState = { status: "idle" | "uploading" | "done" | "error"; url: string | null };

const NOTES_LIMIT = 300;

export function LaunchConfigurator({ product, uploadsEnabled }: { product: LaunchProduct; uploadsEnabled: boolean }) {
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
  const [design, setDesign] = useState<DesignMethod>(uploadsEnabled ? "archivo" : "whatsapp");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle", url: null });
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [canvaUrl, setCanvaUrl] = useState("");
  const canvaReady = isCanvaUrl(canvaUrl);

  /*
   * Vista previa local: la primera página del PDF dibujada en el navegador, para
   * ponerla en el mockup. Se suelta al cambiar el archivo o al salir.
   */
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewFor = useRef<File | null>(null);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const [artworkFacts, setArtworkFacts] = useState<ArtworkFacts | null>(null);
  const [checkingArtwork, setCheckingArtwork] = useState(false);

  function showPreview(next: File | null) {
    previewFor.current = next;
    setPreviewUrl(null);
    setArtworkFacts(null);
    setCheckingArtwork(Boolean(next));
    if (next) {
      void readArtworkFacts(next).then((facts) => {
        if (previewFor.current !== next) return;
        setArtworkFacts(facts);
        setCheckingArtwork(false);
      });
    }
    if (!next || !mayPreviewArtwork(next)) return;
    void renderArtworkPages(next, 1).then((urls) => {
      if (previewFor.current === next) setPreviewUrl(urls[0] ?? null);
      else urls.forEach((url) => URL.revokeObjectURL(url));
    });
  }

  async function takeFile(next: File | null) {
    setFileError(null);
    showPreview(null);
    if (!next) {
      setFile(null);
      setUploadState({ status: "idle", url: null });
      return;
    }
    if (!artworkContentType(next)) {
      setFileError(`Solo ${ARTWORK_FORMATS_LABEL}. Si tu diseño es una imagen, expórtalo a PDF.`);
      return;
    }
    if (next.size > MAX_ARTWORK_BYTES) {
      setFileError(`El archivo supera ${MAX_ARTWORK_MB} MB.`);
      return;
    }
    setFile(next);
    showPreview(next);
    if (!uploadsEnabled) return;
    /* Se sube ya: el pedido termina en un enlace a WhatsApp y el arte tiene que ir escrito en él. */
    setUploadState({ status: "uploading", url: null });
    try {
      const blob = await upload(`artes/${safeFilename(next.name)}`, next, {
        access: "public",
        handleUploadUrl: "/api/arte",
        contentType: artworkContentType(next) ?? undefined,
      });
      setUploadState({ status: "done", url: blob.url });
    } catch {
      setUploadState({ status: "error", url: null });
      setFileError("No pudimos subir el archivo. Inténtalo de nuevo o elige enviarlo por WhatsApp.");
    }
  }

  const uploading = design === "archivo" && uploadState.status === "uploading";
  const designLine =
    design === "archivo"
      ? uploadState.url
        ? `archivo ${uploadState.url}`
        : uploading
          ? "subiendo el archivo"
          : "lo envío en este chat"
      : design === "enlace"
        ? canvaReady
          ? `Canva ${canvaUrl.trim()}`
          : "lo envío en este chat"
        : design === "whatsapp"
          ? "lo adjunto en este chat"
          : "necesito ayuda para armarlo";
  const designLabel =
    design === "archivo"
      ? uploadState.url
        ? "Archivo subido"
        : uploading
          ? "Subiendo…"
          : "Lo mandas por WhatsApp"
      : design === "enlace"
        ? canvaReady
          ? "Enlace de Canva"
          : "Lo mandas por WhatsApp"
        : design === "whatsapp"
          ? "Por WhatsApp"
          : "Necesito ayuda";
  /* Como en tarjetas: nada se ve elegido hasta que la persona lo toca. */
  const [picked, setPicked] = useState<Set<string>>(() => new Set());

  const missing = steps.filter((step) => !picked.has(step));
  const firstMissing = steps.findIndex((step) => !picked.has(step));
  const message = launchRequestMessage({ product, selection, quantity, speed, design: designLine, notes });

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

  /* El plazo depende de la cantidad elegida y del nivel (matriz, hoja Precios). */
  const leadFor = (id: string) => leadLabel(leadHours(product.id, quantity, id.toLowerCase() as LeadLevel));
  const caption = [...fixed.map((option) => option.choices[0]), `plazo ${leadFor(speed)}`].join(" · ");

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <StickyColumn className="space-y-8 lg:col-start-1 lg:row-start-1">
          <div>
            {/* La clave reinicia la galería al subir o quitar el diseño: vuelve a la primera vista. */}
            <LaunchGallery key={design === "archivo" && previewUrl ? previewUrl : "foto"} product={product} designPreview={design === "archivo" ? previewUrl : null} />
            <p className="mt-4 text-sm text-ink-soft">{caption}</p>
          </div>
          <div className="hidden lg:block">
            <LaunchNotes product={product} />
          </div>
        </StickyColumn>

        <div className="space-y-8 pb-28 lg:col-start-2 lg:row-start-1 lg:pb-0">
          <DesignPanel
            method={design}
            onMethod={setDesign}
            notes={notes}
            onNotes={setNotes}
            file={file}
            uploadsEnabled={uploadsEnabled}
            uploadState={uploadState}
            fileError={fileError}
            dragOver={dragOver}
            onDragOver={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onFile={takeFile}
            hasPreview={Boolean(previewUrl)}
            preflight={file ? <PreflightList checking={checkingArtwork} checks={artworkFacts ? evaluateArtwork(artworkFacts) : []} /> : null}
            canvaUrl={canvaUrl}
            canvaReady={canvaReady}
            onCanvaUrl={setCanvaUrl}
          />

          {choosable.map((option) => (
            <OptionGroup
              key={option.id}
              step={option.id}
              state={stepState(option.id)}
              legend={option.label}
              value={picked.has(option.id) ? selection[option.id] : undefined}
            >
              <div className={`grid gap-3 ${option.choices.some((choice) => explain(choice)) ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
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
            hint={`Plazo para ${quantity.toLocaleString("es-EC")} u.: ${leadFor("standard")} en Standard. Si lo necesitas antes, lo adelantamos.`}
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
                      <DeliveryIcon speed={option.id} />
                      <span className="min-w-0">
                        <span className={`block ${checked ? "font-semibold" : "font-medium"}`}>{option.id}</span>
                        <span className="mt-0.5 block text-sm text-ink-soft">
                          <span className="font-medium text-ink">{leadFor(option.id)}</span> · {option.detail}
                        </span>
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
                { label: "Diseño", value: designLabel },
              ]}
              quantity={quantity}
              missing={missing.map((step) => stepNames[step])}
              message={message}
              uploading={uploading}
            />
          </div>
        </div>

        <div className="lg:hidden">
          <LaunchNotes product={product} />
        </div>
      </div>

      <div
        className={`bottom-bar fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur-md ${
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
          {uploading ? (
            <span className="inline-flex min-h-12 shrink-0 items-center rounded-full border border-line bg-paper-deep px-5 text-sm font-medium text-ink-soft">
              Subiendo…
            </span>
          ) : missing.length > 0 ? (
            <button
              type="button"
              onClick={goToMissing}
              className="min-h-12 shrink-0 cursor-pointer rounded-full border border-line bg-paper-deep px-5 text-sm font-medium text-ink transition hover:border-ink/30"
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

function LaunchGallery({ product, designPreview }: { product: LaunchProduct; designPreview: string | null }) {
  const [index, setIndex] = useState(0);
  const swipeStart = useRef<number | null>(null);
  /*
   * Sin diseño solo va la foto de referencia: nada de muestras de relleno.
   * Cuando el cliente sube una imagen, primero aparece su mockup.
   */
  const photo = {
    id: "foto",
    label: "Foto de referencia",
    scene: <ProductPhoto slug={product.slug} alt={`${product.name}, foto de referencia`} sizes="(min-width: 1024px) 520px, 100vw" preload />,
    thumb: <ProductPhoto slug={product.slug} alt="" sizes="76px" />,
  };
  const slides = designPreview
    ? [
        {
          id: "mockup",
          label: "Con tu diseño",
          scene: <ProductMockup slug={product.slug} designUrl={designPreview} alt={`${product.name} con tu diseño`} sizes="(min-width: 1024px) 520px, 100vw" />,
          thumb: <ProductMockup slug={product.slug} designUrl={designPreview} alt="" sizes="76px" />,
        },
        photo,
      ]
    : [photo];

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
        {slides.length > 1 ? (
          <>
            <GalleryArrow side="left" onClick={() => go(index - 1)} />
            <GalleryArrow side="right" onClick={() => go(index + 1)} />
          </>
        ) : null}
      </div>

      {slides.length > 1 ? (
      <div className="-mx-1.5 mt-1.5 flex min-w-0 items-center gap-2 overflow-x-auto p-1.5" role="group" aria-label="Elegir foto">
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
        <p className="ml-auto shrink-0 pl-2 text-sm text-ink-soft" aria-live="polite">
          <span className="hidden font-medium text-ink sm:inline">{slides[index].label} · </span>
          {index + 1}/{slides.length}
        </p>
      </div>
      ) : null}
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
  file,
  uploadsEnabled,
  uploadState,
  fileError,
  dragOver,
  onDragOver,
  onDragLeave,
  onFile,
  hasPreview,
  preflight,
  canvaUrl,
  canvaReady,
  onCanvaUrl,
}: {
  /** El diseño ya se ve en la foto del producto. */
  hasPreview: boolean;
  preflight: React.ReactNode;
  method: DesignMethod;
  onMethod: (next: DesignMethod) => void;
  notes: string;
  onNotes: (next: string) => void;
  file: File | null;
  uploadsEnabled: boolean;
  uploadState: UploadState;
  fileError: string | null;
  dragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onFile: (file: File | null) => void;
  canvaUrl: string;
  canvaReady: boolean;
  onCanvaUrl: (value: string) => void;
}) {
  const activeIndex = Math.max(0, DESIGN_METHODS.findIndex((option) => option.id === method));
  const active = DESIGN_METHODS[activeIndex];
  const [direction, setDirection] = useState<1 | -1>(1);
  const icons: Record<DesignMethod, React.ReactNode> = {
    archivo: <UploadGlyph />,
    enlace: <CanvaMark />,
    whatsapp: <WhatsappLogo brand />,
    ayuda: <BrushGlyph />,
  };

  return (
    <section id="tu-diseno" aria-labelledby="tu-diseno-titulo" className="scroll-mt-28 rounded-[28px] border border-line bg-sheet p-5">
      <h2 id="tu-diseno-titulo" className="text-lg font-semibold tracking-tight">
        Tu diseño
      </h2>
      <p className="mt-0.5 text-sm leading-6 text-ink-soft">Elige cómo nos haces llegar el arte. Puedes cambiarlo cuando quieras.</p>

      <div
        role="radiogroup"
        aria-label="Cómo enviar el diseño"
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
                {icons[option.id]}
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

        {method === "archivo" ? (
          <>
            <FileDrop
              file={file}
              uploadsEnabled={uploadsEnabled}
              dragOver={dragOver}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onFile={onFile}
              error={fileError}
              imageFaces={{ front: true, back: false }}
              onPlace={() => undefined}
              placement={false}
              preflight={preflight}
            />
            {file && uploadsEnabled ? (
              <p
                role="status"
                className={`mt-2 text-sm font-medium ${
                  uploadState.status === "done" ? "text-moss" : uploadState.status === "error" ? "text-alert-deep" : "text-ink-soft"
                }`}
              >
                {uploadState.status === "uploading"
                  ? "Subiendo tu archivo…"
                  : uploadState.status === "done"
                    ? hasPreview
                      ? "Listo: tu diseño ya está en la foto y el enlace va en el pedido."
                      : "Listo: el enlace a tu archivo va en el pedido."
                    : null}
              </p>
            ) : null}
          </>
        ) : null}

        {method === "enlace" ? (
          <div>
            <label htmlFor="canva-url" className="block text-sm font-medium">
              Enlace de tu diseño en Canva
            </label>
            <input
              id="canva-url"
              type="url"
              inputMode="url"
              value={canvaUrl}
              onChange={(event) => onCanvaUrl(event.target.value)}
              placeholder="https://www.canva.com/design/…"
              aria-invalid={Boolean(canvaUrl.trim()) && !canvaReady}
              aria-describedby="canva-help"
              className="field mt-1.5"
            />
            <p
              id="canva-help"
              className={`mt-2 text-sm leading-6 ${
                canvaUrl.trim() && !canvaReady ? "font-medium text-alert-deep" : canvaReady ? "font-medium text-moss" : "text-ink-soft"
              }`}
            >
              {canvaUrl.trim() && !canvaReady
                ? "Ese enlace no es de Canva. Cópialo desde Compartir en tu diseño."
                : canvaReady
                  ? "Listo: el enlace llega con el pedido."
                  : "En Canva toca Compartir, deja el acceso en «Cualquier persona con el enlace» y copia el enlace."}
            </p>
          </div>
        ) : null}

        {method === "whatsapp" ? (
          <div className="flex gap-3 rounded-2xl bg-paper-deep px-4 py-3.5 text-sm leading-6">
            <span className="mt-0.5" aria-hidden="true">
              <WhatsappLogo brand size={20} />
            </span>
            <p className="text-ink-soft">
              <span className="font-medium text-ink">Al pedir te dejamos el chat listo.</span> Adjunta ahí tu PDF, EPS o AI.
            </p>
          </div>
        ) : null}

        <label htmlFor="notas" className="mt-4 block text-sm font-medium">
          {method === "ayuda" ? "¿Qué tienes en mente?" : "Notas para la imprenta"} <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <textarea
          id="notas"
          rows={3}
          maxLength={NOTES_LIMIT}
          value={notes}
          onChange={(event) => onNotes(event.target.value)}
          placeholder={method === "ayuda" ? "Tu logo, colores, una frase, para qué evento es…" : "Colores, ubicación del logo, fecha que lo necesitas…"}
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
  /* Si el término es técnico, debajo va qué significa: nadie tiene que adivinar qué es «UV DTF». */
  const meaning = explain(title);
  return (
    <label
      className={`relative flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 px-3 py-4 text-center transition-colors has-[:focus-visible]:border-pick has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pick-line ${
        checked ? "border-pick bg-pick-soft" : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {checked ? <CheckMark /> : null}
      <span className={`text-sm leading-5 ${checked ? "font-semibold" : "font-medium"}`}>{title}</span>
      {meaning ? <span className="text-xs leading-4 text-ink-soft">{meaning}</span> : null}
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
  uploading,
}: {
  product: LaunchProduct;
  rows: { label: string; value: string }[];
  quantity: number;
  missing: string[];
  message: string;
  uploading: boolean;
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
        {open || uploading ? (
          <p className="mt-5 hidden min-h-12 w-full items-center justify-center rounded-full border border-line bg-paper-deep px-5 text-base font-medium text-ink-soft lg:flex">
            {open ? `Falta elegir ${missing[0]}` : "Subiendo tu archivo…"}
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
    `Plazo: ${product.leadTime}, según la cantidad`,
    "Envío en Quito y los valles",
  ];
  const faq = [
    {
      q: "¿Cuándo sé el precio?",
      a: "Al pedir se abre WhatsApp con todo lo que elegiste. Te respondemos con el precio con IVA y la fecha de entrega.",
    },
    {
      q: "¿Cómo envío mi diseño?",
      a: "Lo adjuntas en el mismo chat de WhatsApp, en PDF, EPS o AI. Si no lo tienes, te ayudamos a armarlo.",
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
            ...product.options.map(
              (option) =>
                [option.label, option.choices.map((choice) => (explain(choice) ? `${choice}: ${explain(choice)}` : choice)).join(" · ")] as const,
            ),
            ["Cantidades", product.quantities.map((amount) => amount.toLocaleString("es-EC")).join(" / ")] as const,
            ["Plazo (Standard)", leadRanges(product.id).map((range) => `${rangeLabel(range)}: ${leadLabel(range.standard)}`).join(" · ") || product.leadTime] as const,
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
