import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { CardsTile } from "@/components/cards-tile";
import { FamilyGrid } from "@/components/family-grid";
import { LaunchProductTile } from "@/components/launch-product-tile";
import { searchLaunchProducts } from "@/lib/launch-products";

export const metadata: Metadata = pageMetadata({
  title: "Productos personalizados",
  description: "Tarjetas de presentación en línea y, por cotización, esferos, tomatodos, tazas, camisetas, hoodies, gorras, tote bags, etiquetas, papel de regalo, calendarios y cuadernos con tu marca.",
  path: "/productos",
});

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
          ? `No hay resultados para “${q}”. Mira las categorías o escríbenos por WhatsApp y te ayudamos a encontrarlo.`
          : "Promocionales, textil, tarjetas, empaque y papelería con tu marca. Arma el que quieras: las tarjetas se pagan aquí mismo y lo demás te lo cotizamos por WhatsApp."}
      </p>
      <div className="mt-8">
        {q && matches ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {cardsMatch ? (
              <li>
                <CardsTile />
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
