"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CardPreview } from "@/components/card-preview";
import { useCart } from "@/components/cart-provider";
import {
  PRODUCT,
  QUANTITIES,
  SIZES,
  SIZE_IDS,
  type Configuration,
  type Finish,
  type Laminate,
  type SizeId,
  type DeliveryId,
} from "@/lib/catalog";
import { DELIVERY_OPTIONS, deliveryWindow, formatLongDate } from "@/lib/delivery";
import { formatUsd } from "@/lib/money";
import { addonCents, quote, type Quote } from "@/lib/pricing";
import { uploadArtwork } from "@/server/actions";

const MAX_FILE = 8 * 1024 * 1024;

/*
 * El `behavior: "smooth"` del navegador llega de golpe. Esto baja lo mismo pero
 * con una curva larga y suave, y se corta apenas la persona toca la rueda o la
 * pantalla: si decide ir a otro lado, mandamos nosotros menos que ella.
 */
function glideTo(top: number): void {
  const start = window.scrollY;
  const distance = top - start;
  const duration = Math.min(1100, Math.max(520, Math.abs(distance) * 1.25));
  const startedAt = performance.now();
  let cancelled = false;

  const stop = () => {
    cancelled = true;
  };
  const events = ["wheel", "touchstart", "keydown"] as const;
  events.forEach((name) => window.addEventListener(name, stop, { passive: true, once: true }));

  const step = (now: number) => {
    if (cancelled) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    /* easeInOutCubic: arranca y termina quieto, sin frenazo al final. */
    const eased =
      progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    window.scrollTo(0, start + distance * eased);
    if (progress < 1) requestAnimationFrame(step);
    else events.forEach((name) => window.removeEventListener(name, stop));
  };
  requestAnimationFrame(step);
}

/** Los pasos del configurador, en el orden en que se bajan. */
const STEPS = ["tamano", "papel", "laminado", "uv", "lados", "puntas", "cantidad", "entrega"] as const;

const STEP_NAMES: Record<string, string> = {
  tamano: "el tamaño",
  papel: "el papel",
  laminado: "el laminado",
  uv: "el brillo UV",
  lados: "el tipo de impresión",
  puntas: "el tipo de esquina",
  cantidad: "la cantidad",
  entrega: "la entrega",
};

