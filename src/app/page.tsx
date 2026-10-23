import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { CardPreview } from "@/components/card-preview";
import { FamilyGrid } from "@/components/family-grid";
import { LaunchProductTile } from "@/components/launch-product-tile";
import { ProductPhoto } from "@/components/product-photo";
import { ProductRail, RailItem } from "@/components/product-rail";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { PRODUCT, defaultConfiguration, productHref, type Configuration } from "@/lib/catalog";
import { FAMILIES } from "@/lib/families";
import { LAUNCH_PRODUCTS } from "@/lib/launch-products";
import { deliveryWindow, formatLongDate } from "@/lib/delivery";
import { FIRST_KILO_CENTS } from "@/lib/ecuador";
import { formatUsd } from "@/lib/money";
import { quote } from "@/lib/pricing";
import { QUOTE_VALID_DAYS } from "@/lib/quote";
import { customQuoteMessage, whatsappHref } from "@/lib/whatsapp";

/* La fecha de entrega cambia con el día: se vuelve a armar cada 10 minutos. */
export const revalidate = 600;

/* El inicio es para alguien que nunca imprimió nada: frases cortas, un paso a la vez. */

const STEPS = [
  { title: "Elige qué imprimir", text: "Tarjetas, tazas, camisetas, etiquetas y más." },
  { title: "Arma tu pedido", text: "Tamaño, material y cantidad. Las tarjetas muestran el total con IVA al instante." },
  { title: "Sube tu diseño", text: "Desde Canva, un archivo o por el chat. Hay plantilla lista." },
  { title: "Paga y listo", text: "Por WhatsApp, con transferencia o Deuna. Lo llevamos a tu puerta." },
] as const;

/* Los cuatro pasos llevan las tintas de imprenta: cian, magenta, amarillo y negro. */
const STEP_INKS = [
  { background: "#0090c8", color: "#ffffff" },
  { background: "#d6007a", color: "#ffffff" },
  { background: "#ffd400", color: "#141414" },
  { background: "#141414", color: "#ffffff" },
] as const;

/* La barra de color de los pliegos: CMYK y los colores de la marca. */
const COLOR_BAR = ["#00a3e0", "#e6007e", "#ffd400", "#141414", "#4660ff", "#2db84b", "#ff5a2c"] as const;

const BESTSELLERS: Array<{ title: string; detail: string; config: Partial<Configuration> }> = [
  { title: "Tarjeta clásica", detail: "8,5 × 5,5 cm · a un lado", config: { sizeId: "85x55", sides: 1 } },
  { title: "Clásica a doble cara", detail: "8,5 × 5,5 cm · frente y reverso", config: { sizeId: "85x55", sides: 2 } },
  { title: "Tarjeta cuadrada", detail: "5,5 × 5,5 cm · a un lado", config: { sizeId: "55x55", sides: 1 } },
];

const FAQ = [
  {
    q: "No tengo diseño, ¿qué hago?",
    a: "Puedes diseñarla en Canva desde la misma página, descargar nuestra plantilla o escribirnos por WhatsApp y te ayudamos.",
  },
  {
    q: "¿El precio que veo es el final?",
    a: `Sí. Incluye IVA y el envío en Quito y los valles (desde ${formatUsd(FIRST_KILO_CENTS)}). No hay costos escondidos.`,
  },
  { q: "¿Cómo pago?", a: "Al finalizar se abre WhatsApp con tu pedido escrito. Ahí te pasamos la cuenta para transferir o el código de Deuna." },
  { q: "¿Hacen factura?", a: "Sí. Pones tu RUC o cédula al hacer el pedido y la factura sale a tu nombre." },
  { q: "¿Hacen otros productos?", a: "Sí: esferos, tazas, toma todos, camisetas, gorras, tote bags, etiquetas, papel de regalo, calendarios y cuadernos. Por ahora se cotizan por WhatsApp." },
] as const;

function priceFor(partial: Partial<Configuration>, quantity: Configuration["quantity"]) {
  const config = { ...defaultConfiguration(partial.sizeId ?? "85x55"), ...partial, quantity };
  return { cents: quote(config).printingCents, href: productHref(config) };
}

