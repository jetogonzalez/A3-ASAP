"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FocusEvent } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { MobileMenu } from "@/components/mobile-menu";
import { MobileSearch } from "@/components/mobile-search";
import { useCart } from "@/components/cart-provider";
import { PRODUCT } from "@/lib/catalog";
import { ProductPhoto } from "@/components/product-photo";
import { FAMILIES, familyHref, type Family } from "@/lib/families";
import { launchProductHref, launchProductsFor, type LaunchProduct } from "@/lib/launch-products";

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
  /** Productos que se despliegan bajo la categoría en escritorio. */
  products?: LaunchProduct[];
  /** Categorías que aún no se piden: van juntas en «Más». */
  soon?: boolean;
};

function familyItem(family: Family): NavItem {
  const products = launchProductsFor(family.slug);
  return {
    href: familyHref(family),
    label: family.label,
    products: products.length > 0 ? products : undefined,
    soon: !family.live && products.length === 0,
    match: (path) =>
      family.live
        ? path.startsWith(`/producto/${PRODUCT.slug}`)
        : path === `/productos/${family.slug}` || products.some((product) => path === `/producto/${product.slug}`),
  };
}

const ALL: NavItem = { href: "/productos", label: "Todo", match: (path) => path === "/productos" };
const FAMILY_ITEMS = FAMILIES.map(familyItem);
const MAIN = FAMILY_ITEMS.filter((item) => !item.soon);
const SOON = FAMILY_ITEMS.filter((item) => item.soon);
const INFO: NavItem[] = [
  { href: "/envio", label: "Envío", match: (path) => path.startsWith("/envio") },
  { href: "/ayuda", label: "Ayuda", match: (path) => path.startsWith("/ayuda") },
];

/* En el menú del teléfono hay espacio para nombrar bien cada cosa. */
const MOBILE_INFO: NavItem[] = [
  { href: "/ayuda", label: "Centro de ayuda", match: (path) => path.startsWith("/ayuda") },
  { href: "/envio", label: "Envío y plazos", match: (path) => path.startsWith("/envio") },
  { href: "/proforma", label: "Hacer una proforma", match: (path) => path.startsWith("/proforma") },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count, ready } = useCart();

  return (
    /*
     * En el teléfono el encabezado es una sola fila: logo, lupa, carrito y el
     * botón de menú, que abre todas las categorías (components/mobile-menu.tsx).
     */
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-sheet print:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2.5 px-4 py-2.5 md:gap-5 md:px-8 md:py-3">
          <Link href="/" className="shrink-0 text-ink" aria-label="Esto es ASAP, inicio">
            <BrandLogo className="h-8 w-auto md:h-9" />
          </Link>
          {/* En el teléfono el campo no cabía: ahí es una lupa que abre la búsqueda a pantalla completa. */}
          <div className="flex-1 md:hidden" />
          <MobileSearch />
          <form action="/productos" className="hidden min-w-0 flex-1 md:block" role="search">
            <label className="sr-only" htmlFor="buscar">
              Buscar productos
            </label>
            {/* Al enfocar se comporta igual que los campos del formulario: se vacía el relleno y el borde se pone fuerte. */}
            <div className="focus-shell flex h-11 items-center rounded-full border border-line bg-paper-deep pr-1 pl-4 transition-colors has-[input:focus-visible]:border-ink has-[input:focus-visible]:bg-sheet has-[input:focus-visible]:shadow-[inset_0_0_0_1px_var(--ink)]">
              <input
                id="buscar"
                name="q"
                type="search"
                placeholder="Buscar productos"
                className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-soft"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-press text-white hover:bg-press-deep"
              >
                <SearchIcon />
              </button>
            </div>
          </form>
          <CartLink pathname={pathname} count={count} ready={ready} />
          <MobileMenu
            all={{ href: ALL.href, label: ALL.label, active: ALL.match(pathname) }}
            categories={MAIN.map((item) => ({ href: item.href, label: item.label, active: item.match(pathname), products: item.products }))}
            soon={SOON.map((item) => ({ href: item.href, label: item.label, active: item.match(pathname) }))}
            info={MOBILE_INFO.map((item) => ({ href: item.href, label: item.label, active: item.match(pathname) }))}
          />
        </div>
        <DesktopNav pathname={pathname} />
      </header>
    </>
  );
}

/*
 * La página actual se marca con una barra recta y fina abajo (no con el borde
 * del enlace, que con las esquinas redondeadas salía curvo). El anillo de foco
 * va hacia adentro para no pisar la barra.
 */
const LINK =
  "relative inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:-outline-offset-2 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors";

function linkClass(active: boolean): string {
  return `${LINK} ${active ? "text-ink after:bg-ink" : "text-ink-soft after:bg-transparent hover:text-ink hover:after:bg-line"}`;
}

/*
 * Escritorio: las categorías que se piden, cada una con su menú de productos
 * (se abre al pasar el mouse o al llegar con el teclado); las que aún no se
 * piden juntas en «Más»; Envío y Ayuda aparte, a la derecha.
 */