export function Configurator({
  initial,
  editId,
  orderedAt,
}: {
  initial: Configuration;
  editId?: string;
  orderedAt: string;
}) {
  const router = useRouter();
  const cart = useCart();
  const editing = editId ? cart.items.find((item) => item.id === editId) : undefined;
  const [config, setConfig] = useState<Configuration>(editing?.configuration ?? initial);
  /*
   * Nada arranca marcado: la tarjeta de la muestra usa valores por defecto, pero
   * cada grupo se ve vacío hasta que la persona elige. Al editar algo del carrito
   * ya está todo decidido, así que ahí sí viene completo.
   */
  const [picked, setPicked] = useState<Set<string>>(() => new Set(editing ? STEPS : []));
  const missing = STEPS.filter((step) => !picked.has(step));
  const [imageFaces, setImageFaces] = useState<{ front: boolean; back: boolean }>({ front: true, back: false });
  const [file, setFile] = useState<File | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priced = useMemo(() => quote(config), [config]);
  const addons = addonCents(config.sizeId, config.quantity);
  const size = SIZES[config.sizeId];
  /* Base para comparar el precio por unidad de cada tirada. */
  const smallestRun = useMemo(() => quote({ ...config, quantity: QUANTITIES[0] }), [config]);

  /*
   * En escritorio el resumen vive al final de una columna larga, así que mientras
   * eliges acabados no ves ningún total. La barra de abajo lo sostiene y se retira
   * sola cuando el resumen de verdad entra en pantalla.
   */
  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryOnScreen, setSummaryOnScreen] = useState(false);

  useEffect(() => {
    const node = summaryRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSummaryOnScreen(entry.isIntersecting),
      { rootMargin: "0px 0px -96px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!file || !isPreviewImage(file)) {
      setArtworkUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setArtworkUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function patch(partial: Partial<Configuration>) {
    setError(null);
    setConfig((current) => ({ ...current, ...partial }));
  }

  /*
   * Elegir también avanza: la página baja sola al siguiente paso, como en las
   * tiendas donde configuras un producto. Solo baja, nunca sube, y respeta a
   * quien pidió menos movimiento en el sistema.
   */
  function choose(step: string, partial: Partial<Configuration>) {
    patch(partial);
    setPicked((current) => (current.has(step) ? current : new Set(current).add(step)));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    window.setTimeout(() => {
      const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-step]"));
      const next = steps[steps.findIndex((node) => node.dataset.step === step) + 1];
      if (!next) return;
      const header = document.querySelector("header");
      const top =
        next.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight ?? 0) - 16;
      if (top <= window.scrollY + 8) return;
      glideTo(top);
    }, 90);
  }

  /* Marcado solo si ya pasó por ahí: antes de eso ningún recuadro se ve elegido. */
  function on(step: string, value: boolean): boolean {
    return picked.has(step) && value;
  }

  function takeFile(next: File | null) {
    setError(null);
    if (!next) {
      setFile(null);
      setImageFaces({ front: true, back: false });
      return;
    }
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (next.type && !allowed.includes(next.type)) {
      setError("Solo PDF, PNG o JPG.");
      return;
    }
    if (next.size > MAX_FILE) {
      setError("El archivo supera 8 MB.");
      return;
    }
    setFile(next);
    if (isPreviewImage(next)) {
      document.getElementById("muestra")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function commit() {
    if (missing.length > 0) return;
    setPending(true);
    setError(null);
    try {
      let artwork = editing?.artwork ?? null;
      if (file) {
        const body = new FormData();
        body.set("artwork", file);
        const uploaded = await uploadArtwork(body);
        if (!uploaded.ok) {
          setError(uploaded.message);
          setPending(false);
          return;
        }
        artwork = uploaded;
      }
      if (editing) cart.updateItem(editing.id, config, artwork);
      else cart.addItem(config, artwork);
      router.push("/carrito");
    } catch {
      setError("No pudimos guardar el archivo. Inténtalo de nuevo.");
      setPending(false);
    }
  }

  return (
    <>
    {/*
      * En el teléfono las opciones van antes que la descripción: lo que la persona
      * viene a hacer es armar su tarjeta, no leer la ficha. En escritorio la grilla
      * devuelve la ficha a su sitio, debajo de la muestra.
      */}
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="space-y-8 lg:col-start-1 lg:row-start-1">
      <div>
        {/*
          * Las dos caras a la vez. Con un interruptor Frente/Reverso había que
          * descubrir que existía una segunda cara; así se ve de una.
          */}
        <div
          id="muestra"
          className="flex min-h-[340px] scroll-mt-28 flex-col items-center justify-center gap-6 rounded-[28px] bg-paper-deep/70 px-8 py-12 sm:flex-row sm:gap-5"
        >
          <figure className="flex w-full min-w-0 flex-1 flex-col items-center gap-2.5">
            <CardPreview
              config={config}
              face="front"
              pair={config.sides === 2}
              artworkUrl={artworkUrl && imageFaces.front ? artworkUrl : null}
            />
            {config.sides === 2 ? (
              <figcaption className="text-sm text-ink-soft">Frente</figcaption>
            ) : null}
          </figure>
          {config.sides === 2 ? (
            <figure className="flex w-full min-w-0 flex-1 flex-col items-center gap-2.5">
              <CardPreview
                config={config}
                face="back"
                pair
                artworkUrl={artworkUrl && imageFaces.back ? artworkUrl : null}
              />
              <figcaption className="text-sm text-ink-soft">Reverso</figcaption>
            </figure>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
          <p>
            {size.sizeLabel} · {config.paper}
            {config.rounded ? " · puntas redondeadas" : ""}
            {config.uv ? " · el rectángulo claro es el UV" : ""}
          </p>
          <p>{config.sides === 2 ? "Dos lados" : "Un lado"}</p>
        </div>
      </div>
      <ArtworkPanel
        file={file}
        savedName={editing?.artwork?.filename}
        dragOver={dragOver}
        onDragOver={() => setDragOver(true)}
        onDragLeave={() => setDragOver(false)}
        onFile={takeFile}
        sizeId={config.sizeId}
        sizeName={size.name}
        sizeLabel={size.sizeLabel}
        rounded={config.rounded}
        error={error}
        imageFaces={imageFaces}
        onPlace={(side) => {
          const turningOn = !imageFaces[side];
          setImageFaces((current) => ({ ...current, [side]: !current[side] }));
          if (side === "back" && turningOn) choose("lados", { sides: 2 });
        }}
      />
      </div>

      <div className="space-y-8 pb-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pb-0">
        <OptionGroup step="tamano" legend="Tamaño" value={picked.has("tamano") ? size.sizeLabel : undefined} hint="Las dos medidas que imprimimos hoy. El dibujo está a escala.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SIZE_IDS.map((id) => (
              <Tile
                key={id}
                name="tamano"
                checked={on("tamano", config.sizeId === id)}
                onChange={() => choose("tamano", { sizeId: id })}
                title={SIZES[id].name}
                detail={SIZES[id].sizeLabel}
                tag={id === "85x55" ? "Más vendida" : undefined}
                glyph={<SizeGlyph square={id === "55x55"} />}
              />
            ))}
          </div>
        </OptionGroup>

        <OptionGroup step="papel" legend="Tipo de papel" value={picked.has("papel") ? (config.paper === "mate" ? "Mate" : "Brillante") : undefined} hint="Couche 300 g. Ya está incluido en la impresión.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile
              name="papel"
              checked={on("papel", config.paper === "mate")}
              onChange={() => choose("papel", { paper: "mate" })}
              title="Mate"
              detail="Incluido"
              tag="Más vendido"
              glyph={<PaperGlyph glossy={false} />}
            />
            <Tile
              name="papel"
              checked={on("papel", config.paper === "brillante")}
              onChange={() => choose("papel", { paper: "brillante" })}
              title="Brillante"
              detail="Incluido"
              glyph={<PaperGlyph glossy />}
            />
          </div>
        </OptionGroup>

        <OptionGroup
          step="laminado"
          legend="Laminado"
          value={
            !picked.has("laminado")
              ? undefined
              : config.laminate === "none"
                ? "Sin laminado"
                : config.laminate === "mate"
                  ? "Laminado mate"
                  : "Laminado brillante"
          }
          hint={`Capa extra a doble cara. Mismo cargo para mate o brillante: ${formatUsd(addons.laminate)}.`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile
              name="laminado"
              checked={on("laminado", config.laminate === "none")}
              onChange={() => choose("laminado", { laminate: "none" })}
              title="Sin laminado"
              detail="Incluido"
              glyph={<NoneGlyph />}
            />
            {(["mate", "brillante"] as Finish[]).map((finish) => (
              <Tile
                key={finish}
                name="laminado"
                checked={on("laminado", config.laminate === finish)}
                onChange={() => choose("laminado", { laminate: finish satisfies Laminate })}
                title={finish === "mate" ? "Laminado mate" : "Laminado brillante"}
                detail={`+ ${formatUsd(addons.laminate)}`}
                tag={finish === "mate" ? "Más vendido" : undefined}
                glyph={<LaminateGlyph glossy={finish === "brillante"} />}
              />
            ))}
          </div>
        </OptionGroup>

        <OptionGroup
          step="uv"
          legend="Brillo UV"
          value={picked.has("uv") ? (config.uv ? "UV selectivo" : "Sin UV") : undefined}
          hint={`Barniz brillante solo sobre las zonas que marques. Cargo fijo de taller: ${formatUsd(addons.uv)}.`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile
              name="uv"
              checked={on("uv", !config.uv)}
              onChange={() => choose("uv", { uv: false })}
              title="Sin UV"
              detail="Incluido"
              glyph={<NoneGlyph />}
            />
            <Tile
              name="uv"
              checked={on("uv", config.uv)}
              onChange={() => choose("uv", { uv: true })}
              title="UV selectivo"
              detail={`+ ${formatUsd(addons.uv)}`}
              glyph={<UvGlyph />}
            />
          </div>
        </OptionGroup>

        <OptionGroup
          step="lados"
          legend="Opción de impresión"
          value={picked.has("lados") ? (config.sides === 1 ? "A una cara" : "A doble cara") : undefined}
          hint="Las dos opciones no se suman: eliges una y el precio cambia."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile
              name="lados"
              checked={on("lados", config.sides === 1)}
              onChange={() => choose("lados", { sides: 1 })}
              title="A una cara"
              detail="Solo el frente"
              glyph={<SidesGlyph double={false} />}
            />
            <Tile
              name="lados"
              checked={on("lados", config.sides === 2)}
              onChange={() => choose("lados", { sides: 2 })}
              title="A doble cara"
              detail="Frente y reverso"
              tag="Más vendido"
              glyph={<SidesGlyph double />}
            />
          </div>
        </OptionGroup>

        <OptionGroup step="puntas" legend="Esquinas" value={picked.has("puntas") ? (config.rounded ? "Redondeadas" : "Rectas") : undefined}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile
              name="puntas"
              checked={on("puntas", !config.rounded)}
              onChange={() => choose("puntas", { rounded: false })}
              title="Rectas"
              detail="Incluido"
              glyph={<CornerGlyph rounded={false} />}
            />
            <Tile
              name="puntas"
              checked={on("puntas", config.rounded)}
              onChange={() => choose("puntas", { rounded: true })}
              title="Redondeadas"
              detail={`+ ${formatUsd(addons.corners)}`}
              glyph={<CornerGlyph rounded />}
            />
          </div>
        </OptionGroup>

        <OptionGroup
          step="cantidad"
          legend="Cantidad"
          value={picked.has("cantidad") ? `${config.quantity.toLocaleString("es-EC")} u.` : undefined}
          hint={`El precio de cada fila ya incluye los acabados que elegiste. El porcentaje compara el precio por tarjeta contra pedir ${QUANTITIES[0]} unidades, que con estos acabados salen en ${formatUsd(smallestRun.unitCents)} c/u.`}
        >
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Cantidad">
            {QUANTITIES.map((quantity) => {
              const row = quote({ ...config, quantity });
              const checked = on("cantidad", config.quantity === quantity);
              const recommended = quantity === 250;
              /*
               * Cuánto baja el precio por unidad frente a la tirada más chica. Se calcula
               * sobre el total, no sobre unitCents: a estos precios el redondeo al centavo
               * dejaba 500 y 1.000 con el mismo porcentaje.
               */
              const saving = Math.round(
                (1 - row.totalCents / quantity / (smallestRun.totalCents / QUANTITIES[0])) * 100,
              );
              return (
                <label
                  key={quantity}
                  /*
                   * La etiqueta de esquina va encima del hueco de arriba, sin empujar el
                   * contenido: así todas las filas miden lo mismo, con o sin etiqueta.
                   */
                  className={`relative flex min-h-16 cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl border-2 px-4 py-3 transition-colors has-[:focus-visible]:border-pick has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pick-line ${
                    checked
                      ? "border-pick bg-pick-soft"
                      : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"
                  }`}
                >
                  {recommended ? <CornerTag>Más vendida</CornerTag> : null}
                  <span className="flex min-w-0 items-center gap-3">
                    <input
                      type="radio"
                      name="cantidad"
                      value={quantity}
                      checked={checked}
                      onChange={() => choose("cantidad", { quantity })}
                      className="control control-radio"
                    />
                    <span
                      className={`whitespace-nowrap ${
                        checked ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {quantity.toLocaleString("es-EC")} u.
                    </span>
                    {saving >= 5 ? <SavingTag percent={saving} onPick={checked} /> : null}
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={`block tabular-nums ${
                        checked ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {formatUsd(row.totalCents)}
                    </span>
                    <span
                      className="block text-xs tabular-nums text-ink-soft"
                    >
                      {formatUsd(row.unitCents)} c/u
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </OptionGroup>

        <DeliveryChoices
          orderedAt={orderedAt}
          selected={picked.has("entrega") ? config.delivery : null}
          hasArtwork={Boolean(file || editing?.artwork)}
          onChange={(delivery) => choose("entrega", { delivery })}
        />
        <div ref={summaryRef} data-step="resumen" className="scroll-mt-4">
          <QuoteSummary
            config={config}
            priced={priced}
            missing={missing}
            sizeName={size.name}
            sizeLabel={size.sizeLabel}
            pending={pending}
            editing={Boolean(editing)}
            disabled={pending || Boolean(editId && !cart.ready)}
            error={error}
            onCommit={commit}
          />
        </div>
      </div>

      <div className="lg:col-start-1 lg:row-start-2">
        <DesignNotes />
      </div>
    </div>

    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur-md ${
        summaryOnScreen ? "lg:hidden" : ""
      }`}
    >
        {error ? (
          <p role="alert" className="mx-auto mb-2 max-w-6xl text-sm font-medium text-alert-deep">
            {error}
          </p>
        ) : null}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 pb-[env(safe-area-inset-bottom)]">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-soft">
              {missing.length > 0 ? "Desde · " : ""}
              {config.quantity.toLocaleString("es-EC")} tarjetas · {formatUsd(priced.unitCents)} c/u
              <span className="hidden lg:inline">
                {" "}
                · {size.name}, {size.sizeLabel} · {config.sides === 1 ? "un lado" : "dos lados"} · papel{" "}
                {config.paper}
              </span>
            </p>
            <p
              key={priced.totalCents}
              className="price-tick font-display text-2xl leading-none tabular-nums"
              aria-live="polite"
            >
              {formatUsd(priced.totalCents)}
            </p>
          </div>
          <button
            type="button"
            onClick={commit}
            disabled={pending || missing.length > 0 || Boolean(editId && !cart.ready)}
            className="min-h-12 shrink-0 cursor-pointer rounded-full bg-press px-5 text-sm font-medium text-white transition hover:bg-press-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {missing.length > 0 ? (
              `Falta ${STEP_NAMES[missing[0]]}`
            ) : (
              <>
                {pending ? "Guardando…" : editing ? "Actualizar" : "Agregar"}
                <span className="hidden lg:inline">{pending || editing ? "" : " al pedido"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function DeliveryChoices({
  orderedAt,
  selected,
  hasArtwork,
  onChange,
}: {
  orderedAt: string;
  selected: DeliveryId | null;
  hasArtwork: boolean;
  onChange: (delivery: DeliveryId) => void;
}) {
  return (
    <fieldset data-step="entrega" className="scroll-mt-4">
      <legend className="text-sm font-medium">Fecha de entrega estimada</legend>
      <p className="mt-1 mb-3 text-sm leading-6 text-ink-soft">
        Por ahora el envío es solo en Quito y los valles. Adelantar la producción tiene un recargo de demostración y se suma al pagar.
        {hasArtwork ? "" : " Sin archivo, la cuenta empieza cuando lo envíes."}
      </p>
      <div className="grid gap-2" role="radiogroup" aria-label="Fecha de entrega estimada">
        {DELIVERY_OPTIONS.map((option) => {
          const window = deliveryWindow(orderedAt, option.id);
          const checked = selected === option.id;
          /* La entrega más rápida es la que cuesta: ahí sí vale señalarla. */
          const fastest = option.id === DELIVERY_OPTIONS[DELIVERY_OPTIONS.length - 1].id;
          return (
            <label
              key={option.id}
              /* Mismo alto en todas y el contenido centrado: la etiqueta vive en la columna del precio. */
              className={`relative flex min-h-20 cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl border-2 px-4 py-3 transition-colors ${
                checked
                  ? "border-pick bg-pick-soft"
                  : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"
              }`}
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="entrega"
                  checked={checked}
                  onChange={() => onChange(option.id)}
                  className="control control-radio mt-0.5"
                />
                <span>
                  <span className={checked ? "font-semibold" : "font-medium"}>
                    Entre el {formatLongDate(window.earliest)}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-soft">
                    A más tardar el {formatLongDate(window.latest)}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                {fastest ? (
                  <span className="rounded-full bg-flag px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-flag-ink">
                    La más rápida
                  </span>
                ) : null}
                <span className={`text-sm font-medium tabular-nums ${option.cents === 0 ? "text-press-deep" : ""}`}>
                  {option.cents === 0 ? "Incluido" : `+ ${formatUsd(option.cents)}`}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ArtworkPanel({
  file,
  savedName,
  dragOver,
  onDragOver,
  onDragLeave,
  onFile,
  sizeId,
  sizeName,
  sizeLabel,
  rounded,
  error,
  imageFaces,
  onPlace,
}: {
  file: File | null;
  savedName?: string;
  dragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onFile: (file: File | null) => void;
  sizeId: SizeId;
  sizeName: string;
  sizeLabel: string;
  rounded: boolean;
  error: string | null;
  imageFaces: { front: boolean; back: boolean };
  onPlace: (side: "front" | "back") => void;
}) {
  const ready = Boolean(file || savedName);
  const invalid = Boolean(error) && !file;
  const href = `/plantilla/${sizeId}?puntas=${rounded ? "1" : "0"}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const title = dragOver ? "Aquí va el archivo" : invalid ? "Revisa el archivo" : file?.name ?? savedName ?? "Elige el archivo";
  const hint = dragOver
    ? "PDF, PNG o JPG"
    : invalid
      ? error
      : file
        ? formatFileSize(file.size)
        : savedName
          ? "Ya está en este pedido. Puedes cambiarlo."
          : "También puedes enviarlo después de pedir.";

  return (
    <section id="tu-diseno" aria-label="Tu diseño" className="scroll-mt-28 rounded-[28px] border border-line bg-sheet p-5">
      <h2 className="text-lg font-semibold tracking-tight">Tu diseño</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">PDF, PNG o JPG de hasta 8 MB.</p>
      {/* El input vive fuera de la zona de arrastre porque "Cambiar" también lo abre. */}
      <input
        id="archivo"
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpeg,.jpg"
        className="sr-only"
        onChange={(event) => {
          onFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      {ready && !dragOver ? (
        /* Con el archivo puesto deja de ser una caja para soltar: es una lista de lo que ya está listo. */
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
          <div className="flex items-center gap-3 px-4 py-3">
            <FileCheck />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{file?.name ?? savedName}</span>
              <span className="block text-sm text-ink-soft">{hint}</span>
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="min-h-11 shrink-0 cursor-pointer px-1 text-sm font-medium text-pick-deep underline-offset-4 hover:underline"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={() => onFile(null)}
              className="min-h-11 shrink-0 cursor-pointer px-1 text-sm font-medium text-alert-deep underline-offset-4 hover:underline"
            >
              Eliminar
            </button>
          </div>
          {file && isPreviewImage(file) ? (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ink-soft">Colocar la imagen en</span>
              <div className="flex gap-2" role="group" aria-label="Dónde va la imagen">
                {(
                  [
                    ["front", "Frente"],
                    ["back", "Reverso"],
                  ] as const
                ).map(([side, label]) => (
                  <button
                    key={side}
                    type="button"
                    aria-pressed={imageFaces[side]}
                    onClick={() => onPlace(side)}
                    className={`min-h-9 cursor-pointer rounded-full border px-3.5 text-sm font-medium transition-colors ${
                      imageFaces[side]
                        ? "border-pick bg-pick-soft text-pick-deep"
                        : "border-line bg-sheet text-ink-soft hover:border-pick-line hover:bg-pick-wash"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <label
          htmlFor="archivo"
          onDragOver={(event) => {
            event.preventDefault();
            onDragOver();
          }}
          onDragLeave={onDragLeave}
          onDrop={(event) => {
            event.preventDefault();
            onDragLeave();
            onFile(event.dataTransfer.files?.[0] ?? null);
          }}
          className={`mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 px-5 py-6 text-center transition-colors ${
            dragOver
              ? "border-solid border-pick bg-pick-soft"
              : invalid
                ? "border-dashed border-alert bg-alert-soft"
                : "border-dashed border-pick-line bg-pick-wash hover:border-pick hover:bg-pick-soft"
          }`}
        >
          <DropGlyph dragOver={dragOver} invalid={invalid} />
          <span className="mt-3 max-w-full truncate text-sm font-semibold text-ink">{title}</span>
          <span className={`mt-1 text-sm ${invalid ? "font-medium text-alert-deep" : "text-ink-soft"}`}>{hint}</span>
        </label>
      )}
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-sm font-medium">¿Todavía no tienes el arte?</p>
        <a
          href="https://www.canva.com/es_419/crear/tarjetas-de-presentacion/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex items-center gap-3 rounded-2xl border border-ink/10 bg-sheet px-3.5 py-3 shadow-[0_8px_24px_-18px_rgba(26,29,33,0.9)] transition hover:border-ink/25"
        >
          <img src="/canva.png" alt="" width={40} height={40} className="size-10 shrink-0 rounded-full" />
          <span className="min-w-0 text-left">
            <span className="block text-sm font-semibold text-ink">Diseñar en Canva</span>
            <span className="mt-0.5 block text-sm leading-5 text-ink-soft">Se abre en otra pestaña. Exporta el PDF y súbelo aquí.</span>
          </span>
        </a>
        <a href={href} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-pick-deep underline-offset-4 hover:underline">
          <PdfIcon />
          Plantilla {sizeName}, {sizeLabel}
          {rounded ? ", con puntas redondeadas" : ""}
        </a>
      </div>
    </section>
  );
}

/* Verde: el archivo ya está, es una confirmación, no una selección. */
function FileCheck() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-press text-white" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M4.5 9.2 7.4 12 13.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function DropGlyph({ dragOver, invalid }: { dragOver: boolean; invalid: boolean }) {
  const tone = dragOver ? "text-pick-deep" : invalid ? "text-alert" : "text-pick";
  return (
    <span className={`flex size-10 items-center justify-center rounded-full bg-sheet ${tone}`} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 12.5V4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M6 7.2 9 4.2l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 14.2h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function isPreviewImage(file: File): boolean {
  return file.type === "image/png" || file.type === "image/jpeg" || /\.(png|jpe?g)$/i.test(file.name);
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

const SPECS = [
  ["Material", "Couche 300 g"],
  ["Papel", "Mate | Brillante"],
  ["Impresión", "A todo color"],
  ["Caras", "1 lado | 2 lados"],
  ["Tamaños", "Clásica 85 × 55 mm | Cuadrada 55 × 55 mm"],
  ["Corte", "Esquinas rectas | Puntas redondeadas"],
  ["Acabados", "Laminado mate o brillante | UV selectivo"],
  ["Técnica", "Impresión digital"],
] as const;

const DESIGN_RULES = [
  "Usa la plantilla del tamaño que vas a pedir.",
  "Trabaja en CMYK. Un archivo RGB se convierte y el color puede cambiar.",
  "Imágenes a 300 ppp, al tamaño real.",
  "Deja 3 mm de sangrado y 4 mm de margen de seguridad.",
  "Texto de al menos 6 pt y líneas de al menos 0,25 pt.",
  "Configura el archivo sin sobreimpresión.",
  "La cobertura de tinta no debe pasar del 300 %.",
  "Evita un marco pegado al borde: el corte puede comerlo.",
  "Si pides puntas redondeadas, aparta el contenido de las esquinas.",
  "PDF, PNG o JPG, hasta 8 MB. Puedes pedirlo ahora y mandar el arte después.",
] as const;

const TEMPLATES = [
  { name: "Clásica (85 × 55 mm)", href: "/plantilla/85x55?puntas=0" },
  { name: "Clásica, puntas redondeadas", href: "/plantilla/85x55?puntas=1" },
  { name: "Cuadrada (55 × 55 mm)", href: "/plantilla/55x55?puntas=0" },
  { name: "Cuadrada, puntas redondeadas", href: "/plantilla/55x55?puntas=1" },
] as const;

const QUESTIONS = [
  {
    q: "¿Qué es este producto?",
    a: "Tarjetas de presentación en cartulina couche de 300 g. Sirven para dejar nombre, cargo y un contacto.",
  },
  {
    q: "¿A dónde se envían?",
    a: "Por ahora solo a Quito y los valles. El costo depende del peso y te lo confirmamos por WhatsApp.",
  },
  {
    q: "¿Qué materiales hay?",
    a: "Couche de 300 g, mate o brillante. El laminado y el UV selectivo se agregan aparte.",
  },
  {
    q: "¿Cuál es el plazo más corto?",
    a: "La entrega exprés sale entre 2 y 3 días hábiles en Quito y los valles. Es un recargo de demostración. Sin archivo, el plazo empieza cuando lo recibimos.",
  },
  {
    q: "¿Cómo se imprimen?",
    a: "Impresión digital a color, a un lado o a dos. Esas dos opciones no se suman: eliges una.",
  },
  {
    q: "¿Llegan plegadas?",
    a: "No. Son tarjetas planas, clásicas o cuadradas.",
  },
  {
    q: "¿Cuánto puede variar el corte?",
    a: "El corte se mueve un poco. Por eso el texto y los logos van al menos a 4 mm del borde, con 3 mm de sangrado.",
  },
  {
    q: "¿Se pueden perforar?",
    a: "No en este producto.",
  },
] as const;

function DesignNotes() {
  return (
    <div className="border-t border-line">
      <Note title="Descripción" open>
        <p className="text-ink">
          Tarjetas para dejar un dato claro en una reunión o un mostrador. {PRODUCT.summary} Eliges el tamaño, la cantidad y los acabados en esta página. El precio ya está en dólares y el envío solo cubre Quito y los valles.
        </p>
        <ul className="mt-5 space-y-3">
          {["Impresión digital a color", "Couche 300 g, mate o brillante", "Envío en Quito y los valles"].map((item) => (
            <li key={item} className="flex items-center gap-3 text-ink">
              <FeatureCheck />
              {item}
            </li>
          ))}
        </ul>
      </Note>
      <Note title="Especificaciones del producto">
        <dl className="overflow-hidden rounded-lg border border-line text-ink">
          {SPECS.map(([label, value], index) => (
            <div key={label} className={`grid grid-cols-[9.5rem_minmax(0,1fr)] gap-4 px-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] ${index % 2 === 0 ? "bg-paper-deep" : "bg-sheet"}`}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </Note>
      <Note title="Normas de diseño">
        <ul className="space-y-2.5 text-ink">
          {DESIGN_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <div className="mt-5 overflow-hidden rounded-lg border border-line">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-paper-deep px-4 py-3 font-medium text-ink">
            <span>Guía</span>
            <span>PDF</span>
          </div>
          {TEMPLATES.map((template, index) => (
            <div key={template.href} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 ${index % 2 === 0 ? "bg-sheet" : "bg-paper-deep"}`}>
              <span className="text-ink">{template.name}</span>
              <a href={template.href} className="inline-flex items-center gap-1.5 font-medium text-pick-deep underline-offset-4 hover:underline">
                <PdfIcon />
                PDF
              </a>
            </div>
          ))}
        </div>
      </Note>
      <Note title="Preguntas frecuentes">
        <div>
          {QUESTIONS.map((item) => (
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
      <Note title="Proceso de pedido">
        <ul className="space-y-3">
          <li>
            <a href="#tu-diseno" className="font-medium text-ink underline-offset-4 hover:underline">
              Pedidos con diseño propio
            </a>
          </li>
          <li>
            <a
              href="https://www.canva.com/es_419/crear/tarjetas-de-presentacion/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline-offset-4 hover:underline"
            >
              Diseñar en Canva y subir el PDF
            </a>
          </li>
        </ul>
      </Note>
    </div>
  );
}

function Note({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-base font-semibold">
        <span>{title}</span>
        <Chevron />
      </summary>
      <div className="pb-5 text-sm leading-6 text-ink-soft">{children}</div>
    </details>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="disclosure-mark shrink-0 text-ink-soft transition-transform duration-200">
      <path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Visto, no un más: el círculo con cruz parecía un botón para desplegar algo. */
function FeatureCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0 text-press">
      <circle cx="9" cy="9" r="8" fill="currentColor" />
      <path d="M5.4 9.2 7.9 11.7 12.6 6.6" fill="none" stroke="var(--sheet)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
      <path d="M6 1.5h7.2L19 7.2V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V3A1.5 1.5 0 0 1 6.5 1.5H6Z" fill="#e11d2e" />
      <path d="M13.2 1.5V6a1.2 1.2 0 0 0 1.2 1.2H19" fill="#ff8a93" />
      <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="5.5" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
        PDF
      </text>
    </svg>
  );
}

function QuoteSummary({
  config,
  priced,
  missing,
  sizeName,
  sizeLabel,
  pending,
  editing,
  disabled,
  error,
  onCommit,
}: {
  config: Configuration;
  priced: Quote;
  missing: string[];
  sizeName: string;
  sizeLabel: string;
  pending: boolean;
  editing: boolean;
  disabled: boolean;
  error: string | null;
  onCommit: () => void;
}) {
  const count = config.quantity.toLocaleString("es-EC");
  /* Mientras falte algo por elegir el total es un "desde", no una cuenta cerrada. */
  const open = missing.length > 0;

  return (
    <section aria-label="Resumen del precio" className="overflow-hidden rounded-[28px] border border-line bg-sheet shadow-[0_18px_44px_-28px_rgba(26,29,33,0.55)]">
      <div className="px-5 pt-5">
        <p className="text-sm text-ink-soft">Tu pedido</p>
        <h2 className="mt-1 text-[1.65rem] font-medium leading-tight tracking-tight">
          {open ? "Tu tarjeta" : `${count} tarjetas`}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-ink-soft">
          {open
            ? "El precio se arma mientras eliges."
            : `${sizeName}, ${sizeLabel} · ${config.sides === 1 ? "un lado" : "dos lados"} · papel ${config.paper}`}
        </p>
      </div>
      {open ? (
        <ul className="mt-4 space-y-2.5 border-t border-line px-5 py-4 text-sm">
          {missing.map((step) => (
            <li key={step} className="flex items-center gap-2.5 text-ink-soft">
              <span className="size-1.5 shrink-0 rounded-full bg-line" aria-hidden="true" />
              Falta {STEP_NAMES[step]}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 space-y-2.5 border-t border-line px-5 py-4 text-sm">
          {priced.lines.map((line) => (
            <li key={line.label} className="flex items-baseline justify-between gap-4">
              <span className="text-ink-soft">{line.label}</span>
              <span className={`shrink-0 tabular-nums ${line.included ? "font-medium text-press-deep" : "font-medium"}`}>
                {line.included ? "Incluido" : formatUsd(line.cents)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-line bg-paper-deep/70 px-5 py-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{open ? "Desde" : "Total"}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {open ? `${count} tarjetas` : `${formatUsd(priced.unitCents)} cada una`}
            </p>
          </div>
          <p key={priced.totalCents} className="price-tick text-[2.65rem] font-medium leading-none tracking-tight tabular-nums" aria-live="polite">
            {formatUsd(priced.totalCents)}
          </p>
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4 text-sm">
          <span className="text-ink-soft">Envío en Quito y valles</span>
          <span className="font-medium">Se calcula al pagar</span>
        </div>
        {error ? (
          <p role="alert" className="mt-3 hidden text-sm font-medium text-alert-deep lg:block">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onCommit}
          disabled={disabled || open}
          aria-busy={pending}
          className="mt-5 hidden min-h-12 w-full cursor-pointer rounded-full bg-press px-5 text-base font-medium text-white transition hover:bg-press-deep disabled:cursor-not-allowed disabled:opacity-60 lg:inline-flex lg:items-center lg:justify-center"
        >
          {open
            ? `Falta elegir ${STEP_NAMES[missing[0]]}`
            : pending
              ? "Guardando…"
              : editing
                ? "Actualizar pedido"
                : "Agregar al pedido"}
        </button>
      </div>
    </section>
  );
}

function OptionGroup({
  step,
  legend,
  value,
  hint,
  children,
}: {
  step: string;
  legend: string;
  value?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset data-step={step} className="scroll-mt-4">
      <legend className="text-sm font-medium">
        {legend}
        {value ? <span className="font-semibold text-pick-deep">: {value}</span> : null}
      </legend>
      {hint ? <p className="mt-1 mb-3 text-sm leading-6 text-ink-soft">{hint}</p> : <div className="mb-3" />}
      {children}
    </fieldset>
  );
}

/** Etiqueta de esquina. Ámbar porque el azul ya significa "esto elegiste" y el verde, "ahorro". */
function CornerTag({ children }: { children: string }) {
  return (
    <span className="absolute left-0 top-0 rounded-br-xl bg-flag px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-flag-ink">
      {children}
    </span>
  );
}

/*
 * El relleno verde se ve sucio sobre la fila azul elegida, así que ahí la pastilla
 * pasa a blanca: el ahorro sigue en verde pero deja de pelear con el fondo.
 */
function SavingTag({ percent, onPick }: { percent: number; onPick: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold text-press-deep ${
        onPick ? "bg-sheet" : "bg-moss-soft"
      }`}
    >
      Ahorras {percent} %
    </span>
  );
}

function CheckMark() {
  return (
    <span
      className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-pick text-white"
      aria-hidden="true"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Tile({
  name,
  checked,
  onChange,
  title,
  detail,
  glyph,
  tag,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
  glyph: React.ReactNode;
  tag?: string;
}) {
  return (
    <label
      className={`relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-2xl border-2 px-3 pb-4 text-center transition-colors has-[:focus-visible]:border-pick has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pick-line ${
        tag ? "pt-7" : "pt-4"
      } ${checked ? "border-pick bg-pick-soft" : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"}`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {tag ? <CornerTag>{tag}</CornerTag> : null}
      {checked ? <CheckMark /> : null}
      <span
        className={`flex h-16 items-center justify-center ${checked ? "text-ink" : "text-ink-soft"}`}
        style={{ "--glyph-bg": checked ? "var(--pick-soft)" : "var(--sheet)" } as React.CSSProperties}
        aria-hidden="true"
      >
        {glyph}
      </span>
      <span className={`mt-1 text-sm leading-5 ${checked ? "font-semibold" : "font-medium"}`}>
        {title}
      </span>
      {/* El verde es el color del dinero en el sitio, así que "Incluido" se lee solo. */}
      <span
        className={`text-sm leading-5 ${
          detail === "Incluido" ? "font-medium text-press-deep" : "text-ink-soft"
        }`}
      >
        {detail}
      </span>
    </label>
  );
}

/** Rectángulo a escala: el lado largo de la clásica mide 60 px y la cuadrada baja a 39. */
function SizeGlyph({ square }: { square: boolean }) {
  const width = square ? 39 : 60;
  const height = 39;
  return (
    <svg width="72" height="52" viewBox="0 0 72 52" fill="none">
      <rect
        x={(72 - width) / 2}
        y={(52 - height) / 2}
        width={width}
        height={height}
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SidesGlyph({ double }: { double: boolean }) {
  return (
    <svg width="62" height="52" viewBox="0 0 62 52" fill="none">
      <rect x="14" y="5" width="34" height="42" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <text x="20" y="20" fontSize="12" fill="currentColor">
        1
      </text>
      {double ? (
        <>
          <path d="M48 26 28 47h20z" fill="var(--glyph-bg, var(--sheet))" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <text x="37" y="44" fontSize="12" fill="currentColor">
            2
          </text>
        </>
      ) : null}
    </svg>
  );
}

function PaperGlyph({ glossy }: { glossy: boolean }) {
  return (
    <svg width="62" height="52" viewBox="0 0 62 52" fill="none">
      <rect x="13" y="7" width="36" height="38" rx="2" stroke="currentColor" strokeWidth="1.5" />
      {glossy ? (
        <path d="M20 38 42 14" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.25" />
      ) : (
        <path
          d="M20 19h22M20 26h22M20 33h14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
      )}
    </svg>
  );
}

function LaminateGlyph({ glossy }: { glossy: boolean }) {
  return (
    <svg width="62" height="52" viewBox="0 0 62 52" fill="none">
      <rect x="8" y="12" width="34" height="34" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
      <rect x="18" y="6" width="34" height="34" rx="2" fill="var(--glyph-bg, var(--sheet))" stroke="currentColor" strokeWidth="1.5" />
      {glossy ? (
        <Sparkle x={35} y={23} size={9} />
      ) : (
        <path d="M44 32 52 40h-8z" fill="var(--glyph-bg, var(--sheet))" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function UvGlyph() {
  return (
    <svg width="62" height="52" viewBox="0 0 62 52" fill="none">
      <rect x="13" y="7" width="36" height="38" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="21" y="17" width="20" height="18" rx="1.5" fill="currentColor" opacity="0.14" />
      <Sparkle x={31} y={26} size={9} />
    </svg>
  );
}

function Sparkle({ x, y, size = 8 }: { x: number; y: number; size?: number }) {
  return (
    <path
      d={`M${x} ${y - size}c1.3 ${size * 0.72} 2.4 ${size * 0.84} ${size} ${size}-${size * 0.72} 1.3-${size * 0.84} 2.4-${size} ${size}-1.3-${size * 0.72}-2.4-${size * 0.84}-${size}-${size} ${size * 0.72}-1.3 ${size * 0.84}-2.4 ${size}-${size}z`}
      fill="currentColor"
    />
  );
}

function CornerGlyph({ rounded }: { rounded: boolean }) {
  return (
    <svg width="62" height="52" viewBox="0 0 62 52" fill="none">
      <path d="M18 47V15h30" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {rounded ? (
        <path d="M18 45V28a13 13 0 0 1 13-13h16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <path d="M18 45V15h29" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" />
      )}
    </svg>
  );
}

function NoneGlyph() {
  return (
    <svg width="62" height="52" viewBox="0 0 62 52" fill="none">
      <circle cx="31" cy="26" r="17" stroke="currentColor" strokeWidth="2.5" />
      <path d="M19 38 43 14" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
