/*
 * Muestras de material para las opciones del configurador. Un ícono dice
 * «esto es brillante»; la persona igual no sabe cómo se ve. Esto pinta una
 * tarjeta sobre la mesa con la luz que le corresponde a cada acabado, como
 * las fotos de producto de una imprenta, pero hecho con CSS: no hay fotos que
 * mantener y la muestra siempre coincide con lo que se imprime.
 */

export type SwatchKind =
  | "papel-mate"
  | "papel-brillante"
  | "sin-laminado"
  | "laminado-mate"
  | "laminado-brillante"
  | "sin-uv"
  | "uv"
  | "esquina-recta"
  | "esquina-redonda"
  | "una-cara"
  | "doble-cara";

/** Grano de papel: ruido fractal en un SVG. Se multiplica sobre el color de la hoja. */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.4 0 0 0 0 0.33 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")";

const INK = "#0e5a33";
const MATTE_PAPER = "#f4efe6";

/*
 * Escena 3D de verdad: la caja tiene perspectiva y cada tarjeta es una pila de
 * capas en Z (sombra en la mesa, canto, cara). Al inclinarla, las capas se
 * separan y aparece el grosor del cartón, como en una foto.
 */
const PERSPECTIVE = "560px";
const CARD_THICKNESS = 3;

export function FinishSwatch({ kind }: { kind: SwatchKind }) {
  return (
    <span
      className="swatch relative block h-28 w-full overflow-hidden rounded-xl bg-[radial-gradient(110%_95%_at_35%_15%,#f6f4f0,#e2ddd5_62%,#cdc6bb)]"
      style={{ perspective: PERSPECTIVE }}
      aria-hidden="true"
    >
      {/* Viñeta: la luz cae en el centro de la mesa y se apaga en los bordes. */}
      <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_28px_rgba(60,50,35,0.18)]" />
      {kind === "esquina-recta" || kind === "esquina-redonda" ? (
        <CornerScene rounded={kind === "esquina-redonda"} />
      ) : kind === "una-cara" || kind === "doble-cara" ? (
        <SidesScene double={kind === "doble-cara"} />
      ) : (
        <FinishScene kind={kind} />
      )}
    </span>
  );
}

function FinishScene({ kind }: { kind: SwatchKind }) {
  const dark = kind === "uv" || kind === "sin-uv";
  const matte = kind === "papel-mate" || kind === "laminado-mate" || kind === "sin-laminado" || dark;
  const glossy = kind === "papel-brillante" || kind === "laminado-brillante";
  const laminated = kind === "laminado-mate" || kind === "laminado-brillante";

  return (
    <Card3D paper={dark ? "#1c1e20" : matte ? MATTE_PAPER : "#ffffff"} edge={dark ? "#0b0c0d" : "#d6cfc2"}>
      <PrintedArt dark={dark} deep={laminated} muted={matte && !laminated && !dark} />

      {/* El grano solo se ve donde no hay capa encima que lo tape. */}
      {matte && !laminated ? (
        <span className="absolute inset-0 opacity-70 mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
      ) : null}

      {/* Luz de ambiente: más clara arriba, como bajo una lámpara. */}
      <span className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.2),transparent_45%,rgba(0,0,0,0.09))]" />

      {kind === "laminado-mate" ? (
        /* Terciopelo: un brillo ancho y apagado, sin borde definido. */
        <span className="absolute inset-0 bg-[radial-gradient(70%_80%_at_32%_22%,rgba(255,255,255,0.32),transparent_70%)]" />
      ) : null}

      {glossy ? (
        <>
          {/* El reflejo de una ventana: dos paños blancos con el borde nítido. */}
          <span className="absolute -top-[10%] left-[18%] h-[130%] w-[16%] -skew-x-[18deg] bg-white/55 blur-[1px]" />
          <span className="absolute -top-[10%] left-[38%] h-[130%] w-[7%] -skew-x-[18deg] bg-white/35 blur-[1px]" />
          <span className="swatch-sweep absolute inset-0" />
        </>
      ) : null}

      {kind === "uv" ? <UvShine /> : null}

      {laminated ? <FilmCorner glossy={kind === "laminado-brillante"} /> : null}
    </Card3D>
  );
}

/**
 * Una tarjeta acostada en la mesa. La sombra va pegada al plano de la mesa y
 * el canto son capas a 1 px de distancia, así el grosor sale de la perspectiva.
 */
function Card3D({
  paper,
  edge,
  width = "76%",
  turn = -16,
  shiftX = 0,
  shiftY = -3,
  lift = 0,
  children,
}: {
  paper: string;
  edge: string;
  width?: string;
  /** Giro sobre la mesa, en grados. */
  turn?: number;
  shiftX?: number;
  shiftY?: number;
  /** Altura sobre la mesa: para apilar una tarjeta encima de otra. */
  lift?: number;
  children?: React.ReactNode;
}) {
  return (
    <span
      className="absolute left-1/2 top-1/2 block aspect-[85/55]"
      style={{
        width,
        transformStyle: "preserve-3d",
        transform: `translate(-50%, -50%) translate(${shiftX}px, ${shiftY}px) rotateX(50deg) rotateZ(${turn}deg) translateZ(${lift}px)`,
      }}
    >
      <span
        className="absolute inset-0 rounded-[2px]"
        style={{ background: "rgba(38,28,12,0.5)", filter: "blur(5px)", transform: "translate3d(2px, 5px, -1px) scale(1.03)" }}
      />
      {Array.from({ length: CARD_THICKNESS }, (_, layer) => (
        <span key={layer} className="absolute inset-0 rounded-[2px]" style={{ background: edge, transform: `translateZ(${layer}px)` }} />
      ))}
      <span
        className="absolute inset-0 overflow-hidden rounded-[2px] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.08)]"
        style={{ background: paper, transform: `translateZ(${CARD_THICKNESS}px)` }}
      >
        {children}
      </span>
    </span>
  );
}

