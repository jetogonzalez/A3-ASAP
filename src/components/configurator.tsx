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
  const [face, setFace] = useState<"front" | "back">("front");
  const [imageFaces, setImageFaces] = useState<{ front: boolean; back: boolean }>({ front: true, back: false });
  const [file, setFile] = useState<File | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priced = useMemo(() => quote(config), [config]);
  const addons = addonCents(config.sizeId, config.quantity);
  const size = SIZES[config.sizeId];

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
    if (partial.sides === 1) setFace("front");
  }

  function takeFile(next: File | null) {
    setError(null);
    if (!next) {
      setFile(null);
      setImageFaces({ front: true, back: false });
      setFace("front");
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
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="space-y-8">
      <div>
        <div id="muestra" className="flex min-h-[340px] scroll-mt-28 items-center justify-center rounded-[28px] bg-paper-deep/70 px-8 py-12">
          <CardPreview
            config={config}
            face={face}
            artworkUrl={
              artworkUrl && (face === "front" ? imageFaces.front : config.sides === 2 && imageFaces.back)
                ? artworkUrl
                : null
            }
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
          <p>
            {size.sizeLabel} · {config.paper}
            {config.rounded ? " · puntas redondeadas" : ""}
            {config.uv ? " · el rectángulo claro es el UV" : ""}
          </p>
          {config.sides === 2 ? (
            <div className="flex rounded-full bg-paper-deep p-1" role="group" aria-label="Cara de la muestra">
              {(
                [
                  ["front", "Frente"],
                  ["back", "Reverso"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFace(value)}
                  aria-pressed={face === value}
                  className={`min-h-10 cursor-pointer rounded-full px-3 text-sm ${
                    face === value ? "bg-sheet text-ink shadow-sm" : "text-ink-soft"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p>Un lado</p>
          )}
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
          if (side === "back" && turningOn) patch({ sides: 2 });
          setFace(side);
        }}
      />
      <DesignNotes />
      </div>

      <div className="space-y-8 pb-28 lg:pb-0">
        <OptionGroup legend="Formato">
          <div className="grid gap-2 sm:grid-cols-2">
            {SIZE_IDS.map((id) => (
              <Choice
                key={id}
                name="tamano"
                checked={config.sizeId === id}
                onChange={() => patch({ sizeId: id })}
                title={SIZES[id].name}
                detail={SIZES[id].sizeLabel}
              />
            ))}
          </div>
        </OptionGroup>

        <OptionGroup legend="Cantidad" hint="El precio de cada fila ya incluye los acabados que elegiste.">
          <div className="grid gap-2" role="radiogroup" aria-label="Cantidad">
            {QUANTITIES.map((quantity) => {
              const row = quote({ ...config, quantity });
              return (
                <label
                  key={quantity}
                  className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                    config.quantity === quantity
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-sheet hover:border-ink/30"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="cantidad"
                      value={quantity}
                      checked={config.quantity === quantity}
                      onChange={() => patch({ quantity })}
                      className="h-4 w-4 accent-current"
                    />
                    <span className="font-medium">{quantity.toLocaleString("es-EC")} u.</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-medium">{formatUsd(row.totalCents)}</span>
                    <span className={`block text-xs ${config.quantity === quantity ? "text-paper/75" : "text-ink-soft"}`}>
                      {formatUsd(row.unitCents)} c/u
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </OptionGroup>

        <OptionGroup legend="Impresión">
          <div className="grid gap-2 sm:grid-cols-2">
            <Choice
              name="lados"
              checked={config.sides === 1}
              onChange={() => patch({ sides: 1 })}
              title="1 lado"
              detail="Solo el frente"
            />
            <Choice
              name="lados"
              checked={config.sides === 2}
              onChange={() => patch({ sides: 2 })}
              title="2 lados"
              detail="Frente y reverso"
            />
          </div>
        </OptionGroup>

        <OptionGroup legend="Papel" hint="Mate o brillante. Ya está incluido en la impresión.">
          <div className="grid gap-2 sm:grid-cols-2">
            <Choice
              name="papel"
              checked={config.paper === "mate"}
              onChange={() => patch({ paper: "mate" })}
              title="Mate"
              detail="Incluido"
            />
            <Choice
              name="papel"
              checked={config.paper === "brillante"}
              onChange={() => patch({ paper: "brillante" })}
              title="Brillante"
              detail="Incluido"
            />
          </div>
        </OptionGroup>

        <OptionGroup legend="Laminado" hint={`Capa extra. Mismo cargo para mate o brillante: ${formatUsd(addons.laminate)}.`} >
          <div className="grid gap-2">
            <Choice
              name="laminado"
              checked={config.laminate === "none"}
              onChange={() => patch({ laminate: "none" })}
              title="Sin laminado"
              detail={formatUsd(0)}
            />
            {(["mate", "brillante"] as Finish[]).map((finish) => (
              <Choice
                key={finish}
                name="laminado"
                checked={config.laminate === finish}
                onChange={() => patch({ laminate: finish satisfies Laminate })}
                title={finish === "mate" ? "Laminado mate" : "Laminado brillante"}
                detail={`+ ${formatUsd(addons.laminate)}`}
              />
            ))}
          </div>
        </OptionGroup>

        <OptionGroup legend="Acabados">
          <ToggleRow
            checked={config.uv}
            onChange={(uv) => patch({ uv })}
            title="UV selectivo"
            detail={`Cargo fijo de taller · + ${formatUsd(addons.uv)}`}
          />
          <ToggleRow
            checked={config.rounded}
            onChange={(rounded) => patch({ rounded })}
            title="Puntas redondeadas"
            detail={`+ ${formatUsd(addons.corners)}`}
          />
        </OptionGroup>

        <DeliveryChoices
          orderedAt={orderedAt}
          selected={config.delivery}
          hasArtwork={Boolean(file || editing?.artwork)}
          onChange={(delivery) => patch({ delivery })}
        />
        <QuoteSummary
          config={config}
          priced={priced}
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

    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur-md lg:hidden">
        {error ? (
          <p role="alert" className="mx-auto mb-2 max-w-6xl text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 pb-[env(safe-area-inset-bottom)]">
          <div>
            <p className="text-xs text-ink-soft">
              {config.quantity.toLocaleString("es-EC")} tarjetas · {formatUsd(priced.unitCents)} c/u
            </p>
            <p className="font-display text-2xl leading-none tabular-nums">{formatUsd(priced.totalCents)}</p>
          </div>
          <button
            type="button"
            onClick={commit}
            disabled={pending || Boolean(editId && !cart.ready)}
            className="min-h-12 cursor-pointer rounded-full bg-press px-5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Guardando…" : editing ? "Actualizar" : "Agregar"}
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
  selected: DeliveryId;
  hasArtwork: boolean;
  onChange: (delivery: DeliveryId) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Fecha de entrega estimada</legend>
      <p className="mt-1 mb-3 text-sm leading-6 text-ink-soft">
        Por ahora el envío es solo en Quito y los valles. Adelantar la producción tiene un recargo de demostración y se suma al pagar.
        {hasArtwork ? "" : " Sin archivo, la cuenta empieza cuando lo envíes."}
      </p>
      <div className="grid gap-2" role="radiogroup" aria-label="Fecha de entrega estimada">
        {DELIVERY_OPTIONS.map((option) => {
          const window = deliveryWindow(orderedAt, option.id);
          const checked = selected === option.id;
          return (
            <label
              key={option.id}
              className={`flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 bg-sheet px-4 py-3 ${
                checked ? "border-press" : "border-line hover:border-ink/30"
              }`}
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="entrega"
                  checked={checked}
                  onChange={() => onChange(option.id)}
                  className="mt-1 h-4 w-4 accent-press"
                />
                <span>
                  <span className="block font-medium">Entre el {formatLongDate(window.earliest)}</span>
                  <span className="mt-0.5 block text-sm text-ink-soft">
                    A más tardar el {formatLongDate(window.latest)}
                  </span>
                </span>
              </span>
              <span className={`shrink-0 text-sm font-medium tabular-nums ${option.cents === 0 ? "text-press-deep" : ""}`}>
                {option.cents === 0 ? "Incluido" : `+ ${formatUsd(option.cents)}`}
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
      <label
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
            ? "border-solid border-blue-700 bg-blue-100"
            : invalid
              ? "border-dashed border-red-500 bg-red-50"
              : ready
                ? "border-solid border-press bg-moss-soft"
                : "border-dashed border-blue-600 bg-blue-50 hover:border-blue-700 hover:bg-blue-100"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
          className="sr-only"
          onChange={(event) => {
            onFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <DropGlyph dragOver={dragOver} invalid={invalid} ready={ready} />
        <span className="mt-3 max-w-full truncate text-sm font-semibold text-ink">{title}</span>
        <span className={`mt-1 text-sm ${invalid ? "text-red-800" : "text-ink-soft"}`}>{hint}</span>
      </label>
      {ready ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-line bg-sheet px-4 text-sm font-medium hover:border-ink"
          >
            Recargar
          </button>
          <button
            type="button"
            onClick={() => onFile(null)}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-line bg-sheet px-4 text-sm font-medium text-red-800 hover:border-red-800"
          >
            Eliminar
          </button>
        </div>
      ) : null}
      {file && isPreviewImage(file) ? (
        <div className="mt-3">
          <p className="text-sm text-ink-soft">Colocar esta imagen en</p>
          <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Dónde va la imagen">
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
                className={`min-h-11 cursor-pointer rounded-full border px-4 text-sm font-medium ${
                  imageFaces[side] ? "border-ink bg-ink text-paper" : "border-line bg-sheet"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <a
        href="https://www.canva.com/es_419/crear/tarjetas-de-presentacion/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-3 rounded-2xl border border-ink/10 bg-sheet px-3.5 py-3 shadow-[0_8px_24px_-18px_rgba(26,29,33,0.9)] transition hover:border-ink/25"
      >
        <img src="/canva.png" alt="" width={40} height={40} className="size-10 shrink-0 rounded-full" />
        <span className="min-w-0 text-left">
          <span className="block text-sm font-semibold text-ink">Diseñar en Canva</span>
          <span className="mt-0.5 block text-sm leading-5 text-ink-soft">Se abre en otra pestaña. Exporta el PDF y súbelo aquí.</span>
        </span>
      </a>
      <a href={href} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-press-deep underline-offset-4 hover:underline">
        <PdfIcon />
        Plantilla {sizeName}, {sizeLabel}
        {rounded ? ", con puntas redondeadas" : ""}
      </a>
    </section>
  );
}

function DropGlyph({ dragOver, invalid, ready }: { dragOver: boolean; invalid: boolean; ready: boolean }) {
  const tone = dragOver ? "text-blue-700" : invalid ? "text-red-600" : ready ? "text-press" : "text-blue-600";
  return (
    <span className={`flex size-10 items-center justify-center rounded-full bg-sheet ${tone}`} aria-hidden="true">
      {ready && !dragOver ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4.5 9.2 7.4 12 13.5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 12.5V4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M6 7.2 9 4.2l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 14.2h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )}
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
    a: "Por ahora solo a Quito y los valles. El envío se suma al pagar. También puedes retirar en Quito.",
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
              <PlusMark />
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
              <a href={template.href} className="inline-flex items-center gap-1.5 font-medium text-press-deep underline-offset-4 hover:underline">
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

function PlusMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0 text-press">
      <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 5.2v7.6M5.2 9h7.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
  sizeName: string;
  sizeLabel: string;
  pending: boolean;
  editing: boolean;
  disabled: boolean;
  error: string | null;
  onCommit: () => void;
}) {
  const count = config.quantity.toLocaleString("es-EC");

  return (
    <section aria-label="Resumen del precio" className="overflow-hidden rounded-[28px] border border-line bg-sheet shadow-[0_18px_44px_-28px_rgba(26,29,33,0.55)]">
      <div className="px-5 pt-5">
        <p className="text-sm text-ink-soft">Tu pedido</p>
        <h2 className="mt-1 text-[1.65rem] font-medium leading-tight tracking-tight">{count} tarjetas</h2>
        <p className="mt-1.5 text-sm leading-6 text-ink-soft">
          {sizeName}, {sizeLabel} · {config.sides === 1 ? "un lado" : "dos lados"} · papel {config.paper}
        </p>
      </div>
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
      <div className="border-t border-line bg-paper-deep/70 px-5 py-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Total</p>
            <p className="mt-1 text-sm text-ink-soft">{formatUsd(priced.unitCents)} cada una</p>
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
          <p role="alert" className="mt-3 hidden text-sm text-red-800 lg:block">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onCommit}
          disabled={disabled}
          aria-busy={pending}
          className="mt-5 hidden min-h-12 w-full cursor-pointer rounded-full bg-press px-5 text-base font-medium text-white transition hover:bg-press-deep disabled:cursor-wait disabled:opacity-60 lg:inline-flex lg:items-center lg:justify-center"
        >
          {pending ? "Guardando…" : editing ? "Actualizar pedido" : "Agregar al pedido"}
        </button>
      </div>
    </section>
  );
}

function OptionGroup({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      {hint ? <p className="mt-1 mb-3 text-sm leading-6 text-ink-soft">{hint}</p> : <div className="mb-3" />}
      {children}
    </fieldset>
  );
}

function Choice({
  name,
  checked,
  onChange,
  title,
  detail,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
        checked ? "border-ink bg-ink text-paper" : "border-line bg-sheet hover:border-ink/30"
      }`}
    >
      <span className="flex items-center gap-3">
        <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-current" />
        <span className="font-medium">{title}</span>
      </span>
      <span className={`text-sm ${checked ? "text-paper/80" : "text-ink-soft"}`}>{detail}</span>
    </label>
  );
}

function ToggleRow({
  checked,
  onChange,
  title,
  detail,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  detail: string;
}) {
  return (
    <label
      className={`mb-2 flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 last:mb-0 ${
        checked ? "border-ink bg-ink text-paper" : "border-line bg-sheet hover:border-ink/30"
      }`}
    >
      <span>
        <span className="block font-medium">{title}</span>
        <span className={`block text-sm ${checked ? "text-paper/75" : "text-ink-soft"}`}>{detail}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-current"
      />
    </label>
  );
}
