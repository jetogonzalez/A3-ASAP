import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { productHref } from "@/lib/catalog";
import { familyBySlug } from "@/lib/families";

type FamilyPageProps = {
  params: Promise<{ familia: string }>;
};

export async function generateMetadata({ params }: FamilyPageProps): Promise<Metadata> {
  const { familia } = await params;
  const family = familyBySlug(familia);
  if (!family || family.live) return { title: "Productos" };
  return {
    title: family.label,
    description: `${family.note} Todavía no abrimos esta categoría.`,
  };
}

export default async function FamilyPage({ params }: FamilyPageProps) {
  const { familia } = await params;
  const family = familyBySlug(familia);
  if (!family) notFound();
  if (family.live) redirect(productHref());

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <nav aria-label="Miga de pan" className="text-sm text-ink-soft">
        <Link href="/productos" className="underline-offset-4 hover:underline">
          Productos
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{family.label}</span>
      </nav>
      <span className="mt-4 inline-flex items-center rounded-full bg-flag px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-flag-ink">
        Pronto
      </span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{family.label}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">{family.note}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
        Todavía no abrimos esta categoría. Por ahora imprimimos tarjetas de presentación y vamos sumando el resto poco a poco.
      </p>
      <Link
        href={productHref()}
        className="mt-6 inline-flex min-h-12 items-center rounded-full bg-press px-5 text-sm font-semibold text-white hover:bg-press-deep"
      >
        Ver tarjetas de presentación
      </Link>
    </div>
  );
}
