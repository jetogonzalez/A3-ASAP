import Link from "next/link";
import { CardPreview } from "@/components/card-preview";
import { CatalogCard } from "@/components/catalog-card";
import { PRODUCT, defaultConfiguration, productHref } from "@/lib/catalog";
import { FAMILIES, familyHref } from "@/lib/families";
import { formatUsd } from "@/lib/money";
import { fromPrice } from "@/lib/pricing";

const TRUST = ["Precio en dólares", "Couche 300 g, mate o brillante", "Envío en Quito y valles"];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance md:text-[2rem] md:leading-tight">
          ASAP, productos personalizados
        </h1>
        <p className="text-sm text-ink-soft">USD · Quito y valles</p>
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-soft sm:flex-row sm:flex-wrap sm:gap-x-6">
        {TRUST.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Check />
            {item}
          </li>
        ))}
      </ul>

      <ul className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Categorías">
        {FAMILIES.map((family) => (
          <li key={family.slug} className="shrink-0">
            <Link
              href={familyHref(family)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm ${
                family.live ? "border-ink bg-ink text-white" : "border-line text-ink-soft hover:border-ink/30 hover:text-ink"
              }`}
            >
              {family.label}
              {family.live ? null : <span className="text-xs">Pronto</span>}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={productHref()}
        className="mt-8 grid overflow-hidden rounded-2xl bg-paper-deep outline-offset-4 md:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]"
      >
        <div className="flex min-h-[280px] items-center justify-center px-6 py-10">
          <CardPreview
            config={{ ...defaultConfiguration("85x55"), paper: "brillante", rounded: false }}
          />
        </div>
        <div className="flex flex-col justify-end bg-white p-6 md:bg-transparent md:p-8">
          <p className="text-sm text-ink-soft">{PRODUCT.material}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{PRODUCT.name}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-soft">
            Elige cantidad, lados y acabados. El total aparece antes de pedirlo.
          </p>
          <p className="mt-4 text-lg font-semibold">Desde {formatUsd(fromPrice("85x55"))}</p>
          <span className="mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold text-press">
            Configurar tarjetas
          </span>
        </div>
      </Link>

      <section className="mt-12" aria-labelledby="disponible">
        <h2 id="disponible" className="text-xl font-semibold tracking-tight">
          Disponible ahora
        </h2>
        <div className="mt-5">
          <CatalogCard />
        </div>
        <p className="mt-4 text-sm text-ink-soft">Las demás categorías se abren más adelante.</p>
      </section>
    </div>
  );
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0 text-press">
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M4.5 8.2 6.7 10.3 11.5 5.7" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
