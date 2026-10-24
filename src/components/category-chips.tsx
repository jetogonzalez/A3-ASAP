import Link from "next/link";
import { FAMILIES, familyHref, type Family } from "@/lib/families";
import { launchProductsFor } from "@/lib/launch-products";
import { inkFor } from "@/lib/palette";

/*
 * Fila de categorías como chips, cada una con su color y cuántos productos
 * tiene. En /productos lleva a cada sección de la misma página; en una
 * categoría, a las demás. Envuelve en varias líneas (no se desliza de lado):
 * así se ven todas a la vez y el foco no se recorta.
 */
export function CategoryChips({ current, anchors = false }: { current?: string; anchors?: boolean }) {
  return (
    <nav aria-label="Categorías de productos">
      <ul className="flex flex-wrap gap-2">
        {FAMILIES.map((family) => {
          const count = family.live ? 1 : launchProductsFor(family.slug).length;
          const active = family.slug === current;
          const ink = inkFor(family.slug);
          return (
            <li key={family.slug}>
              <Link
                href={anchors ? `#${family.slug}` : familyHref(family)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                  active ? "border-ink bg-ink text-on-ink" : "border-line bg-sheet hover:border-ink/30"
                }`}
              >
                <span className="size-2.5 rounded-full" style={{ background: ink.accent }} aria-hidden="true" />
                {family.label}
                <span className={`text-xs ${active ? "opacity-80" : "text-ink-soft"}`}>{chipCount(family, count)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function chipCount(family: Family, count: number): string {
  if (family.live) return "en línea";
  return count > 0 ? String(count) : "pronto";
}
