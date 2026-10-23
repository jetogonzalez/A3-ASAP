import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { FamilyGrid } from "@/components/family-grid";
import { CardsTile } from "@/components/cards-tile";
import { LaunchProductTile } from "@/components/launch-product-tile";
import { ProductPhoto } from "@/components/product-photo";
import { ProductRail, RailItem } from "@/components/product-rail";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { defaultConfiguration, productHref, type Configuration } from "@/lib/catalog";
import { FAMILIES } from "@/lib/families";
import { LAUNCH_PRODUCTS } from "@/lib/launch-products";
import { deliveryWindow, formatLongDate, formatShortDate } from "@/lib/delivery";
import { FIRST_KILO_CENTS } from "@/lib/ecuador";
import { formatUsd } from "@/lib/money";
import { quote } from "@/lib/pricing";
import { QUOTE_VALID_DAYS, quoteValidUntil } from "@/lib/quote";
import { IVA_LABEL } from "@/lib/tax";
import { orderTotals } from "@/lib/order";
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
  { background: "#00749f", color: "#ffffff" },
  { background: "#c2006c", color: "#ffffff" },
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
            <p className="reveal-up inline-flex items-center gap-2 rounded-full border border-line bg-sheet px-3 py-1 text-sm font-medium text-ink-soft">
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
                className="press inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-sheet px-5 font-semibold text-ink hover:border-ink/30"
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
          <Perk tint="bg-tint-lilac text-brand-deep" icon={<TagIcon />} title="Precio final al instante" text="Con IVA y envío incluidos" />
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
              <CardsTile />
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
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                className="step-ink grid size-10 place-items-center rounded-full text-base font-semibold tabular-nums"
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
            <Link href="/proforma" className="press mt-8 inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-on-ink hover:bg-ink/85">
              Hacer una proforma
            </Link>
          </div>
          <SampleQuote />
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
 * Solo la forma de la tarjeta, a escala (8,5 × 5,5 o 5,5 × 5,5 cm), con las
 * marcas de corte de imprenta y su medida. Sin textos de relleno: el diseño
 * lo pone cada cliente.
 */
function CardStage({ config }: { config: Configuration }) {
  const square = config.sizeId === "55x55";
  const faces = config.sides === 2 ? ["Frente", "Reverso"] : [null];
  return (
    <span
      className="flex aspect-[16/10] w-full items-center justify-center gap-6 bg-[radial-gradient(110%_95%_at_35%_12%,#ffffff,var(--tint-lilac)_62%)] px-6"
      aria-hidden="true"
    >
      {faces.map((face, index) => (
        <span key={index} className="flex flex-col items-center gap-2">
          <CardShape square={square} back={face === "Reverso"} />
          <span className="text-xs font-medium text-ink-soft">
            {face ? `${face} · ` : ""}
            {square ? "5,5 × 5,5 cm" : "8,5 × 5,5 cm"}
          </span>
        </span>
      ))}
    </span>
  );
}

/* Rectángulo a escala con las cuatro marcas de corte en las esquinas. El reverso va en azul de marca. */
function CardShape({ square, back }: { square: boolean; back: boolean }) {
  const width = square ? 74 : 114;
  return (
    <span className="relative block p-2.5">
      {(["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"] as const).map(
        (corner) => (
          <span key={corner} className={`absolute size-2.5 border-ink/35 ${corner}`} />
        ),
      )}
      <span
        className={`block rounded-[3px] shadow-[0_14px_22px_-14px_rgba(20,20,40,0.45),0_1px_0_rgba(0,0,0,0.06)] ${
          back ? "bg-[#4660ff]" : "bg-white ring-1 ring-black/5"
        }`}
        style={{ width, height: 74 }}
      />
    </span>
  );
}

/*
 * La proforma de ejemplo: la misma estructura que la real (número, cliente,
 * fechas, detalle, IVA y total), con precios de verdad calculados con la
 * tabla de hoy. Va un poco girada, como una hoja sobre la mesa.
 */
function SampleQuote() {
  const issued = new Date().toISOString();
  const configs: Configuration[] = [
    { ...defaultConfiguration("85x55"), sides: 2, quantity: 500 },
    { ...defaultConfiguration("55x55"), sides: 1, quantity: 250 },
  ];
  /* El mismo cálculo que la proforma real: impresión, peso, envío e IVA. */
  const totals = orderTotals(configs, issued);
  const lines = [
    { label: "Tarjetas clásicas a doble cara", detail: "8,5 × 5,5 cm · couché 300 g", quantity: 500, cents: quote(configs[0]).printingCents },
    { label: "Tarjetas cuadradas", detail: "5,5 × 5,5 cm · un lado", quantity: 250, cents: quote(configs[1]).printingCents },
  ];
  const shippingCents = totals.shipping.cents + totals.delivery.cents;
  const totalCents = totals.totalCents;
  const iva = totals.iva;

  return (
    <div className="relative lg:rotate-[1.5deg]" aria-hidden="true">
      <span className="absolute -top-3 right-6 z-10 rounded-full bg-flag px-3 py-1 text-xs font-semibold text-flag-ink shadow-sm">Ejemplo</span>
      <div className="rounded-[22px] border border-line bg-sheet p-6 shadow-[0_28px_60px_-34px_rgba(20,20,20,0.5)] sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b-2 border-ink pb-4">
          <div>
            <BrandLogo className="h-9 w-auto text-ink" />
            <p className="mt-1.5 text-xs text-ink-soft">Quito, Ecuador · estoesasap.com</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-soft">Proforma</p>
            <p className="text-sm font-semibold tabular-nums">PRO-0001</p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <dt className="text-ink-soft">Cliente</dt>
            <dd className="mt-0.5 font-medium">Tu empresa</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Emitida</dt>
            <dd className="mt-0.5 font-medium">{formatShortDate(issued)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Válida hasta</dt>
            <dd className="mt-0.5 font-medium">{formatShortDate(quoteValidUntil(issued))}</dd>
          </div>
        </dl>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="pb-2 font-medium">Detalle</th>
              <th className="pb-2 text-right font-medium">Cant.</th>
              <th className="pb-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.label} className="border-b border-line/70">
                <td className="py-2.5 pr-3">
                  <span className="block font-medium">{line.label}</span>
                  <span className="block text-xs text-ink-soft">{line.detail}</span>
                </td>
                <td className="py-2.5 text-right tabular-nums">{line.quantity}</td>
                <td className="py-2.5 text-right tabular-nums">{formatUsd(line.cents)}</td>
              </tr>
            ))}
            <tr className="border-b border-line/70">
              <td className="py-2.5 pr-3">
                <span className="block font-medium">Entrega Standard y envío</span>
                <span className="block text-xs text-ink-soft">Quito y valles</span>
              </td>
              <td />
              <td className="py-2.5 text-right tabular-nums">{formatUsd(shippingCents)}</td>
            </tr>
          </tbody>
        </table>

        <dl className="ml-auto mt-4 max-w-[15rem] space-y-1 text-sm">
          <div className="flex justify-between gap-4 text-ink-soft">
            <dt>Subtotal sin IVA</dt>
            <dd className="tabular-nums">{formatUsd(iva.baseCents)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-ink-soft">
            <dt>{IVA_LABEL}</dt>
            <dd className="tabular-nums">{formatUsd(iva.ivaCents)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink pt-2">
            <dt className="font-semibold">Total</dt>
            <dd className="text-2xl font-semibold tabular-nums">{formatUsd(totalCents)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ink-soft">Válida {QUOTE_VALID_DAYS} días hábiles. Precios en dólares, con IVA.</p>
      </div>
    </div>
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
