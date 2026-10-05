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
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:gap-5 md:px-8">
        <div className="flex w-full items-center justify-between md:w-auto">
          <Link href="/" className="shrink-0 text-xl font-semibold tracking-tight" aria-label="ASAP, inicio">
            ASAP
          </Link>
          <CartLink className="inline-flex md:hidden" pathname={pathname} count={count} ready={ready} />
        </div>
        <form action="/productos" className="min-w-0 w-full flex-1" role="search">
          <label className="sr-only" htmlFor="buscar">
            Buscar productos
          </label>
          <div className="flex h-11 items-center rounded-full border border-line bg-paper-deep pr-1 pl-4 focus-within:border-ink">
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
        <CartLink className="hidden md:inline-flex" pathname={pathname} count={count} ready={ready} />
      </div>
      <nav aria-label="Categorías" className="border-t border-line">
        <ul className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 md:px-8">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-medium ${
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
    </header>
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
  className,
  pathname,
  count,
  ready,
}: {
  className: string;
  pathname: string;
  count: number;
  ready: boolean;
}) {
  return (
    <Link
      href="/carrito"
      aria-current={pathname === "/carrito" ? "page" : undefined}
      className={`min-h-11 shrink-0 items-center gap-2 rounded-full bg-press px-4 text-sm font-semibold text-white hover:bg-press-deep ${className}`}
    >
      Tu carrito
      {ready && count > 0 ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs text-press">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
