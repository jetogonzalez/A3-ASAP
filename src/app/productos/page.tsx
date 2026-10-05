import type { Metadata } from "next";
import { CatalogCard } from "@/components/catalog-card";
import { PRODUCT } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Productos",
  description: "Hoy se piden tarjetas de presentación. El resto de categorías se abre después.",
};

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = await searchParams;
  const raw = query.q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();
  const matches = q.length === 0 || /tarjet|present|card|visite|pliego|couche/i.test(q);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Productos</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
        {q && !matches
          ? `No hay resultados para “${q}”. Hoy solo se piden ${PRODUCT.name.toLowerCase()}.`
          : "Hoy se piden tarjetas de presentación. Papelería, catálogos, gran formato, pegatinas, empaque y textil se abren después."}
      </p>
      <div className="mt-8">
        <CatalogCard />
      </div>
    </div>
  );
}
