import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Configurator } from "@/components/configurator";
import { PRODUCT, configurationFromSearch } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Tarjetas de presentación",
  description: "Configura tamaño, cantidad, lados y acabados. El precio se calcula en dólares.",
};

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  if (slug !== PRODUCT.slug) notFound();
  const query = await searchParams;
  const initial = configurationFromSearch(query);
  const item = query.item;
  const editId = typeof item === "string" ? item : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
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
        <Configurator initial={initial} editId={editId} orderedAt={new Date().toISOString()} />
      </div>
    </div>
  );
}
