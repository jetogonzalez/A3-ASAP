import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Configurator } from "@/components/configurator";
import { LaunchConfigurator } from "@/components/launch-configurator";
import { PRODUCT, configurationFromSearch } from "@/lib/catalog";
import { familyBySlug } from "@/lib/families";
import { launchProductBySlug, type LaunchProduct } from "@/lib/launch-products";
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
    return pageMetadata({
      title: `${launch.name} con tu marca en Quito`,
      description: `${launch.summary} Desde ${launch.quantities[0]} unidades, producción en ${launch.leadTime}${family ? ` · ${family.label}` : ""}. Cotiza por WhatsApp con entrega en Quito y los valles.`,
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
      </div>
      <div className="mt-8">
        <LaunchConfigurator product={product} uploadsEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
      </div>
    </div>
  );
}
