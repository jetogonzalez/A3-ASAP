"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { articleHref, helpCategory, searchHelp } from "@/lib/help-center";

/*
 * El buscador del centro de ayuda. El anillo de foco lo lleva la píldora
 * entera (focus-shell), no el campo de adentro: si no, sale un recuadro
 * cuadrado dentro del borde redondeado.
 * Muestra resultados mientras escribes, como
 * los centros de ayuda grandes. Con el teclado: flechas para moverse, Enter
 * para abrir el resultado marcado (o ver todos), Escape para cerrar. Sin
 * JavaScript sigue funcionando: el formulario va a /ayuda?q=…
 */
export function HelpSearch({ initial = "", autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const [query, setQuery] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const listId = useId();
  const results = searchHelp(query, 6);
  const showList = open && query.trim().length > 1;

  return (
    <form
      action="/ayuda"
      role="search"
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        const picked = active >= 0 ? results[active] : undefined;
        setOpen(false);
        if (picked) router.push(articleHref(picked));
        else router.push(query.trim() ? `/ayuda?q=${encodeURIComponent(query.trim())}#resultados` : "/ayuda");
      }}
    >
      <label htmlFor="buscar-ayuda" className="sr-only">
        Buscar en la ayuda
      </label>
      <div className="focus-shell flex h-14 items-center rounded-full border-2 border-ink bg-sheet pr-1.5 pl-5 shadow-[0_18px_40px_-24px_rgba(20,20,40,0.45)] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-brand">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-ink-soft">
          <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.2 10.2 13 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          id="buscar-ayuda"
          name="q"
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          value={query}
          placeholder="Ej.: formatos, sangrado, cuánto tarda, factura"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((current) => Math.min(current + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((current) => Math.max(current - 1, -1));
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-ink-soft"
        />
        <button type="submit" className="press inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full bg-press px-5 text-sm font-semibold text-white hover:bg-press-deep">
          Buscar
        </button>
      </div>

      {showList ? (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-sheet text-left shadow-[0_24px_48px_-24px_rgba(20,20,20,0.45)]">
          {results.length > 0 ? (
            <ul id={listId} role="listbox" aria-label="Artículos sugeridos">
              {results.map((article, index) => (
                <li key={article.slug} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
                  <Link
                    href={articleHref(article)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 focus-visible:-outline-offset-4 ${index === active ? "bg-paper-deep" : "hover:bg-paper-deep"}`}
                  >
                    <span className="block font-semibold">{article.title}</span>
                    <span className="block truncate text-sm text-ink-soft">
                      {helpCategory(article.category)?.title} · {article.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p id={listId} className="px-4 py-3 text-sm text-ink-soft">
              No encontramos nada con «{query.trim()}». Prueba con otra palabra o escríbenos por WhatsApp.
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
}
