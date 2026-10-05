"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { FAMILIES, familyHref } from "@/lib/families";

const NAV = [
  { href: "/productos", label: "Productos", match: (path: string) => path === "/productos" },
  ...FAMILIES.map((family) => ({
    href: familyHref(family),
    label: family.label,
    match: (path: string) =>
      family.live ? path.startsWith("/producto/") : path === `/productos/${family.slug}`,
  })),
  { href: "/envio", label: "Envío", match: (path: string) => path.startsWith("/envio") },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count, ready } = useCart();

  return (
    /*
     * En el teléfono solo se queda pegada la fila de arriba. Las categorías viven
     * fuera del sticky y se van con el scroll: antes el encabezado se comía tres
     * filas de pantalla en cada página.
     */
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2.5 px-4 py-2.5 md:gap-5 md:px-8 md:py-3">
          <Link href="/" className="shrink-0 text-xl font-semibold tracking-tight" aria-label="ASAP, inicio">
            ASAP
          </Link>
          <form action="/productos" className="min-w-0 flex-1" role="search">
            <label className="sr-only" htmlFor="buscar">
              Buscar productos
            </label>
            <div className="focus-shell flex h-11 items-center rounded-full border border-line bg-paper-deep pr-1 pl-4 transition-colors has-[input:focus-visible]:border-pick has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-pick-line">
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
        </div>
        <CategoryNav className="hidden border-t border-line md:block" pathname={pathname} />
      </header>
      <CategoryNav className="border-b border-line bg-white md:hidden" pathname={pathname} />
    </>
  );
}

function CategoryNav({ className, pathname }: { className: string; pathname: string }) {
  return (
    <nav aria-label="Categorías" className={className}>
      <ul className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 md:px-8">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap ${
                  active ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-semibold text-press ring-2 ring-white md:static md:ring-0">
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