export default function HomePage() {
  const arrival = formatLongDate(deliveryWindow(new Date().toISOString(), "express").earliest);
  const help = whatsappHref(customQuoteMessage("algo y no sé por dónde empezar"));
  const familyLabels = Object.fromEntries(FAMILIES.map((family) => [family.slug, family.label]));

  return (
    <>
      {/* ---------- Portada ---------- */}
      <section className="cutting-mat relative overflow-hidden" aria-labelledby="hero-title">
        <div className="color-bar" aria-hidden="true">
          {COLOR_BAR.map((color) => (
            <span key={color} style={{ background: color }} />
          ))}
        </div>
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-14 pb-14 md:px-8 md:pt-20 md:pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="reveal-up inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm font-medium text-ink-soft">
              <span className="size-2 rounded-full bg-speed-standard" aria-hidden="true" />
              Imprenta en línea en Quito y los valles
            </p>
            <h1
              id="hero-title"
              className="reveal-up mt-5 max-w-xl text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.03em] text-balance sm:text-6xl"
              style={{ animationDelay: "90ms" }}
            >
              Imprime lo de tu marca, sin complicarte.
            </h1>
            <p className="reveal-up mt-5 max-w-md text-lg leading-7 text-ink-soft" style={{ animationDelay: "180ms" }}>
              Tarjetas con precio al instante y en tu puerta desde el {arrival}. Tazas, camisetas, etiquetas y más: los armas aquí y nos los pides por WhatsApp.
            </p>
            <div className="reveal-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "270ms" }}>
              <Link
                href="#todo"
                className="press inline-flex min-h-12 items-center rounded-full bg-press px-6 font-semibold text-white hover:bg-press-deep"
              >
                Ver productos
              </Link>
              <a
                href={help}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-white px-5 font-semibold text-ink hover:border-ink/30"
              >
                <WhatsappLogo size={20} brand />
                Te ayudamos a elegir
              </a>
            </div>
          </div>

          {/* Collage de productos, cada uno con su tinta: deja claro que no son solo tarjetas. */}
          <div className="grid h-[340px] grid-cols-6 grid-rows-5 gap-3 sm:h-[420px]" aria-hidden="true">
            <CollageTile className="col-span-4 row-span-3 bg-tint-lilac" delay={120}>
              <ProductPhoto slug="tarjetas-de-presentacion" alt="" sizes="(min-width: 1024px) 380px, 66vw" preload />
            </CollageTile>
            <CollageTile className="col-span-2 row-span-3 bg-tint-peach" delay={200}>
              <ProductPhoto slug="tazas-mugs" alt="" sizes="(min-width: 1024px) 190px, 33vw" />
            </CollageTile>
            <CollageTile className="col-span-2 row-span-2 bg-tint-green" delay={280}>
              <ProductPhoto slug="gorras" alt="" sizes="(min-width: 1024px) 190px, 33vw" />
            </CollageTile>
            <CollageTile className="col-span-2 row-span-2 bg-tint-yellow" delay={360}>
              <ProductPhoto slug="etiquetas" alt="" sizes="(min-width: 1024px) 190px, 33vw" />
            </CollageTile>
            <CollageTile className="col-span-2 row-span-2 bg-tint-cyan" delay={440}>
              <ProductPhoto slug="cuadernos" alt="" sizes="(min-width: 1024px) 190px, 33vw" />
            </CollageTile>
          </div>
        </div>
      </section>

      {/* ---------- Lo que siempre pasa ---------- */}
      <section className="border-b border-line bg-sheet" aria-label="Ventajas">
        <ul className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-5 px-5 py-6 md:grid-cols-4 md:px-8">
          <Perk tint="bg-tint-lilac text-[#2d43d6]" icon={<TagIcon />} title="Precio final al instante" text="Con IVA y envío incluidos" />
          <Perk tint="bg-tint-peach text-[#c93d17]" icon={<TruckIcon />} title="Entrega a domicilio" text="Quito y los valles" />
          <Perk tint="bg-tint-green" icon={<WhatsappLogo size={22} brand />} title="Pagas por WhatsApp" text="Transferencia o Deuna" />
          <Perk tint="bg-tint-yellow text-[#9a6a00]" icon={<BrushIcon />} title="Tu diseño como quieras" text="Canva, archivo o chat" />
        </ul>
      </section>

      {/* ---------- Todos los productos ---------- */}
      <section id="todo" className="mx-auto w-full max-w-6xl scroll-mt-28 px-5 pt-16 md:px-8 md:pt-20" aria-labelledby="todo-titulo">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="todo-titulo" className="text-3xl font-semibold tracking-tight md:text-4xl">
              Todo lo que imprimimos
            </h2>
            <p className="mt-2 max-w-lg leading-7 text-ink-soft">{LAUNCH_PRODUCTS.length + 1} productos para tu marca. Elige uno y ármalo a tu medida.</p>
          </div>
        </div>
        <div className="mt-8">
          <ProductRail label="Productos">
            <RailItem>
              <CardsTile price={formatUsd(quote({ ...defaultConfiguration("85x55"), quantity: 100 }).printingCents)} />
            </RailItem>
            {LAUNCH_PRODUCTS.map((product) => (
              <RailItem key={product.id}>
                <LaunchProductTile product={product} familyLabel={familyLabels[product.family]} />
              </RailItem>
            ))}
          </ProductRail>
        </div>
      </section>

      {/* ---------- Catálogo ---------- */}
      <section id="que-imprimir" className="mx-auto w-full max-w-6xl scroll-mt-28 px-5 py-16 md:px-8 md:py-20" aria-labelledby="que-imprimir-titulo">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="que-imprimir-titulo" className="text-3xl font-semibold tracking-tight md:text-4xl">
              Por categoría
            </h2>
            <p className="mt-2 max-w-lg leading-7 text-ink-soft">Las tarjetas se piden y pagan en línea. Lo demás lo armas aquí y nos lo envías por WhatsApp.</p>
          </div>
          <Link href="/productos" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline">
            Ver todo
          </Link>
        </div>
        <div className="mt-8">
          <FamilyGrid />
        </div>
      </section>

      {/* ---------- Más pedidos ---------- */}
      <section className="bg-paper-deep" aria-labelledby="mas-pedidos">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <h2 id="mas-pedidos" className="text-3xl font-semibold tracking-tight md:text-4xl">
            Lo más pedido
          </h2>
          <p className="mt-2 max-w-lg leading-7 text-ink-soft">Precios con IVA, en couche 300 g mate o brillante. Los acabados se suman al armarlas.</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {BESTSELLERS.map((item) => {
              const small = priceFor(item.config, 100);
              const big = priceFor(item.config, 500);
              return (
                <li key={item.title}>
                  <Link href={small.href} className="family-card group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-sheet">
                    <CardStage config={{ ...defaultConfiguration(item.config.sizeId ?? "85x55"), ...item.config }} />
                    <span className="flex flex-1 flex-col p-5">
                      <span className="text-lg font-semibold tracking-tight">{item.title}</span>
                      <span className="text-sm text-ink-soft">{item.detail}</span>
                      <span className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <span className="rounded-xl bg-paper-deep px-3 py-2">
                          <span className="block text-ink-soft">100 u.</span>
                          <span className="text-lg font-semibold tabular-nums">{formatUsd(small.cents)}</span>
                        </span>
                        <span className="rounded-xl bg-paper-deep px-3 py-2">
                          <span className="block text-ink-soft">500 u.</span>
                          <span className="text-lg font-semibold tabular-nums">{formatUsd(big.cents)}</span>
                        </span>
                      </span>
                      <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-press px-5 text-sm font-semibold text-white transition-colors group-hover:bg-press-deep">
                        Armar ahora
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ---------- Pasos ---------- */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20" aria-labelledby="como-se-pide">
        <h2 id="como-se-pide" className="text-3xl font-semibold tracking-tight md:text-4xl">
          Así de fácil
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-[22px] border border-line bg-sheet p-5">
              <span
                className="grid size-10 place-items-center rounded-full text-base font-semibold tabular-nums"
                style={STEP_INKS[index]}
              >
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1 leading-6 text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Proforma ---------- */}
      <section className="border-t border-line" aria-labelledby="proforma">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 id="proforma" className="max-w-md text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              ¿Necesitas una proforma para la empresa?
            </h2>
            <p className="mt-4 max-w-md leading-7 text-ink-soft">
              Sácala en un minuto, con número, fecha y {QUOTE_VALID_DAYS} días hábiles de validez. La guardas en PDF, la compartes o te la enviamos.
            </p>
            <Link href="/proforma" className="press mt-8 inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-white hover:bg-ink/85">
              Hacer una proforma
            </Link>
          </div>
          <div className="rounded-[22px] border border-line bg-sheet p-6 shadow-[0_24px_50px_-34px_rgba(20,20,20,0.45)]" aria-hidden="true">
            <div className="flex items-center justify-between border-b-2 border-ink pb-4">
              <BrandLogo className="h-8 w-auto text-ink" />
              <span className="text-sm text-ink-soft">Proforma de ejemplo</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">Tarjetas clásicas a doble cara · 500 u.</span>
                <span className="tabular-nums">{formatUsd(priceFor({ sizeId: "85x55", sides: 2 }, 500).cents)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">Entrega Standard</span>
                <span className="font-medium text-moss">Incluida</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Preguntas ---------- */}
      <section className="bg-paper-deep" aria-labelledby="preguntas">
        <div className="mx-auto w-full max-w-3xl px-5 py-16 md:px-8 md:py-20">
          <h2 id="preguntas" className="text-3xl font-semibold tracking-tight md:text-4xl">
            Preguntas frecuentes
          </h2>
          <div className="mt-8 divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-sheet">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-5">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-paper-deep transition-transform duration-200 group-open:rotate-45" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="pb-5 leading-7 text-ink-soft">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Ayuda ---------- */}
      <section className="bg-tint-yellow" aria-labelledby="ayuda">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center md:px-8">
          <div>
            <h2 id="ayuda" className="text-3xl font-semibold tracking-tight">¿No sabes por dónde empezar?</h2>
            <p className="mt-2 max-w-md leading-7 text-ink-soft">Cuéntanos qué necesitas y te decimos qué imprimir, en qué papel y cuánto cuesta.</p>
          </div>
          <a
            href={help}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-press px-6 font-semibold text-white hover:bg-press-deep"
          >
            <WhatsappLogo size={20} />
            Escríbenos por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}

/*
 * La tarjeta de verdad, la misma muestra del configurador: así cada opción se
 * ve distinta (clásica, a doble cara, cuadrada) y coincide con lo que se pide.
 */
function CardStage({ config }: { config: Configuration }) {
  const pair = config.sides === 2;
  return (
    <span
      className="flex aspect-[16/10] w-full items-center justify-center gap-3 bg-[radial-gradient(110%_95%_at_35%_12%,#ffffff,#ecebff_60%,#d9daf6)] px-6"
      aria-hidden="true"
    >
      <span className={`block ${pair ? "w-[42%]" : config.sizeId === "55x55" ? "w-[38%]" : "w-[60%]"}`}>
        <CardPreview config={config} face="front" pair={pair} compact />
      </span>
      {pair ? (
        <span className="block w-[42%]">
          <CardPreview config={config} face="back" pair compact />
        </span>
      ) : null}
    </span>
  );
}

function CollageTile({ className, delay, children }: { className: string; delay: number; children: React.ReactNode }) {
  return (
    <div
      className={`reveal-up overflow-hidden rounded-[20px] shadow-[0_22px_40px_-28px_rgba(20,20,40,0.45)] ring-1 ring-black/5 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* Las tarjetas de presentación en el slider: son las únicas con precio en línea. */
function CardsTile({ price }: { price: string }) {
  return (
    <Link href={productHref()} className="family-card group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-sheet">
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-tint-lilac">
        <ProductPhoto
          slug="tarjetas-de-presentacion"
          alt="Tarjetas de presentación"
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 42vw, 74vw"
          className="family-photo"
        />
      </span>
      <span className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-semibold text-[#2d43d6]">Tarjetas</span>
        <span className="text-base font-semibold tracking-tight sm:text-lg">{PRODUCT.name}</span>
        <span className="text-sm leading-5 text-ink-soft">Couché 300 g, mate o brillante, con acabados.</span>
        <span className="mt-auto flex flex-wrap gap-1.5 pt-3 text-xs font-semibold">
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[#2d43d6]">Pídelo en línea · desde {price}</span>
        </span>
      </span>
    </Link>
  );
}

function Perk({ tint, icon, title, text }: { tint: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tint}`} aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-5">{title}</span>
        <span className="block text-sm leading-5 text-ink-soft">{text}</span>
      </span>
    </li>
  );
}

function TagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6h11v10H2zM13 9h4l4 4v3h-8" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-2.1.9H6v-3.4a3 3 0 0 1 .9-2.1L14 4Z" />
      <path d="M12 6l6 6" />
    </svg>
  );
}
