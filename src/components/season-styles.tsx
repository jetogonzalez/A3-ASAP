import { SEASONS } from "@/lib/seasons";

/*
 * El CSS de cada temporada sale de lib/seasons.ts: qué se ve (data-season-only)
 * y sus colores. Así sumar una temporada es solo agregar datos.
 *
 * data-season-only acepta varias temporadas separadas por espacio (por
 * ejemplo la foto normal también se ve en las temporadas sin foto propia).
 */
function seasonCss(): string {
  const rules = [`:root:not([data-season]) [data-season-only~="normal"]{display:revert}`];
  for (const season of SEASONS) {
    if (season.id === "normal") continue;
    const root = `:root[data-season="${season.id}"]`;
    rules.push(`${root} [data-season-only~="${season.id}"]{display:revert}`);
    const look = season.look;
    if (!look) continue;
    rules.push(
      `${root}{--season-panel:${look.panel};--season-kit:${look.kit};--season-a:${look.accent};--season-bg:${look.bg}}`,
      `${root} .color-bar > span{background:linear-gradient(90deg,${look.bar[0]},${look.bar[1]} 50%,${look.bar[2]})}`,
    );
  }
  return rules.join("\n");
}

const CSS = seasonCss();

export function SeasonStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
