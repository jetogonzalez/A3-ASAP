"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CardPreview } from "@/components/card-preview";
import { useCart } from "@/components/cart-provider";
import { FinishSwatch, type SwatchFaces } from "@/components/finish-swatch";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { LightStage } from "@/components/light-stage";
import { ProductGallery } from "@/components/product-gallery";
import { StickyColumn } from "@/components/sticky-column";
import type { CartItemInput } from "@/lib/schema";
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
import { DELIVERY_OPTIONS, deliveryWindow, formatLongDate, formatShortDate } from "@/lib/delivery";
import { EXTRA_KILO_CENTS, FIRST_KILO_CENTS, shippingQuote } from "@/lib/ecuador";
import { formatUsd } from "@/lib/money";
import { upload } from "@vercel/blob/client";
import { ARTWORK_TYPES, CANVA_FILENAME, isCanvaUrl, MAX_ARTWORK_BYTES } from "@/lib/artwork";
import { addonCents, quote, type Quote } from "@/lib/pricing";
import { IVA_LABEL, ivaBreakdown } from "@/lib/tax";
import { safeFilename } from "@/lib/text";
import {
  CANVA_EXPORT_FILENAME,
  canvaStartHref,
  type CanvaDesign,
  type CanvaReturn,
  type CanvaStatus,
} from "@/lib/canva-return";
import { formatWeight, packageGrams } from "@/lib/weight";

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
/* Una o dos caras va segundo: cambia el precio base y cuántos artes necesitas. */
const STEPS = ["tamano", "lados", "papel", "laminado", "uv", "puntas", "cantidad", "entrega"] as const;

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
  uploadsEnabled,
  canvaEnabled = false,
  canvaReturn = null,
  initialPicked = [],
}: {
  initial: Configuration;
  editId?: string;
  orderedAt: string;
  /** Sin Vercel Blob conectado, el arte se ve en la muestra pero se manda por WhatsApp. */
  uploadsEnabled: boolean;
  /** Con la app de Canva conectada, se diseña en Canva y se vuelve con el arte puesto. */
  canvaEnabled?: boolean;
  canvaReturn?: CanvaReturn | null;
  /** Los pasos ya elegidos antes de ir a Canva, para no tener que elegirlos otra vez. */
  initialPicked?: string[];
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
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(editing ? STEPS : initialPicked.filter((step) => (STEPS as readonly string[]).includes(step))),
  );
  const [canvaDesign, setCanvaDesign] = useState<CanvaDesign | null>(canvaReturn?.design ?? null);
  /* Qué forma de enviar el arte está abierta. Al volver de Canva, la de Canva. */
  const [method, setMethod] = useState<ArtworkMethod>(() => {
    if (canvaReturn) return "canva";
    if (editing?.artwork?.source === "canva") return "enlace";
    if (editing?.artwork) return "archivo";
    return canvaEnabled ? "canva" : "archivo";
  });
  const missing = STEPS.filter((step) => !picked.has(step));
  const [imageFaces, setImageFaces] = useState<{ front: boolean; back: boolean }>({ front: true, back: false });
  const [file, setFile] = useState<File | null>(null);
  /* El enlace de Canva es la otra forma de mandar el diseño desde la página. */
  const [canvaUrl, setCanvaUrl] = useState(editing?.artwork?.source === "canva" ? editing.artwork.url : "");
  const canvaReady = isCanvaUrl(canvaUrl);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priced = useMemo(() => quote(config), [config]);
  /* Cada opción se muestra sobre el diseño del cliente, con esa opción aplicada. */
  function facesWith(variant: Partial<Configuration>): SwatchFaces {
    const next = { ...config, ...variant };
    return {
      front: <CardPreview config={next} face="front" fill artworkUrl={previewFront} />,
      back: <CardPreview config={next} face="back" fill artworkUrl={previewBack} />,
    };
  }

  /* Lo que paga por esta tanda: impresión, entrega y envío. El envío va dentro del total, no aparte. */
  const shipping = shippingQuote(packageGrams(config));
  const grandCents = priced.totalCents + shipping.cents;
  const addons = addonCents(config.sizeId, config.quantity);
  const size = SIZES[config.sizeId];
  /* Base para comparar el precio por unidad de cada tirada. */
  const smallestRun = useMemo(() => quote({ ...config, quantity: QUANTITIES[0] }), [config]);
  /* Lo que suma imprimir el reverso con lo demás que ya elegiste. */
  const doubleSideExtra =
    quote({ ...config, sides: 2 }).printingCents - quote({ ...config, sides: 1 }).printingCents;

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

  /* La vista previa se arma al elegir el archivo y se suelta al cambiarlo o al salir. */
  const previewRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function showPreview(next: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next && isPreviewImage(next) ? URL.createObjectURL(next) : null;
    setArtworkUrl(previewRef.current);
  }

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

  /*
   * Un paso se abre cuando eliges el anterior: así la persona sigue un camino y
   * no tiene que adivinar por dónde empezar. Lo ya elegido queda siempre abierto.
   */
  const firstMissing = STEPS.findIndex((step) => !picked.has(step));
  function stepState(step: (typeof STEPS)[number]): StepState {
    const index = STEPS.indexOf(step);
    const status = picked.has(step) ? "done" : index === firstMissing ? "current" : "locked";
    return { number: index + 1, status, waitFor: index > 0 ? STEP_NAMES[STEPS[index - 1]] : "" };
  }

  function takeFile(next: File | null) {
    setError(null);
    if (!next) {
      setFile(null);
      showPreview(null);
      setImageFaces({ front: true, back: false });
      return;
    }
    if (next.type && !ARTWORK_TYPES.some((type) => type === next.type)) {
      setError("Solo PDF, PNG o JPG.");
      return;
    }
    if (next.size > MAX_ARTWORK_BYTES) {
      setError("El archivo supera 8 MB.");
      return;
    }
    setFile(next);
    showPreview(next);
    if (isPreviewImage(next)) {
      document.getElementById("muestra")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /* La muestra enseña el arte de la forma elegida: el archivo propio o lo que volvió de Canva. */
  const previewFront =
    method === "archivo" ? (artworkUrl && imageFaces.front ? artworkUrl : null) : method === "canva" ? (canvaDesign?.front ?? null) : null;
  const previewBack =
    method === "archivo" ? (artworkUrl && imageFaces.back ? artworkUrl : null) : method === "canva" ? (canvaDesign?.back ?? null) : null;
  const artworkReady =
    method === "canva"
      ? Boolean(canvaDesign)
      : method === "archivo"
        ? Boolean((uploadsEnabled && file) || (!file && editing?.artwork?.source === "archivo"))
        : method === "enlace"
          ? canvaReady
          : false;

  async function commit() {
    if (missing.length > 0) return;
    if (method === "enlace" && canvaUrl.trim() && !canvaReady) {
      setError("Ese enlace no es de Canva. Cópialo desde Compartir en tu diseño.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      /* Lo que viaja con el pedido sale de la forma elegida; las otras quedan guardadas por si vuelve. */
      const kept = editing?.artwork ?? null;
      let artwork: CartItemInput["artwork"] = null;
      if (method === "canva") {
        artwork = canvaDesign
          ? { source: "archivo", url: canvaDesign.pdf, filename: CANVA_EXPORT_FILENAME }
          : null;
      } else if (method === "archivo") {
        if (file && uploadsEnabled) {
          const filename = safeFilename(file.name);
          const blob = await upload(`artes/${filename}`, file, {
            access: "public",
            handleUploadUrl: "/api/arte",
            contentType: file.type || undefined,
          });
          artwork = { source: "archivo", url: blob.url, filename };
        } else if (!file && kept?.source === "archivo") {
          artwork = kept;
        }
      } else if (method === "enlace" && canvaReady) {
        artwork = { source: "canva", url: canvaUrl.trim(), filename: CANVA_FILENAME };
      }
      if (editing) cart.updateItem(editing.id, config, artwork);
      else cart.addItem(config, artwork);
      router.push("/carrito");
    } catch {
      setError("No pudimos subir el archivo. Inténtalo de nuevo o elige enviarlo por WhatsApp.");
      setPending(false);
    }
  }

  return (
    <>
    {/*
      * En escritorio la ficha va debajo de la galería y la columna acompaña el
      * scroll. En el teléfono va al final: primero se arma la tarjeta.
      */}
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      {/*
        * La muestra acompaña mientras eliges: en escritorio queda fija arriba y
        * cada opción que tocas a la derecha se ve en ella sin tener que subir.
        */}
      <StickyColumn className="space-y-8 lg:col-start-1 lg:row-start-1">
      <div>
        {/*
          * Las dos caras a la vez. Con un interruptor Frente/Reverso había que
          * descubrir que existía una segunda cara; así se ve de una.
          */}
        <ProductGallery config={config} front={previewFront} back={previewBack}>
          <LightStage
            id="muestra"
            className="flex min-h-[340px] scroll-mt-28 touch-pan-y flex-col items-center justify-center gap-6 rounded-[28px] bg-paper-deep/70 px-8 py-12 sm:flex-row sm:gap-5"
          >
            <figure className="flex w-full min-w-0 flex-1 flex-col items-center gap-2.5">
              <CardPreview
                config={config}
                face="front"
                pair={config.sides === 2}
                artworkUrl={previewFront}
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
                  artworkUrl={previewBack}
                />
                <figcaption className="text-sm text-ink-soft">Reverso</figcaption>
              </figure>
            ) : null}
          </LightStage>
        </ProductGallery>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
          <p>
            {size.sizeLabel} · {config.paper}
            {config.rounded ? " · puntas redondeadas" : ""}
            {config.uv ? " · el rectángulo claro es el UV" : ""}
            <span className="hidden sm:inline"> · pasa el cursor para ver el brillo</span>
          </p>
          <p>{config.sides === 2 ? "Dos lados" : "Un lado"}</p>
        </div>
      </div>
        <div className="hidden lg:block">
          <DesignNotes />
        </div>
      </StickyColumn>

      <div className="space-y-8 pb-28 lg:col-start-2 lg:row-start-1 lg:pb-0">
        {/* El arte es el primer paso: todo lo demás se ve sobre tu diseño. */}
        <ArtworkPanel
          method={method}
          onMethod={(next) => {
            setError(null);
            setMethod(next);
          }}
          file={file}
          savedName={editing?.artwork?.source === "archivo" ? editing.artwork.filename : undefined}
          uploadsEnabled={uploadsEnabled}
          canvaUrl={canvaUrl}
          canvaReady={canvaReady}
          canvaStartHref={
            canvaEnabled
              ? canvaStartHref(config, editId, Array.from(picked))
              : null
          }
          twoSided={config.sides === 2}
          canvaDesign={canvaDesign}
          canvaStatus={canvaReturn?.status ?? null}
          onCanvaRemove={() => setCanvaDesign(null)}
          onCanvaUrl={(value) => {
            setError(null);
            setCanvaUrl(value);
          }}
          dragOver={dragOver}
          onDragOver={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onFile={takeFile}
          sizeId={config.sizeId}
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
        <OptionGroup step="tamano" state={stepState("tamano")} legend="Tamaño" value={picked.has("tamano") ? size.sizeLabel : undefined} hint="Las dos medidas que imprimimos hoy. El dibujo está a escala.">
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

        <OptionGroup
          step="lados" state={stepState("lados")}
          legend="Opción de impresión"
          value={picked.has("lados") ? (config.sides === 1 ? "A una cara" : "A doble cara") : undefined}
          hint="Define el precio base y si necesitas uno o dos diseños. Las dos opciones no se suman."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile
              name="lados"
              checked={on("lados", config.sides === 1)}
              onChange={() => choose("lados", { sides: 1 })}
              title="A una cara"
              detail="Incluido"
              media={<FinishSwatch kind="una-cara" faces={facesWith({ sides: 1 })} />}
            />
            <Tile
              name="lados"
              checked={on("lados", config.sides === 2)}
              onChange={() => choose("lados", { sides: 2 })}
              title="A doble cara"
              detail={`+ ${formatUsd(doubleSideExtra)}`}
              tag="Más vendido"
              media={<FinishSwatch kind="doble-cara" faces={facesWith({ sides: 2 })} />}
            />
          </div>
        </OptionGroup>

        <OptionGroup step="papel" state={stepState("papel")} legend="Tipo de papel" value={picked.has("papel") ? (config.paper === "mate" ? "Mate" : "Brillante") : undefined} hint="Couche 300 g. Ya está incluido en la impresión.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile
              name="papel"
              checked={on("papel", config.paper === "mate")}
              onChange={() => choose("papel", { paper: "mate" })}
              title="Mate"
              detail="Incluido"
              tag="Más vendido"
              media={<FinishSwatch kind="papel-mate" faces={facesWith({ paper: "mate", laminate: "none" })} />}
            />
            <Tile
              name="papel"
              checked={on("papel", config.paper === "brillante")}
              onChange={() => choose("papel", { paper: "brillante" })}
              title="Brillante"
              detail="Incluido"
              media={<FinishSwatch kind="papel-brillante" faces={facesWith({ paper: "brillante", laminate: "none" })} />}
            />
          </div>
        </OptionGroup>

        <OptionGroup
          step="laminado" state={stepState("laminado")}
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
              media={<FinishSwatch kind="sin-laminado" faces={facesWith({ laminate: "none" })} />}
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
                media={<FinishSwatch kind={finish === "mate" ? "laminado-mate" : "laminado-brillante"} faces={facesWith({ laminate: finish })} />}
              />
            ))}
          </div>
        </OptionGroup>

        <OptionGroup
          step="uv" state={stepState("uv")}
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
              media={<FinishSwatch kind="sin-uv" faces={facesWith({ uv: false })} />}
            />
            <Tile
              name="uv"
              checked={on("uv", config.uv)}
              onChange={() => choose("uv", { uv: true })}
              title="UV selectivo"
              detail={`+ ${formatUsd(addons.uv)}`}
              media={<FinishSwatch kind="uv" faces={facesWith({ uv: true })} />}
            />
          </div>
        </OptionGroup>


        <OptionGroup step="puntas" state={stepState("puntas")} legend="Esquinas" value={picked.has("puntas") ? (config.rounded ? "Redondeadas" : "Rectas") : undefined}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile
              name="puntas"
              checked={on("puntas", !config.rounded)}
              onChange={() => choose("puntas", { rounded: false })}
              title="Rectas"
              detail="Incluido"
              media={<FinishSwatch kind="esquina-recta" faces={facesWith({ rounded: false })} />}
            />
            <Tile
              name="puntas"
              checked={on("puntas", config.rounded)}
              onChange={() => choose("puntas", { rounded: true })}
              title="Redondeadas"
              detail={`+ ${formatUsd(addons.corners)}`}
              media={<FinishSwatch kind="esquina-redonda" faces={facesWith({ rounded: true })} />}
            />
          </div>
        </OptionGroup>

        <OptionGroup
          step="cantidad" state={stepState("cantidad")}
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
                (1 - row.printingCents / quantity / (smallestRun.printingCents / QUANTITIES[0])) * 100,
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
                      {formatUsd(row.printingCents)}
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
          state={stepState("entrega")}
          hasArtwork={artworkReady}
          onChange={(delivery) => choose("entrega", { delivery })}
        />
        <div ref={summaryRef} data-step="resumen" className="scroll-mt-4">
          <QuoteSummary
            config={config}
            priced={priced}
            shippingCents={shipping.cents}
            shippingGrams={shipping.grams}
            grandCents={grandCents}
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

      <div className="lg:hidden">
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
              {missing.length > 0 ? "Desde · " : "Total · "}
              {config.quantity.toLocaleString("es-EC")} tarjetas con envío e IVA
              <span className="hidden lg:inline">
                {" "}
                · {size.name}, {size.sizeLabel} · {config.sides === 1 ? "un lado" : "dos lados"} · papel{" "}
                {config.paper}
              </span>
            </p>
            <p
              key={grandCents}
              className="price-tick font-display text-2xl leading-none tabular-nums"
              aria-live="polite"
            >
              {formatUsd(grandCents)}
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
  state,
}: {
  orderedAt: string;
  state: StepState;
  selected: DeliveryId | null;
  hasArtwork: boolean;
  onChange: (delivery: DeliveryId) => void;
}) {
  return (
    <fieldset data-step="entrega" disabled={state.status === "locked"} className={`step scroll-mt-4 ${state.status === "locked" ? "is-locked" : ""}`}>
      <StepLegend state={state} legend="Fecha de entrega estimada" />
      <p className="mt-1 mb-3 text-sm leading-6 text-ink-soft">
        Adelantar la entrega cuesta más. El recargo va una vez por pedido y se suma al total.
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
              /*
               * Todas del mismo alto. Antes la fecha larga partía el renglón en
               * unas filas y en otras no, y la columna quedaba desalineada.
               */
              className={`relative flex min-h-20 cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl border-2 px-4 py-3 transition-colors ${
                checked
                  ? "border-pick bg-pick-soft"
                  : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <input
                  type="radio"
                  name="entrega"
                  checked={checked}
                  onChange={() => onChange(option.id)}
                  className="control control-radio"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    <span className={`size-2 rounded-full ${option.tone}`} aria-hidden="true" />
                    {option.name}
                  </span>
                  <span className={`mt-0.5 block ${checked ? "font-semibold" : "font-medium"}`}>
                    {formatLongDate(window.earliest)}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-soft">
                    A más tardar, {formatShortDate(window.latest)}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                {fastest ? (
                  <span className="rounded-full bg-flag px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-flag-ink">
                    Más rápida
                  </span>
                ) : null}
                <span className={`text-sm font-medium tabular-nums ${option.cents === 0 ? "text-moss" : ""}`}>
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

type ArtworkMethod = "canva" | "archivo" | "enlace" | "whatsapp";

/*
 * Cuatro formas de hacernos llegar el arte. Primero se elige una y solo se ve
 * lo de esa: antes estaban todas apiladas y la columna parecía un formulario.
 */
function ArtworkPanel({
  method,
  onMethod,
  file,
  savedName,
  uploadsEnabled,
  canvaUrl,
  canvaReady,
  canvaStartHref: startHref,
  twoSided,
  canvaDesign,
  canvaStatus,
  onCanvaRemove,
  onCanvaUrl,
  dragOver,
  onDragOver,
  onDragLeave,
  onFile,
  sizeId,
  sizeLabel,
  rounded,
  error,
  imageFaces,
  onPlace,
}: {
  method: ArtworkMethod;
  onMethod: (method: ArtworkMethod) => void;
  file: File | null;
  savedName?: string;
  uploadsEnabled: boolean;
  canvaUrl: string;
  canvaReady: boolean;
  canvaStartHref: string | null;
  twoSided: boolean;
  canvaDesign: CanvaDesign | null;
  canvaStatus: CanvaStatus | null;
  onCanvaRemove: () => void;
  onCanvaUrl: (value: string) => void;
  dragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onFile: (file: File | null) => void;
  sizeId: SizeId;
  sizeLabel: string;
  rounded: boolean;
  error: string | null;
  imageFaces: { front: boolean; back: boolean };
  onPlace: (side: "front" | "back") => void;
}) {
  const template = `/plantilla/${sizeId}?puntas=${rounded ? "1" : "0"}`;
  const methods: Array<{ id: ArtworkMethod; label: string; title: string; hint: string; icon: React.ReactNode; done: boolean }> = [
    ...(startHref || canvaDesign
      ? [{ id: "canva" as const, label: "Canva", title: "Diseñar en Canva", hint: "Abrimos un lienzo al tamaño exacto, con sangrado.", icon: <CanvaMark />, done: Boolean(canvaDesign) }]
      : []),
    { id: "archivo", label: "Archivo", title: "Subir archivo", hint: "PDF, PNG o JPG, hasta 8 MB.", icon: <UploadGlyph />, done: Boolean(file || savedName) },
    { id: "enlace", label: "Enlace", title: "Enlace de Canva", hint: "Ya lo tienes hecho: pega el enlace.", icon: <LinkGlyph />, done: canvaReady },
    { id: "whatsapp", label: "WhatsApp", title: "Por WhatsApp", hint: "Lo adjuntas en el chat al finalizar.", icon: <WhatsappLogo brand />, done: false },
  ];
  const activeIndex = Math.max(0, methods.findIndex((option) => option.id === method));
  const active = methods[activeIndex];
  /* Hacia dónde entra el contenido: si eliges una opción a la derecha, llega desde la derecha. */
  const [direction, setDirection] = useState<1 | -1>(1);

  function pick(next: ArtworkMethod) {
    const nextIndex = methods.findIndex((option) => option.id === next);
    setDirection(nextIndex >= activeIndex ? 1 : -1);
    onMethod(next);
  }

  return (
    <section id="tu-diseno" aria-labelledby="tu-diseno-titulo" className="scroll-mt-28 rounded-[28px] border border-line bg-sheet p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="tu-diseno-titulo" className="text-lg font-semibold tracking-tight">
            Tu diseño
          </h2>
          <p className="mt-0.5 text-sm leading-6 text-ink-soft">Elige cómo nos haces llegar el arte. Puedes cambiarlo cuando quieras.</p>
        </div>
      </div>

      {/*
        * Control segmentado: la píldora blanca se desliza hasta la opción elegida.
        * Las columnas miden lo mismo, así que basta con moverla un ancho por índice.
        */}
      <div
        role="radiogroup"
        aria-label="Cómo enviar el diseño"
        className="relative mt-4 grid rounded-2xl bg-paper-deep p-1"
        style={{ gridTemplateColumns: `repeat(${methods.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          className="segment-thumb absolute bottom-1 left-1 top-1 rounded-xl bg-sheet shadow-[0_1px_2px_rgba(26,29,33,0.08),0_6px_16px_-8px_rgba(26,29,33,0.35)]"
          style={{
            width: `calc((100% - 0.5rem) / ${methods.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {methods.map((option) => {
          const checked = method === option.id;
          return (
            <label
              key={option.id}
              className={`segment-option relative z-10 flex min-h-[3.75rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pick-line ${
                checked ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              <input type="radio" name="metodo-diseno" checked={checked} onChange={() => pick(option.id)} className="sr-only" />
              <span className="relative grid size-6 place-items-center" aria-hidden="true">
                {option.icon}
                {option.done ? (
                  <span className="absolute -right-1.5 -top-1 grid size-3.5 place-items-center rounded-full bg-press text-white ring-2 ring-sheet">
                    <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : null}
              </span>
              <span className={`text-xs leading-4 sm:text-[13px] ${checked ? "font-semibold" : "font-medium"}`}>
                {option.label}
                {option.done ? <span className="sr-only"> (listo)</span> : null}
              </span>
            </label>
          );
        })}
      </div>

      <div key={method} className={`segment-panel mt-4 ${direction === 1 ? "from-right" : "from-left"}`}>
        <p className="mb-3 text-sm leading-6">
          <span className="font-semibold">{active?.title}</span>
          <span className="text-ink-soft"> · {active?.hint}</span>
        </p>
        {method === "canva" ? (
          <CanvaBlock startHref={startHref} design={canvaDesign} status={canvaStatus} onRemove={onCanvaRemove} sizeLabel={sizeLabel} twoSided={twoSided} />
        ) : null}

        {method === "archivo" ? (
          <FileDrop
            file={file}
            savedName={savedName}
            uploadsEnabled={uploadsEnabled}
            dragOver={dragOver}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onFile={onFile}
            error={error}
            imageFaces={imageFaces}
            onPlace={onPlace}
          />
        ) : null}

        {/* La plantilla sirve para armar el archivo: va donde se habla de archivos, no arriba suelta. */}
        {method === "archivo" || method === "whatsapp" ? <TemplateTip href={template} sizeLabel={sizeLabel} /> : null}

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
              <span className="font-medium text-ink">Al finalizar te dejamos el chat listo.</span> Adjunta ahí tu PDF, PNG o JPG. La fecha de entrega cuenta desde que lo recibimos.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* La zona para soltar o elegir el archivo, y la lista cuando ya está puesto. */
function FileDrop({
  file,
  savedName,
  uploadsEnabled,
  dragOver,
  onDragOver,
  onDragLeave,
  onFile,
  error,
  imageFaces,
  onPlace,
}: {
  file: File | null;
  savedName?: string;
  uploadsEnabled: boolean;
  dragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onFile: (file: File | null) => void;
  error: string | null;
  imageFaces: { front: boolean; back: boolean };
  onPlace: (side: "front" | "back") => void;
}) {
  const ready = Boolean(file || savedName);
  const invalid = Boolean(error) && !file;
  const inputRef = useRef<HTMLInputElement>(null);
  const title = dragOver ? "Suéltalo aquí" : invalid ? "Revisa el archivo" : file?.name ?? savedName ?? "Arrastra tu archivo o elígelo";
  const hint = dragOver
    ? "PDF, PNG o JPG"
    : invalid
      ? error
      : file
        ? uploadsEnabled
          ? formatFileSize(file.size)
          : `${formatFileSize(file.size)} · solo para la muestra, lo mandas por WhatsApp`
        : savedName
          ? "Ya está en este pedido. Puedes cambiarlo."
          : "PDF, PNG o JPG de hasta 8 MB, con 3 mm de sangrado";

  return (
    <>
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
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
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
              Quitar
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
          className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 px-5 py-6 text-center transition-colors ${
            dragOver
              ? "border-solid border-pick bg-pick-soft"
              : invalid
                ? "border-dashed border-alert bg-alert-soft"
                : "border-dashed border-line bg-paper-deep hover:border-pick hover:bg-pick-wash"
          }`}
        >
          <DropGlyph dragOver={dragOver} invalid={invalid} />
          <span className="mt-3 max-w-full truncate text-sm font-semibold text-ink">{title}</span>
          <span className={`mt-1 text-sm ${invalid ? "font-medium text-alert-deep" : "text-ink-soft"}`}>{hint}</span>
        </label>
      )}
    </>
  );
}

function CanvaMark() {
  /* eslint-disable-next-line @next/next/no-img-element -- logo pequeño y fijo */
  return <img src="/canva.png" alt="" width={24} height={24} className="size-6 rounded-full" />;
}

function UploadGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 12V3.5M5.5 7 9 3.5 12.5 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 11.5v2a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function LinkGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7.6 10.4a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-.9.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10.4 7.6a3 3 0 0 0-4.2 0l-2.3 2.3a3 3 0 0 0 4.2 4.2l.9-.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const CANVA_MESSAGES: Record<Exclude<CanvaStatus, "listo">, string> = {
  cancelado: "No diste permiso en Canva. Puedes intentarlo otra vez o subir tu archivo.",
  error: "No pudimos conectar con Canva. Inténtalo otra vez o sube tu archivo.",
  exportar: "Tu diseño quedó en Canva, pero no pudimos traerlo. Si usaste elementos de pago de Canva, quítalos o descárgalo como PDF y súbelo aquí.",
  apagado: "Diseñar en Canva no está disponible ahora. Sube tu archivo o pega el enlace.",
};

/*
 * Diseñar en Canva sin salir del pedido: se abre un lienzo del tamaño exacto,
 * con sangrado, y al tocar «Volver» el arte aparece en la muestra.
 */
function CanvaBlock({
  startHref,
  design,
  status,
  onRemove,
  sizeLabel,
  twoSided,
}: {
  startHref: string | null;
  design: CanvaDesign | null;
  status: CanvaStatus | null;
  onRemove: () => void;
  sizeLabel: string;
  twoSided: boolean;
}) {
  if (design) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-moss/30 bg-moss-soft px-3.5 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de Vercel Blob, ya del tamaño justo */}
        <img src={design.front} alt="Tu diseño de Canva" className="h-12 w-auto shrink-0 rounded-[3px] border border-ink/10 bg-white" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">Tu diseño de Canva está listo</span>
          <span className="block text-sm text-ink-soft">
            {design.back ? "Frente y reverso" : "Una cara"}, en PDF para imprimir.
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {startHref ? (
            <a href={startHref} className="text-sm font-medium text-pick-deep underline-offset-4 hover:underline">
              Hacer otro
            </a>
          ) : null}
          <button type="button" onClick={onRemove} className="cursor-pointer text-sm font-medium text-alert-deep underline-offset-4 hover:underline">
            Quitar
          </button>
        </span>
      </div>
    );
  }
  if (!startHref) return null;
  return (
    <div className="rounded-2xl border border-line bg-paper-deep p-4">
      <ul className="space-y-1.5 text-sm leading-6 text-ink-soft">
        <li>Lienzo de {sizeLabel} con 3 mm de sangrado, listo para imprenta.</li>
        {twoSided ? <li>Agrega una segunda página para el reverso.</li> : null}
        <li>Al terminar toca «Volver» y tu diseño aparece en la muestra.</li>
      </ul>
      <a
        href={startHref}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#00c4cc] via-[#5a32fa] to-[#7d2ae8] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-14px_rgba(90,50,250,0.9)] transition hover:brightness-110 active:scale-[0.98]"
      >
        Abrir Canva
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M5 2.5h6.5V9M11.5 2.5 3 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      {status && status !== "listo" ? (
        <p role="alert" className="mt-3 text-sm font-medium text-alert-deep">
          {CANVA_MESSAGES[status]}
        </p>
      ) : null}
    </div>
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
  "PDF, PNG o JPG, hasta 8 MB. Puedes pedir ahora y mandar el arte por WhatsApp.",
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
    a: `Por ahora solo a Quito y los valles. El envío se cobra por peso y el total ya lo verás al pagar: ${formatUsd(FIRST_KILO_CENTS)} el primer kilo y ${formatUsd(EXTRA_KILO_CENTS)} por cada kilo adicional, con IVA.`,
  },
  {
    q: "¿Qué materiales hay?",
    a: "Couche de 300 g, mate o brillante. El laminado y el UV selectivo se agregan aparte.",
  },
  {
    q: "¿Cuál es el plazo más corto?",
    a: "La entrega Express llega a tu puerta entre 2 y 3 días hábiles, en Quito y los valles. Se cobra una sola vez por pedido. Sin archivo, el plazo empieza cuando lo recibimos por WhatsApp.",
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
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0 text-brand">
      <circle cx="9" cy="9" r="8" fill="currentColor" />
      <path d="M5.4 9.2 7.9 11.7 12.6 6.6" fill="none" stroke="var(--sheet)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Para quien todavía no tiene el arte: la plantilla con la medida y el sangrado. */
function TemplateTip({ href, sizeLabel }: { href: string; sizeLabel: string }) {
  return (
    <a
      href={href}
      className="press mt-3 flex items-center gap-3 rounded-2xl border border-line px-4 py-3 transition-colors hover:border-ink/25 hover:bg-paper-deep/50"
    >
      <PdfIcon />
      <span className="min-w-0 flex-1 text-sm leading-5">
        <span className="block font-semibold">¿Aún no tienes el arte listo?</span>
        <span className="block text-ink-soft">Descarga la plantilla de {sizeLabel} con el sangrado marcado.</span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-brand">Descargar PDF</span>
    </a>
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
  shippingCents,
  shippingGrams,
  grandCents,
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
  shippingCents: number;
  shippingGrams: number;
  grandCents: number;
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
  const iva = ivaBreakdown(grandCents);

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
        /* Un solo desglose: impresión, acabados, entrega y envío, todos con IVA y en la misma columna. */
        <ul className="mt-4 space-y-2.5 border-t border-line px-5 py-4 text-sm">
          {priced.lines.map((line) => (
            <SummaryLine key={line.label} label={line.label} value={line.included ? "Incluido" : formatUsd(line.cents)} included={line.included} />
          ))}
          <SummaryLine label="Envío Quito y valles" note={formatWeight(shippingGrams)} value={formatUsd(shippingCents)} />
        </ul>
      )}

      <div className="border-t border-line bg-paper-deep/70 px-5 py-5">
        {open ? null : (
          <dl className="mb-4 space-y-1.5 border-b border-line pb-4 text-sm text-ink-soft">
            <div className="flex justify-between gap-4">
              <dt>Subtotal sin IVA</dt>
              <dd className="tabular-nums">{formatUsd(iva.baseCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{IVA_LABEL}</dt>
              <dd className="tabular-nums">{formatUsd(iva.ivaCents)}</dd>
            </div>
          </dl>
        )}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-base font-semibold">{open ? "Desde" : "Total"}</p>
            <p className="mt-0.5 text-sm text-ink-soft">{open ? `${count} tarjetas` : "Con envío e IVA"}</p>
          </div>
          <p key={grandCents} className="price-tick text-[2.65rem] font-medium leading-none tracking-tight tabular-nums" aria-live="polite">
            {formatUsd(grandCents)}
          </p>
        </div>
        {open ? (
          <p className="mt-2 text-xs leading-5 text-ink-soft">Incluye envío en Quito y valles e IVA.</p>
        ) : (
          <p className="mt-2 text-xs leading-5 text-ink-soft">
            {formatUsd(priced.unitCents)} cada tarjeta. Si sumas más tandas, el envío se recalcula por el peso total.
          </p>
        )}
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

function SummaryLine({ label, note, value, included = false }: { label: string; note?: string; value: string; included?: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-4">
      <span className="text-ink-soft">
        {label}
        {note ? <span className="ml-1.5 text-xs">· {note}</span> : null}
      </span>
      <span className={`shrink-0 font-medium tabular-nums ${included ? "text-moss" : ""}`}>{value}</span>
    </li>
  );
}

type StepState = { number: number; status: "done" | "current" | "locked"; waitFor: string };

function OptionGroup({
  step,
  state,
  legend,
  value,
  hint,
  children,
}: {
  step: string;
  state: StepState;
  legend: string;
  value?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const locked = state.status === "locked";
  return (
    <fieldset data-step={step} disabled={locked} className={`step scroll-mt-4 ${locked ? "is-locked" : ""}`}>
      <StepLegend state={state} legend={legend} value={value} />
      {hint ? <p className="mt-1 mb-3 text-sm leading-6 text-ink-soft">{hint}</p> : <div className="mb-3" />}
      {children}
    </fieldset>
  );
}

/** El número del paso: azul el que toca, check verde los hechos, gris los que esperan. */
function StepLegend({ state, legend, value }: { state: StepState; legend: string; value?: string }) {
  return (
    <legend className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium">
      <span
        className={`step-badge grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums ${
          state.status === "done"
            ? "bg-press text-white"
            : state.status === "current"
              ? "bg-pick text-white ring-4 ring-pick-soft"
              : "bg-paper-deep text-ink-soft"
        }`}
        aria-hidden="true"
      >
        {state.status === "done" ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          state.number
        )}
      </span>
      <span className="text-base font-semibold">
        {legend}
        {value ? <span className="text-pick-deep">: {value}</span> : null}
      </span>
      {state.status === "locked" ? (
        <span className="text-xs font-normal text-ink-soft">Primero elige {state.waitFor}</span>
      ) : null}
    </legend>
  );
}

/** Etiqueta de esquina. Ámbar porque el azul ya significa "esto elegiste" y el verde, "ahorro". */
function CornerTag({ children, overlay = false }: { children: string; overlay?: boolean }) {
  return (
    <span
      className={`absolute z-10 bg-flag px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-flag-ink ${
        overlay ? "left-5 top-5 rounded-md shadow-sm" : "left-0 top-0 rounded-br-xl"
      }`}
    >
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
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold text-moss ${
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
      className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-pick text-white"
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
  media,
  tag,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
  /** Un dibujo esquemático, para lo que se entiende con una línea (el tamaño). */
  glyph?: React.ReactNode;
  /** Una muestra del material, para lo que hay que ver para entender (acabados). */
  media?: React.ReactNode;
  tag?: string;
}) {
  return (
    <label
      className={`relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-2xl border-2 px-3 pb-4 text-center transition-colors has-[:focus-visible]:border-pick has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pick-line ${
        /* Con muestra, la etiqueta va encima de la foto: así todas las opciones quedan a la misma altura. */
        media ? "pt-3" : tag ? "pt-7" : "pt-4"
      } ${checked ? "border-pick bg-pick-soft" : "border-line bg-sheet hover:border-pick-line hover:bg-pick-wash"}`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {tag ? <CornerTag overlay={Boolean(media)}>{tag}</CornerTag> : null}
      {checked ? <CheckMark /> : null}
      {media ? (
        <span className="mb-1 block w-full">{media}</span>
      ) : (
        <span
          className={`flex h-16 items-center justify-center ${checked ? "text-ink" : "text-ink-soft"}`}
          style={{ "--glyph-bg": checked ? "var(--pick-soft)" : "var(--sheet)" } as React.CSSProperties}
          aria-hidden="true"
        >
          {glyph}
        </span>
      )}
      <span className={`mt-1 text-sm leading-5 ${checked ? "font-semibold" : "font-medium"}`}>
        {title}
      </span>
      {/* El verde es el color del dinero en el sitio, así que "Incluido" se lee solo. */}
      <span
        className={`text-sm leading-5 ${
          detail === "Incluido" ? "font-medium text-moss" : "text-ink-soft"
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
