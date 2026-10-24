import type { Metadata } from "next";
import Link from "next/link";
import { HelpSearch } from "@/components/help/help-search";
import { CATEGORY_TINT, HelpContact, HelpIcon } from "@/components/help/help-ui";
import { JsonLd } from "@/components/json-ld";
import { FAQS } from "@/lib/faq";
import { HELP_ARTICLES, HELP_CATEGORIES, articleHref, articlesIn, helpCategory, searchHelp } from "@/lib/help-center";
import { pageMetadata } from "@/lib/site";
import { faqGraph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Centro de ayuda",
  description:
    "Respuestas sobre pedidos, pagos, formatos de archivo (PDF, EPS, AI), sangrado, plazos de entrega, envío en Quito, facturas y proformas.",
  path: "/ayuda",
});

type HelpHomeProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/*
 * Centro de ayuda. Arriba el buscador (con resultados mientras escribes),
 * después los temas más consultados, las categorías y las preguntas
 * frecuentes. Cada artículo tiene su página y entra al sitemap.
 */
export default async function HelpHome({ searchParams }: HelpHomeProps) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q ?? "").trim();
  const results = query ? searchHelp(query, 20) : [];
  const popular = HELP_ARTICLES.filter((article) => article.popular);

  return (
    <div>
      <JsonLd data={faqGraph(FAQS)} />
      <section className="cutting-mat border-b border-line" aria-labelledby="ayuda-titulo">
        <div className="mx-auto w-full max-w-3xl px-5 pt-14 pb-12 text-center md:px-8 md:pt-20 md:pb-16">
          <p className="text-sm font-semibold text-brand-deep">Centro de ayuda</p>
          <h1 id="ayuda-titulo" className="mt-2 text-4xl font-semibold tracking-[-0.02em] text-balance md:text-5xl">
            ¿En qué te ayudamos?
          </h1>
          <div className="mt-8">
            <HelpSearch initial={query} />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Lo más buscado">
            {popular.map((article) => (
              <Link
                key={article.slug}
                href={articleHref(article)}
                className="inline-flex min-h-9 items-center rounded-full border border-line bg-sheet px-3.5 text-sm font-medium hover:border-ink/30"
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-16">
        {query ? (
          <section id="resultados" aria-labelledby="resultados-titulo" className="mb-14 scroll-mt-28">
            <h2 id="resultados-titulo" className="text-2xl font-semibold tracking-tight">
              {results.length > 0
                ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"} para «${query}»`
                : `No encontramos nada para «${query}»`}
            </h2>
            {results.length > 0 ? (
              <ul className="mt-5 divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-sheet">
                {results.map((article) => (
                  <li key={article.slug}>
                    <Link href={articleHref(article)} className="block px-5 py-4 hover:bg-paper-deep focus-visible:-outline-offset-4">
                      <span className="text-sm text-ink-soft">{helpCategory(article.category)?.title}</span>
                      <span className="block text-lg font-semibold">{article.title}</span>
                      <span className="block text-ink-soft">{article.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-ink-soft">Prueba con otra palabra, mira las categorías o escríbenos por WhatsApp.</p>
            )}
          </section>
        ) : null}

        <section aria-labelledby="categorias-titulo">
          <h2 id="categorias-titulo" className="text-2xl font-semibold tracking-tight md:text-3xl">
            Temas
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HELP_CATEGORIES.map((category) => {
              const articles = articlesIn(category.slug);
              return (
                <li key={category.slug} className="flex flex-col rounded-[22px] border border-line bg-sheet p-5">
                  <Link href={`/ayuda/${category.slug}`} className="group -m-1.5 flex items-start gap-4 rounded-2xl p-1.5">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${CATEGORY_TINT[category.icon]}`}>
                      <HelpIcon icon={category.icon} />
                    </span>
                    <span>
                      <span className="block text-lg font-semibold tracking-tight group-hover:underline group-hover:underline-offset-4">{category.title}</span>
                      <span className="block text-sm leading-6 text-ink-soft">{category.description}</span>
                    </span>
                  </Link>
                  <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-[0.95rem]">
                    {articles.slice(0, 3).map((article) => (
                      <li key={article.slug}>
                        <Link href={articleHref(article)} className="rounded-sm text-ink hover:text-brand-deep hover:underline hover:underline-offset-4">
                          {article.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/ayuda/${category.slug}`} className="mt-auto pt-4 text-sm font-semibold text-brand-deep underline-offset-4 hover:underline">
                    Ver los {articles.length} artículos
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-labelledby="preguntas-titulo">
          <div>
            <h2 id="preguntas-titulo" className="text-2xl font-semibold tracking-tight md:text-3xl">
              Preguntas frecuentes
            </h2>
            <div className="mt-6 divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-sheet">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group px-5">
                  <summary className="-mx-2 flex min-h-14 cursor-pointer list-none rounded-xl px-2 focus-visible:-outline-offset-2 items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-paper-deep transition-transform duration-200 group-open:rotate-45" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </span>
                  </summary>
                  <p className="pb-5 leading-7 text-ink-soft">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="lg:pt-14">
            <HelpContact compact />
          </div>
        </section>
      </div>
    </div>
  );
}
