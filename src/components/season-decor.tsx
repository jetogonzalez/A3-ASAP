/*
 * Decoración animada de temporada en la portada: no se queda congelada, se
 * mueve despacio todo el tiempo. Cada temporada trae sus formas y colores
 * (lib/seasons.ts): confeti en Quito y Carnaval, destellos y estrellas en
 * Navidad, Reyes y Año nuevo, corazones en San Valentín, pétalos en mayo.
 *
 * Las posiciones son fijas (no al azar) para que el servidor y el navegador
 * pinten lo mismo. Solo se ve en su temporada (data-season en <html>); con
 * «reducir movimiento» queda quieta y en alto contraste no aparece.
 */

import { SEASONS, type DecorShape } from "@/lib/seasons";

type Piece = { x: number; y: number; size: number; duration: number; delay: number; drift: number; color: string; shape: string };

/* Un generador con semilla: mismo resultado en cada render. */
function pieces(seed: number, count: number, colors: string[], shapes: DecorShape[]): Piece[] {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  return Array.from({ length: count }, (_, index) => ({
    x: Math.round(next() * 100),
    y: Math.round(next() * 90),
    size: 5 + Math.round(next() * 7),
    duration: 9 + Math.round(next() * 9),
    delay: -Math.round(next() * 18),
    drift: Math.round((next() - 0.5) * 80),
    color: colors[index % colors.length],
    shape: shapes[index % shapes.length],
  }));
}

/* Una capa por temporada, con los colores y formas de lib/seasons.ts. */
const LAYERS = SEASONS.flatMap((season) =>
  season.look ? [{ id: season.id, items: pieces(season.look.decor.seed, season.look.decor.count, season.look.decor.colors, season.look.decor.shapes) }] : [],
);

function Layer({ id, items }: { id: string; items: Piece[] }) {
  return (
    <div data-season-only={id} className="season-decor" aria-hidden="true">
      {items.map((piece, index) => (
        <span
          key={index}
          className={`season-piece piece-${piece.shape}`}
          style={
            {
              "--x": `${piece.x}%`,
              "--y": `${piece.y}%`,
              "--s": `${piece.size}px`,
              "--d": `${piece.duration}s`,
              "--delay": `${piece.delay}s`,
              "--drift": `${piece.drift}px`,
              "--c": piece.color,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function SeasonDecor() {
  return (
    <>
      {LAYERS.map((layer) => (
        <Layer key={layer.id} id={layer.id} items={layer.items} />
      ))}
    </>
  );
}