function DesktopNav({ pathname }: { pathname: string }) {
  const soonActive = SOON.some((item) => item.match(pathname));
  /*
   * Un solo menú abierto a la vez. Antes cada uno se abría con CSS (hover o
   * foco dentro): tras un clic el foco se quedaba en uno y al pasar el mouse
   * por otro quedaban los dos abiertos, encimados.
   */
  const [open, setOpen] = useState<string | null>(null);
  const menu = (key: string) => ({
    onMouseEnter: () => setOpen(key),
    onMouseLeave: () => setOpen((current) => (current === key ? null : current)),
    onFocus: () => setOpen(key),
    onBlur: (event: FocusEvent<HTMLLIElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen((current) => (current === key ? null : current));
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLLIElement>) => {
      if (event.key === "Escape") setOpen(null);
    },
    onClick: () => setOpen(null),
  });
  return (
    <nav aria-label="Categorías" className="hidden border-t border-line md:block">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <ul className="flex items-center gap-0.5">
          <li>
            <Link href={ALL.href} aria-current={ALL.match(pathname) ? "page" : undefined} className={linkClass(ALL.match(pathname))}>
              {ALL.label}
            </Link>
          </li>
          {MAIN.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.label} className="relative" {...(item.products ? menu(item.label) : {})}>
                <Link href={item.href} aria-current={active ? "page" : undefined} className={linkClass(active)}>
                  {item.label}
                  {item.products ? <Caret open={open === item.label} /> : null}
                </Link>
                {item.products ? (
                  <Dropdown label={item.label} open={open === item.label}>
                    <ul className="grid gap-1">
                      {item.products.map((product) => (
                        <li key={product.id}>
                          <Link
                            href={launchProductHref(product)}
                            aria-current={pathname === launchProductHref(product) ? "page" : undefined}
                            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-paper-deep aria-[current=page]:bg-pick-soft"
                          >
                            <span className="relative block h-11 w-14 shrink-0 overflow-hidden rounded-lg">
                              <ProductPhoto slug={product.slug} alt="" sizes="56px" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-ink">{product.name}</span>
                              <span className="block text-xs text-ink-soft">
                                Desde {product.quantities[0].toLocaleString("es-EC")} u. · {product.leadTime}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href={item.href} className="mt-2 block rounded-xl px-2 py-2 text-sm font-semibold text-brand hover:bg-paper-deep">
                      Ver todo en {item.label}
                    </Link>
                  </Dropdown>
                ) : null}
              </li>
            );
          })}
          {SOON.length > 0 ? (
            <li className="relative" {...menu("mas")}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={open === "mas"}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen((current) => (current === "mas" ? null : "mas"));
                }}
                className={`${linkClass(soonActive)} cursor-pointer`}
              >
                Más
                <Caret open={open === "mas"} />
              </button>
              <Dropdown label="Más categorías" open={open === "mas"}>
                <p className="px-2 pb-1 text-xs font-medium text-ink-soft">Próximamente · se cotizan por WhatsApp</p>
                <ul className="grid gap-1">
                  {SOON.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        aria-current={item.match(pathname) ? "page" : undefined}
                        className="flex items-center gap-3 rounded-xl p-2 text-sm font-semibold text-ink transition-colors hover:bg-paper-deep aria-[current=page]:bg-pick-soft"
                      >
                        <span className="relative block h-11 w-14 shrink-0 overflow-hidden rounded-lg">
                          <ProductPhoto slug={item.href.split("/").pop() ?? ""} alt="" sizes="56px" />
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Dropdown>
            </li>
          ) : null}
        </ul>
        <ul className="flex items-center gap-0.5">
          {INFO.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.label}>
                <Link href={item.href} aria-current={active ? "page" : undefined} className={linkClass(active)}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

/* El panel se muestra al pasar el mouse o con el foco dentro (teclado), con un leve deslizamiento. */
function Dropdown({ label, open, children }: { label: string; open: boolean; children: React.ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      className={`absolute left-0 top-full z-50 w-[21rem] pt-1 transition-[opacity,transform,visibility] duration-150 ease-out ${
        open ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"
      }`}
    >
      <div className="rounded-2xl border border-line bg-sheet p-2 shadow-[0_24px_48px_-24px_rgba(20,20,20,0.35)]">{children}</div>
    </div>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`mt-px text-ink-soft transition-transform duration-150 ${open ? "rotate-180" : ""}`}
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.2 10.2 13 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CartLink({
  pathname,
  count,
  ready,
}: {
  pathname: string;
  count: number;
  ready: boolean;
}) {
  const badge = ready && count > 0 ? count : null;
  return (
    <Link
      href="/carrito"
      aria-current={pathname === "/carrito" ? "page" : undefined}
      aria-label={badge ? `Tu carrito, ${badge} ${badge === 1 ? "producto" : "productos"}` : "Tu carrito"}
      className="relative grid size-11 shrink-0 place-items-center rounded-full bg-press text-sm font-semibold text-white hover:bg-press-deep md:inline-flex md:size-auto md:min-h-11 md:items-center md:gap-2 md:px-4"
    >
      <CartIcon className="md:hidden" />
      <span className="hidden md:inline">Tu carrito</span>
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-sheet px-1 text-xs font-semibold text-ink ring-2 ring-white md:static md:ring-0">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function CartIcon({ className }: { className: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3 4h1.8l1.6 8.4h8.2l1.6-6H6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="16" r="1.3" fill="currentColor" />
      <circle cx="14.4" cy="16" r="1.3" fill="currentColor" />
    </svg>
  );
}
