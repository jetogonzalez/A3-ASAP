"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { SEASONS, SEASON_KEY, seasonsFrom, type Season, type SeasonId } from "@/lib/seasons";

/*
 * «Temporada»: botón flotante abajo a la izquierda para ver la página como se
 * vería en cada fecha especial (Reyes, Carnaval, San Valentín, Día de la
 * Madre, Fiestas de Quito, Navidad, Año nuevo…). Un toque abre la lista,
 * ordenada desde la próxima fecha; otro toque cambia la portada al instante.
 *
 * Escribe data-season en <html> (el CSS hace el resto) y lo recuerda en este
 * navegador; el script del <head> lo aplica antes de pintar. Solo cambia lo
 * que ves tú: no publica nada.
 */

/* La temporada vive en <html data-season>; aquí se escucha para marcar la elegida. */
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const readSeason = (): SeasonId => (document.documentElement.dataset.season as SeasonId | undefined) ?? "normal";

/* Fuera del componente, como el panel de accesibilidad: escribe en <html> y avisa. */
function applySeason(id: SeasonId) {
  const root = document.documentElement;
  if (id === "normal") delete root.dataset.season;
  else root.dataset.season = id;
  try {
    if (id === "normal") localStorage.removeItem(SEASON_KEY);
    else localStorage.setItem(SEASON_KEY, id);
  } catch {
    /* Sin almacenamiento se ve igual en esta visita. */
  }
  listeners.forEach((listener) => listener());
  /* La barra de arriba se vuelve a llenar con los colores nuevos. */
  document.querySelectorAll<HTMLElement>(".color-bar > span").forEach((bar) => {
    bar.getAnimations().forEach((animation) => {
      animation.cancel();
      animation.play();
    });
  });
}

/* La muestra de color de cada temporada: los tres tonos de su barra. */
function Swatch({ season, className = "" }: { season: Season; className?: string }) {
  const [a, b, c] = season.look?.bar ?? ["#c7cfff", "#8f9fff", "#4660ff"];
  return <span aria-hidden="true" className={`season-swatch shrink-0 rounded-full ${className}`} style={{ background: `linear-gradient(135deg, ${a}, ${b} 50%, ${c})` }} />;
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M12 13.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3.9-1.8Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SeasonFab() {
  const current = useSyncExternalStore(subscribe, readSeason, () => "normal" as SeasonId);
  const [open, setOpen] = useState(false);
  const [ordered, setOrdered] = useState<Season[]>(SEASONS);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const active = SEASONS.find((season) => season.id === current) ?? SEASONS[0];
  const nextId = ordered.find((season) => season.date)?.id;

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function toggle() {
    /* El orden depende de hoy: se calcula al abrir, en el navegador. */
    if (!open) setOrdered(seasonsFrom(new Date()));
    setOpen(!open);
  }

  return (
    <div className="season-fab fixed bottom-4 left-4 z-40 sm:bottom-5 sm:left-5 print:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="press flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-sheet py-1.5 pr-4 pl-1.5 text-sm font-semibold text-ink shadow-[0_12px_28px_-12px_rgba(20,20,40,0.45)] ring-1 ring-line hover:ring-ink/30"
      >
        <span className="brand-tile grid size-9 place-items-center rounded-full">
          <CalendarIcon />
        </span>
        <span>
          <span className="sr-only">Ver temporada: </span>
          {current === "normal" ? "Temporadas" : active.name}
        </span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Ver temporada"
          className="season-panel absolute bottom-full left-0 mb-3 max-h-[calc(100dvh-7rem)] w-[min(21rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-sheet p-2 text-ink shadow-[0_24px_48px_-24px_rgba(20,20,20,0.45)]"
        >
          <div className="flex items-start justify-between gap-3 px-2 pt-1 pb-2">
            <div>
              <h2 className="text-base font-semibold">Ver temporada</h2>
              <p className="text-sm text-ink-soft">Así se vería la portada. Solo cambia en tu pantalla.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              aria-label="Cerrar"
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-paper-deep"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <ul className="space-y-0.5">
            {ordered.map((season) => {
              const selected = season.id === current;
              return (
                <li key={season.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => applySeason(season.id)}
                    className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-1.5 text-left ${selected ? "bg-brand-soft" : "hover:bg-paper-deep"}`}
                  >
                    <Swatch season={season} className="size-7" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-semibold">
                        {season.name}
                        {season.id === nextId ? <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-on-ink">Próxima</span> : null}
                      </span>
                      <span className="block text-sm text-ink-soft">{season.when}</span>
                    </span>
                    {selected ? (
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 text-brand-deep">
                        <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
