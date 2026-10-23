import type { ReactNode } from "react";

/** Plantilla sobria para las páginas de texto largo: privacidad, términos y ayuda. */
export function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro: string; children: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-ink-soft">Actualizado el {updated}</p>
      <p className="mt-6 text-lg leading-8 text-ink-soft">{intro}</p>
      <div className="mt-10 space-y-10 leading-7 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-brand-deep [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </article>
  );
}
