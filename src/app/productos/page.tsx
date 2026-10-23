import type { Metadata } from "next";
import { CatalogCard } from "@/components/catalog-card";
import { FamilyGrid } from "@/components/family-grid";
import { LaunchProductTile } from "@/components/launch-product-tile";
import { PRODUCT } from "@/lib/catalog";
import { searchLaunchProducts } from "@/lib/launch-products";

export const metadata: Metadata = {
  title: "Productos",
  description: "Tarjetas de presentación en línea. Promocionales, textil, empaque y papelería por cotización.",
};

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = await searchParams;
  const raw = query.q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();
  const cardsMatch = q.length === 0 || /tarjet|present|card|visite|asap|couche/i.test(q);
  const launchMatches = q ? searchLaunchProducts(q) : [];
  const matches = cardsMatch || launchMatches.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Productos</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
        {q && !matches
          ? `No hay resultados para “${q}”. En línea se piden ${PRODUCT.name.toLowerCase()}; lo demás se cotiza por WhatsApp.`
          : "Las tarjetas se arman y piden aquí mismo. Promocionales, textil, empaque y papelería se cotizan por WhatsApp."}
      </p>
      <div className="mt-8">
        {q && matches ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {cardsMatch ? (
              <li>
                <CatalogCard />
              </li>
            ) : null}
            {launchMatches.map((product) => (
              <li key={product.id}>
                <LaunchProductTile product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <FamilyGrid />
        )}
      </div>
    </div>
  );
}
