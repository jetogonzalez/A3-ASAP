/*
 * Decoración animada de temporada en la portada: no se queda congelada, se
 * mueve despacio todo el tiempo. Navidad: estrellas doradas que titilan y
 * destellos que caen. Fiestas de Quito: confeti rojo y azul que cae girando.
 *
 * Las posiciones son fijas (no al azar) para que el servidor y el navegador
 * pinten lo mismo. Solo se ve en su temporada (data-season en <html>); con
 * «reducir movimiento» queda quieta y en alto contraste no aparece.
 */

type Piece = { x: number; y: number; size: number; duration: number; delay: number; drift: number; color: string; shape: string };

/* Un generador con semilla: mismo resultado en cada render. */
function pieces(seed: number, count: number, colors: string[], shapes: string[]): Piece[] {
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

const QUITO = pieces(7, 12, ["#d7262f", "#1f5fbf", "#e8434b", "#2f74d6"], ["confeti", "confeti", "serpentina"]);
const NAVIDAD = pieces(19, 10, ["#d4a017", "#1e7a4f", "#b3122e", "#e9c46a"], ["destello", "estrella", "destello"]);
const NAVIDAD_STARS = pieces(41, 5, ["#d4a017", "#e9c46a"], ["titila"]);

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
      <Layer id="fiestas-quito" items={QUITO} />
      <Layer id="navidad" items={[...NAVIDAD, ...NAVIDAD_STARS]} />
    </>
  );
}
