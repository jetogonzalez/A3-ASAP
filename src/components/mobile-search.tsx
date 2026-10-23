"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ProductPhoto } from "@/components/product-photo";
import { PRODUCT, productHref } from "@/lib/catalog";
import { LAUNCH_PRODUCTS, launchProductHref, searchLaunchProducts } from "@/lib/launch-products";

/*
 * Buscador del teléfono. En el encabezado no cabía un campo entero (se cortaba
 * en «Buscar pr…»), así que ahí queda una lupa y al tocarla se abre una
 * pantalla completa: campo grande con el teclado ya abierto, resultados
 * mientras escribes y, antes de escribir, lo más pedido.
 *
 * Es un diálogo modal: el foco entra al campo, Escape o «Cerrar» lo cierran y
 * el foco vuelve a la lupa. El fondo no se desplaza mientras está abierto.
 */

type Result = { href: string; slug: string; name: string; summary: string };

const CARDS: Result = { href: productHref(), slug: PRODUCT.slug, name: PRODUCT.name, summary: "Precio al instante, pídelas en línea." };
const POPULAR: Result[] = [
  CARDS,
  ...["tazas-mugs", "camisetas-hoodies", "etiquetas", "gorras"].flatMap((slug) => {
    const product = LAUNCH_PRODUCTS.find((item) => item.slug === slug);
    return product ? [{ href: launchProductHref(product), slug: product.slug, name: product.name, summary: product.summary }] : [];
  }),
];

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function search(query: string): Result[] {
  const needle = normalize(query.trim());
  if (!needle) return [];
  const cards = normalize(`${PRODUCT.name} ${PRODUCT.summary} tarjetas presentacion`).includes(needle) ? [CARDS] : [];
  return [
    ...cards,
    ...searchLaunchProducts(query).map((product) => ({
      href: launchProductHref(product),
      slug: product.slug,
      name: product.name,
      summary: product.summary,
    })),
  ];
}

export function MobileSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const results = search(query);
  const typing = query.trim().length > 0;
  const shown = typing ? results : POPULAR;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label="Buscar productos"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="press grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-paper-deep text-ink hover:border-ink/30 md:hidden"
      >
        <SearchIcon size={20} />
      </button>
      {open
        ? createPortal(
            <div role="dialog" aria-modal="true" aria-label="Buscar productos" className="search-sheet fixed inset-0 z-[60] flex flex-col bg-sheet text-ink">
              <form
                role="search"
                action="/productos"
                onSubmit={(event) => {
                  event.preventDefault();
                  const q = query.trim();
                  setOpen(false);
                  router.push(q ? `/productos?q=${encodeURIComponent(q)}` : "/productos");
                }}
                className="flex items-center gap-2 border-b border-line px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar búsqueda"
                  className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-paper-deep"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="focus-shell flex h-12 min-w-0 flex-1 items-center rounded-full border-2 border-ink bg-sheet pr-1 pl-4">
                  <label htmlFor="buscar-movil" className="sr-only">
                    Buscar productos
                  </label>
                  <input
                    ref={input}
                    id="buscar-movil"
                    name="q"
                    type="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tazas, gorras, tarjetas…"
                    className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-soft"
                  />
                  <button
                    type="submit"
                    aria-label="Buscar"
                    className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-press text-white hover:bg-press-deep"
                  >
                    <SearchIcon size={16} />
                  </button>
                </div>
              </form>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
                <h2 className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft" aria-live="polite">
                  {typing ? (results.length > 0 ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}` : "Sin resultados") : "Lo más pedido"}
                </h2>
                {typing && results.length === 0 ? (
                  <p className="mt-3 leading-7 text-ink-soft">
                    No encontramos «{query.trim()}». Prueba con otra palabra o{" "}
                    <Link href="/productos" onClick={() => setOpen(false)} className="font-semibold text-brand-deep underline underline-offset-4">
                      mira todos los productos
                    </Link>
                    .
                  </p>
                ) : null}
                <ul className="mt-2 divide-y divide-line">
                  {shown.map((result) => (
                    <li key={result.slug}>
                      <Link href={result.href} onClick={() => setOpen(false)} className="flex min-h-16 items-center gap-3 py-2.5">
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-paper-deep">
                          <ProductPhoto slug={result.slug} alt="" sizes="56px" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold">{result.name}</span>
                          <span className="block truncate text-sm text-ink-soft">{result.summary}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/productos"
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm font-semibold hover:border-ink/30"
                >
                  Ver todos los productos
                </Link>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function SearchIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.2 10.2 13 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
