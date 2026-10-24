import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SeasonSwitcher } from "@/components/season-switcher";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-line print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-soft md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-7 w-auto text-ink" />
          <p>Productos personalizados · USD · Quito y valles</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/productos" className="hover:text-ink">
            Productos
          </Link>
          <Link href="/proforma" className="hover:text-ink">
            Proforma
          </Link>
          <Link href="/envio" className="hover:text-ink">
            Envío
          </Link>
          <Link href="/carrito" className="hover:text-ink">
            Tu carrito
          </Link>
          <Link href="/ayuda" className="hover:text-ink">
            Centro de ayuda
          </Link>
          <Link href="/terminos" className="hover:text-ink">
            Términos
          </Link>
          <Link href="/privacidad" className="hover:text-ink">
            Privacidad
          </Link>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl border-t border-line px-4 py-4 md:px-8">
        <SeasonSwitcher />
      </div>
    </footer>
  );
}
