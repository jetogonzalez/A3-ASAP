import Link from "next/link";
import { productHref } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-soft md:flex-row md:items-center md:justify-between md:px-8">
        <p>ASAP · productos personalizados · USD · Quito y valles</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/productos" className="hover:text-ink">
            Productos
          </Link>
          <Link href={productHref()} className="hover:text-ink">
            Tarjetas
          </Link>
          <Link href="/envio" className="hover:text-ink">
            Envío
          </Link>
          <Link href="/carrito" className="hover:text-ink">
            Tu carrito
          </Link>
        </div>
      </div>
    </footer>
  );
}
