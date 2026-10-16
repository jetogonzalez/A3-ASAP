"use client";

import Link from "next/link";
import { useState } from "react";
import { CardPreview } from "@/components/card-preview";
import { defaultConfiguration, productHref } from "@/lib/catalog";

const CARD = { ...defaultConfiguration("85x55"), paper: "mate" as const };

/** Los centímetros de la regla de arriba, como en la mesa del taller. */
const RULER = Array.from({ length: 40 }, (_, index) => index);

export function HomeHero({ arrival, fromPrice }: { arrival: string; fromPrice: string }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");

  return (
    <section className="cutting-mat relative overflow-hidden text-white" aria-labelledby="hero-title">
      <div className="mat-ruler absolute inset-x-0 top-0 h-3" aria-hidden="true" />
      <div className="absolute inset-x-0 top-3 flex overflow-hidden text-[10px] tabular-nums text-white/55" aria-hidden="true">
        {RULER.map((cm) => (
          <span key={cm} className="w-10 shrink-0 pl-1">
            {cm}
          </span>
        ))}
      </div>
      <AngleGuide />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-20 pb-16 md:px-8 md:pt-24 md:pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-0">
        <div className="lg:col-start-1 lg:row-start-1">
          <h1 id="hero-title" className="max-w-xl text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
            Tus tarjetas de presentación, en tu puerta el {arrival}.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-7 text-white/80">
            Las armas aquí, ves el precio en dólares mientras eliges y pagas por WhatsApp. Entregamos en Quito y los valles.
          </p>
        </div>

        {/* En el teléfono la tarjeta va antes de los campos, para ver el nombre mientras se escribe. */}
        <div className="flex flex-col items-center gap-8 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="card-settle w-full max-w-[440px] text-ink [&_article]:shadow-[0_40px_60px_-30px_rgba(0,0,0,0.65)] [&_span.border-ink\/40]:border-white/70">
            <CardPreview
              config={CARD}
              company={company.trim() || "Estudio Norte"}
              name={name.trim() || "Tu nombre"}
              role="Tu cargo"
            />
          </div>
          <p className="rounded-full bg-black/25 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
            100 tarjetas clásicas desde <strong className="font-semibold text-white">{fromPrice}</strong>
          </p>
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <div className="grid max-w-md gap-3 sm:grid-cols-2 lg:mt-8">
            <label className="text-sm font-medium text-white/85">
              Tu nombre
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={32}
                autoComplete="name"
                placeholder="María Pérez"
                className="mat-field mt-1.5"
              />
            </label>
            <label className="text-sm font-medium text-white/85">
              Tu empresa
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                maxLength={24}
                autoComplete="organization"
                placeholder="Estudio Norte"
                className="mat-field mt-1.5"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={productHref()}
              className="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-ink transition-transform hover:bg-white/90 active:scale-[0.97]"
            >
              Armar mis tarjetas
            </Link>
            <Link href="/cotizacion" className="inline-flex min-h-12 items-center font-semibold underline decoration-white/40 underline-offset-[6px] hover:decoration-white">
              Hacer una cotización
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}

/* Las guías de ángulo que traen las mesas de corte, en una esquina y sin protagonismo. */
function AngleGuide() {
  return (
    <svg
      className="pointer-events-none absolute right-0 bottom-0 hidden h-72 w-72 text-white/20 md:block"
      viewBox="0 0 288 288"
      fill="none"
      aria-hidden="true"
    >
      <path d="M288 288 0 0" stroke="currentColor" />
      <path d="M288 288 122 0" stroke="currentColor" />
      <path d="M288 288 0 122" stroke="currentColor" />
      <text x="150" y="128" fill="currentColor" fontSize="11">45°</text>
      <text x="196" y="66" fill="currentColor" fontSize="11">60°</text>
      <text x="56" y="214" fill="currentColor" fontSize="11">30°</text>
    </svg>
  );
}
