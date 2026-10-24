import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { CardsTile } from "@/components/cards-tile";
import { CategoryChips } from "@/components/category-chips";
import { ProductPhoto } from "@/components/product-photo";
import Link from "next/link";
import { FAMILIES, familyHref } from "@/lib/families";
import { inkFor } from "@/lib/palette";
import { LaunchProductTile } from "@/components/launch-product-tile";
import { launchProductsFor, searchLaunchProducts } from "@/lib/launch-products";

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

  const groups = FAMILIES.filter((family) => family.live || launchProductsFor(family.slug).length > 0);
  const soon = FAMILIES.filter((family) => !family.live && launchProductsFor(family.slug).length === 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Productos</h1>
      <p className="mt-2 max-w-xl leading-7 text-ink-soft">
        {q && !matches
          ? `No hay resultados para “${q}”. Mira las categorías o escríbenos por WhatsApp y te ayudamos a encontrarlo.`
          : q
            ? `Resultados para “${q}”.`
            : "Todo con tu marca. Las tarjetas se pagan aquí mismo; lo demás lo armas y te lo cotizamos por WhatsApp."}
      </p>

      {q && matches ? (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
        <>
          <div className="mt-6">
            <CategoryChips anchors />
          </div>

          {/* Cada categoría con sus productos a la vista: no hace falta entrar para saber qué hay. */}
          {groups.map((family) => {
            const products = launchProductsFor(family.slug);
            const ink = inkFor(family.slug);
            return (
              <section key={family.slug} id={family.slug} aria-labelledby={`${family.slug}-titulo`} className="mt-12 scroll-mt-28">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-1.5 rounded-full" style={{ background: ink.accent }} aria-hidden="true" />
                    <div>
                      <h2 id={`${family.slug}-titulo`} className="text-2xl font-semibold tracking-tight">
                        {family.label}
                      </h2>
                      <p className="text-sm text-ink-soft">{family.note}</p>
                    </div>
                  </div>
                  {family.live ? (
                    <span className="rounded-full bg-moss-soft px-2.5 py-1 text-xs font-semibold text-moss">Se pagan en línea</span>
                  ) : (
                    <Link href={familyHref(family)} className="inline-flex min-h-10 items-center rounded-md text-sm font-semibold text-brand-deep underline-offset-4 hover:underline">
                      Ver {family.label.toLowerCase()} ({products.length}) →
                    </Link>
                  )}
                </div>
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {family.live ? (
                    <li>
                      <CardsTile />
                    </li>
                  ) : (
                    products.map((product) => (
                      <li key={product.id}>
                        <LaunchProductTile product={product} />
                      </li>
                    ))
                  )}
                </ul>
              </section>
            );
          })}

          {soon.length > 0 ? (
            <section id="pronto" aria-labelledby="pronto-titulo" className="mt-14 rounded-[22px] bg-paper-deep p-5 md:p-6">
              <h2 id="pronto-titulo" className="text-xl font-semibold tracking-tight">
                Pronto en la web
              </h2>
              <p className="mt-1 text-sm text-ink-soft">Todavía no se arman aquí, pero ya los cotizamos por WhatsApp.</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {soon.map((family) => (
                  <li key={family.slug} id={family.slug} className="scroll-mt-28">
                    <Link href={familyHref(family)} className="flex h-full items-center gap-3 rounded-2xl border border-line bg-sheet p-3 hover:border-ink/30">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl" style={{ background: inkFor(family.slug).tint }}>
                        <ProductPhoto slug={family.slug} alt="" sizes="56px" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">{family.label}</span>
                        <span className="block text-sm text-ink-soft">{family.note}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
