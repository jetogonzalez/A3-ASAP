import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { FamilyGrid } from "@/components/family-grid";
import { CardsTile } from "@/components/cards-tile";
import { LaunchProductTile } from "@/components/launch-product-tile";
import { ProductPhoto, SeasonalProductPhoto } from "@/components/product-photo";
import { ProductRail, RailItem } from "@/components/product-rail";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { PRODUCT, QUANTITIES, defaultConfiguration, productHref, type Configuration } from "@/lib/catalog";
import { FAQS } from "@/lib/faq";
import { SEASONS } from "@/lib/seasons";
import { SeasonDecor } from "@/components/season-decor";
import { SeasonCampaign } from "@/components/season-campaign";
import { FAMILIES } from "@/lib/families";
import { LAUNCH_PRODUCTS, launchProductHref } from "@/lib/launch-products";
import { formatShortDate } from "@/lib/delivery";
import { formatUnitUsd, formatUsd } from "@/lib/money";
import { quote } from "@/lib/pricing";
import { QUOTE_VALID_DAYS, quoteValidUntil } from "@/lib/quote";
import { IVA_LABEL } from "@/lib/tax";
import { orderTotals } from "@/lib/order";
import { COMPANY } from "@/lib/company";
import { skuFor } from "@/lib/sku";
import { customQuoteMessage, whatsappHref } from "@/lib/whatsapp";

/* La fecha de entrega cambia con el día: se vuelve a armar cada 10 minutos. */
export const revalidate = 600;

export const metadata: Metadata = {
  alternates: { canonical: "/", types: { "text/markdown": "/llms.txt" } },
};

/* El inicio es para alguien que nunca imprimió nada: frases cortas, un paso a la vez. */

const STEPS = [
  { title: "Elige qué imprimir", text: "Tazas, camisetas, etiquetas, cuadernos, tarjetas y más." },
  { title: "Arma tu pedido", text: "Opciones, cantidad y fecha de entrega. Ves el resumen antes de pedir." },
  { title: "Sube tu diseño", text: "En PDF, EPS o AI, o desde Canva. La web revisa tu archivo." },
  { title: "Paga y listo", text: "Por WhatsApp, con transferencia o Deuna. Lo llevamos a tu puerta." },
] as const;

/*
 * Los cuatro pasos en pastel, en la gama del azul del logo: de periwinkle a
 * lavanda y lila, con el número en el tono profundo de cada uno (pasa AA).
 */
const STEP_COLORS = ["#2d43d6", "#4f30cf", "#6a2fb8", "#1c2a99"] as const;
const STEP_TINTS = ["#e6e9ff", "#ebe6ff", "#f1e6ff", "#e3e7f8"] as const;
const STEP_INKS = STEP_COLORS.map((color, index) => ({ background: STEP_TINTS[index], color }));

/*
 * La barra de arriba: una sola línea azul que se va oscureciendo y se llena
 * de izquierda a derecha como una barra de carga. Cuando va terminando,
 * aparece el resto de la portada.
 */
/** Cuándo empieza a aparecer la portada, en ms: la barra va por el último tramo. */
const AFTER_BAR = 420;

/*
 * Ideas por ocasión, con productos de todo el catálogo: ayudan a quien no
 * sabe qué pedir (lo mismo que se le preguntaría a un asistente).
 */
function occasionItem(slug: string): { slug: string; name: string; detail: string; href: string } {
  if (slug === PRODUCT.slug) return { slug, name: PRODUCT.name, detail: `Desde ${QUANTITIES[0]} u. · precio al instante`, href: productHref() };
  const product = LAUNCH_PRODUCTS.find((candidate) => candidate.slug === slug);
  if (!product) throw new Error(`Producto desconocido: ${slug}`);
  return { slug, name: product.name, detail: `Desde ${product.quantities[0]} u. · ${product.leadTime}`, href: launchProductHref(product) };
}

const OCCASIONS = [
  {
    title: "Tu emprendimiento",
    text: "Que cada pedido salga con tu marca.",
    products: ["etiquetas", "papel-regalo", "tarjetas-de-regalo", PRODUCT.slug].map(occasionItem),
  },
  {
    title: "Eventos y ferias",
    text: "Para tu equipo, tu stand o para regalar.",
    products: ["camisetas-hoodies", "gorras", "tote-bags", "toma-todos"].map(occasionItem),
  },
  {
    title: "Empresa y regalos",
    text: "Detalles corporativos que se usan todo el año.",
    products: ["tazas-mugs", "esferos", "cuadernos", "calendarios"].map(occasionItem),
  },
];