/** Lo impreso: logo, nombre y datos. Sobre el arte es donde más se nota el acabado. */
function PrintedArt({ dark, deep, muted }: { dark: boolean; deep: boolean; muted: boolean }) {
  const ink = dark ? "#e9e4da" : INK;
  return (
    <span className="absolute inset-0" style={{ opacity: muted ? 0.86 : 1, filter: deep ? "saturate(1.18) brightness(0.94)" : undefined }}>
      {dark ? null : <span className="absolute inset-y-0 left-0 w-[34%]" style={{ background: INK }} />}
      <span
        className="absolute left-[9%] top-[30%] h-[38%] aspect-square rounded-full"
        style={{ background: dark ? "#2a2d30" : "#f4efe6" }}
      />
      <span className="absolute left-[44%] top-[26%] h-[11%] w-[40%] rounded-[1px]" style={{ background: ink }} />
      <span className="absolute left-[44%] top-[46%] h-[6%] w-[28%] rounded-[1px] opacity-60" style={{ background: ink }} />
      <span className="absolute left-[44%] top-[66%] h-[5%] w-[34%] rounded-[1px] opacity-45" style={{ background: ink }} />
      <span className="absolute left-[44%] top-[76%] h-[5%] w-[24%] rounded-[1px] opacity-45" style={{ background: ink }} />
    </span>
  );
}

/** El barniz UV va solo sobre el logo: se ve como un charco de luz encima del negro mate. */
function UvShine() {
  return (
    <span className="absolute left-[9%] top-[30%] h-[38%] aspect-square overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]">
      <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,255,255,0.05)_48%,rgba(255,255,255,0.35)_80%)]" />
      <span className="swatch-sweep absolute inset-0" />
    </span>
  );
}

/** La película del laminado levantada en la esquina: se ve que es una capa aparte. */
function FilmCorner({ glossy }: { glossy: boolean }) {
  return (
    <>
      {/* Donde se levantó, queda la tarjeta sin capa y con la sombra de la película. */}
      <span
        className="absolute bottom-0 right-0 h-[36%] w-[22%]"
        style={{
          clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
          background: "linear-gradient(315deg, #efe9de 40%, #cfc7b9)",
        }}
      />
      {/* La película doblada hacia adentro, como la punta de una página. */}
      <span
        className="absolute bottom-0 right-0 h-[36%] w-[22%] drop-shadow-[-1px_-1px_1.5px_rgba(0,0,0,0.25)]"
        style={{
          clipPath: "polygon(0 100%, 100% 0, 0 0)",
          background: glossy
            ? "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(214,224,236,0.9) 55%, rgba(255,255,255,0.92))"
            : "linear-gradient(135deg, rgba(244,241,236,0.98), rgba(214,208,198,0.95))",
        }}
      />
    </>
  );
}

/** De cerca, la esquina. Detrás asoma otra tarjeta para que se lea el canto. */
function CornerScene({ rounded }: { rounded: boolean }) {
  const radius = rounded ? "22px" : "2px";
  return (
    <>
      <span
        className="absolute left-[30%] top-[30%] block h-[130%] w-[110%] bg-[#e7e1d6]"
        style={{ borderRadius: radius, transform: "rotate(-6deg)", boxShadow: "0 6px 10px -6px rgba(40,32,20,0.4)" }}
      />
      <span
        className="absolute left-[22%] top-[20%] block h-[130%] w-[110%] overflow-hidden"
        style={{
          borderRadius: radius,
          background: MATTE_PAPER,
          transform: "rotate(-6deg)",
          boxShadow: "0 1px 0 #ddd6c9, 0 2px 0 #cdc5b6, 0 3px 0 #c2b9a9, 0 16px 18px -10px rgba(40,32,20,0.5)",
        }}
      >
        <span className="absolute inset-0 opacity-60 mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
        <span className="absolute left-[10%] top-[16%] h-[18%] aspect-square rounded-full" style={{ background: INK }} />
        <span className="absolute left-[36%] top-[20%] h-[6%] w-[30%] rounded-[1px]" style={{ background: INK }} />
      </span>
    </>
  );
}

/** Dos tarjetas en abanico: la de abajo muestra el reverso, impreso o en blanco. */
function SidesScene({ double }: { double: boolean }) {
  return (
    <>
      <Card3D paper={double ? INK : "#fbf9f5"} edge={double ? "#09391f" : "#d6cfc2"} width="58%" turn={8} shiftX={14} shiftY={-6}>
        {double ? <span className="absolute right-[12%] top-[24%] h-[34%] aspect-square rounded-full bg-[#f4efe6]" /> : null}
      </Card3D>
      <Card3D paper="#fbf9f5" edge="#d6cfc2" width="58%" turn={-18} shiftX={-16} shiftY={6} lift={4}>
        <PrintedArt dark={false} deep={false} muted={false} />
      </Card3D>
    </>
  );
}
