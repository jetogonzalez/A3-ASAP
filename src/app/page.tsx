import Link from "next/link";
import { FamilyGrid } from "@/components/family-grid";
import { ProductArt } from "@/components/product-art";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { defaultConfiguration, productHref, type Configuration } from "@/lib/catalog";
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
  { title: "Elige qué imprimir", text: "Tarjetas hoy en línea; el resto lo cotizamos por WhatsApp." },
  { title: "Arma y mira el precio", text: "Tamaño, papel y cantidad. El total ya trae IVA y envío." },
  { title: "Sube tu diseño", text: "Desde Canva, un archivo o por el chat. Hay plantilla lista." },
  { title: "Paga y listo", text: "Por WhatsApp, con transferencia o Deuna. Lo llevamos a tu puerta." },
] as const;

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
  { q: "¿Hacen otros productos?", a: "Sí: papelería, catálogos, gran formato, pegatinas, empaque y textil. Por ahora se cotizan por WhatsApp." },
] as const;

function priceFor(partial: Partial<Configuration>, quantity: Configuration["quantity"]) {
  const config = { ...defaultConfiguration(partial.sizeId ?? "85x55"), ...partial, quantity };
  return { cents: quote(config).printingCents, href: productHref(config) };
}

export default function HomePage() {
  const arrival = formatLongDate(deliveryWindow(new Date().toISOString(), "express").earliest);
  const help = whatsappHref(customQuoteMessage("algo y no sé por dónde empezar"));

  return (
    <>
      {/* ---------- Portada ---------- */}
      <section className="cutting-mat relative overflow-hidden text-white" aria-labelledby="hero-title">
        <div className="mat-ruler absolute inset-x-0 top-0 h-3" aria-hidden="true" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-16 pb-14 md:px-8 md:pt-20 md:pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="reveal-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur-sm">
              <span className="size-2 rounded-full bg-[#7ee2a8]" aria-hidden="true" />
              Imprenta en línea · Quito y valles
            </p>
            <h1 id="hero-title" className="mt-5 max-w-xl text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
              Imprime lo de tu marca, sin complicarte.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-7 text-white/80">
              Eliges, ves el precio final al instante y pides por WhatsApp. Tarjetas en tu puerta desde el {arrival}.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#que-imprimir"
                className="press inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-ink hover:bg-white/90"
              >
                Ver productos
              </Link>
              <a
                href={help}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex min-h-12 items-center gap-2 rounded-full border border-white/35 px-5 font-semibold text-white hover:bg-white/10"
              >
                <WhatsappLogo size={20} />
                Te ayudamos a elegir
              </a>
            </div>
          </div>

          {/* Collage de productos: deja claro de entrada que no son solo tarjetas. */}
          <div className="grid h-[320px] grid-cols-6 grid-rows-5 gap-3 sm:h-[400px] lg:h-[420px]" aria-hidden="true">
            <Collage className="col-span-4 row-span-3" kind="tarjetas" delay={60} />
            <Collage className="col-span-2 row-span-3" kind="gran-formato" delay={140} />
            <Collage className="col-span-2 row-span-2" kind="pegatinas" delay={220} />
            <Collage className="col-span-2 row-span-2" kind="empaque" delay={300} />
            <Collage className="col-span-2 row-span-2" kind="papeleria" delay={380} />
          </div>
        </div>
      </section>

      {/* ---------- Lo que siempre pasa ---------- */}
      <section className="border-b border-line bg-sheet" aria-label="Ventajas">
        <ul className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-5 px-5 py-6 md:grid-cols-4 md:px-8">
          <Perk icon={<TagIcon />} title="Precio final al instante" text="Con IVA y envío incluidos" />
          <Perk icon={<TruckIcon />} title="Entrega a domicilio" text="Quito y los valles" />
          <Perk icon={<WhatsappLogo size={22} brand />} title="Pagas por WhatsApp" text="Transferencia o Deuna" />
          <Perk icon={<BrushIcon />} title="Tu diseño como quieras" text="Canva, archivo o chat" />
        </ul>
      </section>

      {/* ---------- Catálogo ---------- */}
      <section id="que-imprimir" className="mx-auto w-full max-w-6xl scroll-mt-28 px-5 py-16 md:px-8 md:py-20" aria-labelledby="que-imprimir-titulo">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="que-imprimir-titulo" className="text-3xl font-semibold tracking-tight md:text-4xl">
              ¿Qué quieres imprimir?
            </h2>
            <p className="mt-2 max-w-lg leading-7 text-ink-soft">Toca una categoría. Las que dicen «en línea» las armas y pides aquí mismo.</p>
          </div>
          <Link href="/productos" className="inline-flex min-h-11 items-center text-sm font-semibold text-press underline-offset-4 hover:underline">
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
                    <ProductArt kind="tarjetas" className="aspect-[16/10] w-full" />
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
              <span className="grid size-10 place-items-center rounded-full bg-press text-base font-semibold text-white tabular-nums">{index + 1}</span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1 leading-6 text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Cotización ---------- */}
      <section className="border-t border-line" aria-labelledby="cotizacion">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 id="cotizacion" className="max-w-md text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              ¿Necesitas una cotización para la empresa?
            </h2>
            <p className="mt-4 max-w-md leading-7 text-ink-soft">
              Sácala en un minuto, con número, fecha y {QUOTE_VALID_DAYS} días hábiles de validez. La guardas en PDF, la compartes o te la enviamos.
            </p>
            <Link href="/cotizacion" className="press mt-8 inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-white hover:bg-ink/85">
              Hacer una cotización
            </Link>
          </div>
          <div className="rounded-[22px] border border-line bg-sheet p-6 shadow-[0_24px_50px_-34px_rgba(26,29,33,0.5)]" aria-hidden="true">
            <div className="flex items-center justify-between border-b-2 border-ink pb-4">
              <span className="text-xl font-semibold">ASAP</span>
              <span className="text-sm text-ink-soft">Cotización de ejemplo</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">Tarjetas clásicas a doble cara · 500 u.</span>
                <span className="tabular-nums">{formatUsd(priceFor({ sizeId: "85x55", sides: 2 }, 500).cents)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">Entrega estándar</span>
                <span className="font-medium text-press-deep">Incluida</span>
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
      <section className="cutting-mat text-white" aria-labelledby="ayuda">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center md:px-8">
          <div>
            <h2 id="ayuda" className="text-3xl font-semibold tracking-tight">¿No sabes por dónde empezar?</h2>
            <p className="mt-2 max-w-md leading-7 text-white/80">Cuéntanos qué necesitas y te decimos qué imprimir, en qué papel y cuánto cuesta.</p>
          </div>
          <a
            href={help}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 font-semibold text-ink hover:bg-white/90"
          >
            <WhatsappLogo size={20} brand />
            Escríbenos por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}

function Collage({ kind, className, delay }: { kind: string; className: string; delay: number }) {
  return (
    <div
      className={`reveal-up overflow-hidden rounded-[20px] shadow-[0_24px_40px_-24px_rgba(0,0,0,0.6)] ring-1 ring-white/10 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <ProductArt kind={kind} className="h-full w-full" />
    </div>
  );
}

function Perk({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-moss-soft text-press-deep" aria-hidden="true">
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