export default function HomePage() {
  const help = whatsappHref(customQuoteMessage("algo y no sé por dónde empezar"));
  const familyLabels = Object.fromEntries(FAMILIES.map((family) => [family.slug, family.label]));

  return (
    <>
      {/* ---------- Portada ---------- */}
      <section className="cutting-mat relative overflow-hidden" aria-labelledby="hero-title">
        <div className="color-bar" aria-hidden="true">
          <span />
        </div>
        <SeasonDecor />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-14 pb-14 md:px-8 md:pt-20 md:pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p
              className="reveal-up inline-flex items-center gap-2 rounded-full border border-line bg-sheet px-3 py-1 text-sm font-medium text-ink-soft"
              style={{ animationDelay: `${AFTER_BAR}ms` }}
            >
              <span className="season-dot size-2 rounded-full bg-speed-standard" aria-hidden="true" />
              {/* Un texto por temporada; el CSS deja ver el de la activa (lib/seasons.ts). */}
              {SEASONS.map((season) => (
                <span key={season.id} data-season-only={season.id} data-nosnippet={season.id === "normal" ? undefined : ""}>
                  {season.badge}
                </span>
              ))}
            </p>
            <h1
              id="hero-title"
              className="reveal-up mt-5 max-w-xl text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.03em] text-balance sm:text-6xl"
              style={{ animationDelay: `${AFTER_BAR + 90}ms` }}
            >
              {SEASONS.map((season) => (
                /* Las de temporada van con data-nosnippet: Google solo toma el título normal. */
                <span key={season.id} data-season-only={season.id} data-nosnippet={season.id === "normal" ? undefined : ""}>
                  {season.title}
                </span>
              ))}
            </h1>
            <p className="reveal-up mt-5 max-w-md text-lg leading-7 text-ink-soft" style={{ animationDelay: `${AFTER_BAR + 180}ms` }}>
              Tazas, camisetas, gorras, etiquetas, cuadernos, tarjetas y más con tu logo. Los armas aquí en pocos pasos y te los llevamos a la puerta en Quito y los valles.
            </p>
            <div className="reveal-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: `${AFTER_BAR + 270}ms` }}>
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
                Pedir ayuda para elegir
              </a>
            </div>
          </div>

          {/* Collage de productos, cada uno con su tinta: deja claro que no son solo tarjetas. */}
          <div className="grid h-[340px] grid-cols-6 grid-rows-5 gap-3 sm:h-[420px]" aria-hidden="true">
            <CollageTile className="col-span-4 row-span-3 bg-tint-peach" delay={120}>
              <SeasonalProductPhoto slug="tazas-mugs" alt="" sizes="(min-width: 1024px) 380px, 66vw" preload />
            </CollageTile>
            <CollageTile className="col-span-2 row-span-3 bg-tint-lilac" delay={200}>
              <SeasonalProductPhoto slug="tarjetas-de-presentacion" alt="" sizes="(min-width: 1024px) 190px, 33vw" />
            </CollageTile>
            <CollageTile className="col-span-2 row-span-2 bg-tint-green" delay={280}>
              <SeasonalProductPhoto slug="gorras" alt="" sizes="(min-width: 1024px) 190px, 33vw" />
            </CollageTile>
            <CollageTile className="col-span-2 row-span-2 bg-tint-yellow" delay={360}>
              <SeasonalProductPhoto slug="etiquetas" alt="" sizes="(min-width: 1024px) 190px, 33vw" />
            </CollageTile>
            <CollageTile className="col-span-2 row-span-2 bg-tint-cyan" delay={440}>
              <SeasonalProductPhoto slug="cuadernos" alt="" sizes="(min-width: 1024px) 190px, 33vw" />
            </CollageTile>
          </div>
        </div>
      </section>

      {/* ---------- Lo que siempre pasa ---------- */}
      <section className="border-b border-line bg-sheet" aria-label="Ventajas">
        <ul className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-5 px-5 py-6 md:grid-cols-4 md:px-8">
          <Perk tint="bg-tint-lilac text-brand-deep" icon={<TagIcon />} title="Desde 5 unidades" text="Pedidos pequeños o grandes" />
          <Perk tint="bg-tint-peach text-[#c93d17]" icon={<TruckIcon />} title="Entrega a domicilio" text="Quito y los valles" />
          <Perk tint="bg-tint-green" icon={<WhatsappLogo size={22} brand />} title="Pagas por WhatsApp" text="Transferencia o Deuna" />
          <Perk tint="bg-tint-yellow text-[#9a6a00]" icon={<BrushIcon />} title="Tu diseño como quieras" text="Canva, archivo o chat" />
        </ul>
      </section>

      {/* ---------- Campaña de temporada (solo en temporada) ---------- */}
      <SeasonCampaign />

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
            {/* En el orden de las categorías: las tarjetas van con las demás, no primero. */}
            {FAMILIES.flatMap((family) =>
              family.live
                ? [
                    <RailItem key="tarjetas">
                      <CardsTile />
                    </RailItem>,
                  ]
                : LAUNCH_PRODUCTS.filter((product) => product.family === family.slug).map((product) => (
                    <RailItem key={product.id}>
                      <LaunchProductTile product={product} familyLabel={familyLabels[product.family]} />
                    </RailItem>
                  )),
            )}
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
            <p className="mt-2 max-w-lg leading-7 text-ink-soft">Promocionales, textil, empaque, papelería y tarjetas, todo con tu marca.</p>
          </div>
          <Link href="/productos" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline">
            Ver todo
          </Link>
        </div>
        <div className="mt-8">
          <FamilyGrid />
        </div>
      </section>

      {/* ---------- Para qué ---------- */}
      <section className="bg-paper-deep" aria-labelledby="para-que">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <h2 id="para-que" className="text-3xl font-semibold tracking-tight md:text-4xl">
            ¿Para qué lo necesitas?
          </h2>
          <p className="mt-2 max-w-lg leading-7 text-ink-soft">Ideas según la ocasión. Si no ves lo tuyo, cuéntanos y te recomendamos.</p>
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {OCCASIONS.map((occasion) => (
              <li key={occasion.title} className="flex flex-col rounded-[22px] border border-line bg-sheet p-5">
                <h3 className="text-lg font-semibold tracking-tight">{occasion.title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-soft">{occasion.text}</p>
                <ul className="mt-4 space-y-2">
                  {occasion.products.map((item) => (
                    <li key={item.slug}>
                      <Link href={item.href} className="group flex items-center gap-3 rounded-2xl p-1.5 hover:bg-paper-deep">
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-paper-deep">
                          <ProductPhoto slug={item.slug} alt="" sizes="56px" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{item.name}</span>
                          <span className="block text-sm text-ink-soft">{item.detail}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
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
            <li
              key={step.title}
              className="step-card rounded-[22px] border border-line bg-sheet p-5"
              style={{ "--step": STEP_COLORS[index] } as React.CSSProperties}
            >
              <span
                className="step-ink grid size-11 place-items-center rounded-full text-base font-semibold tabular-nums"
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
            {FAQS.slice(0, 6).map((faq) => (
              <details key={faq.question} className="group px-5">
                <summary className="-mx-2 flex min-h-14 cursor-pointer list-none rounded-xl px-2 focus-visible:-outline-offset-2 items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-paper-deep transition-transform duration-200 group-open:rotate-45" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="pb-5 leading-7 text-ink-soft">{faq.answer}</p>
              </details>
            ))}
          </div>
          <Link href="/ayuda" className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-deep underline underline-offset-4">
            Ver todo en el centro de ayuda →
          </Link>
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
            Escribir por WhatsApp
          </a>
        </div>
      </section>
    </>
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
    { label: "Tarjetas clásicas a doble cara", config: configs[0] },
    { label: "Tarjetas cuadradas", config: configs[1] },
  ].map((line) => ({ ...line, sku: skuFor(line.config), quantity: line.config.quantity, priced: quote(line.config) }));
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
            <p className="mt-1.5 text-xs text-ink-soft">
              {COMPANY.city} · WhatsApp {COMPANY.whatsapp}
            </p>
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
              <th className="pb-2 pl-2 text-right font-medium">P. unit.</th>
              <th className="pb-2 pl-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.label} className="border-b border-line/70">
                <td className="py-2.5 pr-3">
                  <span className="block font-medium">{line.label}</span>
                  <span className="block font-mono text-[11px] text-ink-soft">{line.sku}</span>
                </td>
                <td className="py-2.5 text-right tabular-nums">{line.quantity}</td>
                <td className="py-2.5 pl-2 text-right tabular-nums text-ink-soft">{formatUnitUsd(line.priced.printingCents, line.quantity)}</td>
                <td className="py-2.5 pl-2 text-right tabular-nums">{formatUsd(line.priced.printingCents)}</td>
              </tr>
            ))}
            <tr className="border-b border-line/70">
              <td className="py-2.5 pr-3">
                <span className="block font-medium">Entrega Standard y envío</span>
                <span className="block text-xs text-ink-soft">Quito y valles</span>
              </td>
              <td />
              <td />
              <td className="py-2.5 pl-2 text-right tabular-nums">{formatUsd(shippingCents)}</td>
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
      style={{ animationDelay: `${AFTER_BAR + delay}ms` }}
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
