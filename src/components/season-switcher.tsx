"use client";

import { useSyncExternalStore } from "react";
import { SEASONS, SEASON_KEY, type SeasonId } from "@/lib/seasons";

/*
 * «Ver temporada»: cambia la página a la versión de Fiestas de Quito o de
 * Navidad para verla antes de lanzarla. Escribe data-season en <html> (el
 * CSS hace el resto) y lo recuerda en este navegador. El script del <head>
 * lo aplica antes de pintar.
 */
/* La temporada vive en <html data-season>; aquí se escucha para pintar el botón marcado. */
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
  /* La barra de la portada se vuelve a llenar con los colores nuevos. */
  document.querySelectorAll<HTMLElement>(".color-bar > span").forEach((bar) => {
    bar.getAnimations().forEach((animation) => {
      animation.cancel();
      animation.play();
    });
  });
}

export function SeasonSwitcher() {
  const current = useSyncExternalStore(subscribe, readSeason, () => "normal" as SeasonId);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ver temporada">
      <span className="text-sm text-ink-soft">Ver temporada:</span>
      {SEASONS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={current === option.id}
          onClick={() => applySeason(option.id)}
          className={`min-h-9 cursor-pointer rounded-full border px-3 text-sm font-medium transition-colors ${
            current === option.id ? "border-ink bg-ink text-on-ink" : "border-line hover:border-ink/30"
          }`}
        >
          {option.name}
        </button>
      ))}
    </div>
  );
}
