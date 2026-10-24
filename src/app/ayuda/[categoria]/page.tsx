import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpSearch } from "@/components/help/help-search";
import { CATEGORY_TINT, HelpContact, HelpIcon } from "@/components/help/help-ui";
import { HELP_CATEGORIES, articleHref, articlesIn, helpCategory } from "@/lib/help-center";
import { pageMetadata } from "@/lib/site";

type CategoryProps = { params: Promise<{ categoria: string }> };

export function generateStaticParams() {
  return HELP_CATEGORIES.map((category) => ({ categoria: category.slug }));
}

export async function generateMetadata({ params }: CategoryProps): Promise<Metadata> {
  const { categoria } = await params;
  const category = helpCategory(categoria);
  if (!category) return { title: "Ayuda" };
  return pageMetadata({ title: `${category.title} · Ayuda`, description: category.description, path: `/ayuda/${category.slug}` });
}

export default async function HelpCategoryPage({ params }: CategoryProps) {
  const { categoria } = await params;
  const category = helpCategory(categoria);
  if (!category) notFound();
  const articles = articlesIn(category.slug);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <nav aria-label="Miga de pan" className="text-sm text-ink-soft">
        <Link href="/ayuda" className="underline-offset-4 hover:underline">
          Centro de ayuda
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{category.title}</span>
      </nav>
      <div className="mt-5 flex items-center gap-4">
        <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${CATEGORY_TINT[category.icon]}`}>
          <HelpIcon icon={category.icon} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{category.title}</h1>
          <p className="mt-1 text-ink-soft">{category.description}</p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ul className="divide-y divide-line self-start overflow-hidden rounded-[22px] border border-line bg-sheet">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link href={articleHref(article)} className="group flex items-center gap-4 px-5 py-4 hover:bg-paper-deep focus-visible:-outline-offset-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold">{article.title}</span>
                  <span className="block text-ink-soft">{article.summary}</span>
                </span>
                <span aria-hidden="true" className="text-ink-soft transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <aside className="space-y-6">
          <HelpSearch />
          <nav aria-label="Otros temas">
            <h2 className="text-sm font-semibold text-ink-soft">Otros temas</h2>
            <ul className="mt-2 space-y-1">
              {HELP_CATEGORIES.filter((other) => other.slug !== category.slug).map((other) => (
                <li key={other.slug}>
                  <Link href={`/ayuda/${other.slug}`} className="flex min-h-10 items-center gap-3 rounded-xl px-2 hover:bg-paper-deep">
                    <span className={`grid size-8 place-items-center rounded-lg ${CATEGORY_TINT[other.icon]}`}>
                      <HelpIcon icon={other.icon} className="size-[18px]" />
                    </span>
                    <span className="font-medium">{other.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <HelpContact compact />
        </aside>
      </div>
    </div>
  );
}
