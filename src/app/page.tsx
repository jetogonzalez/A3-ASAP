import Link from "next/link";
import { HomeHero } from "@/components/home-hero";
import { defaultConfiguration, productHref, QUANTITIES, type Configuration } from "@/lib/catalog";
import { deliveryWindow, formatLongDate } from "@/lib/delivery";
import { FAMILIES } from "@/lib/families";
import { formatUsd } from "@/lib/money";
import { quote } from "@/lib/pricing";
import { QUOTE_VALID_DAYS } from "@/lib/quote";
import { customQuoteMessage, whatsappHref } from "@/lib/whatsapp";

/* La fecha del titular cambia con el día: se vuelve a armar cada 10 minutos. */
export const revalidate = 600;

const STEPS = [
  {
    title: "Arma tu tarjeta",
    text: "Eliges tamaño, papel, acabados y cantidad. El precio en dólares cambia mientras eliges, y puedes subir tu diseño.",
  },
  {
    title: "Finaliza el pedido",
    text: "Pones la dirección y los datos de la factura. El total ya trae el envío, así que no hay sorpresas.",
  },
  {
    title: "Paga por WhatsApp",
    text: "Te dejamos el mensaje escrito. Lo envías, te pasamos la cuenta o el código Deuna y empezamos a imprimir.",
  },
] as const;

const PRICE_COLUMNS: Array<{ label: string; config: Partial<Configuration> }> = [
  { label: "Clásica, 1 lado", config: { sizeId: "85x55", sides: 1 } },
  { label: "Clásica, 2 lados", config: { sizeId: "85x55", sides: 2 } },
  { label: "Cuadrada, 1 lado", config: { sizeId: "55x55", sides: 1 } },
];

function priceFor(partial: Partial<Configuration>, quantity: Configuration["quantity"]) {
  const config = { ...defaultConfiguration(partial.sizeId ?? "85x55"), ...partial, quantity };
  return { cents: quote(config).printingCents, href: productHref(config) };
}

export default function HomePage() {
  const arrival = formatLongDate(deliveryWindow(new Date().toISOString(), "express").earliest);
  const upcoming = FAMILIES.filter((family) => !family.live);

  return (
    <>
      <HomeHero arrival={arrival} fromPrice={formatUsd(priceFor({ sizeId: "85x55", sides: 1 }, 100).cents)} />

      <section className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8" aria-labelledby="como-se-pide">
        <h2 id="como-se-pide" className="text-3xl font-semibold tracking-tight md:text-4xl">
          Así se pide
        </h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t-2 border-ink pt-5">
              <span className="text-sm font-semibold tabular-nums text-press">Paso {index + 1}</span>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 max-w-sm leading-7 text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-paper-deep" aria-labelledby="precios">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 md:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h2 id="precios" className="text-3xl font-semibold tracking-tight md:text-4xl">
              Cuánto cuestan
            </h2>
            <p className="mt-4 max-w-sm leading-7 text-ink-soft">
              Couche de 300 g, mate o brillante, sin acabados. El laminado, el UV selectivo y las puntas redondeadas se suman al armarlas.
            </p>
            <p className="mt-4 max-w-sm leading-7 text-ink-soft">
              El envío en Quito y los valles cuesta {formatUsd(350)} hasta el primer kilo. Mil tarjetas pesan alrededor de 1,5 kg.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Precios en USD por cantidad y formato</caption>
              <thead>
                <tr className="border-b-2 border-ink text-sm">
                  <th scope="col" className="py-3 pr-4 font-medium">Cantidad</th>
                  {PRICE_COLUMNS.map((column) => (
                    <th key={column.label} scope="col" className="py-3 pr-3 text-right font-medium last:pr-0 sm:pr-4">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {QUANTITIES.map((quantity) => (
                  <tr key={quantity} className="border-b border-line">
                    <th scope="row" className="py-4 pr-4 font-medium tabular-nums">
                      {quantity.toLocaleString("es-EC")}
                    </th>
                    {PRICE_COLUMNS.map((column) => {
                      const price = priceFor(column.config, quantity);
                      return (
                        <td key={column.label} className="py-4 pr-4 text-right last:pr-0">
                          <Link
                            href={price.href}
                            className="text-base font-semibold tabular-nums underline-offset-4 sm:text-lg hover:text-press hover:underline"
                            aria-label={`${quantity} tarjetas, ${column.label}: ${formatUsd(price.cents)}. Armarlas`}
                          >
                            {formatUsd(price.cents)}
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-sm text-ink-soft">Toca un precio para armar esa tarjeta.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8" aria-labelledby="cotizacion">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <h2 id="cotizacion" className="max-w-md text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              ¿Alguien más tiene que aprobarlo?
            </h2>
            <p className="mt-4 max-w-md leading-7 text-ink-soft">
              Arma las tarjetas y sácalas en una cotización con número, fecha y {QUOTE_VALID_DAYS} días hábiles de validez, a nombre de tu empresa.
            </p>
            <Link
              href="/cotizacion"
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-press px-6 font-semibold text-white hover:bg-press-deep active:scale-[0.97]"
            >
              Hacer una cotización
            </Link>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            <div className="py-5">
              <dt className="font-semibold">La guardas o la compartes</dt>
              <dd className="mt-1 leading-7 text-ink-soft">
                En PDF, por correo o con un enlace. Quien la recibe ve los mismos precios y puede convertirla en pedido.
              </dd>
            </div>
            <div className="py-5">
              <dt className="font-semibold">Te la enviamos</dt>
              <dd className="mt-1 leading-7 text-ink-soft">
                La pides por WhatsApp y te respondemos con la cotización formal para tu contabilidad.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-t border-line" aria-labelledby="pronto">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8">
          <h2 id="pronto" className="text-3xl font-semibold tracking-tight md:text-4xl">
            Lo que viene
          </h2>
          <p className="mt-4 max-w-lg leading-7 text-ink-soft">
            Estos productos todavía no se arman en la web, pero ya los cotizamos por WhatsApp.
          </p>
          <ul className="mt-8 grid gap-x-10 sm:grid-cols-2">
            {upcoming.map((family) => (
              <li key={family.slug} className="flex items-center justify-between gap-4 border-b border-line py-4">
                <span>
                  <span className="block font-semibold">{family.label}</span>
                  <span className="block text-sm text-ink-soft">{family.note}</span>
                </span>
                <a
                  href={whatsappHref(customQuoteMessage(family.label.toLowerCase()))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-press underline-offset-4 hover:underline"
                  aria-label={`Cotizar ${family.label} por WhatsApp`}
                >
                  Cotizar
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
