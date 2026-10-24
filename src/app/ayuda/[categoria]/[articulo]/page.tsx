import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpFeedback } from "@/components/help/help-feedback";
import { HelpBody, HelpContact } from "@/components/help/help-ui";
import { JsonLd } from "@/components/json-ld";
import { HELP_ARTICLES, articleHref, articlesIn, helpArticle, helpCategory } from "@/lib/help-center";
import { absoluteUrl, pageMetadata } from "@/lib/site";

type ArticleProps = { params: Promise<{ categoria: string; articulo: string }> };

export function generateStaticParams() {
  return HELP_ARTICLES.map((article) => ({ categoria: article.category, articulo: article.slug }));
}

export async function generateMetadata({ params }: ArticleProps): Promise<Metadata> {
  const { categoria, articulo } = await params;
  const article = helpArticle(categoria, articulo);
  if (!article) return { title: "Ayuda" };
  return pageMetadata({ title: article.title, description: article.summary, path: articleHref(article) });
}

export default async function HelpArticlePage({ params }: ArticleProps) {
  const { categoria, articulo } = await params;
  const article = helpArticle(categoria, articulo);
  const category = helpCategory(categoria);
  if (!article || !category) notFound();
  const siblings = articlesIn(category.slug);
  const related = siblings.filter((other) => other.slug !== article.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.summary,
        inLanguage: "es-EC",
        url: absoluteUrl(articleHref(article)),
        publisher: { "@id": absoluteUrl("/#organizacion") },
        articleSection: category.title,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Centro de ayuda", item: absoluteUrl("/ayuda") },
          { "@type": "ListItem", position: 2, name: category.title, item: absoluteUrl(`/ayuda/${category.slug}`) },
          { "@type": "ListItem", position: 3, name: article.title, item: absoluteUrl(articleHref(article)) },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <JsonLd data={jsonLd} />
      <nav aria-label="Miga de pan" className="text-sm text-ink-soft">
        <Link href="/ayuda" className="underline-offset-4 hover:underline">
          Centro de ayuda
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/ayuda/${category.slug}`} className="underline-offset-4 hover:underline">
          {category.title}
        </Link>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label={`Artículos de ${category.title}`} className="order-2 lg:order-1">
          <h2 className="text-sm font-semibold text-ink-soft">{category.title}</h2>
          <ul className="mt-2 space-y-0.5 border-l border-line">
            {siblings.map((other) => {
              const current = other.slug === article.slug;
              return (
                <li key={other.slug}>
                  <Link
                    href={articleHref(other)}
                    aria-current={current ? "page" : undefined}
                    className={`-ml-px block border-l-2 py-1.5 pl-3 text-[0.95rem] leading-6 ${
                      current ? "border-ink font-semibold text-ink" : "border-transparent text-ink-soft hover:text-ink"
                    }`}
                  >
                    {other.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <article className="order-1 max-w-3xl lg:order-2">
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">{article.title}</h1>
          <p className="mt-3 text-lg leading-8 text-ink-soft">{article.summary}</p>
          <div className="mt-8">
            <HelpBody blocks={article.body} />
          </div>
          <div className="mt-12">
            <HelpFeedback title={article.title} />
          </div>
          {related.length > 0 ? (
            <section className="mt-12" aria-labelledby="relacionados">
              <h2 id="relacionados" className="text-xl font-semibold tracking-tight">
                Artículos relacionados
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {related.map((other) => (
                  <li key={other.slug}>
                    <Link href={articleHref(other)} className="block h-full rounded-2xl border border-line p-4 hover:border-ink/30">
                      <span className="block font-semibold">{other.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-soft">{other.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <div className="mt-12">
            <HelpContact compact />
          </div>
        </article>
      </div>
    </div>
  );
}
