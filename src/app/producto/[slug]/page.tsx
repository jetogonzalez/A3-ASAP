import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Configurator } from "@/components/configurator";
import { LaunchConfigurator } from "@/components/launch-configurator";
import { PRODUCT, configurationFromSearch } from "@/lib/catalog";
import { familyBySlug } from "@/lib/families";
import { launchProductBySlug, type LaunchProduct } from "@/lib/launch-products";
import { formatUnitPrice, launchPriceFrom, launchPriceTable } from "@/lib/launch-prices";
import { canvaReturnFromSearch, pickedFromSearch } from "@/lib/canva-return";
import { canvaVisible } from "@/server/canva";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/site";
import { cardsProductGraph, launchProductGraph } from "@/lib/structured-data";


type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Pick<ProductPageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const launch = launchProductBySlug(slug);
  if (launch) {
    const family = familyBySlug(launch.family);
    const from = launchPriceFrom(launch.id, launch.quantities);
    const price = from !== null ? ` Desde ${formatUnitPrice(from)} c/u + IVA.` : "";
    return pageMetadata({
      title: `${launch.name} con tu marca en Quito`,
      description: `${launch.summary}${price} Desde ${launch.quantities[0]} unidades, producción en ${launch.leadTime}${family ? ` · ${family.label}` : ""}. Pide por WhatsApp con entrega en Quito y los valles.`,
      path: `/producto/${launch.slug}`,
    });
  }
  return pageMetadata({
    title: "Tarjetas de presentación en Quito",
    description:
      "Tarjetas de presentación en couché 300 g, mate o brillante, con laminado, UV selectivo y puntas redondeadas. Precio final en dólares con IVA al instante y entrega en Quito y los valles.",
    path: `/producto/${PRODUCT.slug}`,
  });
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const launch = launchProductBySlug(slug);
  if (launch) return <LaunchProductPage product={launch} />;
  if (slug !== PRODUCT.slug) notFound();
  const query = await searchParams;
  const initial = configurationFromSearch(query);
  const item = query.item;
  const editId = typeof item === "string" ? item : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <JsonLd data={cardsProductGraph()} />
      <nav aria-label="Miga de pan" className="text-sm text-ink-soft">
        <Link href="/productos" className="underline-offset-4 hover:underline">
          Productos
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{PRODUCT.name}</span>
      </nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">{PRODUCT.name}</h1>
          {/* Sin el nombre del tamaño: se arma en el servidor y no seguiría lo que eliges abajo. */}
          <p className="mt-2 text-ink-soft">{PRODUCT.material}</p>
        </div>
      </div>
      <div className="mt-8">
        <Configurator
          initial={initial}
          editId={editId}
          orderedAt={new Date().toISOString()}
          uploadsEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
          canvaEnabled={await canvaVisible()}
          canvaReturn={canvaReturnFromSearch(query)}
          initialPicked={pickedFromSearch(query)}
        />
      </div>
    </div>
  );
}

function LaunchProductPage({ product }: { product: LaunchProduct }) {
  const family = familyBySlug(product.family);
  const from = launchPriceFrom(product.id, product.quantities);
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <JsonLd data={launchProductGraph(product, family?.label)} />
      <nav aria-label="Miga de pan" className="text-sm text-ink-soft">
        <Link href="/productos" className="underline-offset-4 hover:underline">
          Productos
        </Link>
        {family ? (
          <>
            <span aria-hidden="true"> / </span>
            <Link href={`/productos/${family.slug}`} className="underline-offset-4 hover:underline">
              {family.label}
            </Link>
          </>
        ) : null}
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{product.name}</span>
      </nav>
      <div className="mt-4">
        <h1 className="font-display text-4xl md:text-5xl">{product.name}</h1>
        <p className="mt-2 max-w-xl text-ink-soft">{product.summary}</p>
        {from !== null ? (
          <p className="mt-3 text-lg">
            Desde <span className="font-semibold tabular-nums">{formatUnitPrice(from)}</span> c/u + IVA
          </p>
        ) : null}
      </div>
      <div className="mt-8">
        <LaunchConfigurator product={product} uploadsEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
      </div>
      <LaunchPrices product={product} />
    </div>
  );
}

/* Precio por unidad según variante y cantidad, sin IVA. Se lee de la matriz. */
function LaunchPrices({ product }: { product: LaunchProduct }) {
  const table = launchPriceTable(product.id, product.quantities);
  if (!table) return null;
  return (
    <section aria-labelledby="precios" className="mt-12">
      <h2 id="precios" className="text-2xl font-semibold tracking-tight">
        Precio por unidad
      </h2>
      <p className="mt-1 text-ink-soft">Sin IVA. Mientras más pides, menos pagas por cada una.</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full border-collapse text-left text-base">
          <caption className="sr-only">Precio por unidad de {product.name}, sin IVA, según variante y cantidad</caption>
          <thead className="bg-paper-deep">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold">
                Variante
              </th>
              {table.quantities.map((quantity) => (
                <th key={quantity} scope="col" className="px-4 py-2.5 text-right font-semibold whitespace-nowrap tabular-nums">
                  {quantity.toLocaleString("es-EC")} u.
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {table.variants.map((variant) => (
              <tr key={variant.name}>
                <th scope="row" className="px-4 py-2.5 font-medium whitespace-nowrap">
                  {variant.name}
                </th>
                {variant.prices.map((price, index) => (
                  <td key={table.quantities[index]} className="px-4 py-2.5 text-right whitespace-nowrap tabular-nums text-ink-soft">
                    {price !== null ? formatUnitPrice(price) : <span className="text-sm">A confirmar</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        Precios referenciales. Los acabados, la entrega más rápida y el envío se suman; te confirmamos el total por WhatsApp antes de producir.
      </p>
    </section>
  );
}
