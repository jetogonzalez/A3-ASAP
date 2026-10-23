import { WhatsappLogo } from "@/components/whatsapp-logo";
import type { Metadata } from "next";
import Link from "next/link";
import { customQuoteMessage, whatsappHref } from "@/lib/whatsapp";
import { notFound, redirect } from "next/navigation";
import { productHref } from "@/lib/catalog";
import { familyBySlug } from "@/lib/families";
import { LaunchProductTile } from "@/components/launch-product-tile";
import { ProductArt } from "@/components/product-art";
import { ProductPhoto, hasProductPhoto } from "@/components/product-photo";
import { LAUNCH_PRODUCTS, launchProductsFor } from "@/lib/launch-products";

/*
 * Para las familias que aún no se arman en la web: productos parecidos que sí
 * se pueden pedir ya, para que la página no sea un callejón sin salida.
 */
const RELATED: Record<string, string[]> = {
  pegatinas: ["etiquetas", "papel-regalo", "tarjetas-de-regalo"],
  catalogos: ["cuadernos", "calendarios", "tarjetas-de-regalo"],
  "gran-formato": ["tote-bags", "camisetas-hoodies", "gorras"],
};

type FamilyPageProps = {
  params: Promise<{ familia: string }>;
};

export async function generateMetadata({ params }: FamilyPageProps): Promise<Metadata> {
  const { familia } = await params;
  const family = familyBySlug(familia);
  if (!family || family.live) return { title: "Productos" };
  const hasProducts = launchProductsFor(family.slug).length > 0;
  return {
    title: family.label,
    description: hasProducts
      ? `${family.note} Se cotizan por WhatsApp.`
      : `${family.note} Todavía no abrimos esta categoría.`,
  };
}

export default async function FamilyPage({ params }: FamilyPageProps) {
  const { familia } = await params;
  const family = familyBySlug(familia);
  if (!family) notFound();
  if (family.live) redirect(productHref());
  const products = launchProductsFor(family.slug);
  const related = (RELATED[family.slug] ?? [])
    .map((slug) => LAUNCH_PRODUCTS.find((product) => product.slug === slug))
    .filter((product) => product !== undefined);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <nav aria-label="Miga de pan" className="text-sm text-ink-soft">
        <Link href="/productos" className="underline-offset-4 hover:underline">
          Productos
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{family.label}</span>
      </nav>
      <div className="mt-4 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div>
          {products.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-soft px-2.5 py-1 text-xs font-semibold text-moss">
              {products.length} productos para armar
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-flag px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-flag-ink">
              Pronto
            </span>
          )}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{family.label}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">{family.note}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
            {products.length > 0
              ? "Elige un producto, arma tu pedido y envíalo por WhatsApp. Te respondemos con precio y plazo."
              : "Todavía no se arma en la web, pero ya lo cotizamos por WhatsApp: cuéntanos qué necesitas y te respondemos con precio y plazo."}
          </p>
        </div>
        {products.length > 0 || hasProductPhoto(family.slug) ? (
          <span className="relative hidden aspect-[4/3] w-full overflow-hidden rounded-[22px] md:block">
            <ProductPhoto slug={products[0]?.slug ?? family.slug} alt="" sizes="352px" preload />
          </span>
        ) : (
          <ProductArt kind={family.slug} className="hidden aspect-[4/3] w-full rounded-[22px] md:block" />
        )}
      </div>

      {products.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <LaunchProductTile product={product} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {products.length > 0 ? null : (
          <a
            href={whatsappHref(customQuoteMessage(family.label.toLowerCase()))}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex min-h-12 items-center gap-2 rounded-full bg-press px-5 text-sm font-semibold text-white hover:bg-press-deep"
          >
            <WhatsappLogo />
            Cotizar {family.label.toLowerCase()} por WhatsApp
          </a>
        )}
        <Link
          href="/productos"
          className="press inline-flex min-h-12 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold hover:border-ink/30"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="rotate-180">
            <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ver todos los productos
        </Link>
      </div>

      {related.length > 0 ? (
        <section className="mt-14 border-t border-line pt-10" aria-labelledby="mientras-tanto">
          <h2 id="mientras-tanto" className="text-2xl font-semibold tracking-tight">
            Mientras tanto, esto ya lo puedes armar
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">Productos parecidos que se arman aquí y se piden por WhatsApp.</p>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((product) => (
              <li key={product.id}>
                <LaunchProductTile product={product} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
