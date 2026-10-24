"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/brand-logo";
import { ProductPhoto } from "@/components/product-photo";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { launchProductHref, type LaunchProduct } from "@/lib/launch-products";
import { whatsappHref } from "@/lib/whatsapp";

/*
 * Menú del teléfono. Antes las categorías iban en una fila que se deslizaba de
 * lado: no se veían todas, había que adivinar que seguía y el foco del teclado
 * se cortaba. Ahora un botón abre un panel a pantalla completa con todo:
 * categorías (cada una se despliega con sus productos), las que vienen pronto
 * y la ayuda.
 *
 * Es un diálogo modal: el foco entra al panel, Escape o «Cerrar» lo cierran y
 * el foco vuelve al botón. El fondo no se desplaza mientras está abierto.
 */

export type MenuItem = {
  href: string;
  label: string;
  active: boolean;
  products?: LaunchProduct[];
};

export function MobileMenu({
  all,
  categories,
  soon,
  info,
}: {
  all: MenuItem;
  categories: MenuItem[];
  soon: MenuItem[];
  info: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
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

  const row = "flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left text-lg font-semibold hover:bg-paper-deep";

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label="Menú"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(true)}
        className="press grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-sheet text-ink hover:border-ink/30 md:hidden print:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3.5 6h13M3.5 10h13M3.5 14h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open
        ? createPortal(
            <div id={panelId} role="dialog" aria-modal="true" aria-label="Menú" className="search-sheet fixed inset-0 z-[60] flex flex-col bg-sheet text-ink">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <Link href="/" onClick={() => setOpen(false)} className="rounded-md text-ink" aria-label="Esto es ASAP, inicio">
                  <BrandLogo className="h-8 w-auto" />
                </Link>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label="Cerrar menú"
                  className="grid size-11 cursor-pointer place-items-center rounded-full border border-line hover:border-ink/30"
                >
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <nav aria-label="Menú principal" className="flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-10">
                <Link href={all.href} onClick={() => setOpen(false)} aria-current={all.active ? "page" : undefined} className={row}>
                  Todos los productos
                </Link>

                <h2 className="mt-4 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Categorías</h2>
                <ul className="mt-1">
                  {categories.map((item) => {
                    const isOpen = expanded === item.label;
                    if (!item.products) {
                      return (
                        <li key={item.label}>
                          <Link href={item.href} onClick={() => setOpen(false)} aria-current={item.active ? "page" : undefined} className={row}>
                            {item.label}
                          </Link>
                        </li>
                      );
                    }
                    const listId = `${panelId}-${item.label}`;
                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={listId}
                          onClick={() => setExpanded(isOpen ? null : item.label)}
                          className={`${row} cursor-pointer justify-between`}
                        >
                          <span>{item.label}</span>
                          <span className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                            {item.products.length}
                            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                              <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </button>
                        {isOpen ? (
                          <ul id={listId} className="mb-2 ml-3 border-l border-line pl-2">
                            {item.products.map((product) => (
                              <li key={product.id}>
                                <Link href={launchProductHref(product)} onClick={() => setOpen(false)} className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-paper-deep">
                                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-paper-deep">
                                    <ProductPhoto slug={product.slug} alt="" sizes="44px" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block font-semibold">{product.name}</span>
                                    <span className="block text-sm text-ink-soft">Desde {product.quantities[0]} u. · {product.leadTime}</span>
                                  </span>
                                </Link>
                              </li>
                            ))}
                            <li>
                              <Link href={item.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-brand-deep">
                                Ver todo {item.label.toLowerCase()} →
                              </Link>
                            </li>
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                {soon.length > 0 ? (
                  <>
                    <h2 className="mt-4 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Pronto</h2>
                    <ul className="mt-1">
                      {soon.map((item) => (
                        <li key={item.label}>
                          <Link href={item.href} onClick={() => setOpen(false)} aria-current={item.active ? "page" : undefined} className={`${row} text-base font-medium`}>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                <h2 className="mt-4 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Ayuda</h2>
                <ul className="mt-1">
                  {info.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} onClick={() => setOpen(false)} aria-current={item.active ? "page" : undefined} className={`${row} text-base font-medium`}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <a
                  href={whatsappHref("Hola ASAP, tengo una consulta.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press mx-3 mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-press px-5 font-semibold text-white hover:bg-press-deep"
                >
                  <WhatsappLogo size={20} />
                  Escribir por WhatsApp
                </a>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
