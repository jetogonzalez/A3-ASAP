import { WhatsappLogo } from "@/components/whatsapp-logo";
import type { Metadata } from "next";
import Link from "next/link";
import { customQuoteMessage, whatsappHref } from "@/lib/whatsapp";
import { notFound, redirect } from "next/navigation";
import { productHref } from "@/lib/catalog";
import { familyBySlug } from "@/lib/families";
import { LaunchProductTile } from "@/components/launch-product-tile";
import { ProductArt } from "@/components/product-art";
import { launchProductsFor } from "@/lib/launch-products";

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
        <ProductArt kind={family.slug} className="hidden aspect-[4/3] w-full rounded-[22px] md:block" />
      </div>

      {products.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-press px-5 text-sm font-semibold text-white hover:bg-press-deep"
          >
            <WhatsappLogo />
            Cotizar {family.label.toLowerCase()} por WhatsApp
          </a>
        )}
        <Link
          href={productHref()}
          className="inline-flex min-h-12 items-center rounded-full border border-line px-5 text-sm font-semibold hover:border-ink/30"
        >
          Ver tarjetas de presentación
        </Link>
      </div>
    </div>
  );
}
